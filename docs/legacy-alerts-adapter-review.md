# Revisão do adaptador legado `alerts` → análise V2

Data: 5 de setembro de 2026  
Estado: proposta validada em unidade, não conectada a rota, dashboard, coleção ou produção

## Decisão de arquitetura

O adaptador é uma função pura e server-side que recebe um documento já lido por um repositório privilegiado, constrói um novo objeto somente por allowlist e o entrega em memória ao agregador. Ele não usa spread do documento, não devolve referência ao objeto original, não grava coleção derivada, não altera `alerts` e não executa backfill ou exclusão.

Allowlist de saída v1:

- `adapterVersion`;
- `sourceChannel` reduzido a veterinário legado ou agro-varejo legado;
- UF validada;
- código IBGE municipal somente quando possuir sete dígitos, para agregação server-side;
- espécie mapeada por tabela fechada;
- grupo observacional mapeado por tabela fechada;
- atenção normalizada;
- faixa de animais, nunca contagem livre;
- semana ISO, nunca timestamp exato.

Todo campo não enumerado é descartado, incluindo documento/UID, nome, CRMV, CPF, contato, produtor, propriedade, município textual, localidade aproximada, IP, navegador, produto, marca, prescrição, notas, texto livre e o objeto `context`. Tipos/sinais desconhecidos retornam `null`; não são inferidos.

## Limites de acesso

O módulo não está importado por Client Component nem exposto por API. Uma integração futura deve residir no repositório server-side do SAPSA, aplicar o adaptador antes de qualquer agregação e retornar somente células que passam o mínimo configurado. Testes arquiteturais deverão impedir import em cliente e impedir qualquer endpoint de serializar o documento raw.

Há uma limitação importante: as regras legadas atuais permitem leitura autenticada de `alerts`, pois dashboards de produção dependem disso. A autorização desta fase proíbe alterar permissões. Portanto, o adaptador proposto não cria nova leitura direta, mas também não pode eliminar a leitura direta histórica. Fechar esse caminho exige aprovação futura de mudanças em dashboard/permissões e deve ocorrer antes de alegar que nenhum cliente do sistema consegue ler raw legado.

## Sequência futura, não autorizada

1. Criar repositório Admin SDK exclusivo de servidor.
2. Consultar somente o intervalo necessário, sem enviar snapshot ao cliente.
3. Aplicar `adaptLegacyAlertInMemory` por documento e contar rejeições.
4. Agregar por dimensões permitidas.
5. Excluir suspeitos e aplicar small-cell suppression.
6. Retornar somente células agregadas e metodologia/contagens de descarte.
7. Auditar a consulta/export sem UID bruto ou conteúdo sanitário.
8. Depois de migrar dashboards, solicitar aprovação separada para remover leitura cliente de `alerts`.

Nenhuma dessas etapas de integração foi executada nesta fase.
