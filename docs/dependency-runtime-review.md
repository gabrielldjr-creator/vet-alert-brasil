# Revisão isolada de dependências runtime — Next/Firebase

Data: 6 de setembro de 2026  
Base: `codex/vetalert-v2-reconstruction` em `ee04c76`  
Escopo: análise somente; nenhum `package.json`, lockfile, intake, rule ou configuração alterado

## Evidência reproduzível

Em checkout limpo, `npm ci` instalou `next@16.1.1`, `firebase@12.7.0` e
`firebase-admin@14.3.0`. `npm audit --omit=dev --json` retornou 12 pacotes:
6 moderate, 5 high e 1 critical. O audit é um inventário do grafo, não prova de
exploração.

Buscas no código não encontraram `next/image`, `remotePatterns`, rewrites,
middleware/proxy, Server Actions/`use server`, custom Next server, CSP nonce,
`beforeInteractive`, Cache Components, import de `firebase/database`, Sharp
ou NanoID. O app usa App Router/RSC, API routes, Firebase Auth/Firestore no
cliente e Firebase Admin Auth/Firestore no servidor.

## Next.js: advisories avaliados individualmente

| Advisory | Condição | Avaliação VetAlert |
|---|---|---|
| GHSA-9g9p-9gw9-jx7f | Image Optimizer + remotePatterns | Não alcançado: recurso ausente. |
| GHSA-h25m-26qc-wcjf | desserialização RSC/DoS | Potencialmente alcançável: App Router/RSC é superfície pública. |
| GHSA-ggv3-7p47-pfv8 | request smuggling em rewrites | Não alcançado: sem rewrites. |
| GHSA-3x4c-7xq6-9pq8 | cache de next/image | Não alcançado: sem next/image. |
| GHSA-h27x-g6w4-24gq | postponed resume buffering | Alcance incerto; PPR não está habilitado. |
| GHSA-mq59-m269-xvcx | CSRF em Server Actions | Não alcançado: sem Server Actions. |
| GHSA-jcc7-9wpm-mj36 | HMR dev | Desenvolvimento apenas; não é runtime de produção. |
| GHSA-5f7q-jpqc-wp7h | PPR resume DoS | Não alcançado pela configuração atual: PPR ausente. |
| GHSA-q4gf-8mx6-v5v3 | DoS em Server Components | Alcançável em princípio: RSC público. |
| GHSA-8h8q-6873-q5fj | DoS em Server Components | Alcançável em princípio: RSC público. |
| GHSA-26hh-7cqf-hhc6 | middleware/proxy bypass | Não alcançado: middleware/proxy ausente. |
| GHSA-3g8h-86w9-wvmq | cache poisoning em redirect proxy | Não alcançado: proxy ausente. |
| GHSA-ffhc-5mcf-pf4q | XSS com CSP nonce | Não alcançado: nonce/configuração ausente. |
| GHSA-vfv6-92ff-j949 | colisão cache-busting RSC | Potencialmente alcançável: App Router/RSC presente. |
| GHSA-gx5p-jg67-6x7h | beforeInteractive com input não confiável | Não alcançado: API ausente. |
| GHSA-mg66-mrh9-m8jx | Cache Components connection exhaustion | Não alcançado pela configuração atual. |
| GHSA-h64f-5h5j-jqjh | Image Optimization DoS | Não alcançado: sem next/image. |
| GHSA-c4j6-fc7j-m34r | SSRF em WebSocket upgrades | Não alcançado: sem custom Next WebSocket upgrade/server. |
| GHSA-492v-c6pp-mqqv | middleware dynamic parameter bypass | Não alcançado: middleware ausente. |
| GHSA-wfc6-r584-vfw7 | cache poisoning RSC | Potencialmente alcançável; exige teste dirigido. |
| GHSA-267c-6grr-h53f | segment-prefetch middleware bypass | Não alcançado: middleware ausente. |
| GHSA-36qx-fr4f-26g5 | Pages Router i18n middleware | Não alcançado: App Router, sem i18n/middleware. |
| GHSA-6gpp-xcg3-4w24 | Turbopack single-locale middleware bypass | Não alcançado: middleware ausente. |
| GHSA-m99w-x7hq-7vfj | Server Actions DoS | Não alcançado: sem Server Actions. |
| GHSA-89xv-2m56-2m9x | SSRF Server Actions/custom server | Não alcançado: ambos ausentes. |
| GHSA-68g3-v927-f742 | cache confusion com body | Potencial/incerto para API routes; requer teste dirigido. |
| GHSA-4633-3j49-mh5q | cache confusion com UTF-8 inválido | Potencial/incerto para API routes; requer teste dirigido. |
| GHSA-4c39-4ccg-62r3 | payload Server Action Edge | Não alcançado: sem Server Actions Edge. |
| GHSA-p9j2-gv94-2wf4 | SSRF via rewrites | Não alcançado: sem rewrites. |
| GHSA-q8wf-6r8g-63ch | Image API SVG DoS | Não alcançado: sem next/image. |
| GHSA-955p-x3mx-jcvp | divulgação de Server Functions | Não alcançado: sem `use server`. |

Os itens marcados “potencial” bastam para recomendar atualização dirigida. O
audit atual indica `next@16.3.4` como correção sem major, mas isso não autoriza
atualização automática.

## Firebase e transitivos: achados individuais

| Pacote/advisory | Caminho | Avaliação VetAlert |
|---|---|---|
| websocket-driver GHSA-mp7j-qc5w-4988 | firebase → database → faye-websocket | Critical/high no grafo, mas `firebase/database` não é importado. `websocket-driver` e `faye-websocket` tiveram zero ocorrência nos artefatos de produção pesquisados. Não comprovadamente alcançável. |
| websocket-driver GHSA-xv26-6w52-cph6 | mesmo caminho | Mesma avaliação; atualizar Firebase de forma dirigida continua recomendado. |
| @grpc/grpc-js GHSA-5375-pq7m-f5r2 | firebase → firestore, versão 1.9.15 | Package tracing inclui gRPC, mas não existe servidor gRPC exposto pelo app. Entrada malformada teria de vir do endpoint remoto usado pelo SDK, não do usuário HTTP do VetAlert. Baixa alcançabilidade direta. |
| @grpc/grpc-js GHSA-99f4-grh7-6pcq | mesmo caminho | Mesma avaliação. Firebase Admin/Firestore usa gRPC 1.14.4, fora do range. |
| @google-cloud/storage/retry-request/teeny-request | firebase-admin | O app importa somente Admin app/auth/firestore e não chama Storage. Não há fluxo Storage controlado pelo usuário. |
| uuid GHSA-w5hq-g745-h8pq | Admin transitivos | VetAlert não chama UUID v3/v5/v6 com buffer fornecido; pré-condição ausente. |
| postcss GHSA-qx2v-qp2m-jg93 | Next transitivo | Build-time; CSS é do repositório e não é enviado por usuário. |
| postcss GHSA-6g55-p6wh-862q | Next transitivo | Sem sourceMappingURL CSS controlado por atacante. |
| postcss GHSA-fxqj-rqcc-2cmp | Next transitivo | Mesma ausência de fonte CSS não confiável. |
| postcss GHSA-r28c-9q8g-f849 | Next transitivo | Mesma ausência de fonte CSS não confiável. |
| nanoid GHSA-28wg-ghj8-5hjv | PostCSS transitivo | Sem import direto ou tamanho fornecido por usuário. |
| nanoid GHSA-2v37-7h3g-55p8 | PostCSS transitivo | Sem custom generator no app. |
| nanoid GHSA-xwg4-73v4-xw9w | PostCSS transitivo | Sem chamada direta. |
| sharp GHSA-f88m-g3jw-g9cj | Next transitivo | Sem next/image ou processamento de imagem do usuário. |

A busca no build encontrou identificadores de `@firebase/database` e gRPC em
chunks/traces, embora não haja import de Database no código. Portanto, a revisão
não afirma tree-shaking total; afirma somente que o código vulnerável
`websocket-driver`/faye não apareceu na busca. Essa conclusão deve ser
repetida após qualquer atualização.

## Decisão e plano de compatibilidade

1. Não executar `npm audit fix`, `--force`, override amplo ou bulk upgrade.
2. Em PR corretivo próprio, atualizar somente Next para a menor versão corrigida
   suportada e repetir hashes legado, 20 testes, rules 7/7, browser 5/5, build,
   typecheck e previews.
3. Em outro commit/PR, atualizar Firebase cliente de forma dirigida; comprovar
   Auth anônima, writes legados exatos, Firestore V2 e ausência dos transitivos
   vulneráveis nos artefatos.
4. Tratar Firebase Admin separadamente; não aceitar o downgrade automático
   sugerido pelo audit. Revisar changelog e transitivos de Storage/UUID.
5. Nenhuma atualização pode modificar `AlertFormClient.tsx`,
   `AgroSignalFormClient.tsx`, payloads, coleções, redirects ou rules legadas.

## Resultado

**NO-GO para ignorar os achados** e **NO-GO para bulk upgrade**.  
**GO para PRs corretivos pequenos, separados e condicionados à regressão
completa.** Este branch contém somente documentação de revisão.
