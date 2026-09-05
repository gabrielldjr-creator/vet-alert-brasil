export const V2_SCHEMA_VERSION = 2 as const;
export const V2_CONSENT_VERSION = "vetalert-v2-2026-09-05";
export const V2_SOURCE = "veterinary" as const;

type Environment = Record<string, string | undefined>;

export function isV2Enabled(environment: Environment = process.env) {
  return environment.VETALERT_V2_ENABLED === "true";
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

export function getV2Policy(environment: Environment = process.env) {
  return {
    observationRetentionDays: boundedInteger(environment.VETALERT_V2_RETENTION_DAYS, 365, 30, 3650),
    integrityRetentionDays: boundedInteger(environment.VETALERT_V2_INTEGRITY_RETENTION_DAYS, 30, 1, 365),
    rateWindowMinutes: boundedInteger(environment.VETALERT_V2_RATE_WINDOW_MINUTES, 10, 1, 60),
    maxSubmissionsPerWindow: boundedInteger(environment.VETALERT_V2_MAX_SUBMISSIONS, 10, 2, 100),
    duplicateWindowHours: boundedInteger(environment.VETALERT_V2_DUPLICATE_WINDOW_HOURS, 24, 1, 168),
    minimumAggregateCell: boundedInteger(environment.VETALERT_V2_MINIMUM_CELL, 5, 3, 20),
  } as const;
}
