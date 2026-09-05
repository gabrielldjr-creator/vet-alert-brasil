# Relatório da fase de validação VetAlert V2

Data: 5 de setembro de 2026  
Branch: `codex/vetalert-v2-reconstruction`  
Escopo: emulador e previews; sem cutover, sem mudança de produção e sem dados sanitários sintéticos em produção

## Resultado executivo

| Controle | Resultado | Evidência |
|---|---|---|
| Flag desativada por padrão | PASS | Teste unitário exige valor literal `true`; nenhuma variável/settings de produção foi alterada. |
| Registro legado `/alerta/novo` | PASS no emulador | Browser fez auth anônima, percorreu o formulário, gravou em `alerts`, redirecionou ao dashboard e conferiu os campos persistidos. |
| `/agro-signals/new` disponível | PASS | Rota carregada em browser; contrato também protegido por hash/regressão estática. Submissão agro completa ainda não tem cenário Playwright dedicado. |
| V2 válido e metadados server-side | PASS | API + browser no emulador; `submissionId`, `receivedAt`, schema/source/status são gerados no servidor. |
| Payload inválido/proibido/forjado | PASS | Payload incompleto e campos de nome, CRMV, produto, texto livre e `submissionId` cliente retornam 400. |
| Duplicata e rate burst | PASS | Registros permanecem armazenados e recebem flags separadas; não há exclusão automática. |
| HMAC | PASS | Digest de 64 hex, sem UID bruto; segredo curto retorna 503 e não persiste observação. |
| RBAC SAPSA | PASS | 401 sem token, 403 veterinário; analista SAPSA e admin recebem somente agregado. |
| Raw V2 inacessível ao cliente | PASS | Não autenticado, veterinário, analista e admin falham em get/create nas três coleções V2. |
| Small-cell e CSV | PASS | Célula com 2 registros é suprimida; CSV não contém IDs/timestamps/município/UID/digests; export cria audit log HMAC. |
| Mobile/teclado/navegação/falha/reenvio | PASS | Chromium 390×844, ativação por Enter, sem overflow, voltar preserva dados, falha não envia, refresh reinicia seguro e clique duplo produz uma requisição. |
| Firestore rules | PASS | Blocos legados permanecem iguais; V2 usa negações explícitas por operação; não existe `allow read, write`; testes dinâmicos confirmam. |
| Vercel preview flag off/on | FAIL de verificação externa | Deployments foram criados em ordem, mas leitura/logs/URL protegida retornam 403 por falta de autorização da credencial ao scope. |

## Testes executados

- `npm test`: 16/16 PASS.
- `npm run test:emulator`: 7/7 PASS.
- `npm run test:e2e`: 4/4 PASS em Chromium + Firebase Auth/Firestore Emulator.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; 17 páginas/rotas geradas, incluindo todos os intakes legados e V2.
- ESLint dos arquivos novos/alterados: PASS.
- `npm run lint`: permanece FAIL somente no `app/alerta/novo/AlertFormClient.tsx` protegido (5 erros `no-explicit-any`, 3 warnings preexistentes); não foi alterado.

## Matriz de papéis

| Ator | `alerts` legado | raw V2 via Client SDK | submit V2 API | SAPSA resumo/CSV |
|---|---|---|---|---|
| Não autenticado | read/create negado | negado | 401 | 401 |
| Veterinário | create/read permitido como antes; update/delete negado | negado | permitido | 403 |
| Analista SAPSA | sem exceção raw | negado | não é papel de intake | agregado permitido |
| Administrador | sem exceção raw no Client SDK | negado | não é papel de intake | agregado permitido |

O Admin SDK do servidor ignora rules por desenho; por isso IAM, credenciais e logs do ambiente real continuam sendo controles operacionais obrigatórios.

## Prova das regras

O diff acrescenta somente três blocos server-only. Os blocos históricos `alerts`, `signals`, `profiles`, `veterinarian_alerts` e `users/{uid}/patients` não foram ampliados. Para cada coleção V2, `get`, `list`, `create`, `update` e `delete` são explicitamente `false`. Não há wildcard permissivo e não há expressão ampla `allow read, write`.

Além da inspeção textual, o emulador executou tentativas de get/create para os quatro contextos de autenticação e confirmou negação. No legado, confirmou create/read autenticado, negação sem auth e negação de update/delete.

## Previews Vercel

1. Flag off: deployment `dpl_Aao1ez9AwTTmnkJwZbp64dLAkHJ6`, URL `https://vetalert-v2-validation-l1xm51utd-colo-prep-ia.vercel.app`.
2. Flag on, preview only: deployment `dpl_5quw7BotdoTdSpBSoLMSywSxY6pZ`, URL `https://vetalert-v2-validation-3uzttc2e3-colo-prep-ia.vercel.app`.

Ambos foram enviados como target `preview`, com variável aplicada no artefato daquele deployment. Nenhum domínio foi promovido, nenhum alias de produção foi alterado e nenhuma submissão foi tentada. A ferramenta de deploy confirmou criação, porém a ferramenta de leitura, logs e bypass informou 403: a conexão atual não está autorizada ao time `team_WhTnfhZtuaTOA5leKK3KLqqm` / scope `colo-prep-ia`. Portanto, não se declara build/rota PASS em Vercel até reautenticar o conector nesse scope e verificar: off → 404; on → 200; rotas legadas → 200; logs sem erro.

## Rollback

1. Manter `VETALERT_V2_ENABLED` ausente/false em produção.
2. Não promover nenhum dos previews nem atribuir domínio de produção.
3. Reverter somente o commit de validação e, se decidido, o PR V2 inteiro.
4. Não apagar nem migrar `alerts`; o fluxo legado continua canônico.
5. Em staging real, primeiro bloquear novas escritas V2, revogar claims/credenciais e só depois aplicar retenção aprovada; não apagar registros automaticamente.
6. Remover previews é opcional e separado; não é necessário para rollback de produção porque nunca foram promovidos.

## Riscos e pendências

- Reautorizar Vercel no scope correto e concluir a verificação dos dois previews.
- Adicionar submissão browser completa dedicada para `/agro-signals/new`; hoje há disponibilidade em browser e proteção estática do contrato.
- Validar IAM/service account, rotação do HMAC, custom claims, TTL e redaction de logs em staging não produtivo real.
- Revisar o `npm audit`: 77 vulnerabilidades no grafo completo (1 low, 42 moderate, 33 high, 1 critical) e 21 quando executado com `--omit=dev` (12 moderate, 8 high, 1 critical). Não executar upgrades automáticos no intake protegido; separar triagem por dependência alcançável e compatibilidade.
- Revisão jurídica/regulatória dos textos, retenção, base legal e precisão territorial continua externa ao teste técnico.

## Gate de decisão

Esta fase para sem cutover. A decisão futura precisa aprovar separada e explicitamente: substituição de `/alerta/novo`, tratamento de `alerts`, navegação, permissões de produção e flag de produção. Até isso ocorrer, o V2 permanece draft, isolado e desativado por padrão.
