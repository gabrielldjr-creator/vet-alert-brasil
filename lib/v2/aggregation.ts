import {
  carePressureValues,
  ECONOMIC_OPERATIONAL_CONTEXT_VERSION,
  inputsOrServicesAccessValues,
  preventiveMeasuresAbilityValues,
  veterinaryCareAccessValues,
  type EconomicOperationalContextV1,
} from "./schema";

export type AggregateObservation = {
  receivedAt: Date;
  territory: { stateCode: string; municipalityCode?: string };
  species: string;
  signalGroup: string;
  source: string;
  qualityFlags?: { duplicateSuspected?: boolean; rateLimitExceeded?: boolean };
  economicOperationalContext?: EconomicOperationalContextV1;
};

export type AggregationThresholds = { minimumCell: number; recurring: number; emerging: number; sustained: number };

function weekBucket(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function protectedContextCounts(
  contexts: EconomicOperationalContextV1[],
  field: keyof Omit<EconomicOperationalContextV1, "schemaVersion">,
  allowedValues: readonly string[],
  minimumCell: number,
) {
  const counts = new Map<string, number>();
  for (const context of contexts) {
    const value = context[field];
    if (typeof value === "string" && allowedValues.includes(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(allowedValues.flatMap((value) => {
    const count = counts.get(value) ?? 0;
    return count >= minimumCell ? [[value, count]] : [];
  }));
}

function buildEconomicOperationalContextSummary(group: AggregateObservation[], minimumCell: number) {
  const contexts = group.map((record) => record.economicOperationalContext).filter((context): context is EconomicOperationalContextV1 => context?.schemaVersion === ECONOMIC_OPERATIONAL_CONTEXT_VERSION);
  if (contexts.length < minimumCell) return undefined;
  return {
    moduleVersion: ECONOMIC_OPERATIONAL_CONTEXT_VERSION,
    observationCount: contexts.length,
    suppressionApplied: true,
    accessToVeterinaryCare: protectedContextCounts(contexts, "accessToVeterinaryCare", veterinaryCareAccessValues, minimumCell),
    accessToNecessaryInputsOrServices: protectedContextCounts(contexts, "accessToNecessaryInputsOrServices", inputsOrServicesAccessValues, minimumCell),
    abilityToImplementPreventiveMeasures: protectedContextCounts(contexts, "abilityToImplementPreventiveMeasures", preventiveMeasuresAbilityValues, minimumCell),
    logisticalOrFinancialPressureAffectingCare: protectedContextCounts(contexts, "logisticalOrFinancialPressureAffectingCare", carePressureValues, minimumCell),
  };
}

export function buildSapsaSummary(records: AggregateObservation[], thresholds: AggregationThresholds) {
  const grouped = new Map<string, AggregateObservation[]>();
  for (const record of records) {
    const key = [record.territory.stateCode, record.species, record.signalGroup].join("|");
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  let suppressedCellCount = 0;
  const cells = [...grouped.entries()].flatMap(([key, allInCell]) => {
    const group = allInCell.filter((record) => !record.qualityFlags?.duplicateSuspected && !record.qualityFlags?.rateLimitExceeded);
    if (group.length < thresholds.minimumCell) { suppressedCellCount += 1; return []; }
    const [stateCode, species, signalGroup] = key.split("|");
    const municipalities = new Set(group.map((item) => item.territory.municipalityCode).filter(Boolean));
    const periods = new Set(group.map((item) => weekBucket(item.receivedAt)));
    const sourceChannels = new Set(group.map((item) => item.source));
    let classification = "isolated_observation";
    if (group.length >= thresholds.sustained && municipalities.size >= 2 && periods.size >= 2) classification = "sustained_convergence";
    else if (group.length >= thresholds.emerging && municipalities.size >= 2) classification = "emerging_territorial_convergence";
    else if (group.length >= thresholds.recurring) classification = "recurring_signal";
    const economicOperationalContextSummary = buildEconomicOperationalContextSummary(group, thresholds.minimumCell);
    return [{ stateCode, species, signalGroup, observationCount: group.length, municipalityCount: municipalities.size, periods: [...periods].sort(), sourceChannelCount: sourceChannels.size, classification,
      ...(economicOperationalContextSummary ? { economicOperationalContextSummary } : {}),
      explanation: { compatibleRecords: group.length, municipalities: municipalities.size, timeBuckets: periods.size, suspiciousRecordsExcluded: allInCell.length - group.length } }];
  });

  const eligibleCount = records.filter((record) => !record.qualityFlags?.duplicateSuspected && !record.qualityFlags?.rateLimitExceeded).length;

  return {
    label: "Inteligência observacional — padrão para revisão técnica",
    acceptedObservations: records.length >= thresholds.minimumCell ? records.length : null,
    eligibleObservations: eligibleCount >= thresholds.minimumCell ? eligibleCount : null,
    suppressedCellCount,
    suspiciousRecordsExcluded: records.length - eligibleCount,
    cells,
    methodology: { version: "sapsa-v2-exploratory-3", scientificallyValidated: false, qualityPolicy: "exclude-duplicate-or-rate-flag-v1", thresholds },
  };
}
