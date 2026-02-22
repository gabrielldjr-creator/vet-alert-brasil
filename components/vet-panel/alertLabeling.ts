const ALERT_GROUP_LABEL_MAP: Record<string, string> = {
  "Síndromes Compatíveis com Zoonoses": "Manifestações cutâneas crônicas",
  "Alertas Populacionais": "Contextos clínicos recorrentes",
};

const ALERT_TYPE_LABEL_MAP: Record<string, string> = {
  "Síndrome neurológica com agressividade": "Síndrome neurológica de manejo intensivo",
  "Síndrome febril com icterícia": "Síndrome febril de evolução clínica",
  "Abortos associados a doença humana na propriedade": "Evento reprodutivo de contexto ampliado",
  "Lesões cutâneas potencialmente transmissíveis": "Manifestações cutâneas de acompanhamento",
};

export const mapAlertGroupLabel = (value?: string) => {
  if (!value) return "";
  return ALERT_GROUP_LABEL_MAP[value] ?? value;
};

export const mapAlertTypeLabel = (value?: string) => {
  if (!value) return "";
  return ALERT_TYPE_LABEL_MAP[value] ?? value;
};
