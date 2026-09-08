# VetAlert V2 — release-candidate readiness

Data: 7 de setembro de 2026
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
- Substitui a consulta IBGE em runtime por snapshot oficial estático `ibge-municipalities-2025`, com 5.571 entradas/27 UFs, e torna município obrigatório com validação server-side da combinação UF + código.
- Impede double-submit com ref síncrona além do estado visual já existente.
- Move foco para a nova etapa e para erros de submissão; mantém teclado, `fieldset`/`legend`, estados desabilitados e anúncios live/status.
- Uniformiza a cópia do onboarding como “piloto controlado”.
- Substitui o scan arbitrário dos 100 sidecars por queries limitadas às janelas reais de taxa e duplicidade.
- Versiona a política de integridade como `integrity-v2-3`, registra `integrityKeyVersion` sem expor a chave e mantém o fingerprint limitado à observação central, impedindo que alterações no módulo opcional contornem a suspeita de duplicidade.
- Versiona os índices compostos exigidos pelas novas queries, sem aplicá-los em produção.
- Normaliza limiares de recorrência/emergência/sustentação para nunca ficarem abaixo de small-cell ou fora de ordem.
- Corrige `suspiciousRecordsExcluded` por célula; mantém o total global separado.
- Expõe somente a contagem agregada de canais no dashboard/CSV, sem nomes de fonte por registro.
- Faz o repositório SAPSA falhar fechado quando o cap configurado é ultrapassado, em vez de publicar resumo silenciosamente incompleto.
- Acrescenta `economic-operational-context-v1` como seção opcional, independente e estritamente controlada, sem valores monetários, crédito, identidade ou texto livre.
- Acrescenta `technical-note-v1` como única nota opcional: máximo 280 caracteres, validação cliente/servidor, normalização, padrões, denylist e vocabulário versionado fail-closed. Termo desconhecido bloqueia o envio; não há LLM nem serviço externo.
- Mantém a nota aceita somente no documento operacional protegido, fora do fingerprint, das projeções SAPSA, clusters, rankings, comparações e CSV. Rejeições não criam observação, sidecar, audit log ou alerta legado, e a resposta não contém termo/body/detalhe do validador.
- Exige decisão contextual antes de qualquer manifestação configurada: “sim” oferece o canal oficial e ainda permite continuar no VetAlert; “não” continua diretamente. Ambos enviam somente o mesmo payload observacional, e a pergunta/decisão nunca é persistida.
- Atualiza a metodologia para `sapsa-v2-exploratory-3`, explicitamente não validada cientificamente, com dupla supressão do módulo econômico/operacional.

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
| GPS/IP geolocation no V2 | PASS | Sem chamada de geolocalização; município obrigatório vem de catálogo estático; IP/User-Agent não entram no documento da aplicação |
| Município oficial obrigatório | PASS | Snapshot `ibge-municipalities-2025`, 5.571 entradas/27 UFs; ausência, código inexistente e UF incompatível são rejeitados server-side; nenhuma chamada IBGE em runtime |
| Nota técnica opcional | PASS | `technical-note-v1`, máximo 280 caracteres; fail-closed no cliente e servidor para empresa, fabricante, marca, medicamento comercial, CRMV, contato, URL, endereço, identificador e termo desconhecido |
| Limitação do detector textual | PASS com ressalva explícita | Barreira determinística, não garantia de reconhecimento de 100% dos nomes comerciais; corpus curado final rejeitou 0/50 notas legítimas após uma calibração inicial de 2/50 |
| Isolamento analítico da nota | PASS | Nota fora do fingerprint, tipo agregado, repositório SAPSA, dashboard e CSV; coleção raw V2 permanece client-denied |
| Contexto terapêutico controlado | PASS | Categoria, princípio ativo, exposição e intervalo por allowlists opcionais |
| Contexto econômico/operacional V1 | PASS | Seção separada e opcional; quatro enums amplos; versão/unknown/proibidos validados no cliente e servidor |
| Sem finanças/decisão individual | PASS | Renda, valor, dívida, crédito/score, financiamento, ranking e scores individuais são ausentes da UI e rejeitados pelo schema |
| Decisão de canal oficial | PASS local | “Sim” e “não” permitem salvar a observação descritiva; “sim” mantém o link oficial disponível; nenhuma escolha chama instituição externa ou entra no payload |
| Doença/diagnóstico/suspeita/surto/notificação no documento | PASS | Sem campos no payload; chaves correspondentes são rejeitadas server-side; decisão oficial é estado transitório |
| Schema cliente/servidor versionado | PASS | Tipos/validador compartilhados; `schemaVersion=2`, consentimento e metadados gerados no servidor |
| Validação server-side | PASS | Payload/nota válidos 201; nota, município, campo proibido/unknown/forjado inválidos 400 genérico; JSON malformado 400; content-type inválido 415 |
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
| Small-cell do contexto opcional | PASS | Módulo exige mínimo de registros e cada valor categórico aplica novamente o mesmo limiar; categorias pequenas são omitidas |
| Explicabilidade por célula | PASS | Compatíveis, municípios, períodos, canais e suspeitos locais; metodologia/versionamento incluídos |
| Cap analítico | PASS no código | Excesso falha 503 em vez de truncar; carga/custo real ainda precisa de staging |
| Audit log de submissão/export | PASS no emulador | Eventos mínimos com digest e key version; export sem papel é negado |
| Mobile 390×844 | PASS local | Sem overflow no onboarding |
| Teclado/foco/back | PASS local | Enter, foco de etapa, back preservando estado e foco no erro |
| Falha de rede/refresh | PASS local | Mensagem afirma não envio; URL preservada; refresh retorna ao onboarding |
| Falha do catálogo territorial | PASS local | Mensagem `role=status`; município e avanço permanecem bloqueados |
| Double submission | PASS local | Double-click produz um POST; ref síncrona impede reentrada |
| Unitários/contrato | PASS | 39/39 no stack combinado, incluindo catálogo integral, ausência de logger V2 e corpus de falsos positivos |
| Firebase Emulator | PASS | 8/8 no projeto `demo-vetalert-v2`; nenhum fallback a Firebase real |
| Browser E2E | PASS | 12/12 Chromium em execução isolada, incluindo telas V2, nota fail-closed, município obrigatório, mobile, erros, legado vet e agro |
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
4. A primeira execução Playwright após tornar município obrigatório falhou 6/11 porque o helper do seletor passou a compor seu nome acessível. O V2 recebeu `aria-label="Município"`; a execução seguinte passou 10/11. O teste restante usava um locator de `role=alert` que também encontrava o anunciador de rotas do Next; o locator foi restringido à mensagem da nota. A execução final passou 11/11.
5. O corpus inicial de 50 notas legítimas rejeitou duas flexões observacionais comuns (`elevado` e `moderado`), taxa de 4%. O vocabulário ainda não publicado foi versionado como `technical-note-dictionary-pt-BR-2026-09-07-v2`; a repetição final rejeitou 0/50, taxa de 0% nesse corpus fechado.
6. Uma tentativa de reiniciar o Emulator encontrou as portas locais antigas ocupadas, e uma execução Playwright contra a instância Next anterior produziu 401 e dados residuais. Esses resultados foram descartados. O harness passou a exigir Emulator em loopback, projeto `demo-*`, limpar somente os documentos do Emulator e aceitar porta Next isolada; a execução final em 3101 passou 12/12.

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

Quando o scope `colo-prep-ia` estiver disponível e um preview for autorizado, inspecionar flag-off e flag-on por ID/commit, executar as dez jornadas, confirmar 401/403 e ausência de raw, revisar logs redigidos e provar que nenhum alias/configuração de produção mudou. Nenhum preview foi criado ou alterado neste incremento.

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
