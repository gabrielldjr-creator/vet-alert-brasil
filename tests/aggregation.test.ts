import assert from "node:assert/strict";
import test from "node:test";
import { buildSapsaSummary, type AggregateObservation } from "../lib/v2/aggregation";

const thresholds = { minimumCell: 3, recurring: 2, emerging: 3, sustained: 5 };
const record = (day: number, municipalityCode: string, flags?: AggregateObservation["qualityFlags"]): AggregateObservation => ({ receivedAt: new Date(Date.UTC(2026, 7, day)), territory: { stateCode: "SC", municipalityCode }, species: "bovinos", signalGroup: "respiratorio", source: "vetalert_v2", qualityFlags: flags });

test("small cells are suppressed", () => {
  const summary = buildSapsaSummary([record(1, "4205407"), record(2, "4205407")], thresholds);
  assert.equal(summary.cells.length, 0);
  assert.equal(summary.acceptedObservations, null);
  assert.equal(summary.suppressedCellCount, 1);
});

test("compatible distributed records yield explainable emerging convergence", () => {
  const summary = buildSapsaSummary([record(1, "4205407"), record(2, "4209102"), record(3, "4205407")], thresholds);
  assert.equal(summary.cells[0].classification, "emerging_territorial_convergence");
  assert.equal(summary.cells[0].explanation.compatibleRecords, 3);
  assert.equal(summary.cells[0].explanation.municipalities, 2);
});

test("duplicate/rate-suspicious records do not create convergence and are never deleted", () => {
  const records = [record(1, "4205407"), record(2, "4209102", { duplicateSuspected: true }), record(3, "4209102", { rateLimitExceeded: true })];
  const summary = buildSapsaSummary(records, thresholds);
  assert.equal(summary.cells.length, 0);
  assert.equal(summary.suspiciousRecordsExcluded, 2);
  assert.equal(records.length, 3);
});

test("different syndromes do not converge", () => {
  const records = [record(1, "4205407"), { ...record(2, "4209102"), signalGroup: "digestivo" }, { ...record(3, "4205407"), signalGroup: "neurologico" }];
  assert.equal(buildSapsaSummary(records, thresholds).cells.length, 0);
});

test("explainability reports suspicious exclusions for each cell, not a global total", () => {
  const records = [
    record(1, "4205407"), record(2, "4209102"), record(3, "4205407"),
    { ...record(4, "4205407", { duplicateSuspected: true }), signalGroup: "digestivo" },
  ];
  const summary = buildSapsaSummary(records, thresholds);
  assert.equal(summary.cells[0].explanation.suspiciousRecordsExcluded, 0);
  assert.equal(summary.suspiciousRecordsExcluded, 1);
  assert.equal(summary.methodology.qualityPolicy, "exclude-duplicate-or-rate-flag-v1");
});
