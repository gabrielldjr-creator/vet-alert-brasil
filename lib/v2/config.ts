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

function safeKeyVersion(value: string | undefined) {
  return value && /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(value) ? value : "integrity-key-v1";
}

const officialChannelHosts = new Set(["gov.br", "www.gov.br", "sistemasweb.agricultura.gov.br"]);
const defaultOfficialChannelUrl = "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html";

export function getV2OfficialChannelUrl(environment: Environment = process.env) {
  const value = environment.VETALERT_V2_OFFICIAL_CHANNEL_URL;
  if (value === undefined) return defaultOfficialChannelUrl;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && officialChannelHosts.has(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getV2Policy(environment: Environment = process.env) {
  const minimumAggregateCell = boundedInteger(environment.VETALERT_V2_MINIMUM_CELL, 5, 3, 20);
  const recurringThreshold = Math.max(minimumAggregateCell, boundedInteger(environment.VETALERT_V2_RECURRING_THRESHOLD, 5, 3, 100));
  const emergingThreshold = Math.max(recurringThreshold, boundedInteger(environment.VETALERT_V2_EMERGING_THRESHOLD, 6, 3, 100));
  const sustainedThreshold = Math.max(emergingThreshold, boundedInteger(environment.VETALERT_V2_SUSTAINED_THRESHOLD, 8, 3, 100));
  return {
    observationRetentionDays: boundedInteger(environment.VETALERT_V2_RETENTION_DAYS, 365, 30, 3650),
    integrityRetentionDays: boundedInteger(environment.VETALERT_V2_INTEGRITY_RETENTION_DAYS, 30, 1, 365),
    rateWindowMinutes: boundedInteger(environment.VETALERT_V2_RATE_WINDOW_MINUTES, 10, 1, 60),
    maxSubmissionsPerWindow: boundedInteger(environment.VETALERT_V2_MAX_SUBMISSIONS, 10, 2, 100),
    duplicateWindowHours: boundedInteger(environment.VETALERT_V2_DUPLICATE_WINDOW_HOURS, 24, 1, 168),
    minimumAggregateCell,
    recurringThreshold,
    emergingThreshold,
    sustainedThreshold,
    maximumAggregateRecords: boundedInteger(environment.VETALERT_V2_MAX_AGGREGATE_RECORDS, 5000, 100, 50000),
    integrityKeyVersion: safeKeyVersion(environment.VETALERT_V2_INTEGRITY_KEY_VERSION),
  } as const;
}
