# Estado atual e plano de release do VetAlert

Data da auditoria: 6 de setembro de 2026  
Natureza: snapshot concluído antes do hardening de release candidate; o estado posterior está em `docs/v2-release-candidate-readiness.md`  
Repositório: `gabrielldjr-creator/vet-alert-brasil`  
Baseline de produção: `main` em `0290778`  
Checkout auditado: `codex/vetalert-v2-reconstruction` em `b8192ef`  
PRs remotos consultados: #127, #128 e #129, todos abertos e em draft

## Decisão executiva

O estado atual permanece **NO-GO para cutover**.

O legado continua operacional com escrita direta do navegador em `alerts`. O V2 está isolado, usa persistência server-side e nega acesso de cliente às coleções V2, mas está desativado por padrão e não foi validado em preview Vercel acessível nem em staging real. O V2 não altera a limitação mais importante do produto completo: um usuário que obtém autenticação Firebase, inclusive pela autenticação anônima usada pela própria aplicação, ainda pode ler documentos raw de `alerts` conforme a regra legada.

Esta auditoria não fez deploy, merge, alteração de flag, mudança de configuração Vercel, escrita em Firebase, migração, backfill, exclusão ou modificação de permissões. A única alteração local é este documento.

## Escopo e método

Foram inventariados os 116 arquivos versionados do checkout, incluindo todas as rotas App Router, componentes, módulos Firebase cliente/Admin, regras Firestore, backend FastAPI, scripts, testes, documentação e arquivos de configuração. Artefatos locais ignorados (`node_modules`, `.next`, logs, caches e pacotes baixados) não são fonte do produto e não entram no inventário de release.

Também foram consultados no GitHub os metadados e documentos específicos das três PRs draft:

| PR | Base → head | Estado observado | Escopo |
| --- | --- | --- | --- |
| #127 | `main` → `codex/vetalert-v2-reconstruction` | aberta, draft, mergeable | V2 isolado, regras deny-only, testes e documentação; 59 arquivos alterados |
| #128 | `codex/vetalert-v2-reconstruction` → `codex/vetalert-runtime-security-review` | aberta, draft, mergeable | revisão documental de dependências; 1 arquivo alterado |
| #129 | `codex/vetalert-v2-reconstruction` → `codex/vetalert-next-firebase-compat` | aberta, draft, `mergeable=false` | atualização dirigida Next/Firebase e relatório; 4 arquivos alterados |

# 1. Arquitetura atual

## 1.1 Superfícies web e rotas

| Rota | Camada | Comportamento atual | Acesso efetivo |
| --- | --- | --- | --- |
| `/` | legado/público | Landing page e navegação para intakes, dashboard e terminal | Público |
| `/acesso` | legado/público | Página informativa de convite; não valida convite | Público |
| `/alerta` | legado protegido por contrato | Redireciona para `/alerta/novo` | Público |
| `/alerta/novo` | legado protegido por contrato | Formulário veterinário de sete etapas, autenticação Firebase e escrita direta em `alerts` | Público após bootstrap técnico/anônimo |
| `/agro-signals/new` | legado protegido por contrato | Formulário agro-retail, autenticação anônima e escrita direta em `alerts` | Público após autenticação anônima |
| `/global-alerts-dashboard` | legado | Assina anonimamente e faz `onSnapshot` dos documentos raw de `alerts` | Na prática público, porque a própria aplicação satisfaz `request.auth != null` |
| `/terminal` | legado/FastAPI | Consome eventos, alertas heurísticos e WebSocket do backend Python | Público; endpoints backend não exigem papel |
| `/privacidade` | legado/público | Política pública | Público |
| `/sobre` | legado/público | Texto institucional | Público |
| `/uso-etico` | legado/público | Limites de uso e links ao intake/dashboard | Público |
| `/v2/onboarding` | V2 | Onboarding e formulário controlado sem texto livre | 404 salvo se `VETALERT_V2_ENABLED` for exatamente `true` |
| `/v2/confirmacao` | V2 | Confirmação genérica sem expor ID | Mesma flag V2 |
| `/v2/privacidade` | V2 | Limites e garantias qualificadas do piloto | Mesma flag V2 |
| `/sapsa/v2` | V2 | Shell institucional que busca somente resumo agregado | Flag V2; API exige claim `sapsa_analyst` ou `admin` |
| `POST /api/v2/observations` | V2/server | Autentica token, valida schema e persiste observação/sidecars | Flag V2 + qualquer token Firebase válido |
| `GET /api/v2/territories` | V2/server | Consulta municípios na API IBGE | Flag V2 + UF sintaticamente válida; sem autenticação adicional |
| `GET /api/v2/sapsa/summary` | V2/server | Retorna agregados com supressão | Flag V2 + papel SAPSA verificado no servidor |
| `GET /api/v2/sapsa/export` | V2/server | Retorna CSV agregado e grava evento de exportação | Flag V2 + papel SAPSA verificado no servidor |

Não há middleware/proxy nem Server Actions. O controle V2 ocorre nas páginas e Route Handlers. A rota `/acesso` e arquivos de acesso vazios não constituem mecanismo de autorização.

## 1.2 Componentes e dependências internas

- `Header`, `Footer`, `Button`, `Card`, `Input`, `Select` e `Textarea` são compartilhados. Alterá-los pode atingir simultaneamente legado e V2.
- `AlertFormClient.tsx` usa `ProfileSetupCard`; esse componente tenta gravar `vetProfiles`, embora as regras atuais neguem toda escrita nessa coleção.
- `GlobalAlertsDashboard.tsx` é o consumidor ativo da rota pública de dashboard e lê `alerts` diretamente.
- `DashboardVetPanel.tsx` e parte da família `VetPanelFeed`/`AlertCard`/`VetPanelSummary` não possuem rota/importador ativo encontrado; permanecem código legado/dead ou de piloto, mas ainda representam contratos potenciais e não devem ser removidos nesta fase.
- `AccessButton.tsx`, `AccessRestricted.tsx` e `AccessLinkClient.tsx` são stubs praticamente vazios; `AccessDenied.tsx` não tem consumidor encontrado.
- `lib/alerts/schema.ts` não valida os payloads ativos. Os dois formulários legados montam payloads inline.

## 1.3 Fluxo legado protegido

### Veterinário

`/alerta` → `/alerta/novo` → `onAuthStateChanged`/sessão técnica com fallback anônimo → validação local → `addDoc(collection(db, "alerts"), payload)` → `/global-alerts-dashboard`.

Campos obrigatórios preservados: espécie, grupo/tipo de alerta, quantidade do rebanho, severidade, UF e município. O payload mantém os campos top-level históricos, `context`, `arrival_context` quando aplicável, `source: "pilot"` e `createdAt: serverTimestamp()`.

O fluxo contém aviso de que o VetAlert não substitui notificação obrigatória/MAPA; não existe envio automático ao MAPA.

### Agro-retail

`/agro-signals/new` → autenticação anônima → validação local → escrita direta em `alerts` → `/global-alerts-dashboard`.

O contrato inclui `source: "agro_retail"`, `signalType: "field_retail"`, campos comuns do legado e detalhes em `context`/`retailSignal`, inclusive produto/categoria/prescrição/duração.

## 1.4 Fluxo V2 isolado

O cliente V2 usa vocabulário fechado, sem textarea, nome, CRMV, contato, produtor, propriedade, endereço, GPS, marca ou fabricante. Ele autentica com Firebase, envia bearer token a `/api/v2/observations` e nunca escreve diretamente em Firestore.

O servidor:

1. exige a flag V2 e JSON limitado a 16 KiB;
2. verifica o ID token com revogação;
3. aplica allowlist de schema e denylist recursiva de chaves proibidas;
4. cria `submissionId`, `receivedAt`, versão, origem e retenção no servidor;
5. transforma UID e fingerprint em digests HMAC server-only;
6. aceita o registro mesmo quando suspeito, marcando duplicidade/rate window;
7. grava transacionalmente observação, sidecar de integridade e audit log.

Registros suspeitos são excluídos da agregação SAPSA, não apagados. O SAPSA agrupa por UF, espécie e grupo observacional, aplica célula mínima configurável e apresenta metodologia exploratória.

## 1.5 Backend Python legado

O FastAPI expõe `/`, `/terminal/events`, `/terminal/alerts` e `/terminal/stream`. Ele lê até 5.000 documentos de `alerts` com Google Application Default Credentials e aplica normalização permissiva, clusterização, anomalia, projeção e heurísticas de confiança/probabilidade. Não há autenticação/RBAC nos endpoints, o CORS é amplo e existe fallback sintético cuja rotulagem não é consistente em toda saída. Esse backend não participa da persistência V2.

## 1.6 Firestore e permissões

| Coleção | Produtor/consumidor atual | Regra de cliente na branch V2 | Observação |
| --- | --- | --- | --- |
| `alerts` | intakes legados, dashboards e backend Python | leitura e criação para qualquer autenticado; update/delete negados | Contrato legado; raw inclui timestamp, município, texto/contexto e detalhes comerciais |
| `vetProfiles` | componentes legados tentam escrever/ler | leitura autenticada; escrita negada | Código e rules são inconsistentes |
| `doctors` | superfície legada sem consumidor encontrado | leitura autenticada; próprio UID cria/atualiza; delete negado | Não é prova institucional de elegibilidade |
| `veterinaryObservationsV2` | Admin SDK V2/SAPSA | todas as operações de cliente negadas | Observação V2 sem UID bruto |
| `submissionIntegrityV2` | Admin SDK V2 | todas as operações de cliente negadas | HMAC, fingerprint e flags; dado pseudonimizado, não anônimo absoluto |
| `auditLogsV2` | Admin SDK V2/export | todas as operações de cliente negadas | Eventos operacionais mínimos |

O diff de `firestore.rules` contra `main@0290778` acrescenta somente os três blocos deny-only V2. Os blocos de `alerts`, `vetProfiles` e `doctors` permanecem textualmente iguais. Não existe regra ampla `allow read, write`.

# 2. Legado versus V2

| Dimensão | Legado | V2 draft |
| --- | --- | --- |
| Estado | produção atual | isolado, default-off |
| Persistência | cliente → `alerts` | Route Handler/Admin SDK → três coleções V2 |
| Autenticação de intake | sessão técnica/anônima | token Firebase; qualquer usuário Firebase válido pode submeter |
| Elegibilidade profissional | não comprovada | ainda não comprovada; interface de attestação externa não está integrada |
| Schema | payload inline permissivo | schema v2 fechado e validado no servidor |
| Texto livre/dados comerciais | presentes | ausentes/rejeitados |
| Metadados de integridade | ausentes | gerados no servidor e separados |
| Abuso/duplicidade | sem controle específico | flags determinísticas; observação preservada; suspeitos excluídos do SAPSA |
| Leitura institucional | raw no cliente e terminal público | API agregada, RBAC e small-cell |
| Export | sem fronteira institucional uniforme | CSV agregado com RBAC e audit log |
| Retenção | não definida | `expiresAt` gravado, mas TTL operacional ainda não ativado/comprovado |
| MAPA | aviso no formulário; sem integração | aviso qualificado; sem integração ou alegação de canal oficial |
| Privacidade | não pode ser descrito como privacy-safe | desenho privacy-safe no escopo testado; ainda depende de IAM/logs/segredos reais |

O adaptador `legacy-alerts` é apenas uma função pura, não integrada. Ele constrói em memória uma saída por allowlist, sem raw, identidade, texto livre, produto ou timestamp exato, e não lê/escreve/apaga/backfilla dados. Ainda preserva código IBGE municipal para futura agregação server-side; esse código nunca poderá ser exposto antes de agregação e small-cell suppression.

# 3. Testes concluídos e evidência

## Evidência registrada nas PRs

| Suite/controle | #127 | #129 |
| --- | --- | --- |
| Unitários/contrato | 20/20 PASS no relatório atualizado | 20/20 PASS |
| TypeScript | PASS | PASS |
| Build Next | PASS | PASS com Next 16.3.4 |
| ESLint novo/V2 | PASS | sem source V2 alterado |
| ESLint completo | FAIL conhecido: 5 erros e 3 warnings no `AlertFormClient.tsx` protegido | mesmo baseline |
| Firebase Auth/Firestore Emulator | 7/7 PASS, projeto local `demo-vetalert-v2` | 7/7 PASS |
| Playwright/Chromium | 5/5 PASS | 5/5 PASS |
| Fluxo vet legado | hash + browser/emulator PASS | PASS |
| Fluxo agro legado | hash + cenário dedicado PASS | PASS |
| RBAC/raw V2/small-cell/export audit | PASS no emulador | PASS no emulador |
| Preview Vercel flag off/on | bloqueado/não verificado | não há nova evidência de preview |
| Staging real IAM/claims/HMAC/TTL/logs | não testado | não testado |

Os cenários Playwright cobrem onboarding mobile, teclado, navegação voltar, clique duplo, falha de rede, refresh, rotas, autenticação anônima e persistência exata dos dois intakes legados. Os testes de emulador cobrem usuário sem autenticação, veterinário, analista SAPSA, administrador, tentativas indevidas, schema, HMAC fail-closed, duplicidade, rate flag, agregação, supressão, CSV e audit log.

## Verificação desta auditoria

- `node ... --test tests/*.test.ts`: **20/20 PASS**.
- `node node_modules/typescript/bin/tsc --noEmit`: **PASS**.
- Comparação de `firestore.rules` com `main@0290778`: somente três blocos V2 deny-only adicionados.
- Inventário Git: checkout limpo antes da criação deste documento.

O executável `npm` não estava no `PATH` desta sessão. A tentativa via wrapper `pnpm` iniciou verificação de metadados externos e foi interrompida quando a rede restrita impediu o acesso; os dois comandos acima foram então executados diretamente com o Node 24.19.0 disponível. Build, emulador, Playwright e lint completo não foram repetidos nesta auditoria documental; seus resultados acima são evidência versionada das validações anteriores, não uma nova execução.

Não existe suíte Python; a evidência existente limita-se a `compileall`. Não existe workflow de CI versionado em `.github/workflows`; somente o template de PR está presente.

# 4. Riscos não resolvidos

## Bloqueadores de release

1. **Raw legado continua acessível.** `alerts` permite leitura a qualquer autenticado e o dashboard cria autenticação anônima automaticamente. O produto inteiro não é privacy-safe.
2. **Previews Vercel não foram verificados.** A evidência mais recente registra 403/conector sem acesso ao time `colo-prep-ia`. Flag off, flag on, mobile, erros e SAPSA no artefato Vercel permanecem não verificados.
3. **Staging real não foi validado.** IAM mínimo, service account, claims reais, segredo HMAC/rotação, retenção de logs, backups e TTL precisam de prova fora do emulador.
4. **PR #129 não está mergeable.** GitHub informou `mergeable=false`; a causa deve ser resolvida sem alterar contratos protegidos. #128 e #129 são branches irmãs sobre #127 e exigem ordem explícita de integração.
5. **Cutover não foi autorizado.** Rota, navegação, flag, permissões e tratamento de `alerts` requerem decisões separadas.

## Riscos técnicos e de privacidade

- O legado envia IP a `ipapi.co`, mantém identificadores locais/técnicos, timestamps exatos, município, localidade e texto livre. Esses dados podem permitir correlação ou reidentificação.
- As páginas públicas ainda contêm afirmações fortes como “100% anônimos”, “conformidade LGPD”, convite/CRMV e “dados exclusivamente agregados” que não correspondem a todo o legado implementado.
- A submissão V2 aceita qualquer token Firebase válido; não comprova veterinário elegível nem fontes profissionais distintas.
- O HMAC reduz exposição, mas o digest continua pseudônimo correlacionável. Comprometimento do segredo mais acesso a UIDs permite correlação.
- Rate limiting V2 é classificação, não bloqueio. As consultas de integridade usam `limit(100)` sem estratégia de alta cardinalidade; em volume elevado, duplicidade/taxa podem deixar de considerar os eventos mais recentes.
- A retenção é apenas um campo `expiresAt`; TTL não foi ativado nem verificado. Admin SDK contorna rules por desenho, portanto IAM é o controle real server-side.
- O agregador lê no máximo 5.000 observações em 90 dias, sem paginação. Pode subcontar silenciosamente em escala.
- `suspiciousRecordsExcluded` na explicação de cada célula usa o total global, não o total daquela célula, o que pode induzir interpretação incorreta.
- Com célula mínima padrão 5 e limiares recorrente/emergente abaixo de 5, as classificações inferiores são suprimidas na saída institucional. A evolução completa não fica visível no SAPSA atual.
- `sourceChannelCount` é calculado, mas não aparece no dashboard nem no CSV; como o intake V2 atual possui uma única origem, corroboração cross-source ainda não está demonstrada.
- Limiares de convergência/small-cell são exploratórios e não cientificamente validados.
- O endpoint IBGE é dependência externa; falha resulta em lista vazia/502 e não há staging evidence da experiência completa.
- O terminal Python expõe raw/derivados sem RBAC, usa heurísticas com aparência quantitativa e pode misturar fallback sintético sem rotulagem suficiente.
- `vetProfiles` tem implementação e regras incompatíveis; `doctors` não comprova habilitação profissional.
- Não há pipeline CI obrigatório para impedir regressões antes de merge.
- Documentos existentes divergem na contagem de lint em alguns trechos (“8” versus a baseline confirmada de 5 erros e 3 warnings). Os relatórios precisam ser reconciliados antes de uso institucional.
- A branch #127 é ampla (59 arquivos). Mesmo com hashes do intake, a revisão de release precisa tratar separadamente código, regras, testes, documentação e lockfile.

## Dependências

A PR #128 documenta os achados sem alterar pacotes. A PR #129 propõe Next 16.1.1 → 16.3.4, `eslint-config-next` correspondente e Firebase cliente `^12.7.0` → `12.18.0`, mantendo `firebase-admin@14.3.0`.

Segundo o relatório da #129, `npm audit --omit=dev` caiu de 21 para 7 achados e de 8 para 0 high. Permanece 1 critical (`websocket-driver` via Realtime Database não importado pelo app) e 6 moderate na família Firebase Admin/Google Cloud Storage não usada pelo código V2. Isso é redução do grafo, não prova de ausência de exploração; não usar `npm audit fix`, downgrade de Admin ou upgrade em massa.

# 5. Arquivos seguros para alterar nesta fase

“Seguro” significa somente que a mudança pode ser proposta em draft com escopo isolado e regressão completa; não autoriza deploy, merge ou cutover.

| Superfície | Condição |
| --- | --- |
| `docs/*.md` e testes novos | Podem corrigir evidência, metodologia e cobertura sem alterar comportamento; não reescrever evidência histórica silenciosamente |
| `app/v2/**`, `app/api/v2/**`, `app/sapsa/v2/**` | Somente enquanto isolados, default-off e sem import/injeção nos fluxos legados |
| `lib/v2/**` | Somente server/client boundaries explícitos, schema versionado e testes de privacidade/RBAC |
| `tests/**`, `firebase.json`, `.firebaserc`, `playwright.config.ts` | Somente ambientes `demo-`/staging, sem fallback para produção |
| Novo código de staging/observabilidade redigida | Sem segredo, dado sanitário raw ou alteração de configuração de produção |
| PR documental de dependências | Análise sem mutação de lockfile/runtime |

Mudanças em `package.json`, `package-lock.json`, `next.config.ts`, dependências ou componentes compartilhados são **mixed-risk**, não genericamente seguras. Devem permanecer em PR de compatibilidade estreita, com hashes, unitários, typecheck, build, emulador, E2E dos dois legados e previews.

# 6. Arquivos e contratos que devem permanecer protegidos

## Registro e persistência legados

- `app/alerta/page.tsx`
- `app/alerta/novo/page.tsx`
- `app/alerta/novo/AlertFormClient.tsx`
- `app/agro-signals/new/page.tsx`
- `app/agro-signals/new/AgroSignalFormClient.tsx`
- `lib/auth.ts`
- `lib/firebase.ts` e `lib/regions.ts`, porque são dependências diretas do intake
- `components/ProfileSetupCard.tsx` e componentes compartilhados usados pelos formulários, salvo revisão visual/compatibilidade específica
- coleção `alerts`, nomes de campos, objetos `context`/`arrival_context`, required fields, step order, autenticação, write target e redirect
- aviso e fluxo de notificação obrigatória/MAPA do legado

## Permissões, consumidores e produção

- os blocos legados de `firestore.rules` para `alerts`, `vetProfiles` e `doctors`
- `components/vet-panel/GlobalAlertsDashboard.tsx` e `app/global-alerts-dashboard/page.tsx` até existir migração aprovada
- `backend/**` e `app/terminal/page.tsx` até existir plano próprio de fechamento/migração
- `Header.tsx`, `Footer.tsx`, `app/page.tsx` e navegação pública durante a fase sem cutover
- aliases, settings, variáveis e feature flags de produção na Vercel
- dados e coleções existentes; nenhuma escrita sintética, migração, backfill, update ou delete
- PRs #127, #128 e #129 devem continuar draft até os gates abaixo e aprovação explícita

# Plano de release por gates

## Gate 0 — estado atual

- Manter `VETALERT_V2_ENABLED` ausente/false em produção.
- Manter as três PRs draft e não mesclar.
- Resolver a condição `mergeable=false` da #129 e definir ordem de integração entre #128 e #129 sem ampliar escopo.
- Reconciliar relatórios conflitantes e linguagem pública; nenhuma correção pública entra sem PR/revisão próprios.

## Gate 1 — validação de preview, sem produção

- Reautorizar o conector somente no scope `colo-prep-ia`.
- Identificar por ID/commit os previews flag-off e flag-on.
- Verificar rotas, onboarding, mobile, teclado, erro de rede, refresh/back/double submit, 401/403 SAPSA e ausência de raw.
- Provar que nenhum alias, environment de produção ou setting foi alterado.
- Se o acesso continuar bloqueado, registrar **BLOCKED**, nunca PASS.

## Gate 2 — staging Firebase real

- Usar projeto separado, contas/claims de teste e service account mínima.
- Testar sem produção: autenticação, observação válida/inválida, chaves proibidas, HMAC, duplicidade, taxa, transação, índices, raw deny, RBAC, small-cell, CSV e audit log.
- Ativar/testar TTL somente no staging e documentar rotação de segredo, IAM, logs, backups e resposta a incidente.
- Fazer teste de carga dirigido ao `limit(100)` de integridade e ao limite de 5.000 do agregador.

## Gate 3 — fechamento das lacunas de produto

- Corrigir a explicação por célula e alinhar limiares de classificação com small-cell sem alegação científica.
- Decidir como demonstrar evolução temporal e corroboração de fontes sem afirmar independência não comprovada.
- Criar processo externo de atribuição/revogação de claims e, futuramente, attestação de elegibilidade sem identidade no documento.
- Aprovar juridicamente consentimento, retenção, direitos, precisão territorial, logs e linguagem pública.
- Definir arquitetura para migrar dashboards/terminal a APIs agregadas antes de fechar raw reads.

## Gate 4 — estratégia legada, decisão externa

- Escolher tratamento de `alerts`: permanecer imutável como arquivo restrito, leitura server-side agregada via adapter, período de convivência e retenção aprovada.
- Integrar o adapter somente server-side: allowlist → descarte/rejeição contabilizado → agregação → small-cell → resposta agregada.
- Nunca expor documento raw, timestamp exato, texto, identidade, produto ou detalhe de propriedade.
- Só depois de migrar todos os consumidores, propor em PR separado o fechamento de leitura cliente em `alerts`.

## Gate 5 — aprovação explícita de cutover

Exige decisão separada e inequívoca sobre cada item:

1. substituir ou redirecionar `/alerta/novo`;
2. alterar navegação pública;
3. habilitar a flag V2 em produção;
4. aplicar permissões de produção;
5. definir o tratamento e acesso futuro a `alerts`;
6. aprovar rollback e janela de observação.

Sem essa aprovação, o release continua NO-GO.

## Rollback proposto

- Antes do cutover: manter a flag off e fechar/reverter somente as PRs draft; nenhum dado precisa ser revertido.
- Em preview/staging: remover somente variáveis/claims/credenciais daquele ambiente e revogar o segredo de teste; não tocar produção.
- Em eventual cutover futuro: preservar deploy anterior e configuração anterior, manter `alerts` imutável, reverter rota/navegação/flag/permissões pelo PR aprovado e nunca apagar observações como mecanismo de rollback.
- Qualquer rollback de rules deve usar o arquivo versionado e revisão humana, sem comandos destrutivos ou migração reversa improvisada.

## Próxima decisão permitida

No estado presente, a única decisão recomendada é autorizar a correção documental e a continuação dos Gates 0–3 em ambientes não produtivos. A substituição do fluxo legado e qualquer mudança de produção permanecem fora de escopo.
