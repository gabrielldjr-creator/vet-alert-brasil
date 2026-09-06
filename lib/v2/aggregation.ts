export type AggregateObservation = {
  receivedAt: Date;
  territory: { stateCode: string; municipalityCode?: string };
  species: string;
  signalGroup: string;
  source: string;
  qualityFlags?: { duplicateSuspected?: boolean; rateLimitExceeded?: boolean };
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

export function buildSapsaSummary(records: AggregateObservation[], thresholds: AggregationThresholds) {
  const eligible = records.filter((record) => !record.qualityFlags?.duplicateSuspected && !record.qualityFlags?.rateLimitExceeded);
  const grouped = new Map<string, AggregateObservation[]>();
  for (const record of eligible) {
    const key = [record.territory.stateCode, record.species, record.signalGroup].join("|");
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  let suppressedCellCount = 0;
  const cells = [...grouped.entries()].flatMap(([key, group]) => {
    if (group.length < thresholds.minimumCell) { suppressedCellCount += 1; return []; }
    const [stateCode, species, signalGroup] = key.split("|");
    const municipalities = new Set(group.map((item) => item.territory.municipalityCode).filter(Boolean));
    const periods = new Set(group.map((item) => weekBucket(item.receivedAt)));
    const sourceChannels = new Set(group.map((item) => item.source));
    let classification = "isolated_observation";
    if (group.length >= thresholds.sustained && municipalities.size >= 2 && periods.size >= 2) classification = "sustained_convergence";
    else if (group.length >= thresholds.emerging && municipalities.size >= 2) classification = "emerging_territorial_convergence";
    else if (group.length >= thresholds.recurring) classification = "recurring_signal";
    return [{ stateCode, species, signalGroup, observationCount: group.length, municipalityCount: municipalities.size, periods: [...periods].sort(), sourceChannelCount: sourceChannels.size, classification,
      explanation: { compatibleRecords: group.length, municipalities: municipalities.size, timeBuckets: periods.size, suspiciousRecordsExcluded: records.length - eligible.length } }];
  });

  return {
    label: "Inteligência observacional — padrão para revisão técnica",
    acceptedObservations: records.length >= thresholds.minimumCell ? records.length : null,
    eligibleObservations: eligible.length >= thresholds.minimumCell ? eligible.length : null,
    suppressedCellCount,
    suspiciousRecordsExcluded: records.length - eligible.length,
    cells,
    methodology: { version: "sapsa-v2-exploratory-1", scientificallyValidated: false, thresholds },
  };
}
