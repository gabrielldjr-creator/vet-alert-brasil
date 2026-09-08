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
| `territory.municipalityCode` | cliente controlado | obrigatório; código de sete dígitos e combinação UF + município validada no catálogo estático `ibge-municipalities-2025` |
| `species` | allowlist | enum em `lib/v2/schema.ts` |
| `signalGroup` | allowlist | grupo observacional |
| `observedPattern` | allowlist | manifestação observada |
| `animalCountBand` | allowlist | faixa, nunca número de “casos” inferido |
| `attentionLevel` | allowlist | percepção: observed/elevated/urgent |
| `observationPeriod` | allowlist | janela declarada controlada |
| `therapeuticContext` | allowlist | categoria, princípio ativo, exposição e intervalo controlados |
| `economicOperationalContext` | allowlist opcional versionada | seção `economic-operational-context-v1`; somente acesso a cuidado, acesso a insumos/serviços, capacidade preventiva e pressão sobre o cuidado em categorias amplas |
| `technicalNote` | cliente validado + versões server-side | módulo opcional `technical-note-v1`, máximo 280 caracteres; texto fail-closed restrito ao registro protegido, fora do fingerprint, SAPSA e exportações |
| `consentVersion` | cliente validado | versão exata da informação apresentada |
| `integrityStatus`, `qualityFlags` | servidor | aceito ou revisão; nunca apaga observação |
| `retentionVersion` | servidor | política aplicada |

`submissionIntegrityV2` contém somente ID, digests HMAC, timestamps, expiração, flags e versão de política. `auditLogsV2` contém evento, ID técnico, digest do ator, horário, expiração, versão e resultado. Nenhuma coleção técnica é legível pelo cliente ou incluída em export institucional.

Campos proibidos: nome, CRMV, CPF, email, telefone, produtor, propriedade, endereço, GPS/coordenadas, IP, User-Agent, dispositivo, UID bruto, organização/papel client-side, empresa, marca, fabricante, produto, notas arbitrárias, renda, valores monetários, dívida, crédito/score, financiamento, ranking e score de risco individual. Chaves desconhecidas também são rejeitadas. A única exceção textual é `technicalNote`, validada por schema, padrões e vocabulário versionados com rejeição de incerteza. A decisão contextual sobre possível comunicação obrigatória nunca integra o payload.
