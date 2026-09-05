import assert from "node:assert/strict";
import test from "node:test";
import { V2_CONSENT_VERSION } from "../lib/v2/config";
import { buildObservationDocument, validateObservationV2 } from "../lib/v2/schema";

const valid = { territory: { stateCode: "SC", municipalityCode: "4205407" }, species: "bovinos", signalGroup: "respiratorio", observedPattern: "manifestacao_respiratoria_observada", animalCountBand: "2_5", attentionLevel: "observed", observationPeriod: "ultimos_7d", consentVersion: V2_CONSENT_VERSION } as const;

test("V2 accepts the canonical controlled input", () => assert.equal(validateObservationV2(valid).ok, true));

test("V2 rejects identity, commercial, free-text and forged server fields recursively", () => {
  for (const field of ["name", "crmv", "cpf", "email", "producer", "farm", "brand", "manufacturer", "productSold", "notes", "uid", "role", "submissionId", "receivedAt", "schemaVersion", "source", "integrity"]) {
    const result = validateObservationV2({ ...valid, therapeuticContext: { [field]: "forged" } });
    assert.equal(result.ok, false, field);
  }
});

test("server metadata overrides no client value and contains no identity", () => {
  const parsed = validateObservationV2(valid);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const document = buildObservationDocument(parsed.value, { submissionId: "server-id", receivedAt: "server-time", expiresAt: "expiry", duplicateSuspected: false, rateLimitExceeded: false });
  assert.equal(document.submissionId, "server-id");
  assert.equal(document.schemaVersion, 2);
  assert.equal(document.source, "veterinary");
  assert.equal(document.sourceChannel, "vetalert_v2");
  const serialized = JSON.stringify(document).toLowerCase();
  for (const prohibited of ["crmv", "cpf", "email", "producer", "farm", "manufacturer", "productsold", '"uid"']) assert.equal(serialized.includes(prohibited), false, prohibited);
});
