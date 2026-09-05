# Papéis e permissões V2

| Ator | Intake V2 | Observação bruta | SAPSA agregado | Integridade/auditoria |
|---|---|---|---|---|
| Sessão Firebase válida | criar via API quando flag ativa | não | não | não |
| `vet` | criar via API quando flag ativa | não | não | não |
| `sapsa_analyst` | opcional | não | ler via API | não |
| `admin` | opcional | somente por operação controlada fora desta UI | ler via API | operação controlada |
| Cliente Firebase direto | não | não | não | não |

Papéis são custom claims verificadas pelo Firebase Admin SDK. Nenhum campo de payload define papel ou organização. Atribuição, revisão e revogação de claims são processos externos ainda não implementados.
