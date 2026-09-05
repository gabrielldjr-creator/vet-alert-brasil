# Relatório de prontidão da reconstrução paralela V2

Data: 2026-09-05. Branch: `codex/vetalert-v2-reconstruction`.

> Atualização da fase seguinte: a validação com Firebase Emulator e Chromium foi concluída. O resultado detalhado e mais recente está em `docs/v2-validation-report.md`; ele substitui as pendências de emulador/browser registradas na primeira versão deste documento.

## Escopo entregue

- Auditoria de código e metadados, inventário do repositório e plano de migração criados antes da implementação.
- Intake V2 isolado, desativado por padrão e sem escrita em `alerts`.
- Boas-vindas, explicação de confiança/uso, configuração mínima e registro em três etapas, sem texto livre.
- Schema canônico estrito validado no cliente e no servidor; unknown fields e campos de identidade/comerciais são rejeitados.
- Metadados, rate control, suspeita de duplicidade e auditoria gerados no servidor; observações suspeitas são preservadas.
- Coleções V2 bloqueadas ao Firebase Client SDK; escrita e leitura bruta somente via Admin SDK.
- SAPSA com RBAC, agregação server-side, explicação determinística, exclusão visível de suspeitos e small-cell minimum.
- Export CSV somente agregado, protegido por papel e auditado.
- Proxy server-side para municípios do IBGE, evitando conexão direta do navegador V2 ao serviço externo.
- Superfícies VetAlert V2 e SAPSA V2 não exibem a navegação legada dentro das rotas versionadas.

## Resultado por requisito

| Área | Resultado | Evidência/qualificação |
|---|---|---|
| Contrato legado | PASS | Quatro arquivos protegidos têm hashes fixos e permanecem byte a byte iguais; rotas, required checks, `alerts` e redirects testados estaticamente. |
| Feature flag | PASS | Ausente/false por padrão; só `true` habilita V2. Nenhuma configuração Vercel foi alterada. |
| Schema e privacidade V2 | PASS | Allowlist estrita, sem texto livre, identidade, empresa, marca/fabricante, GPS/IP ou metadados forjáveis. |
| Integridade | PASS no código | ID/timestamps/source/flags server-side; HMAC; duplicate/rate flags sem exclusão. Requer credenciais e secret operacionais. |
| SAPSA/RBAC | PASS no código | Papéis `sapsa_analyst`/`admin`, dados agregados e coleções raw client-denied. Claims/IAM reais ainda precisam de teste em ambiente controlado. |
| Small-cell/export | PASS | Células menores que 5 não são exportadas; CSV não contém IDs, município individual, timestamp exato, UID ou digest. |
| MAPA | PASS no V2 | Orientação neutra; sem integração/envio oficial automático e sem alegação de endosso. Legado permanece inalterado. |
| Build/typecheck/testes V2 | PASS | Build, TypeScript, lint do novo código e 16 testes passam. |
| Lint total | FAIL preexistente | Cinco erros e três avisos permanecem no `AlertFormClient.tsx` protegido; não foram introduzidos nem corrigidos nesta fase. |
| Browser | PASS no emulador | 4 cenários Chromium cobrem V2, legado, rotas, mobile, teclado, falha, refresh, back e clique duplo. |
| Firebase E2E/regras dinâmicas | PASS no emulador | Auth/Firestore demo, 7 grupos: papéis, rules, schema, HMAC, integridade, agregação e export. |

## Verificações executadas

- `tsc --noEmit`: PASS.
- suíte Node/TypeScript: 16/16 PASS.
- ESLint de `app/v2`, `app/sapsa`, `app/api`, `lib/v2`, `tests`: PASS.
- Next.js production build: PASS; todas as rotas legadas e V2 compiladas.
- Python `compileall backend`: PASS.
- Browser local: 4/4 PASS com Firebase Emulator.
- Firebase Emulator: 7/7 PASS.
- `git diff --check`: PASS.
- Lint de source total: somente o delta preexistente de 5 erros/3 avisos no intake protegido.

## Arquivos intencionalmente inalterados

- `app/alerta/novo/AlertFormClient.tsx`
- `app/agro-signals/new/AgroSignalFormClient.tsx`
- `app/alerta/page.tsx`
- `lib/auth.ts`
- demais payloads/redirects do intake legado e nomes das coleções existentes
- configuração/deployment da Vercel e valor da feature flag em produção

## Rollback

1. Manter `VETALERT_V2_ENABLED` ausente ou `false`.
2. Reverter somente o commit/PR desta branch.
3. Não apagar `alerts` nem documentos V2; qualquer limpeza exige política de retenção aprovada.
4. Se credenciais de preview forem configuradas depois, revogá-las separadamente.
5. Nenhuma migração legada precisa ser revertida, porque nenhuma foi executada.

## Riscos e dependências restantes

- Repetir criação/transação, rules e RBAC em staging não produtivo real antes de qualquer cutover.
- Configurar service account mínima, segredo HMAC gerenciado, custom claims e rotação; não usar segredo de produção em preview local.
- Ativar e verificar TTL separadamente; `expiresAt` sozinho não apaga dados.
- Auditar retenção/redação de logs em Vercel, Firebase, proxies, suporte e backups.
- Aprovar juridicamente textos, consentimento, base legal, atendimento a direitos e limites de precisão territorial.
- Validar minimum cell 5 e thresholds exploratórios; não tratá-los como evidência científica.
- Adicionar submissão browser dedicada do fluxo agro; o intake veterinário legado e o V2 já foram submetidos somente no emulador, sem observação sanitária em produção.
- Resolver vulnerabilidades reportadas no grafo npm em trabalho separado, com análise de compatibilidade.

## Decisão exata necessária para cutover

> Você aprova promover o fluxo V2, atualmente isolado e desativado, para substituir o comportamento padrão de `/alerta/novo`, definir o destino do legado `alerts` e aplicar as mudanças correspondentes de navegação, permissões e configuração de produção?

Até aprovação explícita dessa decisão e conclusão dos testes Firebase E2E, não alterar a rota padrão, não habilitar a flag e não implantar em produção.

