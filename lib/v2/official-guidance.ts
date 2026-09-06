export const contextualOfficialGuidanceGroups = ["respiratorio", "neurologico", "reprodutivo"] as const;

export const officialGuidanceCopy = {
  title: "Como este registro funciona",
  paragraphs: [
    "O VetAlert é um registro observacional independente. O conteúdo enviado não é encaminhado automaticamente ao MAPA, ao e-SISBRAVET ou a qualquer outro sistema ou instituição.",
    "O formulário não solicita nome do veterinário, CRMV, nome do produtor, propriedade, fabricante, marca ou coordenada individual. Por isso, o VetAlert não é um canal de notificação oficial.",
    "Se, considerando o contexto clínico, houver suspeita de doença ou síndrome de notificação obrigatória, o profissional deve comunicar imediatamente o Serviço Veterinário Oficial ou o e-SISBRAVET. O registro no VetAlert nunca substitui essa obrigação.",
  ],
} as const;

export function requiresContextualOfficialGuidance(signalGroup: string | undefined) {
  return contextualOfficialGuidanceGroups.some((group) => group === signalGroup);
}
