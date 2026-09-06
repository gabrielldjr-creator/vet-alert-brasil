# Ambiente reproduzível de validação Firebase

Data da reprodução: 5 de setembro de 2026

## Versões exigidas

- Node.js 20.9 ou superior (reprodução executada com Node.js 24.19.0).
- npm conforme o lockfile; instalar exclusivamente com `npm ci`.
- Java 21 LTS. A reprodução foi executada com Eclipse Temurin JRE 21.0.12.1.
- Chromium compatível com a versão de `@playwright/test` fixada no `package-lock.json`.

O Firebase CLI usado pelo projeto inicia Auth e Firestore Emulator. Java deve ser encontrável por `java` no `PATH`; não basta possuir um JRE extraído em outro diretório.

## Reprodução a partir de checkout limpo

PowerShell:

```powershell
git clone --branch codex/vetalert-v2-reconstruction --single-branch <repository-url> vetalert-validation
Set-Location vetalert-validation

$env:JAVA_HOME = "C:\caminho\para\temurin-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

node --version
java -version
npm ci
npm test
npm run test:emulator
npx playwright install chromium
npm run test:e2e
```

Ambientes que mantêm browsers Playwright em cache podem, em vez de instalar, definir `PLAYWRIGHT_BROWSERS_PATH` para um cache compatível e imutável.

## Isolamento de produção

- `.firebaserc` fixa o projeto `demo-vetalert-v2`.
- `firebase.json` fixa Auth em `127.0.0.1:9099` e Firestore em `127.0.0.1:8080`.
- `emulators:exec --project demo-vetalert-v2 --only auth,firestore` encerra os emuladores após o teste.
- O Firebase CLI reconhece o prefixo `demo-` e falha para serviços não emulados; não há fallback autorizado para projeto Firebase real.
- O segredo HMAC usado pelos testes é descartável, local e não é segredo de preview ou produção.

## Resultado reproduzido

O checkout separado estava limpo antes e depois da execução. Resultado:

- suíte Node/contrato: 20/20 PASS;
- Auth/Firestore Emulator, rules, RBAC, integridade e export: 7/7 PASS;
- Chromium + emuladores: 5/5 PASS;
- `/alerta/novo`, `/agro-signals/new` e V2 foram testados sem escrita em Firebase de produção.

O runner E2E executa `next build` e `next start`, evitando que compilação incremental de desenvolvimento torne o teste dependente de timing. Uma execução foi interrompida por suspensão prolongada do host; a repetição imediata e contínua passou 5/5.
