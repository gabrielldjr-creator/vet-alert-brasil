const ALERT_GROUP_LABEL_MAP: Record<string, string> = {
  "Síndromes Compatíveis com Zoonoses": "Sinais clínicos atípicos (interface ampliada)",
  "Alertas Populacionais": "Registros Populacionais",
};

const ALERT_TYPE_LABEL_MAP: Record<string, string> = {
  "Síndrome neurológica com agressividade": "Síndrome neurológica atípica",
  "Síndrome febril com icterícia": "Síndrome febril atípica",
  "Abortos associados a doença humana na propriedade": "Evento reprodutivo atípico",
  "Lesões cutâneas potencialmente transmissíveis": "Lesões cutâneas atípicas",
};

export const mapAlertGroupLabel = (value?: string) => {
  if (!value) return "";
  return ALERT_GROUP_LABEL_MAP[value] ?? value;
};

export const mapAlertTypeLabel = (value?: string) => {
  if (!value) return "";
  return ALERT_TYPE_LABEL_MAP[value] ?? value;
};
