export const contextualOfficialGuidanceGroups = [
  "respiratorio",
  "digestivo",
  "locomotor",
  "neurologico",
  "dermatologico",
  "reprodutivo",
  "populacional",
] as const;

export type OfficialGuidanceDecision = "official_channel_also" | "observational" | null;

export const officialGuidanceCopy = {
  title: "Como este registro funciona",
  notice: "O VetAlert registra observações independentes para fins de inteligência operacional agregada. Este registro não é uma notificação oficial e não é encaminhado automaticamente ao MAPA, ao e-SISBRAVET ou a outras instituições. O formulário não solicita os dados necessários para uma notificação oficial. Se, considerando o contexto clínico, houver suspeita de doença ou síndrome de notificação obrigatória, o profissional deve comunicar também e de forma independente ao Serviço Veterinário Oficial ou ao e-SISBRAVET. O registro observacional no VetAlert não substitui essa obrigação.",
  explanation: "Este registro é apenas descritivo e observacional. Não é diagnóstico, notificação oficial nem sistema oficial de alerta.",
  question: "Considerando seu julgamento profissional, esta observação indica suspeita de doença ou síndrome de notificação obrigatória?",
} as const;

export function requiresContextualOfficialGuidance(signalGroup: string | undefined) {
  return contextualOfficialGuidanceGroups.some((group) => group === signalGroup);
}

export function allowsObservationalSubmission(signalGroup: string | undefined, decision: OfficialGuidanceDecision) {
  return !requiresContextualOfficialGuidance(signalGroup) || decision !== null;
}
