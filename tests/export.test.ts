import assert from "node:assert/strict";
import test from "node:test";
import { buildSapsaSummary, type AggregateObservation } from "../lib/v2/aggregation";
import { renderSapsaCsv } from "../lib/v2/export";

test("institutional CSV contains only non-suppressed aggregate fields", () => {
  const records: AggregateObservation[] = Array.from({ length: 5 }, (_, index) => ({ receivedAt: new Date(`2026-09-0${index + 1}T12:34:56Z`), territory: { stateCode: "SC", municipalityCode: String(4200000 + index) }, species: "bovinos", signalGroup: "respiratorio", source: "vetalert_v2", qualityFlags: {} }));
  const csv = renderSapsaCsv(buildSapsaSummary(records, { minimumCell: 5, recurring: 2, emerging: 3, sustained: 5 }));
  assert.match(csv, /stateCode,species,signalGroup,observationCount/);
  assert.match(csv, /SC,bovinos,respiratorio,5/);
  for (const prohibited of ["submissionId", "municipalityCode", "receivedAt", "uid", "digest"]) assert.equal(csv.includes(prohibited), false, prohibited);
});

test("institutional CSV does not export suppressed small cells", () => {
  const records: AggregateObservation[] = [{ receivedAt: new Date("2026-09-01T12:34:56Z"), territory: { stateCode: "SC", municipalityCode: "4205407" }, species: "bovinos", signalGroup: "respiratorio", source: "vetalert_v2", qualityFlags: {} }];
  const csv = renderSapsaCsv(buildSapsaSummary(records, { minimumCell: 5, recurring: 2, emerging: 3, sustained: 5 }));
  assert.equal(csv.split("\r\n").length, 1);
});
