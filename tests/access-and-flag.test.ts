import assert from "node:assert/strict";
import test from "node:test";
import { getV2Policy, isV2Enabled } from "../lib/v2/config";
import { hasSapsaRole } from "../lib/v2/security";
import { AccessError, requireSapsaRole } from "../lib/v2/server-auth";

test("V2 feature flag is disabled by default and requires exact true", () => {
  assert.equal(isV2Enabled({}), false);
  assert.equal(isV2Enabled({ VETALERT_V2_ENABLED: "false" }), false);
  assert.equal(isV2Enabled({ VETALERT_V2_ENABLED: "true" }), true);
});

test("SAPSA permits only server-verified institutional roles", () => {
  assert.equal(hasSapsaRole({}), false);
  assert.equal(hasSapsaRole({ role: "vet" }), false);
  assert.equal(hasSapsaRole({ role: "sapsa_analyst" }), true);
  assert.equal(hasSapsaRole({ roles: ["vet", "admin"] }), true);
  assert.throws(() => requireSapsaRole({ uid: "anonymous" } as never), (error) => error instanceof AccessError && error.status === 403);
});

test("privacy thresholds are bounded", () => {
  assert.equal(getV2Policy({ VETALERT_V2_MINIMUM_CELL: "1" }).minimumAggregateCell, 5);
  assert.equal(getV2Policy({ VETALERT_V2_RETENTION_DAYS: "99999" }).observationRetentionDays, 365);
  const policy = getV2Policy({ VETALERT_V2_MINIMUM_CELL: "8", VETALERT_V2_RECURRING_THRESHOLD: "3", VETALERT_V2_EMERGING_THRESHOLD: "4", VETALERT_V2_SUSTAINED_THRESHOLD: "7" });
  assert.deepEqual([policy.recurringThreshold, policy.emergingThreshold, policy.sustainedThreshold], [8, 8, 8]);
  assert.equal(getV2Policy({ VETALERT_V2_INTEGRITY_KEY_VERSION: "invalid key" }).integrityKeyVersion, "integrity-key-v1");
});
