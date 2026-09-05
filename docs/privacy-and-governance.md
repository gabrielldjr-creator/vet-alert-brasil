# Privacidade e governança V2

O desenho prioriza minimização de dados, controle de acesso e leitura agregada. A avaliação jurídica deve acompanhar a implantação.

## Garantias do código V2

- Não pede nem aceita identidade profissional, produtor/propriedade, contato, coordenada precisa ou texto livre.
- Não persiste UID bruto no documento observacional.
- Não lê nem persiste IP ou User-Agent no código da aplicação.
- Consulta a lista pública de municípios pelo servidor V2, evitando conexão direta do navegador ao IBGE.
- Separa observação, integridade e auditoria em coleções server-only.
- Usa HMAC com segredo mínimo de 32 caracteres; o digest continua sendo dado técnico sensível.
- Gera metadados no servidor e rejeita unknown/proibidos recursivamente.
- Mantém observações suspeitas, marca-as e as exclui da convergência automática.
- Suprime células pequenas e não retorna registros individuais no SAPSA.

## Limitações e retenção

Firebase, Vercel, proxies, o serviço do IBGE e a rede podem registrar IP, User-Agent, UID e horários nos respectivos níveis de infraestrutura. No fluxo V2, o IBGE recebe a conexão do servidor, não a conexão direta do navegador. IAM, logs, backups, retenção e suporte precisam de configuração/auditoria externa. Município mais timestamp ainda pode permitir inferência. Não se promete anonimato absoluto ou conformidade LGPD concluída.

Defaults: observações 365 dias; sidecars/auditoria 30 dias. `expiresAt` prepara TTL, mas ativá-lo é decisão operacional posterior. Nenhum dado legado é apagado ou migrado. O CSV institucional deriva do agregador SAPSA, exige papel no servidor, registra auditoria e não contém IDs, digests, timestamps exatos ou células pequenas.
