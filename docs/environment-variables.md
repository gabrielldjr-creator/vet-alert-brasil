# Variáveis de ambiente V2

| Variável | Obrigatória | Default/uso |
|---|---|---|
| `VETALERT_V2_ENABLED` | sim para usar V2 | ausente/diferente de `true` = desativado |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | em Vercel sem ADC | JSON server-only |
| `FIREBASE_PROJECT_ID` | não | `vet-alert-brasil` |
| `VETALERT_V2_INTEGRITY_SECRET` | sim para submissão | mínimo 32 caracteres |
| `VETALERT_V2_INTEGRITY_KEY_VERSION` | não | `integrity-key-v1`; rótulo não secreto validado para auditoria de rotação |
| `VETALERT_V2_RETENTION_DAYS` | não | 365 (30–3650) |
| `VETALERT_V2_INTEGRITY_RETENTION_DAYS` | não | 30 (1–365) |
| `VETALERT_V2_RATE_WINDOW_MINUTES` | não | 10 (1–60) |
| `VETALERT_V2_MAX_SUBMISSIONS` | não | 10 (2–100) |
| `VETALERT_V2_DUPLICATE_WINDOW_HOURS` | não | 24 (1–168) |
| `VETALERT_V2_MINIMUM_CELL` | não | 5 (3–20) |
| `VETALERT_V2_RECURRING_THRESHOLD` | não | 5 (3–100), nunca efetivo abaixo de small-cell |
| `VETALERT_V2_EMERGING_THRESHOLD` | não | 6 (3–100), nunca abaixo do limiar anterior |
| `VETALERT_V2_SUSTAINED_THRESHOLD` | não | 8 (3–100), nunca abaixo do limiar anterior |
| `VETALERT_V2_MAX_AGGREGATE_RECORDS` | não | 5000 (100–50000); exceder faz o resumo falhar fechado |

Não expor segredos com `NEXT_PUBLIC_`. Não alterar variáveis Vercel de produção nesta fase. Preview deve usar privilégio mínimo e projeto/namespace separado.

## Ambiente de teste isolado

`firebase.json` e `.firebaserc` fixam o projeto demo `demo-vetalert-v2`, com Auth em `127.0.0.1:9099` e Firestore em `127.0.0.1:8080`. O runner define `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST`, `GCLOUD_PROJECT`, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` e `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-vetalert-v2`. Essas variáveis são exclusivas dos testes e não devem ser copiadas para produção.

O segredo HMAC dos testes é um valor descartável, definido somente no processo local. Em preview/staging real, usar secret gerenciado, diferente de produção, com no mínimo 32 caracteres e rotação documentada. A aplicação falha fechada (`503`) quando o segredo está ausente ou curto. `VETALERT_V2_INTEGRITY_KEY_VERSION` deve mudar junto com o segredo para permitir auditoria sem registrar a chave. A implementação atual não consulta simultaneamente uma chave anterior; uma rotação dentro da janela de duplicidade cria uma lacuna de correlação e precisa de runbook aprovado antes do piloto.

As consultas de integridade dependem dos índices compostos versionados em `firestore.indexes.json`. Criá-los em preview/staging não autoriza alteração de índices ou configuração de produção.
