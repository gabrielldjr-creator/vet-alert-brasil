# Privacidade e governança V2

O desenho prioriza minimização de dados, controle de acesso e leitura agregada. A avaliação jurídica deve acompanhar a implantação.

## Garantias do código V2

- Não pede nem aceita identidade profissional, produtor/propriedade, contato ou coordenada precisa. A única entrada textual é a nota técnica opcional curta, submetida a validação fail-closed local e server-side com padrões e dicionário versionados.
- Não persiste UID bruto no documento observacional.
- Não lê nem persiste IP ou User-Agent no código da aplicação.
- Usa um snapshot versionado e incorporado da lista oficial de municípios; não há conexão do navegador ou do servidor ao IBGE durante o preenchimento.
- Separa observação, integridade e auditoria em coleções server-only.
- Usa HMAC com segredo mínimo de 32 caracteres; o digest continua sendo dado técnico sensível.
- Gera metadados no servidor e rejeita unknown/proibidos recursivamente.
- Mantém observações suspeitas, marca-as e as exclui da convergência automática.
- Suprime células pequenas e não retorna registros individuais no SAPSA.

## Limitações e retenção

Firebase, Vercel, proxies e a rede podem registrar IP, User-Agent, UID e horários nos respectivos níveis de infraestrutura. O IBGE não é consultado em runtime pelo V2. IAM, logs, backups, retenção e suporte precisam de configuração/auditoria externa. Município mais timestamp e o conteúdo de uma nota aceita ainda podem permitir inferência. A barreira textual não reconhece necessariamente todo nome comercial. Não se promete anonimato absoluto ou conformidade LGPD concluída.

Defaults: observações 365 dias; sidecars/auditoria 30 dias. `expiresAt` prepara TTL, mas ativá-lo é decisão operacional posterior. Nenhum dado legado é apagado ou migrado. O CSV institucional deriva do agregador SAPSA, exige papel no servidor, registra auditoria e não contém IDs, digests, timestamps exatos ou células pequenas.
