# Triagem de dependências — fase de validação V2

Data da consulta: 5 de setembro de 2026  
Comandos: `npm audit --json`, `npm audit --omit=dev --json`, `npm ls ... --all` e busca de uso no código  
Estado: análise somente; nenhum pacote atualizado

## Resumo

O relatório anterior registrava 77 achados (1 low, 42 moderate, 33 high e 1 critical; 21 sem dev). Esse snapshot não foi reproduzido pela consulta atual sobre o mesmo `package-lock.json`: o npm advisory service retornou 27. Como advisories e deduplicação mudam no serviço, a triagem abaixo usa o resultado atual reproduzível e preserva os números anteriores apenas como histórico; não interpreta a redução como correção no código, pois nenhum pacote foi atualizado.

| Grafo | Low | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|---:|
| Completo | 1 | 15 | 10 | 1 | 27 |
| Produção (`--omit=dev`) | 0 | 6 | 5 | 1 | 12 |
| Exclusivo de desenvolvimento | 1 | 9 | 5 | 0 | 15 |

“Produção” aqui significa presença no grafo instalado sem `devDependencies`, não exploração comprovada. A avaliação abaixo cruza caminho, uso e pré-condições; não substitui teste de segurança.

## Critical/high no grafo de produção

| Pacote/caminho | Severidade npm | Alcance nesta aplicação | Decisão |
|---|---|---|---|
| `next@16.1.1` direto | High | **Potencialmente alcançável.** VetAlert usa App Router/RSC e recebe tráfego não confiável. Vários avisos exigem recursos ausentes (middleware/rewrites, Server Actions, custom server, CSP nonce, `next/image`), mas os avisos genéricos de RSC/DoS podem se aplicar. | Prioridade 1: branch separada para upgrade direcionado a versão corrigida indicada pelo audit (`16.3.4` na consulta), seguida de regressão completa dos intakes. Não atualizar nesta fase. |
| `websocket-driver@0.7.4` via `firebase` → `@firebase/database` → `faye-websocket` | Critical | **Não alcançado pelo código atual.** Não há import de `firebase/database`; Auth/Firestore são usados. O WebSocket do `/terminal` usa a API nativa do navegador e não este pacote. Pode permanecer no pacote instalado/bundle alternativo. | Confirmar tree-shaking no artefato e atualizar Firebase de forma direcionada em revisão própria. Não ignorar apenas por ser transitiva. |
| `@grpc/grpc-js@1.9.15` via `firebase` → `@firebase/firestore` | High | **Baixa alcançabilidade direta.** O cliente Firestore é browser-side; o caminho Node vulnerável não é o servidor Admin ativo. `firebase-admin` usa `@grpc/grpc-js@1.14.4`, fora do range reportado. Pode afetar ferramentas/testes ou resolução Node alternativa. | Validar bundle e atualização pontual do Firebase. |
| `postcss@8.4.31` via `next` | High | **Build-time, sem entrada CSS não confiável.** Os avisos exigem CSS/source maps controlados por atacante; o repositório compila CSS local. | Atualização vem com Next corrigido; tratar na mesma revisão direcionada. |
| `nanoid@3.3.11` via PostCSS | High | **Não alcançado diretamente.** VetAlert não importa `nanoid`; os avisos exigem uso de geradores customizados com tamanho inválido. | Resolver pela atualização transitiva, sem override isolado antes de teste. |
| `sharp@0.34.5` via `next` | High | **Não alcançado no fluxo atual.** Não há `next/image`, `remotePatterns` ou pipeline de imagem controlada por usuário. | Resolver com a atualização compatível do Next; reavaliar se imagens dinâmicas forem adicionadas. |

## High exclusivos do grafo de desenvolvimento

| Pacote | Caminho principal | Exposição |
|---|---|---|
| `brace-expansion` | ESLint/TypeScript ESLint | Glob de tooling com configuração controlada; risco de DoS no build, não no runtime. |
| `browserslist` | Babel dentro de `eslint-config-next` | Consultas e stats de build controlados pelo repositório; não recebe payload web. |
| `flatted` | cache do ESLint | Parse/cache local do lint; não é importado pela aplicação. |
| `minimatch` | ESLint e plugins | Padrões de lint controlados; não há glob fornecido por usuário em runtime. |
| `picomatch` | plugins ESLint/tinyglobby | Build/lint somente; sem entrada pública no processo implantado. |

## Recomendações sem bulk upgrade

1. Criar revisão separada para `next` + transitivos PostCSS/Sharp, usando exatamente a menor versão corrigida suportada e executando build, typecheck, emulator, E2E veterinário/agro e previews.
2. Criar revisão separada para Firebase, confirmar que Realtime Database não entra no bundle e que Auth/Firestore mantêm autenticação/persistência.
3. Atualizar tooling de lint/teste separadamente; falha de CI é risco de disponibilidade da engenharia, não equivalência com exposição remota.
4. Não usar `npm audit fix --force`, overrides globais ou atualização de lockfile desacoplada de testes.
5. Reexecutar audit no dia da revisão, pois advisories e versões corrigidas mudam.
