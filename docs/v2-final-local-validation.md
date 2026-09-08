# VetAlert V2 — validação local final da nota e do município

Data: 7 de setembro de 2026
Estado: **PASS local com riscos externos ainda abertos; nenhum commit, push, deploy, flag ou cutover executado.**

## Confirmações

| Item | Estado | Evidência |
| --- | --- | --- |
| Nota rejeitada | PASS | O endpoint rejeita antes de `persistObservationV2`; no Emulator, nove rejeições deixaram inalteradas `veterinaryObservationsV2`, `submissionIntegrityV2`, `auditLogsV2` e `alerts`, e a resposta SAPSA permaneceu idêntica. |
| Logs de aplicação | PASS | Nenhum `console.log`, `console.warn`, `console.error` ou logger existe nas fontes V2; resposta 400 é genérica e não retorna nota, termo ou detalhes do validador. Logs de infraestrutura continuam fora do alcance desta prova local. |
| Nota aceita — leitura cliente | PASS | A leitura do documento aceito foi negada pelas Rules para não autenticado, veterinário, analista SAPSA e admin cliente. Somente backend Admin/IAM pode acessar o registro operacional protegido. |
| Nota aceita — auditoria e exportação | PASS | Nota e conteúdo não entram em sidecar, audit log, SAPSA, agregações ou CSV; testes inspecionam saída e documentos correspondentes. |
| Municípios | PASS | 5.571 registros; 5.571 códigos únicos de sete dígitos; todos os nomes são preenchidos/sem espaços externos; 27 UFs e prefixo numérico oficial compatível em cada registro; todos os pares passam no validador server-side. |
| Falsos positivos | PASS no corpus | Baseline: 2/50 rejeições legítimas (4%). Após incluir apenas as flexões genéricas `elevado`/`moderado` no dicionário candidato v2: 0/50 (0%). O corpus não estima desempenho real de campo. |
| Textos e telas V2 | PASS | Nenhuma tela V2 contém `Município (opcional)` ou `Produto vendido`. Menções a geolocalização/envio automático são somente negações explícitas; referências positivas restantes pertencem ao inventário e aos testes do legado congelado. |
| Legado e produção | PASS | Testes preservam `/alerta/novo` e `/agro-signals/new`; sem diff em arquivos legados, `firestore.rules`, configuração/flag, Vercel ou dados de produção. |

## Execuções finais

- Unitários/contrato: **39/39 PASS**.
- Firebase Emulator: **8/8 PASS**; mensagens `PERMISSION_DENIED` são as negações esperadas dos testes.
- Playwright Chromium isolado: **12/12 PASS**.
- Next.js build e TypeScript: **PASS**.
- Lint de todo código alterado: **PASS**.
- `git diff --check`: **PASS**.

## Riscos abertos

1. O detector determinístico não garante reconhecer todo nome comercial ou identificador futuro; corpus real revisado por especialistas ainda é necessário.
2. Vercel, proxy, Firebase, suporte e backups precisam de prova de redaction/retenção de body e metadados em staging; a prova atual cobre somente logs da aplicação.
3. Backend Admin/IAM pode ler a nota aceita por desenho; mínimo privilégio, auditoria, TTL e governança de acesso ainda exigem validação em staging.
4. O snapshot municipal exige atualização controlada e nova versão quando o IBGE alterar o catálogo.
5. O legado ainda permite raw reads autenticados e não deve ser descrito como privacy-safe até migração separada de dashboards e permissões.
