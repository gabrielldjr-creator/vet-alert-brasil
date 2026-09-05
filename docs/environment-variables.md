# Variáveis de ambiente V2

| Variável | Obrigatória | Default/uso |
|---|---|---|
| `VETALERT_V2_ENABLED` | sim para usar V2 | ausente/diferente de `true` = desativado |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | em Vercel sem ADC | JSON server-only |
| `FIREBASE_PROJECT_ID` | não | `vet-alert-brasil` |
| `VETALERT_V2_INTEGRITY_SECRET` | sim para submissão | mínimo 32 caracteres |
| `VETALERT_V2_RETENTION_DAYS` | não | 365 (30–3650) |
| `VETALERT_V2_INTEGRITY_RETENTION_DAYS` | não | 30 (1–365) |
| `VETALERT_V2_RATE_WINDOW_MINUTES` | não | 10 (1–60) |
| `VETALERT_V2_MAX_SUBMISSIONS` | não | 10 (2–100) |
| `VETALERT_V2_DUPLICATE_WINDOW_HOURS` | não | 24 (1–168) |
| `VETALERT_V2_MINIMUM_CELL` | não | 5 (3–20) |

Não expor segredos com `NEXT_PUBLIC_`. Não alterar variáveis Vercel de produção nesta fase. Preview deve usar privilégio mínimo e projeto/namespace separado.
