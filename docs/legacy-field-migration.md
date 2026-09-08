# Política para campos legados

Nenhum dado histórico será apagado, regravado ou migrado nesta fase. `alerts` permanece intacta e só é consumida pelos painéis legados.

`productSold`, notas legadas, localidade aproximada, fatores socioeconômicos legados não estruturados, marca/origem e texto livre histórico não são migrados para o schema V2. A exceção para novas submissões V2 é `technical-note-v1`: nota curta, fail-closed, sem reaproveitar qualquer texto legado e restrita ao documento operacional protegido. O único contexto econômico/operacional aceito é a seção opcional `economic-operational-context-v1`, com quatro categorias amplas em allowlists fechadas e sem valores, dívida, crédito, identidade ou decisão individual. Nenhuma dessas seções interpreta campos legados.

Um adaptador futuro deverá operar em cópia, manter o original, mapear somente enums defensáveis, descartar texto/identificadores/produtos, marcar origem/versão, relatar perdas, ser idempotente e exigir aprovação antes de executar.
