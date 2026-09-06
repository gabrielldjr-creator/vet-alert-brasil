# Relatório da fase de validação VetAlert V2

Data: 5 de setembro de 2026  
Branch: `codex/vetalert-v2-reconstruction`  
Escopo: emulador e previews; sem cutover, sem mudança de produção e sem dados sanitários sintéticos em produção

## Resultado executivo

| Controle | Resultado | Evidência |
|---|---|---|
| Flag desativada por padrão | PASS | Teste unitário exige valor literal `true`; nenhuma variável/settings de produção foi alterada. |
| Registro legado `/alerta/novo` | PASS no emulador | Browser fez auth anônima, percorreu o formulário, gravou em `alerts`, redirecionou ao dashboard e conferiu os campos persistidos. |
| `/agro-signals/new` | PASS no emulador | Browser fez auth anônima, submeteu o formulário e confirmou o payload legado completo em `alerts`, inclusive objeto `retailSignal`. |
| V2 válido e metadados server-side | PASS | API + browser no emulador; `submissionId`, `receivedAt`, schema/source/status são gerados no servidor. |
| Payload inválido/proibido/forjado | PASS | Payload incompleto e campos de nome, CRMV, produto, texto livre e `submissionId` cliente retornam 400. |
| Duplicata e rate burst | PASS | Registros permanecem armazenados e recebem flags separadas; não há exclusão automática. |
| HMAC | PASS | Digest de 64 hex, sem UID bruto; segredo curto retorna 503 e não persiste observação. |
| RBAC SAPSA | PASS | 401 sem token, 403 veterinário; analista SAPSA e admin recebem somente agregado. |
| Raw V2 inacessível ao cliente | PASS | Não autenticado, veterinário, analista e admin falham em get/create nas três coleções V2. |
| Small-cell e CSV | PASS | Célula com 2 registros é suprimida; CSV não contém IDs/timestamps/município/UID/digests; export cria audit log HMAC. |
| Mobile/teclado/navegação/falha/reenvio | PASS | Chromium 390×844, ativação por Enter, sem overflow, voltar preserva dados, falha não envia, refresh reinicia seguro e clique duplo produz uma requisição. |
| Firestore rules | PASS no branch | Blocos legados permanecem iguais ao baseline `0290778`; o branch acrescenta negações V2 explícitas. Testes dinâmicos confirmam. |
| Vercel preview flag off/on | BLOCKED / NÃO VERIFICADO | A lista de times do conector veio vazia e ambos os URLs protegidos retornaram 403. |

## Testes executados

- `npm test`: 20/20 PASS, incluindo quatro testes dedicados ao adaptador legado por allowlist e isolamento arquitetural.
- `npm run test:emulator`: 7/7 PASS.
- `npm run test:e2e`: 5/5 PASS em Chromium + Firebase Auth/Firestore Emulator.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; 17 páginas/rotas geradas, incluindo todos os intakes legados e V2.
- ESLint dos arquivos novos/alterados: PASS.
- `npm run lint`: permanece FAIL somente no `app/alerta/novo/AlertFormClient.tsx` protegido (8 erros e 3 warnings preexistentes: 5 `no-explicit-any`, 3 `set-state-in-effect` e 3 variáveis não usadas); não foi alterado.
- Reprodução em checkout separado: Node 24.19.0 + Temurin 21.0.12.1, `npm ci`, 20/20, 7/7 e 5/5 PASS. O runner usa build/start; uma execução interrompida por suspensão prolongada do host foi descartada e a repetição contínua passou. Comandos completos em `docs/emulator-validation.md`.

## Matriz de papéis

| Ator | `alerts` legado | raw V2 via Client SDK | submit V2 API | SAPSA resumo/CSV |
|---|---|---|---|---|
| Não autenticado | read/create negado | negado | 401 | 401 |
| Veterinário | create/read permitido como antes; update/delete negado | negado | permitido | 403 |
| Analista SAPSA | sem exceção raw | negado | não é papel de intake | agregado permitido |
| Administrador | sem exceção raw no Client SDK | negado | não é papel de intake | agregado permitido |

O Admin SDK do servidor ignora rules por desenho; por isso IAM, credenciais e logs do ambiente real continuam sendo controles operacionais obrigatórios.

## Prova e histórico das regras

“Arquivo inalterado” no relatório anterior significava inalterado durante o último follow-up, não idêntico à produção. A comparação correta é:

- baseline de produção: commit `0290778`, blob `b5fbc76e9ea01fafc3e499ee401234e8a8cfaa36`;
- introdução das três coleções V2 deny-only: commit `6426b12`, 10 linhas aditivas;
- explicitação das operações `get, list, create, update, delete: if false`: commit `8b6cec8`;
- arquivo atual: blob `a3896d7090400990d5131b67b283b85c4a2e9bc6`, sem mudança posterior.

O diff `0290778..HEAD` acrescenta somente os blocos `veterinaryObservationsV2`, `submissionIntegrityV2` e `auditLogsV2`. Os três blocos legados realmente presentes no baseline — `alerts`, `vetProfiles` e `doctors` — permanecem byte a byte iguais. Para cada coleção V2, `get`, `list`, `create`, `update` e `delete` são explicitamente `false`. Não há wildcard permissivo nem regra ampla `allow read, write`.

Além da inspeção textual, o emulador executou tentativas de get/create para os quatro contextos de autenticação e confirmou negação. No legado, confirmou create/read autenticado, negação sem auth e negação de update/delete.

## Previews Vercel

1. Flag off: deployment `dpl_Aao1ez9AwTTmnkJwZbp64dLAkHJ6`, URL `https://vetalert-v2-validation-l1xm51utd-colo-prep-ia.vercel.app`.
2. Flag on, preview only: deployment `dpl_5quw7BotdoTdSpBSoLMSywSxY6pZ`, URL `https://vetalert-v2-validation-3uzttc2e3-colo-prep-ia.vercel.app`.

Ambos foram enviados como target `preview`, com variável aplicada no artefato daquele deployment. Nenhum domínio foi promovido, nenhum alias de produção foi alterado e nenhuma submissão foi tentada. A ferramenta de deploy confirmou criação, porém a ferramenta de leitura, logs e bypass informou 403: a conexão atual não está autorizada ao time `team_WhTnfhZtuaTOA5leKK3KLqqm` / scope `colo-prep-ia`. Portanto, não se declara build/rota PASS em Vercel até reautenticar o conector nesse scope e verificar: off → 404; on → 200; rotas legadas → 200; logs sem erro.

Nova tentativa em 5 de setembro de 2026: `list_teams` retornou lista vazia e `web_fetch` retornou “Failed to check deployment: 403 Forbidden” para os dois URLs. O conector não oferece ao agente um mecanismo para concluir o consentimento OAuth do usuário. Rotas, onboarding, layout móvel, erros e SAPSA nos previews permanecem **não verificados**.

## Escopo correto das alegações de privacidade

- **V2:** schema estrito, coleções client-denied, processamento server-side e saídas SAPSA agregadas passaram nos testes locais/emulador. A alegação é limitada a esse fluxo e ainda depende de IAM/logs/segredos em staging real.
- **Legado existente:** `alerts` continua legível por qualquer usuário autenticado, conforme o contrato histórico. Logo, o produto inteiro não deve ser descrito como privacy-safe.
- **Migração futura:** dashboards deverão consumir somente agregados server-side antes de uma mudança de permissões separadamente aprovada. Não há migração, backfill, exclusão ou alteração de rules legadas nesta fase.

## Rollback

1. Manter `VETALERT_V2_ENABLED` ausente/false em produção.
2. Não promover nenhum dos previews nem atribuir domínio de produção.
3. Reverter somente o commit de validação e, se decidido, o PR V2 inteiro.
4. Não apagar nem migrar `alerts`; o fluxo legado continua canônico.
5. Em staging real, primeiro bloquear novas escritas V2, revogar claims/credenciais e só depois aplicar retenção aprovada; não apagar registros automaticamente.
6. Remover previews é opcional e separado; não é necessário para rollback de produção porque nunca foram promovidos.

## Riscos e pendências

- Reautorizar o conector Vercel no scope `colo-prep-ia` e concluir a verificação dos dois previews; as tentativas desta fase continuaram retornando 403.
- Validar IAM/service account, rotação do HMAC, custom claims, TTL e redaction de logs em staging não produtivo real.
- Tratar a triagem atual de dependências em `docs/dependency-security-triage.md`: 27 achados completos e 12 no grafo sem dev, sem bulk upgrade nesta fase.
- Integrar o adaptador legado somente após aprovação própria. A revisão em `docs/legacy-alerts-adapter-review.md` registra que ele não expõe raw, mas as permissões históricas ainda permitem leitura autenticada de `alerts` para dashboards existentes.
- Revisão jurídica/regulatória dos textos, retenção, base legal e precisão territorial continua externa ao teste técnico.

## Gate de decisão

Esta fase para sem cutover. A decisão futura precisa aprovar separada e explicitamente: substituição de `/alerta/novo`, tratamento de `alerts`, navegação, permissões de produção e flag de produção. Até isso ocorrer, o V2 permanece draft, isolado e desativado por padrão.
