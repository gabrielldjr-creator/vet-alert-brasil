# Dicionário de dados V2

## `veterinaryObservationsV2`

| Campo | Origem | Regra |
|---|---|---|
| `submissionId` | servidor | UUID imutável; cliente não pode enviar |
| `receivedAt` | servidor | timestamp operacional exato; não exportar em células pequenas |
| `expiresAt` | servidor | candidato a TTL após aprovação operacional |
| `schemaVersion` | servidor | sempre `2` |
| `source` | servidor | sempre `veterinary` |
| `sourceChannel` | servidor | sempre `vetalert_v2` |
| `territory.stateCode` | cliente controlado | UF com duas letras |
| `territory.municipalityCode` | cliente controlado | IBGE com sete dígitos, opcional |
| `species` | allowlist | enum em `lib/v2/schema.ts` |
| `signalGroup` | allowlist | grupo observacional |
| `observedPattern` | allowlist | manifestação observada |
| `animalCountBand` | allowlist | faixa, nunca número de “casos” inferido |
| `attentionLevel` | allowlist | percepção: observed/elevated/urgent |
| `observationPeriod` | allowlist | janela declarada controlada |
| `therapeuticContext` | allowlist | categoria, princípio ativo, exposição e intervalo controlados |
| `consentVersion` | cliente validado | versão exata da informação apresentada |
| `integrityStatus`, `qualityFlags` | servidor | aceito ou revisão; nunca apaga observação |
| `retentionVersion` | servidor | política aplicada |

`submissionIntegrityV2` contém somente ID, digests HMAC, timestamps, expiração, flags e versão de política. `auditLogsV2` contém evento, ID técnico, digest do ator, horário, expiração, versão e resultado. Nenhuma coleção técnica é legível pelo cliente ou incluída em export institucional.

Campos proibidos: nome, CRMV, CPF, email, telefone, produtor, propriedade, endereço, GPS/coordenadas, IP, User-Agent, dispositivo, UID bruto, organização/papel client-side, empresa, marca, fabricante, produto, nota e texto livre. Chaves desconhecidas também são rejeitadas.
