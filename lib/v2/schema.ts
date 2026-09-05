import { V2_CONSENT_VERSION, V2_SCHEMA_VERSION, V2_SOURCE } from "./config";

export const speciesValues = ["bovinos", "equinos", "suinos", "aves", "pequenos_animais", "silvestres", "outros_producao"] as const;
export const signalGroups = ["respiratorio", "digestivo", "locomotor", "neurologico", "dermatologico", "reprodutivo", "populacional"] as const;
export const observedPatterns = [
  "manifestacao_respiratoria_observada", "manifestacao_digestiva_observada", "alteracao_locomotora_observada",
  "alteracao_neurologica_observada", "alteracao_dermatologica_observada", "alteracao_reprodutiva_observada",
  "aumento_percebido_ocorrencias", "mudanca_observada_periodo",
] as const;
export const animalCountBands = ["1", "2_5", "6_20", "mais_20"] as const;
export const attentionLevels = ["observed", "elevated", "urgent"] as const;
export const observationPeriods = ["ultimas_24h", "ultimos_7d", "ultimos_30d"] as const;
export const therapeuticCategories = ["antibiotico", "antiparasitario", "anti_inflamatorio", "vacina"] as const;
export const activeIngredients = ["amoxicilina", "doxiciclina", "ivermectina", "meloxicam", "oxitetraciclina"] as const;
export const exposureValues = ["sim", "nao", "desconhecido"] as const;
export const intervalValues = ["menos_24h", "1_3d", "4_14d", "mais_14d"] as const;

type ValueOf<T extends readonly string[]> = T[number];

export type VeterinaryObservationV2Input = {
  territory: { stateCode: string; municipalityCode?: string };
  species: ValueOf<typeof speciesValues>;
  signalGroup: ValueOf<typeof signalGroups>;
  observedPattern: ValueOf<typeof observedPatterns>;
  animalCountBand: ValueOf<typeof animalCountBands>;
  attentionLevel: ValueOf<typeof attentionLevels>;
  observationPeriod: ValueOf<typeof observationPeriods>;
  therapeuticContext?: {
    category?: ValueOf<typeof therapeuticCategories>;
    activeIngredient?: ValueOf<typeof activeIngredients>;
    exposure?: ValueOf<typeof exposureValues>;
    interval?: ValueOf<typeof intervalValues>;
  };
  consentVersion: typeof V2_CONSENT_VERSION;
};

export type V2ValidationResult =
  | { ok: true; value: VeterinaryObservationV2Input }
  | { ok: false; errors: string[] };

const prohibitedKey = /^(name|nome|veterinarianname|nomeveterinario|crmv|cpf|email|phone|telefone|producer|produtor|farm|fazenda|property|propriedade|address|endereco|latitude|longitude|coordinates|coordenadas|ip|ipaddress|useragent|device|dispositivo|brand|marca|manufacturer|fabricante|product|produto|productsold|notes?|notas?|freetext|uid|authuid|role|organization|submissionid|receivedat|schemaversion|source|sourcechannel|integrity|integritystatus|qualityflags|expiresat)$/i;

function normalizeKey(key: string) {
  return key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  return Object.keys(value).filter((key) => !allowed.includes(key)).map((key) => `${path}.${key}: campo desconhecido`);
}

function findProhibitedKeys(value: unknown, path = "payload"): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => findProhibitedKeys(item, `${path}[${index}]`));
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    ...(prohibitedKey.test(normalizeKey(key)) ? [`${path}.${key}: campo proibido`] : []),
    ...findProhibitedKeys(nested, `${path}.${key}`),
  ]);
}

function oneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function validateObservationV2(input: unknown): V2ValidationResult {
  if (!isRecord(input)) return { ok: false, errors: ["payload: objeto obrigatório"] };
  const errors = findProhibitedKeys(input);
  errors.push(...unknownKeys(input, ["territory", "species", "signalGroup", "observedPattern", "animalCountBand", "attentionLevel", "observationPeriod", "therapeuticContext", "consentVersion"], "payload"));

  const territory = input.territory;
  if (!isRecord(territory)) errors.push("territory: objeto obrigatório");
  else {
    errors.push(...unknownKeys(territory, ["stateCode", "municipalityCode"], "territory"));
    if (typeof territory.stateCode !== "string" || !/^[A-Z]{2}$/.test(territory.stateCode)) errors.push("territory.stateCode: UF inválida");
    if (territory.municipalityCode !== undefined && (typeof territory.municipalityCode !== "string" || !/^\d{7}$/.test(territory.municipalityCode))) errors.push("territory.municipalityCode: código IBGE inválido");
  }
  if (!oneOf(input.species, speciesValues)) errors.push("species: valor inválido");
  if (!oneOf(input.signalGroup, signalGroups)) errors.push("signalGroup: valor inválido");
  if (!oneOf(input.observedPattern, observedPatterns)) errors.push("observedPattern: valor inválido");
  if (!oneOf(input.animalCountBand, animalCountBands)) errors.push("animalCountBand: valor inválido");
  if (!oneOf(input.attentionLevel, attentionLevels)) errors.push("attentionLevel: valor inválido");
  if (!oneOf(input.observationPeriod, observationPeriods)) errors.push("observationPeriod: valor inválido");
  if (input.consentVersion !== V2_CONSENT_VERSION) errors.push("consentVersion: versão inválida");

  if (input.therapeuticContext !== undefined) {
    if (!isRecord(input.therapeuticContext)) errors.push("therapeuticContext: objeto inválido");
    else {
      const context = input.therapeuticContext;
      errors.push(...unknownKeys(context, ["category", "activeIngredient", "exposure", "interval"], "therapeuticContext"));
      if (context.category !== undefined && !oneOf(context.category, therapeuticCategories)) errors.push("therapeuticContext.category: valor inválido");
      if (context.activeIngredient !== undefined && !oneOf(context.activeIngredient, activeIngredients)) errors.push("therapeuticContext.activeIngredient: valor inválido");
      if (context.exposure !== undefined && !oneOf(context.exposure, exposureValues)) errors.push("therapeuticContext.exposure: valor inválido");
      if (context.interval !== undefined && !oneOf(context.interval, intervalValues)) errors.push("therapeuticContext.interval: valor inválido");
    }
  }

  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  return { ok: true, value: input as VeterinaryObservationV2Input };
}

export function buildObservationDocument(input: VeterinaryObservationV2Input, server: {
  submissionId: string; receivedAt: unknown; expiresAt: unknown; duplicateSuspected: boolean; rateLimitExceeded: boolean;
}) {
  return {
    ...input,
    submissionId: server.submissionId,
    receivedAt: server.receivedAt,
    expiresAt: server.expiresAt,
    schemaVersion: V2_SCHEMA_VERSION,
    source: V2_SOURCE,
    sourceChannel: "vetalert_v2",
    integrityStatus: server.duplicateSuspected || server.rateLimitExceeded ? "review" : "accepted",
    qualityFlags: { duplicateSuspected: server.duplicateSuspected, rateLimitExceeded: server.rateLimitExceeded },
    retentionVersion: "v2-2026-09",
  } as const;
}
