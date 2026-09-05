# Auditoria técnica do VetAlert antes da reconstrução V2

Data da auditoria: 5 de setembro de 2026  
Commit auditado: `0290778` (`main`)  
Escopo: todo o repositório `gabrielldjr-creator/vet-alert-brasil`

## 1. Contrato de não regressão

Esta auditoria adota como regra superior a preservação do fluxo de produção existente. Nesta fase não serão alterados em lugar:

- `/alerta` e seu redirecionamento para `/alerta/novo`;
- `/alerta/novo`, `app/alerta/novo/AlertFormClient.tsx` e seu fluxo de sete etapas;
- `/agro-signals/new` e `AgroSignalFormClient.tsx`;
- autenticação anônima/técnica usada pelos fluxos atuais;
- coleção Firestore `alerts`, nomes, formatos aninhados e comportamento de envio;
- campos obrigatórios atuais;
- redirecionamento pós-envio para `/global-alerts-dashboard`;
- permissões existentes de `alerts`, `vetProfiles` e `doctors`.

As correções propostas abaixo serão implementadas em uma superfície V2 isolada, desativada por padrão. Problemas no legado ficam documentados como dívida ou risco de migração, sem correção destrutiva nesta fase.

## 2. Baseline executado antes de alterações

| Verificação | Resultado | Observação |
|---|---|---|
| Instalação conforme `package-lock.json` | PASS | 504 pacotes; npm reportou 17 vulnerabilidades transitivas: 1 baixa, 3 moderadas, 11 altas e 2 críticas. Não foi executado `npm audit fix`. |
| TypeScript `tsc --noEmit` | PASS | Sem erros. |
| `next build` | PASS | 10 rotas de aplicação e `_not-found` geradas. |
| ESLint | FAIL conhecido | 5 erros `no-explicit-any` e 3 avisos existentes, todos em `AlertFormClient.tsx`. O arquivo protegido não foi modificado para mascarar a baseline. |
| Testes JavaScript/TypeScript existentes | AUSENTES | `package.json` não possui script `test` e não existem testes da aplicação. |
| Compilação sintática Python | PASS | `python -m compileall -q backend`. |
| Testes Python existentes | AUSENTES | Não existe diretório ou configuração de testes. |
| Testes Firestore Emulator | AUSENTES | Não há `firebase.json`, configuração de emulator ou harness de regras. |

## 3. Inventário do repositório

### 3.1 Rotas Next.js

| Rota | Implementação | Estado atual | Classificação |
|---|---|---|---|
| `/` | `app/page.tsx` | Homepage pública com links diretos para intake, varejo, painel e terminal | Pública |
| `/acesso` | `app/acesso/page.tsx` | Texto de convite; não valida convite | Pública |
| `/agro-signals/new` | `app/agro-signals/new/*` | Formulário de varejo com gravação direta em `alerts` | Produção protegida por contrato, mas acessível publicamente |
| `/alerta` | `app/alerta/page.tsx` | Redireciona para `/alerta/novo` | Contrato protegido |
| `/alerta/novo` | `app/alerta/novo/*` | Formulário veterinário, autenticação anônima e gravação direta | Contrato protegido |
| `/global-alerts-dashboard` | `app/global-alerts-dashboard/page.tsx` | Leitura de todos os documentos de `alerts` e drill-down bruto | Pública com autenticação anônima automática |
| `/privacidade` | `app/privacidade/page.tsx` | Política pública com afirmações incompatíveis com a implementação | Pública |
| `/sobre` | `app/sobre/page.tsx` | Afirma convite/CRMV ativo sem mecanismo correspondente | Pública |
| `/terminal` | `app/terminal/page.tsx` | Feed, alertas heurísticos e mapa sintético | Pública |
| `/uso-etico` | `app/uso-etico/page.tsx` | Guardrails institucionais e links ao intake/painel | Pública |

Não existem Route Handlers Next.js, middleware/proxy, Server Actions ou rotas de API no baseline.

### 3.2 Componentes

- Componentes genéricos: `Button`, `Card`, `Input`, `Select`, `Textarea`, `Header`, `Footer`.
- Acesso/perfil: `AccessDenied`, `ProfileSetupCard`; `AccessButton`, `AccessRestricted` e `AccessLinkClient` são arquivos vazios de 10 bytes.
- Painéis: `AlertCard`, `DashboardVetPanel`, `GlobalAlertsDashboard`, filtros, feed, resumo, tipos e mapeamento de rótulos.
- `ProfileSetupCard` grava `email`, cidade, estado, papel e UID implícito no caminho `vetProfiles/{uid}`.
- `DashboardVetPanel` cria perfil fallback contendo `uid`, `role`, `state`, `verified` e timestamp.

### 3.3 Dados, tipos e schemas

- `lib/alerts/schema.ts` é um modelo antigo e não é usado pelo formulário atual nem como validador runtime.
- `components/vet-panel/types.ts` descreve parcialmente documentos de `alerts`; não rejeita campos desconhecidos.
- `AlertFormClient.tsx` e `AgroSignalFormClient.tsx` constroem payloads inline sem schema runtime compartilhado.
- O backend Python normaliza livremente documentos antigos em `backend/events.py`.
- Não existe schema canônico validado no servidor.

### 3.4 Coleções Firestore

| Coleção | Escrita atual | Leitura atual | Conteúdo/risco |
|---|---|---|---|
| `alerts` | Cliente autenticado em ambos os intakes | Qualquer usuário autenticado | Observações, município, timestamps exatos, texto livre, produto vendido e contexto detalhado |
| `vetProfiles` | Código tenta gravar, mas regra atual bloqueia toda escrita | Qualquer usuário autenticado | Pretende conter UID, email, estado, cidade, papel e verificação |
| `doctors` | Próprio UID pode criar/atualizar | Qualquer usuário autenticado | Superfície legada sem consumidor encontrado |

O backend usa credenciais Google padrão e lê `alerts`; não há regra server-side, validação de payload, trilha de auditoria, retenção ou controle de exportação.

### 3.5 Funções server-side e Python

- `backend/main.py`: FastAPI com CORS `*`, credenciais habilitadas, todos os métodos e headers.
- `backend/events.py`: leitura direta de até 5.000 registros e normalização permissiva.
- `backend/signal_engine.py`: regras de cluster `>5/48h`, crescimento, espalhamento e Isolation Forest.
- `backend/anomaly.py`: pontuação de anomalia por frequência/distribuição.
- `backend/projection.py`: regressão linear e rótulos de tendência.
- `backend/terminal_routes.py`: endpoints `/terminal/events`, `/terminal/alerts` e WebSocket `/terminal/stream`; engole erros, retorna dados sintéticos sem rotulagem suficiente, calcula confiança e probabilidade de escalada.
- Não há autenticação ou autorização nos endpoints FastAPI.

### 3.6 Variáveis de ambiente e integrações externas

- `NEXT_PUBLIC_PILOT_MODE`: pode liberar `DashboardVetPanel`; leitura client-side.
- `NEXT_PUBLIC_TERMINAL_API_BASE` e `NEXT_PUBLIC_TERMINAL_WS_BASE`: bases do terminal.
- Firebase Web config está versionado em `lib/firebase.ts` (config pública por natureza, mas requer regras robustas).
- IBGE: busca pública de municípios.
- `ipapi.co`: geolocalização automática por IP no formulário protegido.
- Google Application Default Credentials: implicitamente exigidas pelo backend Python.
- Não há documentação completa de ambiente, rotação de segredos ou segregação de ambientes.

### 3.7 Documentação existente

- `README.md` está desatualizado: afirma que persistência não está ativa, embora os dois formulários gravem em Firestore.
- `docs-registration-audit-plan.md` e `docs/vetalert-sapsa-guardrails.md` registram corretamente a fragilidade do intake e o contrato de não regressão.
- Não existem dicionário de dados, política operacional de retenção, matriz de papéis, metodologia SAPSA, plano de migração nem métricas de validação completas.

## 4. Fluxo de produção protegido, ponta a ponta

### 4.1 Veterinário

1. `/alerta` redireciona para `/alerta/novo`.
2. `AlertFormClient` chama `onAuthStateChanged`; sem usuário, chama `signInAnonymously`.
3. O fluxo usa sete passos e exige `alertType`, `species`, `herdCount`, `severity`, `state` e `cityCode` antes do envio.
4. `handleSubmit` obtém token Firebase e grava diretamente com `addDoc(collection(db, "alerts"), payload)`.
5. O payload preserva campos top-level, `arrival_context` e `context`.
6. Após sucesso, redireciona para `/global-alerts-dashboard`.

### 4.2 Agro-retail

1. `/agro-signals/new` renderiza `AgroSignalFormClient`.
2. Exige espécie, sintoma, produto, categoria, UF, município, prescrição e duração.
3. Autentica anonimamente se necessário.
4. Grava diretamente na mesma coleção `alerts` com `source: "agro_retail"`.
5. Após sucesso, redireciona para `/global-alerts-dashboard`.

### 4.3 Payload legado protegido

```text
alerts/{autoId}
  createdAt, state, regionIBGE, municipality, localidadeAproximada,
  city, cityCode, cityName, regionGroup, species, alertGroup,
  alertType, severity, cases, herdCount, source,
  arrival_context?, context
```

O agro-retail acrescenta `signalType` e `context.retailSignal`. Nenhuma mudança será feita nesses payloads nesta fase.

## 5. Metadados que identificam ou podem reidentificar

| Metadado | Onde existe/pode existir | Risco |
|---|---|---|
| Firebase UID | Sessão Auth, caminhos de perfil e logs de autenticação | Identificador persistente capaz de correlacionar registros/sessões |
| Email técnico derivado de UUID local | `lib/auth.ts` | Identificador persistente; não é email profissional, mas correlaciona dispositivo/sessão |
| Email Firebase | `ProfileSetupCard` | Pode conter email real se outro método de autenticação for usado |
| UUID em `localStorage` | `vet-alert-session-id` | Identificador de navegador persistente |
| Reconhecimento do aceite | `vetalert-ethics-ack` | Estado local correlacionável no dispositivo |
| Endereço IP | Firebase, Vercel/hosting, FastAPI/proxy e `ipapi.co` | Pode identificar conexão aproximada e é enviado a terceiro no formulário atual |
| User-Agent/device/browser | Logs de CDN, Vercel, Firebase e navegador | Fingerprinting indireto, especialmente combinado com horário/localidade |
| Timestamp exato | `createdAt`, logs Firebase/Vercel/backend | Liga atendimento a agenda/rota local |
| Município/código IBGE/microrregião | `alerts` e painéis | Pequenas células podem identificar profissional ou propriedade em área pouco coberta |
| Localidade aproximada | Campo livre em `alerts` | Pode conter propriedade, bairro ou descrição singular |
| Notas e observações | Vários campos livres | Podem conter nomes, CRMV, propriedades, marcas, fabricantes, diagnósticos e narrativas singulares |
| Produto vendido | Agro-retail e dashboard | Identifica transação, empresa/produto e contexto comercial |
| Contexto de chegada | `arrival_context` | Pressão financeira/manejo pode reidentificar ou estigmatizar uma propriedade |
| Princípio ativo livre | Opção “Outro” | Pode receber marca/fabricante ou narrativa proibida |
| Console logs | Vários `console.error` | Erros SDK podem carregar metadados técnicos; política de redaction ausente |
| Analytics | Nenhum SDK encontrado | Não implementado no código, mas Vercel/Firebase podem produzir métricas de infraestrutura |

Garantia atual: a aplicação evita pedir nome/CRMV no formulário principal. Limitação: isso não equivale a anonimato absoluto porque há identificadores técnicos, logs, timestamps precisos, município e texto livre.

## 6. Registro de problemas

| ID | Categoria | Arquivo/linha ou componente | Problema | Risco | Correção proposta | Teste necessário | Status após auditoria |
|---|---|---|---|---|---|---|---|
| A01 | Segurança / rota desprotegida | `GlobalAlertsDashboard.tsx:128-160` | Usuário anônimo lê todos os `alerts` e abre registros individuais | Exposição massiva | V2 SAPSA server-side, RBAC e somente agregados | 401/403 e ausência de raw records | Planejado V2; legado congelado |
| A02 | Segurança / permissões | `firestore.rules:4-7` | Qualquer autenticado lê e cria qualquer formato em `alerts` | Exfiltração e payload arbitrário | Novas coleções V2 deny-by-default; escrita somente Admin SDK | Testes estáticos/emulator | Planejado V2; permissão legada preservada |
| A03 | Privacidade | `lib/auth.ts:13-68` | UID/email técnico persistente e UUID em localStorage | Correlação de dispositivo | Não reutilizar no documento observacional V2; pseudonimizar apenas no sidecar server-only | Ausência de UID/email no documento | Planejado V2 |
| A04 | Privacidade | `AlertFormClient.tsx:337-355` | Geolocalização por IP automática | Terceiro recebe IP; território inferido | V2 exige seleção explícita e não chama geolocalização | Teste de ausência de `ipapi` | Planejado V2; legado congelado |
| A05 | Privacidade | `AlertFormClient.tsx:543-603` | Texto livre, localidade e timestamp exato | Reidentificação | V2 sem texto livre e com saída agregada | Denylist e schema estrito | Planejado V2 |
| A06 | Privacidade / produto | `AgroSignalFormClient.tsx:24-120` | Produto vendido, descrição e notas livres entram em `alerts` | Empresa/produto/propriedade identificáveis | V2 não inclui canal varejo; rejeitar chaves proibidas no endpoint V2 | Testes recursivos | Planejado V2; legado congelado |
| A07 | Privacidade | `ProfileSetupCard.tsx:40-61` | Grava email, UID, cidade, papel client-supplied | Identidade e escalada de papel | Não usar no V2; papéis somente em custom claims server-verified | Teste de claims | Planejado V2 |
| A08 | Funcional / permissões | `ProfileSetupCard` e `DashboardVetPanel` versus `firestore.rules:9-12` | Código tenta gravar `vetProfiles`, mas regras bloqueiam | Fluxo inconsistente | Documentar legado; V2 não depende dessa escrita | Teste de contrato | Documentado |
| A09 | Segurança | `backend/main.py:6-14` | CORS `*` com credentials, métodos e headers irrestritos | Uso cross-origin e superfície ampla | Não expor backend V2 por esse app; endpoints Next V2 com same-origin e auth | Testes de headers/acesso | Planejado V2 |
| A10 | Segurança / rota desprotegida | `backend/terminal_routes.py` | Eventos, alertas e stream sem autenticação | Dados e heurísticas públicos | SAPSA V2 exige papel antes de consultar | 401/403 direto | Planejado V2; legado congelado |
| A11 | Lógica estatística | `signal_engine.py` | `>5/48h`, crescimento simples e spread global sem baseline/duplicatas | Falsos padrões | Motor V2 determinístico, configurável, explicável e com qualidade da amostra | Cenários sintéticos | Planejado V2 |
| A12 | Lógica estatística / risco institucional | `terminal_routes.py:153-302` | Confiança percentual e probabilidade de escalada arbitrárias | Aparência científica indevida | V2 não expõe confiança/probabilidade; classifica “padrão para revisão” | Teste de vocabulário | Planejado V2 |
| A13 | Risco institucional | `terminal_routes.py:55-108,243-280` | Fallback sintético não é claramente rotulado em toda saída | Demonstração confundida com dado real | V2 inclui origem/modo explícito e nunca mistura demo com produção | Teste de origem | Planejado V2 |
| A14 | Risco regulatório / cópia | `app/page.tsx`, `privacidade/page.tsx` | “100% anônimo”, “conformidade LGPD” e conclusão jurídica | Afirmações não demonstradas | Novas páginas/UX V2 usam linguagem qualificada; corte público legado exige decisão posterior | Teste de copy V2 | Planejado V2; legado congelado |
| A15 | Risco institucional | `sobre/page.tsx`, `acesso/page.tsx` | Afirma CRMV ativo/convite válido sem verificação real | Representação enganosa | V2 declara “piloto controlado” e não coleta CRMV; integração externa fica futura | Teste de texto | Planejado V2 |
| A16 | Produto / UX | `Header.tsx`, `Footer.tsx`, `page.tsx` | Agro, dashboard bruto e terminal aparecem na navegação pública | Confusão de produto e exposição | V2 terá rota não navegável por padrão; mudança da navegação pública só no cutover | Teste de rotas legadas | Adiado para decisão de cutover |
| A17 | Tipo/schema | Intakes, `lib/alerts/schema.ts` | Três representações divergentes e nenhuma validação server-side | Dados inconsistentes | `VeterinaryObservationV2` versionado e parser estrito no servidor | Unitários de schema | Planejado V2 |
| A18 | Segurança | Intakes client-side | Cliente controla todos os campos e timestamps `serverTimestamp` sem allowlist | Injeção de campos e falsificação | Endpoint V2 rejeita unknown/proibidos e gera metadados no servidor | Testes de forgery | Planejado V2 |
| A19 | Segurança | Repositório | Ausência de rate limit e deduplicação | Abuso e convergência artificial | Transação/sidecar V2 com digest HMAC, rate flag e duplicate flag; nunca apagar | Cenários de burst/duplicata | Planejado V2 |
| A20 | Governança | Repositório | Ausência de retenção e auditoria | Dados indefinidos e baixa rastreabilidade | `expiresAt`, versão de consentimento e `auditLogsV2` sem identidade direta | Testes de metadados | Planejado V2 |
| A21 | Acessibilidade | Formulários/painéis | Alguns grupos usam `aria-labelledby` sem elemento correspondente, cores/rótulos e modal sem dialog semantics | Navegação assistiva incompleta | Componentes V2 com fieldset/legend, foco, erros anunciados e teclado | Testes de markup e browser | Planejado V2 |
| A22 | Código morto | Arquivos de 10 bytes e schema antigo | Stubs e tipos sem consumidor | Confusão/manutenção | Documentar; não remover nesta fase | Inventário | Documentado |
| A23 | Documentação desatualizada | `README.md` | Diz que persistência não está ativa | Operação incorreta | Atualizar README sem mudar contrato | Verificação textual | Planejado |
| A24 | Dependências | `package-lock.json` | 17 vulnerabilidades reportadas | Supply chain/runtime | Auditar e atualizar em PR separado quando houver avaliação de compatibilidade | `npm audit`, build | Decisão externa/PR separado |
| A25 | Governança MAPA | Produto | Avisos existem, mas links oficiais configuráveis e versão de orientação não existem | Direcionamento inconsistente | V2 usa orientação neutra e URL oficial somente via configuração aprovada | Unitário de URL/config | Planejado V2 |

## 7. Arquitetura V2 aprovada para implementação paralela

### Rotas novas propostas

- `/v2/onboarding`: fluxo público V2, acessível somente quando `VETALERT_V2_ENABLED=true`; flag ausente/false retorna indisponível.
- `/v2/confirmacao`: confirmação genérica, sem identificador do registro.
- `/api/v2/observations`: `POST` autenticado por Firebase ID token, validação estrita e persistência server-side.
- `/sapsa/v2`: shell analítico sem dados no HTML; dados exigem claim `sapsa_analyst` ou `admin`.
- `/api/v2/sapsa/summary`: agregação server-side, RBAC e supressão de pequenas células.

Nenhuma rota existente será removida, renomeada ou redirecionada.

### Novos schemas e coleções

| Namespace | Finalidade | Acesso do cliente |
|---|---|---|
| `veterinaryObservationsV2` | Observação canônica sem identidade, texto livre ou metadado técnico | Nenhum; Admin SDK somente |
| `submissionIntegrityV2` | Digest HMAC de origem, fingerprint, janela de taxa e flags | Nenhum |
| `auditLogsV2` | Eventos operacionais mínimos, versionados e pseudonimizados | Nenhum |

O documento observacional V2 não conterá UID, email, nome, CRMV, telefone, propriedade, coordenada, IP, User-Agent, marca, fabricante, produto ou texto livre. `receivedAt`, `submissionId`, `schemaVersion`, `source`, flags de qualidade e retenção serão gerados no servidor.

### Permissões propostas

Os blocos existentes de `firestore.rules` serão preservados byte a byte. Serão acrescentadas negações explícitas `allow get, list, create, update, delete: if false` para as três coleções V2; não há regra ampla `allow read, write`. Toda leitura/escrita V2 passa pelo servidor autenticado. Papéis vêm exclusivamente de custom claims verificadas; payloads do cliente não podem definir papel ou organização.

## 8. Limitações da auditoria

- Não houve acesso a dados reais Firestore, logs Firebase, logs Vercel ou configuração do Firebase Console; portanto não se afirma ausência de IP, User-Agent ou identificadores em infraestrutura.
- Não há Firebase Emulator configurado para provar regras dinamicamente.
- Não há documentação jurídica/regulatória fornecida; a auditoria não conclui conformidade LGPD, MAPA ou homologação institucional.
- Não há mecanismo atual que prove profissionais distintos ou elegibilidade profissional.
- Não há métricas reais de latência; V2 não prometerá “tempo real”.
- A varredura cobre todos os arquivos versionados de código/configuração/documentação e a estrutura do lockfile; artefatos binários SVG/ICO foram inventariados, não interpretados como lógica.

## 9. Critério de encerramento desta fase

A fase V2 somente pode ser apresentada como pronta para validação técnica quando:

1. rotas e payloads legados continuarem intactos;
2. V2 permanecer desativado por padrão;
3. schema e endpoint V2 rejeitarem campos proibidos e desconhecidos;
4. documentos V2 não armazenarem identidade profissional ou da propriedade;
5. SAPSA V2 não entregar dados sem papel autorizado;
6. células pequenas forem suprimidas;
7. testes, typecheck e build passarem;
8. falhas conhecidas do lint legado permanecerem claramente separadas;
9. nenhuma implantação ou migração destrutiva tiver ocorrido.
