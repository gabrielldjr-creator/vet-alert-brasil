# Nota técnica protegida e município obrigatório no VetAlert V2

Data da política: 7 de setembro de 2026
Escopo: somente V2, desativado por padrão

## Nota técnica opcional

A nota usa o módulo `technical-note-v1`, tem no máximo 280 caracteres e é validada no cliente e novamente no servidor pela mesma implementação determinística. Não há LLM, chamada de API ou serviço externo para analisar o texto.

A política `technical-note-fail-closed-2026-09-07` aplica:

1. normalização Unicode NFKD, remoção de diacríticos apenas para comparação, lowercase e normalização de espaços;
2. padrões locais para URLs, e-mail, CRMV/documentos, números, telefones e caracteres fora do conjunto aceito;
3. denylist de categorias proibidas e exemplos conhecidos de empresas, fabricantes, marcas e medicamentos comerciais;
4. allowlist `technical-note-dictionary-pt-BR-2026-09-07-v2` de vocabulário observacional;
5. exigência de uma âncora verbal observacional;
6. rejeição de qualquer palavra desconhecida ou construção incerta.

A resposta de rejeição é genérica e não informa o termo detectado. O endpoint não retorna detalhes do validador e o código da aplicação não registra a nota rejeitada, o termo, o body ou erros que os contenham. A validação ocorre antes da transação: uma rejeição não cria observação, sidecar de integridade, audit log, alerta legado ou saída SAPSA.

Quando aceita, a nota é persistida apenas dentro de `veterinaryObservationsV2`, coleção sem leitura pelo Firebase Client SDK, acompanhada das versões de schema, política e dicionário. Ela não integra o fingerprint de duplicidade, o tipo analítico carregado pelo repositório SAPSA, clusters, rankings, comparações, dashboard ou CSV.

Essa barreira não garante reconhecimento de 100% dos nomes comerciais. A regra fail-closed reduz o risco ao rejeitar termos desconhecidos. Qualquer regressão nos testes de cliente ou servidor é gate para desativar a nota e manter somente campos estruturados.

## Município obrigatório

O V2 incorpora `ibge-municipalities-2025`, snapshot obtido em 7 de setembro de 2026 do endpoint público oficial de localidades do IBGE. O catálogo contém 5.571 entradas e 27 UFs, incluindo Boa Esperança do Norte (`5101837`).

- O preenchimento consulta somente `/api/v2/territories`, que lê o arquivo estático local.
- O navegador não chama IBGE, geolocalização, IP ou GPS.
- O município é obrigatório e selecionado; não existe texto livre.
- O servidor valida o código de sete dígitos e confirma a combinação UF + município no catálogo completo antes de persistir.
- Falha na lista deixa o envio bloqueado.
- Registros V2 históricos que não possuam município não são alterados ou apagados; a obrigatoriedade vale para novas submissões.

Fonte do snapshot: <https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome>. O catálogo precisa de revisão/versionamento quando o IBGE publicar mudança territorial.
