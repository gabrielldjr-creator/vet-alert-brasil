# VetAlert V2 — release-candidate readiness

Data: 6 de setembro de 2026  
Stack avaliado: PR #129 (`codex/vetalert-next-firebase-compat`) + `codex/vetalert-v2-rc-hardening`  
Versões: Next.js 16.3.4, Firebase Web 12.18.0, Firebase Admin 14.3.0, Node.js 24.19.0, Java Temurin JRE 21.0.12.1  
Decisão: **release candidate técnico em draft; NO-GO para produção**

## Limites desta fase

Nenhum deploy, merge, alias, variável de produção, dado Firebase, permissão legada, navegação, rota legada ou feature flag de produção foi alterado. `/alerta/novo`, `/agro-signals/new`, seus payloads, autenticação, coleção `alerts`, validação e redirects permanecem protegidos.

“Privacy-preserving” neste relatório descreve a superfície V2 testada. Não descreve o produto inteiro: o legado ainda permite leitura autenticada de documentos raw em `alerts`, e a aplicação consegue satisfazer essa condição por autenticação anônima.

## Mudanças seguras do release candidate

- Mantém `VETALERT_V2_ENABLED` default-off e todas as rotas V2 isoladas.
- Expande a denylist explícita para empresa/organização, GPS, geografia precisa, dispositivo e demais identificadores; o schema fechado continua sendo a barreira principal.
- Retorna erros JSON V2 com `private, no-store` e `nosniff`; JSON malformado agora recebe 400, não 503.
- Trata falha/exception da consulta IBGE como 502 e apresenta no formulário uma mensagem acessível, mantendo município opcional.
- Impede double-submit com ref síncrona além do estado visual já existente.
- Move foco para a nova etapa e para erros de submissão; mantém teclado, `fieldset`/`legend`, estados desabilitados e anúncios live/status.
- Uniformiza a cópia do onboarding como “piloto controlado”.
- Substitui o scan arbitrário dos 100 sidecars por queries limitadas às janelas reais de taxa e duplicidade.
- Versiona a política de integridade como `integrity-v2-2` e registra `integrityKeyVersion` sem expor a chave.
- Versiona os índices compostos exigidos pelas novas queries, sem aplicá-los em produção.
- Normaliza limiares de recorrência/emergência/sustentação para nunca ficarem abaixo de small-cell ou fora de ordem.
- Corrige `suspiciousRecordsExcluded` por célula; mantém o total global separado.
- Expõe somente a contagem agregada de canais no dashboard/CSV, sem nomes de fonte por registro.
- Faz o repositório SAPSA falhar fechado quando o cap configurado é ultrapassado, em vez de publicar resumo silenciosamente incompleto.
- Atualiza a metodologia para `sapsa-v2-exploratory-2`, explicitamente não validada cientificamente.

## Matriz completa

| Item | Estado | Evidência/limite |
| --- | --- | --- |
| V2 desativado por padrão | PASS | Flag ausente/false é falsa em unidade; execução local flag-off devolveu 404 em onboarding, confirmação, privacidade, SAPSA e API |
| Rotas legadas disponíveis com flag off | PASS | `/alerta/novo` e `/agro-signals/new` devolveram 200 |
| Arquivos/payloads legados protegidos | PASS | Hashes canônicos e testes de contrato; E2E gravou formatos exatos de vet e agro no emulador |
| Coleção legada `alerts` preservada | PASS | Nenhum rename, migração, backfill, update ou delete |
| Rules legadas preservadas | PASS | Blocos `alerts`, `vetProfiles` e `doctors` idênticos ao baseline `0290778`; sem regra ampla `allow read, write` |
| Coleções V2 raw negadas ao cliente | PASS | Rules/emulador negam get/create a não autenticado, veterinário, analista e admin |
| V2 separado do legado | PASS | Route Handler/Admin SDK grava somente `veterinaryObservationsV2`, `submissionIntegrityV2`, `auditLogsV2` |
| Nomes/CRMV/CPF/contatos | PASS | Sem campos no cliente; allowlist + denylist recursiva e testes server-side |
| Produtor/propriedade/empresa/marca/fabricante | PASS | Sem campos; chaves explícitas rejeitadas e valores permitidos são enums fechados |
| GPS/IP geolocation no V2 | PASS | Sem chamada de geolocalização; município é seleção opcional; IP/User-Agent não entram no documento da aplicação |
| Texto livre no primeiro registro | PASS | Nenhum textarea/input livre sanitário no V2; manifestações e terapêutica são controladas |
| Contexto terapêutico controlado | PASS | Categoria, princípio ativo, exposição e intervalo por allowlists opcionais |
| Schema cliente/servidor versionado | PASS | Tipos/validador compartilhados; `schemaVersion=2`, consentimento e metadados gerados no servidor |
| Validação server-side | PASS | Payload válido 201; inválido/proibido/unknown/forjado 400; JSON malformado 400; content-type inválido 415 |
| Metadados imutáveis pelo cliente | PASS | Cliente não pode escrever coleções V2 e campos server-only são rejeitados; `submissionId` UUID e timestamps no servidor |
| HMAC fail-closed | PASS no emulador | Segredo curto retorna 503 sem persistência; digests de 64 hex e key version auditada |
| Duplicidade | PASS no emulador | Mesmo fingerprint na janela é preservado e marcado para revisão |
| Rate window | PASS no emulador | Burst ultrapassando limite é preservado, marcado e excluído do SAPSA |
| Índices de integridade | PASS como configuração | `firestore.indexes.json` versionado; criação/READY em staging real ainda não testada |
| SAPSA RBAC | PASS no código/emulador | Sem token 401; veterinário 403; `sapsa_analyst` e `admin` recebem agregado |
| SAPSA UI não autenticada | PASS local | Playwright mostra “Acesso não autorizado” e não encontra campos raw |
| SAPSA UI com claims reais | NOT TESTED | Não há login institucional UI nem staging com claims reais nesta fase |
| Saída aggregate-only | PASS | API/CSV não contêm ID, digest, timestamp exato, município raw ou documento individual |
| Small-cell suppression | PASS | Células abaixo do mínimo não entram em API/CSV; limiares nunca ficam abaixo do mínimo |
| Explicabilidade por célula | PASS | Compatíveis, municípios, períodos, canais e suspeitos locais; metodologia/versionamento incluídos |
| Cap analítico | PASS no código | Excesso falha 503 em vez de truncar; carga/custo real ainda precisa de staging |
| Audit log de submissão/export | PASS no emulador | Eventos mínimos com digest e key version; export sem papel é negado |
| Mobile 390×844 | PASS local | Sem overflow no onboarding |
| Teclado/foco/back | PASS local | Enter, foco de etapa, back preservando estado e foco no erro |
| Falha de rede/refresh | PASS local | Mensagem afirma não envio; URL preservada; refresh retorna ao onboarding |
| Falha do serviço territorial | PASS local | Mensagem `role=status`; município continua opcional |
| Double submission | PASS local | Double-click produz um POST; ref síncrona impede reentrada |
| Unitários/contrato | PASS | 21/21 no stack combinado |
| Firebase Emulator | PASS | 7/7 no projeto `demo-vetalert-v2`; nenhum fallback a Firebase real |
| Browser E2E | PASS | 7/7 Chromium no stack combinado |
| TypeScript | PASS | `tsc --noEmit` |
| Build de produção | PASS | Next 16.3.4 compilou 18 rotas/listagens, incluindo todos os legados e V2 |
| Lint de código alterado/V2 | PASS | `app/v2`, `app/sapsa`, `app/api`, `lib/v2`, `tests` |
| Lint completo | FAIL | 5 erros `no-explicit-any` e 3 warnings preexistentes apenas no `AlertFormClient.tsx` protegido |
| Python syntax | PASS | `python -m compileall -q backend` |
| Testes Python | NOT TESTED | Não existe suíte Python no repositório |
| Dependency audit runtime | FAIL | 7 achados: 1 critical e 6 moderate; high=0 após #129 |
| Dependency audit completo | FAIL | 22 achados atuais: 1 low, 15 moderate, 5 high de tooling e 1 critical |
| Vercel preview flag off | BLOCKED | Conector retorna `teams: []`; nenhum deployment/URL pôde ser autenticado |
| Vercel preview flag on | BLOCKED | Mesmo bloqueio; não alegar verificação de rota/layout/erros/SAPSA no Vercel |
| Produção Vercel inalterada | PASS quanto a ações desta fase | Nenhuma chamada de mutação/deploy/env/alias; estado remoto de produção não foi auditado por falta de acesso |
| IAM/service account staging | NOT TESTED | Exige staging separado e acesso real |
| Claims/revogação staging | NOT TESTED | Emulator cobre lógica; processo institucional real não existe |
| TTL staging | NOT TESTED | `expiresAt` não ativa TTL; política/execução precisam de prova |
| Redaction/retenção de logs | NOT TESTED | Vercel/Firebase/proxy/backups/suporte fora do emulador |
| Legacy raw-read closure | FAIL | Regra histórica e dashboard cliente continuam expondo raw a autenticados |
| Migração de dashboard/terminal | EXTERNAL APPROVAL REQUIRED | Requer APIs agregadas, adapter server-only e mudança posterior de permissões |
| Estratégia para `alerts` legado | EXTERNAL APPROVAL REQUIRED | Deve permanecer imutável até decisão sobre arquivo restrito/retention/consumidores |
| Jurídico/LGPD/consentimento | EXTERNAL APPROVAL REQUIRED | Código não prova base legal, direitos, DPA, retenção ou conformidade concluída |
| Thresholds/metodologia institucional | EXTERNAL APPROVAL REQUIRED | Valores são configuráveis e exploratórios, não validação epidemiológica |
| Cutover rota/nav/flag/rules | EXTERNAL APPROVAL REQUIRED | Explicitamente fora desta fase |

## Falhas ocorridas e resolvidas durante a validação

1. A primeira execução browser após `npm ci` falhou 7/7 antes de abrir páginas porque o Chromium não estava no cache. O browser 1243 foi instalado em `.tools/playwright-browsers` e a mesma suite passou 7/7.
2. A primeira tentativa de `npm ci` falhou por tentar gravar cache fora do workspace. O alvo `node_modules` foi validado dentro do checkout, o cache foi movido para `.tools/npm-cache` e o install lockfile-exato passou.
3. Foi detectado `node_modules` residual com Firebase 12.18 enquanto a branch #127 ainda fixava 12.7. Os resultados provisórios foram descartados. A validação final foi repetida após rebase sobre #129 e install limpo, com Next 16.3.4/Firebase 12.18.0.

Essas falhas não foram mascaradas. Não representam falha final da aplicação, mas demonstram por que a instalação limpa e a checagem das versões resolvidas são gates obrigatórios.

## Dependências restantes

### Runtime (`npm audit --omit=dev`)

- **Critical — `websocket-driver`** via `firebase` → `@firebase/database` → `faye-websocket`. O app não importa Realtime Database e o handler vulnerável não é uma superfície alcançada pelo código revisado. Continua presente no grafo e não é marcado como resolvido.
- **Moderate — seis itens Firebase Admin/Google Cloud Storage**: `firebase-admin`, `@google-cloud/storage`, `gaxios`, `retry-request`, `teeny-request` e `uuid`. O V2 importa Admin Auth/Firestore, não Storage. O downgrade breaking sugerido pelo npm não foi aplicado.
- #129 removeu os high de Next/RSC e Firestore/gRPC sem bulk upgrade. `npm audit fix`, `--force` e overrides amplos não foram usados.

### Desenvolvimento

O grafo completo mantém cinco high em tooling (`brace-expansion`, `browserslist`, `flatted`, `minimatch`, `picomatch`) e demais moderate/low. São riscos de build/CI, não equivalentes a exposição HTTP runtime, mas exigem PR próprio e testes.

O serviço de advisories é mutável: a contagem completa atual é 22, enquanto relatórios anteriores registraram 21/27/77 em momentos diferentes. Sempre registrar data, lockfile e separar presença no grafo de alcançabilidade.

## Requisitos obrigatórios de staging

1. Projeto Firebase separado; nunca usar `vet-alert-brasil` para teste.
2. Service account exclusiva com mínimo privilégio para Auth/Firestore V2; sem Storage/Realtime Database.
3. Claims de teste atribuídas, revogadas e verificadas para veterinário, `sapsa_analyst`, admin e usuário sem papel.
4. Segredo HMAC com pelo menos 32 caracteres em secret manager, diferente de preview/produção, com acesso auditado.
5. `integrityKeyVersion` coordenada com o segredo. A rotação atual não consulta a chave anterior; definir janela, pausa/aceite de lacuna ou implementar dual-key em PR futuro.
6. Criar os índices V2 e esperar estado READY antes de aceitar submissões.
7. Ativar TTL somente após aprovação de retenção; testar expiração de observação, sidecar e audit log separadamente.
8. Confirmar redaction e retenção de IP, User-Agent, Authorization, UID, body e erros em Vercel, Firebase, proxy, suporte e backups.
9. Testar carga acima do rate threshold e do cap SAPSA, incluindo custo, concorrência e falha fechada.
10. Repetir todos os testes com artefato de preview identificado por commit, sem dados sintéticos em produção.

## Migração obrigatória do dashboard legado

Antes de alegar privacidade do produto completo:

1. criar repositório server-only para leitura legada;
2. aplicar `adaptLegacyAlertInMemory` por allowlist antes de qualquer agregação;
3. remover timestamp exato, texto, município textual, identidade, produto e contexto;
4. agregar e aplicar small-cell antes da resposta;
5. migrar dashboard e terminal para respostas aggregate-only;
6. comprovar que nenhum cliente depende de raw;
7. solicitar aprovação separada para fechar `allow read` em `alerts`;
8. manter documentos legados imutáveis, sem backfill ou delete.

## Vercel preview

Estado: **BLOCKED**. A chamada read-only `list_teams` retornou lista vazia em 6 de setembro de 2026. Não foi possível localizar projeto, deployment IDs, commits, URLs protegidas, env target ou aliases. Portanto, nenhuma checagem de preview é classificada como PASS.

Quando o scope `colo-prep-ia` estiver disponível, inspecionar flag-off e flag-on por ID/commit, executar as sete jornadas, confirmar 401/403 e ausência de raw, revisar logs redigidos e provar que nenhum alias/configuração de produção mudou.

## Rollback

### Antes do cutover

- Manter a flag ausente/false.
- Fechar/reverter somente o draft RC e, se necessário, #129.
- Não apagar documentos V2 ou legado; limpeza exige política aprovada.
- Revogar somente credenciais/claims/segredos de preview ou staging.

### Futuro cutover, ainda não autorizado

- Preservar deploy e configuração anteriores.
- Tornar rota, navegação, flag e rules mudanças separadas/reversíveis.
- Reverter o roteamento/flag antes de qualquer ação sobre dados.
- Nunca usar delete/backfill/migração reversa como rollback emergencial.
- Restaurar rules somente de commit revisado e após confirmar consumidores.

## Estado das PRs

- #127: manter draft; V2 base.
- #128: manter draft; revisão documental de dependências.
- #129: manter draft; compatibilidade Next/Firebase. Era reportada `mergeable=false` antes deste RC e precisa de reconciliação no GitHub.
- RC hardening: branch pequena sobre #129; deve permanecer draft e não deve ser promovida enquanto Vercel/staging/legacy/legal estiverem pendentes.

## What the account owner must decide next

1. Reautorizar leitura Vercel no scope exato `colo-prep-ia` para concluir previews.
2. Autorizar e fornecer um projeto Firebase staging separado, IAM mínimo e operadores de claims/HMAC/TTL.
3. Aceitar ou exigir correção adicional dos sete achados runtime residuais.
4. Aprovar uma arquitetura separada para migrar dashboard/terminal e fechar raw reads legados.
5. Aprovar juridicamente retenção, consentimento, linguagem e thresholds.
6. Somente depois, decidir separadamente rota `/alerta/novo`, navegação, permissões, flag de produção e destino de `alerts`.
