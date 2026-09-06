# Plano de migração: VetAlert produção → VetAlert V2

Data: 5 de setembro de 2026  
Estado inicial: planejamento aprovado; sem cutover e sem migração destrutiva

## 1. Princípio

V2 será uma aplicação paralela. O legado continua sendo a produção canônica até aprovação explícita. O objetivo desta fase é permitir teste técnico e institucional sem colocar o fluxo `/alerta/novo` em risco.

```text
Produção atual — congelada
/alerta → /alerta/novo → AlertFormClient → alerts → /global-alerts-dashboard
/agro-signals/new → AgroSignalFormClient → alerts → /global-alerts-dashboard

V2 — paralela e desativada por padrão
/v2/onboarding → /api/v2/observations → veterinaryObservationsV2
                                         ├─ submissionIntegrityV2
                                         └─ auditLogsV2
veterinaryObservationsV2 → agregação server-side → /api/v2/sapsa/summary → /sapsa/v2
```

## 2. Fases

### Fase 0 — baseline e congelamento

- Registrar hash/contratos de rotas, validações, coleções e redirects atuais.
- Manter `AlertFormClient.tsx` e `AgroSignalFormClient.tsx` sem alterações.
- Registrar build, typecheck, lint e ausência de testes.
- Resultado: documentação somente.

### Fase 1 — V2 escura

- Criar schema V2, validadores, vocabulários controlados e testes.
- Criar páginas V2 atrás de `VETALERT_V2_ENABLED`, cujo default é `false`.
- Criar endpoint server-side autenticado.
- Criar coleções isoladas e deny-by-default para clientes.
- Criar sidecar de integridade, rate flag, duplicate flag, retenção e audit log.
- Criar SAPSA V2 com papel e agregação mínima.
- Não conectar a navegação pública e não modificar a produção.

### Fase 2 — ambiente de desenvolvimento/preview

Depende de autorização posterior para configurar um ambiente não produtivo:

- projeto Firebase separado ou namespace de desenvolvimento;
- service account/Workload Identity com privilégio mínimo;
- `VETALERT_V2_ENABLED=true` somente no preview;
- `VETALERT_V2_INTEGRITY_SECRET` separado do ambiente produtivo;
- custom claim `sapsa_analyst` somente para contas de teste;
- TTL Firestore habilitado para `expiresAt` depois de revisão de retenção;
- Firebase Emulator para testes de regras.

### Fase 3 — validação controlada

Depende de aprovação explícita:

- definir público e método real de acesso: piloto aberto controlado ou convite real;
- definir territórios/espécies/período e tamanho mínimo de célula;
- validar linguagem MAPA e política de privacidade com responsáveis jurídicos/regulatórios;
- medir conclusão, latência, duplicatas, falsos padrões, cobertura e utilidade;
- auditar logs de Vercel/Firebase para exclusão/redaction de metadados sensíveis;
- executar teste de segurança e revisão de IAM.

### Fase 4 — decisão de cutover

Nenhum cutover faz parte desta implementação. Antes de substituir o legado, o responsável deve escolher explicitamente:

1. promover `/v2/onboarding` para `/alerta/novo` ou manter rota versionada;
2. manter `alerts` apenas como histórico, adaptá-la em leitura ou criar backfill anonimizado;
3. encerrar, proteger ou manter `/agro-signals/new`;
4. ocultar/proteger os dashboards/terminal legados;
5. escolher política e prazo de retenção;
6. aprovar método de autenticação/acesso dos veterinários;
7. aprovar papéis SAPSA, responsáveis por atribuição e processo de revogação;
8. aprovar textos de privacidade/MAPA e links oficiais;
9. aprovar thresholds exploratórios e small-cell minimum;
10. autorizar mudanças de produção e plano de comunicação.

## 3. Mudanças propostas nesta fase

### Rotas

| Rota | Ação nesta fase | Cutover |
|---|---|---|
| `/alerta`, `/alerta/novo` | Nenhuma alteração | Exige decisão explícita |
| `/agro-signals/new` | Nenhuma alteração | Exige decisão explícita |
| `/global-alerts-dashboard`, `/terminal` | Nenhuma alteração | Proteção/remoção da navegação exige decisão explícita |
| `/v2/onboarding` | Nova, flag false por padrão | Pode virar candidata ao intake canônico |
| `/v2/confirmacao` | Nova, sem ID público | Pode permanecer |
| `/api/v2/observations` | Nova, auth + schema + server metadata | Pode permanecer |
| `/api/v2/territories` | Nova, proxy server-side para a lista pública do IBGE | Pode permanecer; revisar disponibilidade/cache |
| `/sapsa/v2` | Nova, dados somente com papel | Pode virar SAPSA canônico |
| `/api/v2/sapsa/summary` | Nova, RBAC + agregação | Pode permanecer |
| `/api/v2/sapsa/export` | Nova, RBAC + CSV agregado + auditoria | Pode permanecer após revisão de governança |

### Schema V2

```ts
type VeterinaryObservationV2 = {
  schemaVersion: 2;
  source: "veterinary";
  territory: { stateCode: string; municipalityCode?: string };
  species: ControlledSpecies;
  signalGroup: ControlledSignalGroup;
  observedPattern: ControlledObservedPattern;
  animalCountBand: ControlledAnimalCountBand;
  attentionLevel: "observed" | "elevated" | "urgent";
  observationPeriod: ControlledObservationPeriod;
  therapeuticContext?: {
    category?: ControlledTherapeuticCategory;
    activeIngredient?: ControlledActiveIngredient;
    exposure?: ControlledExposure;
    interval?: ControlledInterval;
  };
  consentVersion: string;
};
```

O cliente envia apenas esse input controlado. O servidor acrescenta `submissionId`, `receivedAt`, `schemaVersion`, `source`, `integrityStatus`, `retentionVersion` e `expiresAt`. Campos desconhecidos ou proibidos são rejeitados.

### Coleções

- `alerts`: sem alteração, sem backfill, sem escrita V2.
- `veterinaryObservationsV2`: nova coleção de observações sem identidade.
- `submissionIntegrityV2`: nova coleção técnica server-only; HMAC de UID e fingerprint, sem UID bruto.
- `auditLogsV2`: nova coleção server-only de eventos mínimos; sem payload clínico, IP ou User-Agent.

### Permissões

- Blocos legados permanecem idênticos.
- Coleções V2 recebem bloqueio total a Firebase Client SDK.
- Admin SDK é usado pelo endpoint V2.
- Intake V2 exige ID token válido, mas UID não é copiado para a observação.
- SAPSA V2 exige custom claim `role=sapsa_analyst` ou `role=admin`.
- Cliente nunca define ou persiste papel.

## 4. Compatibilidade e dados históricos

- Painéis legados continuam lendo `alerts` sem conhecer V2.
- V2 não lê nem grava `alerts` nesta fase.
- SAPSA V2 lê somente `veterinaryObservationsV2`.
- Dados históricos permanecem intactos.
- Um adaptador histórico futuro deverá transformar em memória os campos legados para o schema analítico e excluir texto/identificadores; ele não deverá regravar o histórico sem plano aprovado.
- Qualquer backfill deverá ser idempotente, auditável, executado primeiro em cópia e preservar o documento original.

## 5. Privacidade e integridade

- Nenhum nome, CRMV, CPF, email, telefone, produtor, propriedade, endereço, coordenada precisa, empresa, marca, fabricante, produto ou texto livre entra no input V2.
- UID autenticado é usado transitoriamente para autorização/rate control e convertido em HMAC no sidecar; não entra na observação nem na saída SAPSA.
- IP e User-Agent não serão lidos nem persistidos pelo código V2.
- Duplicatas nunca são apagadas automaticamente: recebem flag técnica e são excluídas ou reduzidas na agregação conforme regra documentada.
- Timestamps exatos permanecem operacionais no armazenamento, mas saídas SAPSA usam buckets de data/período e supressão de células pequenas.
- `expiresAt` prepara TTL, mas ativar TTL no Firebase é mudança operacional futura.

## 6. Estratégia de testes

### Regressão legado

- `/alerta` continua redirecionando para `/alerta/novo`.
- `AlertFormClient` continua usando `alerts`, mesmos required checks, payload e redirect.
- `AgroSignalFormClient` continua usando `alerts`, mesmos required checks, payload e redirect.
- regras legadas de Firestore permanecem textualmente inalteradas.
- todas as rotas legadas continuam compilando.

### V2

- input válido e inválido;
- campos unknown/proibidos em qualquer profundidade;
- metadados de integridade não podem ser fornecidos pelo cliente;
- servidor gera IDs, timestamps, source e retenção;
- documento persistido não contém identidade;
- rate/duplicate são flags e não exclusões;
- agregação por território, espécie e período;
- small-cell suppression;
- nenhuma saída contém raw record, UID, digest, timestamp exato ou campo proibido;
- 401 sem token e 403 sem papel SAPSA;
- flag V2 false por padrão;
- vocabulário sem diagnóstico, causalidade, probabilidade ou desempenho.

## 7. Rollback

Como V2 é aditiva e desativada por padrão, o rollback desta fase é:

1. manter `VETALERT_V2_ENABLED` ausente/false;
2. reverter exclusivamente o commit/PR V2;
3. remover as novas regras deny-only se o código for removido;
4. não tocar em `alerts`, intakes ou dados legados;
5. conservar coleções V2 eventualmente criadas até decisão de retenção—não apagar automaticamente;
6. revogar credenciais/claims de preview se tiverem sido configurados posteriormente.

Não é necessário rollback de dados legados porque esta fase não os modifica.

## 8. Critérios para aprovação de cutover

- fluxo legado e V2 testados end-to-end em browser real e Firebase Emulator;
- testes de regras dinâmicos passando;
- IAM e custom claims revisados;
- privacidade, retenção, small-cell threshold e logs aprovados;
- textos MAPA e jurídicos aprovados;
- métricas do piloto demonstram estabilidade e utilidade sem alegações científicas indevidas;
- plano de suporte/observabilidade aprovado;
- usuário emite autorização inequívoca para alterar a rota padrão e a flag de produção.

## 9. Decisão exata que ficará pendente

Ao fim desta implementação, a decisão solicitada será:

> “Você aprova promover o fluxo V2, atualmente isolado e desativado, para substituir o comportamento padrão de `/alerta/novo`, definir o destino do legado `alerts` e aplicar as mudanças correspondentes de navegação, permissões e configuração de produção?”

Até uma resposta explícita e específica, nenhuma dessas ações será executada.

## 10. Resultado da fase de validação autorizada

- Firebase Emulator Suite adicionada para Auth e Firestore no projeto demo `demo-vetalert-v2`; nenhum projeto ou dado de produção é utilizado.
- Testes dinâmicos cobrem usuário não autenticado, veterinário, analista SAPSA e administrador, inclusive tentativas de acesso indevido.
- O fluxo legado foi submetido de ponta a ponta no emulador e o documento em `alerts` foi conferido nos campos existentes.
- O fluxo agro legado também foi submetido de ponta a ponta no emulador e seu payload aninhado foi conferido sem alteração do componente.
- O V2 foi submetido em browser real ao emulador, incluindo falha de rede, refresh, retorno entre etapas, teclado, viewport móvel e clique duplo.
- Dois deployments Vercel de preview foram solicitados em ordem, primeiro com flag false e depois true, usando configuração por deployment e sem alterar settings do projeto/produção. A verificação final ficou bloqueada porque a credencial de leitura do conector não tem acesso ao scope `colo-prep-ia`; detalhes em `docs/v2-validation-report.md`.

## 11. Tratamento futuro de `alerts`

Nenhuma opção abaixo está aprovada ou executada. A ordem recomendada é manter o histórico imutável e decidir uma camada de leitura:

1. **Congelar e separar:** `alerts` permanece canônica apenas para o legado; dashboards antigos continuam nela e SAPSA V2 ignora seu conteúdo. Menor risco, sem continuidade analítica combinada.
2. **Adaptador de leitura:** um processo server-side transforma registros legados apenas em memória, descarta texto, localidade aproximada e campos comerciais/identificáveis, marca `sourceSchema=legacy` e aplica small-cell suppression. Não regrava documentos. É a opção preferida para uma validação inicial.
3. **Cópia sanitizada:** somente após revisão jurídica e amostragem, um job idempotente copia allowlist segura para namespace derivado, registra versão e perda de informação e nunca altera o original. Exige aprovação separada.
4. **Backfill ou exclusão:** não recomendado para o cutover inicial e proibido sem migração aprovada, backup validado, ensaio em cópia e autorização destrutiva específica.

O rollback antes do cutover consiste em manter a flag false/ausente e reverter somente o PR V2. Se um preview estiver ativo, ele pode expirar ou ser removido separadamente; nenhum alias/domínio de produção foi promovido. Coleções V2 eventualmente criadas não devem ser apagadas automaticamente: bloquear novas escritas, preservar evidência de auditoria e aplicar a política de retenção aprovada.
