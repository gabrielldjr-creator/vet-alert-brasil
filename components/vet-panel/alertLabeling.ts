const ALERT_GROUP_LABEL_MAP: Record<string, string> = {
  "Síndromes Compatíveis com Zoonoses": "Observações ampliadas",
  "Alertas Populacionais": "Indicadores de contexto populacional",
};

const ALERT_TYPE_LABEL_MAP: Record<string, string> = {
  "Síndrome neurológica com agressividade": "Sinais neurológicos observados",
  "Síndrome febril com icterícia": "Sinais febris observados",
  "Abortos associados a doença humana na propriedade": "Ocorrência reprodutiva observada",
  "Lesões cutâneas potencialmente transmissíveis": "Alterações cutâneas observadas",
};

export const mapAlertGroupLabel = (value?: string) => {
  if (!value) return "";
  return ALERT_GROUP_LABEL_MAP[value] ?? value;
};

export const mapAlertTypeLabel = (value?: string) => {
  if (!value) return "";
  return ALERT_TYPE_LABEL_MAP[value] ?? value;
};
