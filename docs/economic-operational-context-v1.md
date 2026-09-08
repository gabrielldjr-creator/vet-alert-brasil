# Contexto econômico e operacional V2 — versão 1

## Finalidade e limites

O módulo `economicOperationalContext` é opcional, separado da observação sanitária principal e identificado por `schemaVersion: economic-operational-context-v1`. Ele registra somente condições amplas que podem afetar a execução do cuidado e permite exclusivamente inteligência operacional agregada.

O módulo não representa suspeita de doença, diagnóstico, causa, desempenho, identidade ou prova de risco do produtor. Não pode ser usado para ranking, decisão individual de crédito, seguro ou comércio. Este módulo não solicita nem aceita renda, valores monetários, dívida, score ou situação de crédito/financiamento, identidade de produtor/propriedade/empresa, nome, CRMV, endereço exato, GPS ou texto livre. A nota técnica V2, quando usada, é outro bloco e nunca entra neste agregado.

## Schema controlado

| Campo opcional | Valores permitidos |
| --- | --- |
| `accessToVeterinaryCare` | `adequate`, `delayed`, `unavailable`, `unknown` |
| `accessToNecessaryInputsOrServices` | `adequate`, `limited`, `unknown` |
| `abilityToImplementPreventiveMeasures` | `not_limited`, `limited`, `unknown` |
| `logisticalOrFinancialPressureAffectingCare` | `not_observed`, `observed`, `unknown` |

Se a seção for enviada, a versão exata e ao menos uma categoria controlada são obrigatórias. O validador server-side rejeita valores fora das listas, campos desconhecidos, campos financeiros/identificadores e metadados reservados. A interface não oferece campo de texto.

## Integridade e minimização

O documento V2 preserva a seção como bloco independente. A versão principal continua `schemaVersion: 2`; a seção tem sua própria versão para evolução sem reinterpretar registros anteriores. O contexto opcional não participa do fingerprint de duplicidade: registros com a mesma observação central continuam suspeitos de duplicidade mesmo se alguém alterar essas respostas opcionais.

A decisão transitória sobre procurar também o canal oficial nunca é salva no documento V2. Tanto “sim” quanto “não” permitem continuar com a mesma observação descritiva. O caminho “sim” mantém disponível o link oficial, mas não o abre automaticamente e não transmite a observação a nenhuma instituição.

## Saída SAPSA

SAPSA pode expor somente contagens agregadas por categorias predefinidas depois da proteção de pequena célula:

1. a célula territorial/espécie/grupo precisa atingir o mínimo configurado;
2. ao menos esse mesmo número de registros elegíveis precisa conter o módulo V1;
3. cada valor de cada categoria só aparece se sua própria contagem atingir o mínimo.

Não são retornados registros individuais, códigos municipais, timestamps exatos, texto, identidades, detalhes de propriedade, produto ou marca, rankings, conclusões causais/de desempenho ou scores individuais. Categorias abaixo do limiar são omitidas, não arredondadas nem inferidas.
