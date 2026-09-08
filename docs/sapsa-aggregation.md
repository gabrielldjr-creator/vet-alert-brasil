# Metodologia de agregação SAPSA V2

Versão: `sapsa-v2-exploratory-3`. Os limiares são heurísticas exploratórias configuráveis e não foram validados cientificamente. A versão 3 acrescenta somente a saída agregada e duplamente suprimida do módulo econômico/operacional V1.

O agregador lê somente `veterinaryObservationsV2`. Registros são compatíveis quando compartilham UF, espécie e grupo observacional. Períodos são semanas ISO derivadas de `receivedAt`. O registro original nunca é alterado.

Registros com `duplicateSuspected` ou `rateLimitExceeded` permanecem armazenados, mas são excluídos da classificação e contados em `suspiciousRecordsExcluded`. A explicação de cada célula apresenta somente os suspeitos daquela célula; o resumo apresenta o total global. Não se afirma que fontes são profissionais independentes.

- `isolated_observation`: abaixo do limiar de recorrência, quando a célula ainda passa a proteção mínima.
- `recurring_signal`: default de ao menos 5 registros compatíveis.
- `emerging_territorial_convergence`: default de ao menos 6 registros e 2 municípios.
- `sustained_convergence`: default de ao menos 8 registros, 2 municípios e 2 semanas.

A pequena célula é suprimida antes da saída. Default: 5; permitido: 3 a 20. Os três limiares de classificação são normalizados para nunca ficar abaixo do small-cell nem abaixo do limiar anterior. Com os defaults, observações isoladas ficam preservadas internamente, mas não são emitidas no SAPSA. Cada célula expõe contagem, quantidade de municípios, buckets temporais, quantidade de canais e suspeitos excluídos—nunca código municipal ou registro bruto.

O repositório lê uma janela de 90 dias e falha fechado se o limite configurado de registros for excedido, evitando publicar um resumo silenciosamente incompleto. Aumentar esse limite exige revisão de custo, desempenho e privacidade.

O resultado é “padrão para revisão técnica”. Não diagnostica, não estima prevalência, não prevê escalada/surto, não atribui causa, não compara marcas/produtos, não calcula confiança e não decide automaticamente.

## Contexto econômico e operacional opcional

O módulo `economic-operational-context-v1` é resumido somente dentro de uma célula já elegível. O módulo precisa aparecer em pelo menos `minimumCell` registros elegíveis e cada valor categórico também precisa atingir `minimumCell` para ser emitido. Contagens abaixo do limiar são omitidas. A resposta usa uma allowlist fixa de quatro distribuições e nunca replica o bloco de um registro.

Essas distribuições não são prova de risco de produtor, ranking, conclusão causal/de desempenho nem score individual de crédito ou seguro. SAPSA não expõe detalhes de propriedade, identidades, valores, texto, produtos, marcas, código municipal ou timestamp individual.
