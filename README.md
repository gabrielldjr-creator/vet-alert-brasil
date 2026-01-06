# Vet Alert Brasil

Plataforma de inteligência epidemiológica exclusiva para médicos-veterinários convidados. O primeiro acesso é feito por link mágico enviado ao e-mail profissional; depois disso, a sessão invisível é mantida pelo Firebase Auth.

## Arquitetura e decisões
- **Next.js App Router + TypeScript + Tailwind** para manter páginas leves, mobile-first e com alta legibilidade.
- **Autenticação passwordless com Firebase Auth** usada apenas para manter a sessão em segundo plano após o convite; não há telas públicas de login ou cadastro.
- **FireStore (futuro)**: consultas de alertas sempre começam pelo campo `estadoCrmv`, permitindo filtros subsequentes por cidade/região, espécie e categoria. Não há caminhos de filtragem que iniciem por espécie.
- **Alertas como sinais anônimos**: estrutura curta (espécie, categoria, fonte suspeita, região, nota curta opcional) para facilitar agrupamentos e clusters sem expor dados sensíveis.
- **Proteção de rotas**: o painel `/dashboard` e o fluxo de alerta `/alerta/novo` são áreas protegidas. A página inicial exibe apenas o aviso de acesso restrito.

## Scripts
- `npm run dev` – ambiente local de desenvolvimento
- `npm run lint` – linting
- `npm run build` – build de produção

Nenhuma API ou persistência está ativa nesta versão; os formulários são apenas a interface pronta para integração com Firebase.
