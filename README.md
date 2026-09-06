# VetAlert Brasil

VetAlert registra observações veterinárias estruturadas. SAPSA é uma camada analítica separada para leitura agregada e revisão humana. O sistema não diagnostica, não estima prevalência, não prevê surtos, não substitui comunicação oficial e não determina decisões institucionais.

## Estado do produto

- Produção legada: `/alerta/novo` e `/agro-signals/new` gravam diretamente em `alerts`. Esses contratos estão congelados nesta fase.
- V2: implementação paralela em `/v2/onboarding`, com boas-vindas, confiança/uso, configuração mínima e registro em três etapas; desativada por padrão com `VETALERT_V2_ENABLED=false`.
- SAPSA V2: `/sapsa/v2`, com dados servidos somente após verificação server-side de papel.
- Nenhuma migração de dados ou alteração de produção faz parte desta branch.

## Desenvolvimento

Requer Node.js 20.9+ (produção configurada com Node 24).

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
```

O lint do baseline legado possui cinco erros e três avisos em `app/alerta/novo/AlertFormClient.tsx`; o arquivo permanece intocado por contrato. Consulte `docs/vetalert-code-audit.md`.

## Configuração e documentação

Consulte `docs/environment-variables.md`. Não versione service accounts, segredos HMAC ou arquivos `.env`. A auditoria, contrato de produto, dicionário, privacidade, limites MAPA, agregação, papéis, métricas e migração ficam em `docs/`.
