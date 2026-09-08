# Limites institucionais e MAPA

- VetAlert não é canal oficial do MAPA, não substitui comunicação obrigatória e não sugere aprovação, participação ou homologação do MAPA.
- O canal oficial aplicável permanece soberano.
- V2 não classifica automaticamente uma observação como notificação obrigatória a partir de sintomas.
- V2 não envia notificação oficial automaticamente.
- A interface orienta de forma neutra a consultar o canal oficial quando aplicável.
- Links oficiais somente podem ser exibidos quando configurados e aprovados; não há link inventado nesta fase.
- Não usar logotipo/selo do MAPA nem “surto detectado”, “caso confirmado”, “vigilância sanitária”, “notificação gerada”, “risco epidemiológico” ou “diagnóstico automático”.

## Orientação contextual no fluxo veterinário V2

Ao selecionar qualquer manifestação observacional atualmente configurada — incluindo os grupos respiratório, neurológico e reprodutivo — o V2 exige uma decisão contextual antes de avançar. Essa cobertura conservadora evita que o software tente decidir, sem contexto clínico, quais manifestações poderiam se sobrepor a uma condição de comunicação obrigatória.

A tela apresenta o aviso contextual, explica que o registro é descritivo, observacional, não diagnóstico e não oficial, e pergunta se o julgamento profissional indica possível obrigação de comunicação oficial. “Não — continuar registro observacional” libera o payload descritivo. “Sim — comunicar também ao canal oficial” mostra novamente o link oficial e oferece “Continuar registro no VetAlert”. Os dois caminhos permitem salvar a mesma observação descritiva; a escolha nunca integra o payload e não inicia comunicação externa.

O botão “Abrir canal oficial” aponta por default para a página pública oficial do e-SISBRAVET no MAPA e seu uso é opcional. `VETALERT_V2_OFFICIAL_CHANNEL_URL` permite ocultá-lo com valor vazio ou substituí-lo por outra URL HTTPS em host governamental permitido. Ele é um link iniciado pelo usuário, sem chamada em segundo plano, envio de payload ou integração. Tanto a pergunta quanto a decisão permanecem no estado transitório da interface: não adicionam doença, suspeita, diagnóstico, “surto”, notificação ou conclusão causal ao documento enviado.

O posicionamento comercial do V2 é “Inteligência de campo independente e agregada para decisões operacionais.” O produto oferece condições de campo agregadas para revisão humana e decisões operacionais de seguradoras, empresas de saúde animal, distribuidores, bancos e produtores. Não deve ser apresentado como vigilância sanitária paralela, notificação oculta, monitoramento epidemiológico, diagnóstico ou sistema oficial de alerta precoce.

Qualquer integração futura exige regra documentada, autorização da integração, validação regulatória, revisão jurídica e autorização expressa do responsável.
