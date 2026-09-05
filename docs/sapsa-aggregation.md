# Metodologia de agregação SAPSA V2

Versão: `sapsa-v2-exploratory-1`. Os limiares são heurísticas exploratórias configuráveis e não foram validados cientificamente.

O agregador lê somente `veterinaryObservationsV2`. Registros são compatíveis quando compartilham UF, espécie e grupo observacional. Períodos são semanas ISO derivadas de `receivedAt`. O registro original nunca é alterado.

Registros com `duplicateSuspected` ou `rateLimitExceeded` permanecem armazenados, mas são excluídos da classificação e contados em `suspiciousRecordsExcluded`. Não se afirma que fontes são profissionais independentes.

- `isolated_observation`: abaixo do limiar de recorrência.
- `recurring_signal`: ao menos 2 registros compatíveis.
- `emerging_territorial_convergence`: ao menos 3 registros e 2 municípios.
- `sustained_convergence`: ao menos 5 registros, 2 municípios e 2 semanas.

A pequena célula é suprimida antes da saída. Default: 5; permitido: 3 a 20. Cada célula expõe contagem, municípios, buckets temporais, canais e suspeitos excluídos—nunca o registro bruto.

O resultado é “padrão para revisão técnica”. Não diagnostica, não estima prevalência, não prevê escalada/surto, não atribui causa, não compara marcas/produtos, não calcula confiança e não decide automaticamente.
