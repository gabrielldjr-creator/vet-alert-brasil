# Vet Alert Brasil

Plataforma de inteligência epidemiológica exclusiva para médicos-veterinários. Todos os acessos exigem CRMV válido e o estado informado no login define o escopo regional padrão dos alertas exibidos no painel.

## Arquitetura e decisões
- **Next.js App Router + TypeScript + Tailwind** para manter páginas leves, mobile-first e com alta legibilidade.
- **Autenticação por e-mail/senha (preparada para Firebase Auth)** com captura de nome completo, CRMV (UF + número) e e-mail. O estado do CRMV é usado para escopar consultas futuras.
- **FireStore (futuro)**: consultas de alertas sempre começam pelo campo `estadoCrmv`, permitindo filtros subsequentes por cidade/região, espécie e categoria. Não há caminhos de filtragem que iniciem por espécie.
- **Alertas como sinais anônimos**: estrutura curta (espécie, categoria, fonte suspeita, região, nota curta opcional) para facilitar agrupamentos e clusters sem expor dados sensíveis.
- **Proteção de rotas**: o painel `/dashboard` e o fluxo de alerta `/alerta/novo` são concebidos como áreas protegidas. A página inicial é somente o formulário de login.

## Scripts
- `npm run dev` – ambiente local de desenvolvimento
- `npm run lint` – linting
- `npm run build` – build de produção

Nenhuma API ou persistência está ativa nesta versão; os formulários são apenas a interface pronta para integração com Firebase.
