export type LegacyAnalyticObservation = Readonly<{
  adapterVersion: "legacy-alerts-allowlist-v1";
  sourceChannel: "legacy_veterinary" | "legacy_agro_retail";
  stateCode: string;
  municipalityCode?: string;
  species: "bovinos" | "equinos" | "suinos" | "aves" | "pequenos_animais" | "silvestres" | "outros_producao";
  signalGroup: "respiratorio" | "digestivo" | "locomotor" | "neurologico" | "dermatologico" | "reprodutivo" | "populacional" | "ambiental";
  attentionBand: "unclassified" | "observed" | "elevated" | "urgent";
  animalCountBand: "unknown" | "1" | "2_5" | "6_20" | "mais_20";
  timeBucket?: string;
}>;

const speciesAllowlist = new Map<string, LegacyAnalyticObservation["species"]>([
  ["Bovinos", "bovinos"], ["Equinos", "equinos"], ["Suínos", "suinos"], ["Aves", "aves"],
  ["Pequenos animais", "pequenos_animais"], ["Pequenos animais (cães/gatos)", "pequenos_animais"],
  ["Animais silvestres", "silvestres"], ["Silvestres", "silvestres"],
  ["Outros", "outros_producao"], ["Outros animais de produção", "outros_producao"],
]);

const signalAllowlist = new Map<string, LegacyAnalyticObservation["signalGroup"]>([
  ["Síndrome respiratória", "respiratorio"], ["Sintoma respiratório", "respiratorio"],
  ["Síndrome digestiva", "digestivo"], ["Diarreia", "digestivo"], ["Sem apetite", "digestivo"],
  ["Claudicação", "locomotor"], ["Manifestações neurológicas inespecíficas", "neurologico"],
  ["Síndrome neurológica atípica", "neurologico"], ["Lesões cutâneas / teciduais", "dermatologico"],
  ["Alterações reprodutivas", "reprodutivo"], ["Mesmo sintoma em vários animais", "populacional"],
  ["Aumento anormal da mortalidade", "populacional"], ["Mortalidade", "populacional"],
  ["Padrão incomum para a estação", "populacional"], ["Aumento repentino de atendimentos clínicos", "populacional"],
  ["Suspeita de intoxicação", "ambiental"], ["Contaminação de água", "ambiental"],
  ["Contaminação ou mudança abrupta de ração/alimento", "ambiental"], ["Pulverização aérea próxima", "ambiental"],
  ["Queimadas / fumaça", "ambiental"], ["Enchentes, secas ou eventos climáticos extremos", "ambiental"],
]);

function stringField(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] as string : undefined;
}

function toWeekBucket(value: unknown) {
  let date: Date | undefined;
  if (value instanceof Date) date = value;
  else if (typeof value === "string") date = new Date(value);
  else if (value && typeof value === "object" && typeof (value as { seconds?: unknown }).seconds === "number") {
    date = new Date((value as { seconds: number }).seconds * 1000);
  }
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function countBand(record: Record<string, unknown>): LegacyAnalyticObservation["animalCountBand"] {
  const herdCount = stringField(record, "herdCount");
  if (herdCount === "1") return "1";
  if (herdCount === "2 a 5" || herdCount === "2_5") return "2_5";
  if (herdCount === "6 a 20" || herdCount === "6_20") return "6_20";
  if (herdCount?.startsWith("Mais de 20") || herdCount === "mais_20") return "mais_20";
  return "unknown";
}

function attentionBand(value: string | undefined): LegacyAnalyticObservation["attentionBand"] {
  if (value === "Urgente") return "urgent";
  if (value === "Preocupante") return "elevated";
  if (value === "Atenção") return "observed";
  return "unclassified";
}

// Pure and intentionally unwired: only a trusted server-side repository may call this
// before aggregation. It never spreads or returns the raw Firestore document.
export function adaptLegacyAlertInMemory(raw: unknown): LegacyAnalyticObservation | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const stateCode = stringField(record, "state")?.toUpperCase();
  const mappedSpecies = speciesAllowlist.get(stringField(record, "species") ?? "");
  const signalGroup = signalAllowlist.get(stringField(record, "alertType") ?? "");
  if (!stateCode || !/^[A-Z]{2}$/.test(stateCode) || !mappedSpecies || !signalGroup) return null;

  const rawMunicipality = record.cityCode;
  const municipalityCode = typeof rawMunicipality === "number" ? String(rawMunicipality) :
    typeof rawMunicipality === "string" ? rawMunicipality : undefined;
  const safeMunicipalityCode = municipalityCode && /^\d{7}$/.test(municipalityCode) ? municipalityCode : undefined;
  const bucket = toWeekBucket(record.createdAt);

  return Object.freeze({
    adapterVersion: "legacy-alerts-allowlist-v1",
    sourceChannel: stringField(record, "source") === "agro_retail" ? "legacy_agro_retail" : "legacy_veterinary",
    stateCode,
    ...(safeMunicipalityCode ? { municipalityCode: safeMunicipalityCode } : {}),
    species: mappedSpecies,
    signalGroup,
    attentionBand: attentionBand(stringField(record, "severity")),
    animalCountBand: countBand(record),
    ...(bucket ? { timeBucket: bucket } : {}),
  });
}
