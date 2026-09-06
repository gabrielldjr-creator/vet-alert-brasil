# Matriz go/no-go pré-cutover

Data: 5 de setembro de 2026

Decisão atual: **NO-GO para cutover**. O V2 continua draft e desativado por padrão. Esta decisão não reprova a implementação V2; registra que validações externas e aprovações separadas ainda faltam.

| Controle | Estado | Evidência ou próximo gate |
|---|---|---|
| Contratos `/alerta/novo` e `/agro-signals/new` | PASSED | Hashes, payloads, auth anônima, persistência em `alerts` e redirects; browser/emulador 5/5. |
| Firestore legado versus baseline `0290778` | PASSED | Blocos `alerts`, `vetProfiles` e `doctors` idênticos; somente três blocos deny-only V2 foram adicionados. |
| Rules/RBAC/integridade/agregação | PASSED NO EMULADOR | Checkout limpo, Temurin 21, 7/7; nenhuma conexão a Firebase produção. |
| Testes unitários/contrato atuais | PASSED | 20/20. |
| Adapter legado proposto | PASSED COMO MÓDULO NÃO INTEGRADO | Allowlist server-only, sem raw/cliente/timestamp exato/texto/identidade/produto/escrita/delete/backfill. |
| Preview Vercel flag off | BLOCKED / NÃO VERIFICADO | Connector sem time `colo-prep-ia`; URL protegida retorna 403. |
| Preview Vercel flag on | BLOCKED / NÃO VERIFICADO | Connector sem time `colo-prep-ia`; URL protegida retorna 403. |
| Onboarding/layout móvel/erros/SAPSA no Vercel | BLOCKED / NÃO VERIFICADO | Coberto localmente, mas não validado nos artefatos Vercel. |
| IAM, claims, HMAC gerenciado, TTL e logs em staging real | NOT YET TESTED | Exige ambiente staging e credenciais institucionais controladas. |
| Upgrades corretivos Next/Firebase | NOT YET TESTED | Revisão isolada não altera dependências; qualquer upgrade exige branch e regressão próprias. |
| Jurídico, retenção e thresholds de small-cell | EXTERNAL APPROVAL REQUIRED | Aprovação institucional/regulatória fora do teste de software. |
| Dashboard legado e fechamento de raw reads | EXTERNAL APPROVAL REQUIRED | Exige migração e mudança de permissões explicitamente aprovadas. |
| Substituir rota, navegação, rules/env/flag de produção | EXTERNAL APPROVAL REQUIRED | Expressamente fora desta fase. |

## Limites de privacidade

- **V2 privacy-safe no escopo testado:** schema estrito, Client SDK negado e SAPSA agregado no emulador.
- **Legado existente não recebe essa alegação:** usuários autenticados ainda podem ler `alerts` raw pelas regras históricas.
- **Estado futuro:** primeiro migrar dashboards para agregação server-side; somente depois solicitar alteração de permissões e cutover.

## Condições mínimas para mudar NO-GO

1. Reautorizar o conector no time correto e completar ambos os previews.
2. Validar IAM, custom claims, HMAC, TTL e redaction de logs em staging real.
3. Resolver ou aceitar formalmente cada achado runtime de Next/Firebase após testes de compatibilidade.
4. Aprovar separadamente estratégia para dashboards e `alerts` legado.
5. Emitir aprovação inequívoca para cada mudança de produção.
