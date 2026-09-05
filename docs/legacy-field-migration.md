# Política para campos legados

Nenhum dado histórico será apagado, regravado ou migrado nesta fase. `alerts` permanece intacta e só é consumida pelos painéis legados.

`productSold`, notas, localidade aproximada, fatores socioeconômicos, marca/origem e texto livre não existem no schema V2 e são rejeitados pelo endpoint V2.

Um adaptador futuro deverá operar em cópia, manter o original, mapear somente enums defensáveis, descartar texto/identificadores/produtos, marcar origem/versão, relatar perdas, ser idempotente e exigir aprovação antes de executar.
