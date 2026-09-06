import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

process.env.GCLOUD_PROJECT = "demo-vetalert-v2";
process.env.FIREBASE_PROJECT_ID = "demo-vetalert-v2";
process.env.VETALERT_V2_ENABLED = "true";
process.env.VETALERT_V2_INTEGRITY_SECRET = "emulator-only-secret-with-at-least-32-chars";
process.env.VETALERT_V2_MAX_SUBMISSIONS = "2";
process.env.VETALERT_V2_MINIMUM_CELL = "5";
process.env.VETALERT_V2_INTEGRITY_KEY_VERSION = "emulator-key-2026-09";

const projectId = "demo-vetalert-v2";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

async function exchangeCustomToken(customToken: string) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=emulator-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const responseText = await response.text();
  assert.equal(response.status, 200, responseText);
  return JSON.parse(responseText) as { idToken: string; localId: string };
}

test("Firebase Emulator validates legacy, V2, RBAC, integrity, aggregation and export boundaries", async (t) => {
  const rules = readFileSync("firestore.rules", "utf8");
  assert.doesNotMatch(rules, /allow\s+read\s*,\s*write/);
  const rulesEnvironment = await initializeTestEnvironment({ projectId, firestore: { host: "127.0.0.1", port: 8080, rules } });
  await rulesEnvironment.clearFirestore();

  const { getAdminAuth } = await import("../../lib/v2/firebase-admin");
  const { getAdminFirestore } = await import("../../lib/v2/firebase-admin");
  const { POST: submitObservation } = await import("../../app/api/v2/observations/route");
  const { GET: loadSummary } = await import("../../app/api/v2/sapsa/summary/route");
  const { GET: exportSummary } = await import("../../app/api/v2/sapsa/export/route");
  const { V2_CONSENT_VERSION } = await import("../../lib/v2/config");

  const createActor = async (role?: string) => {
    const user = await getAdminAuth().createUser({});
    if (role) await getAdminAuth().setCustomUserClaims(user.uid, { role });
    const token = await exchangeCustomToken(await getAdminAuth().createCustomToken(user.uid));
    return { uid: user.uid, token: token.idToken, role };
  };
  const veterinarian = await createActor("veterinarian");
  const analyst = await createActor("sapsa_analyst");
  const administrator = await createActor("admin");

  await t.test("legacy permissions are unchanged and V2 collections are client-denied for every role", async () => {
    const unauthenticated = rulesEnvironment.unauthenticatedContext().firestore();
    const vetClient = rulesEnvironment.authenticatedContext(veterinarian.uid, { role: "veterinarian" }).firestore();
    const analystClient = rulesEnvironment.authenticatedContext(analyst.uid, { role: "sapsa_analyst" }).firestore();
    const adminClient = rulesEnvironment.authenticatedContext(administrator.uid, { role: "admin" }).firestore();
    await assertFails(getDoc(doc(unauthenticated, "alerts", "missing")));
    await assertFails(setDoc(doc(unauthenticated, "alerts", "unauthorized"), { species: "bovinos" }));

    const legacyPayload = { species: "bovinos", alertType: "sinais_respiratorios", herdCount: "2_5", state: "SC", cityCode: "4205407", severity: "moderado", details: { herdCountLabel: "2_5", country: "Brasil" }, source: "pilot" };
    await assertSucceeds(setDoc(doc(vetClient, "alerts", "legacy-contract-e2e"), legacyPayload));
    const persistedLegacy = (await getAdminFirestore().collection("alerts").doc("legacy-contract-e2e").get()).data();
    assert.deepEqual(persistedLegacy, legacyPayload);
    await assertSucceeds(getDoc(doc(vetClient, "alerts", "legacy-contract-e2e")));
    await assertFails(updateDoc(doc(vetClient, "alerts", "legacy-contract-e2e"), { severity: "alto" }));
    await assertFails(deleteDoc(doc(vetClient, "alerts", "legacy-contract-e2e")));

    for (const client of [unauthenticated, vetClient, analystClient, adminClient]) {
      for (const collection of ["veterinaryObservationsV2", "submissionIntegrityV2", "auditLogsV2"]) {
        await assertFails(getDoc(doc(client, collection, "blocked")));
        await assertFails(setDoc(doc(client, collection, "blocked"), { forged: true }));
      }
    }
  });

  const valid = (municipalityCode: string, overrides: Record<string, unknown> = {}) => ({ territory: { stateCode: "SC", municipalityCode }, species: "bovinos", signalGroup: "respiratorio", observedPattern: "manifestacao_respiratoria_observada", animalCountBand: "2_5", attentionLevel: "observed", observationPeriod: "ultimos_7d", consentVersion: V2_CONSENT_VERSION, ...overrides });
  const post = (token: string | undefined, body: unknown) => submitObservation(new Request("http://localhost/api/v2/observations", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }));

  await t.test("authentication and strict server validation reject unauthorized or unsafe requests", async () => {
    assert.equal((await post(undefined, valid("4205407"))).status, 401);
    assert.equal((await post(veterinarian.token, { species: "bovinos" })).status, 400);
    for (const prohibited of [{ name: "Pessoa" }, { crmv: "123" }, { productSold: "Produto" }, { notes: "texto livre" }, { submissionId: "forged" }]) {
      const response = await post(veterinarian.token, { ...valid("4205407"), ...prohibited });
      assert.equal(response.status, 400, JSON.stringify(prohibited));
    }
    const malformed = await submitObservation(new Request("http://localhost/api/v2/observations", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${veterinarian.token}` }, body: "{" }));
    assert.equal(malformed.status, 400);
    assert.equal(malformed.headers.get("cache-control"), "private, no-store");
    const wrongContentType = await submitObservation(new Request("http://localhost/api/v2/observations", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" }));
    assert.equal(wrongContentType.status, 415);
  });

  await t.test("valid submission receives immutable server metadata; duplicates and rate bursts are preserved and flagged", async () => {
    const first = await post(veterinarian.token, valid("4205407"));
    const firstText = await first.text();
    assert.equal(first.status, 201, firstText);
    const firstResult = JSON.parse(firstText) as { submissionId: string; accepted: boolean; reviewRequired: boolean };
    assert.equal(firstResult.accepted, true);
    assert.equal(firstResult.reviewRequired, false);
    const observation = (await getAdminFirestore().collection("veterinaryObservationsV2").doc(firstResult.submissionId).get()).data()!;
    assert.equal(observation.submissionId, firstResult.submissionId);
    assert.equal(observation.schemaVersion, 2);
    assert.equal(observation.sourceChannel, "vetalert_v2");
    assert.equal(observation.integrityStatus, "accepted");
    for (const prohibited of ["uid", "name", "crmv", "email", "ip", "userAgent"]) assert.equal(Object.hasOwn(observation, prohibited), false, prohibited);

    const integrity = (await getAdminFirestore().collection("submissionIntegrityV2").doc(firstResult.submissionId).get()).data()!;
    assert.match(integrity.originDigest, /^[a-f0-9]{64}$/);
    assert.notEqual(integrity.originDigest, veterinarian.uid);
    assert.match(integrity.fingerprint, /^[a-f0-9]{64}$/);
    assert.equal(integrity.integrityKeyVersion, "emulator-key-2026-09");
    assert.equal(integrity.policyVersion, "integrity-v2-2");

    const duplicate = await post(veterinarian.token, valid("4205407"));
    const duplicateResult = await duplicate.json() as { submissionId: string; reviewRequired: boolean };
    assert.equal(duplicate.status, 201);
    assert.equal(duplicateResult.reviewRequired, true);
    const duplicateDoc = (await getAdminFirestore().collection("submissionIntegrityV2").doc(duplicateResult.submissionId).get()).data()!;
    assert.equal(duplicateDoc.duplicateSuspected, true);

    const burst = await post(veterinarian.token, valid("4209102", { animalCountBand: "6_20" }));
    const burstResult = await burst.json() as { submissionId: string; reviewRequired: boolean };
    assert.equal(burst.status, 201);
    assert.equal(burstResult.reviewRequired, true);
    assert.equal((await getAdminFirestore().collection("submissionIntegrityV2").doc(burstResult.submissionId).get()).data()!.rateLimitExceeded, true);
    assert.equal((await getAdminFirestore().collection("veterinaryObservationsV2").doc(burstResult.submissionId).get()).exists, true);
  });

  await t.test("a missing HMAC secret fails closed without persisting an observation", async () => {
    const before = (await getAdminFirestore().collection("veterinaryObservationsV2").get()).size;
    const saved = process.env.VETALERT_V2_INTEGRITY_SECRET;
    process.env.VETALERT_V2_INTEGRITY_SECRET = "short";
    const response = await post((await createActor("veterinarian")).token, valid("4216602", { attentionLevel: "elevated" }));
    process.env.VETALERT_V2_INTEGRITY_SECRET = saved;
    assert.equal(response.status, 503);
    assert.equal((await getAdminFirestore().collection("veterinaryObservationsV2").get()).size, before);
  });

  await t.test("SAPSA roles receive aggregate-only output; small cells stay suppressed", async () => {
    const variations = [
      ["4205407", { animalCountBand: "1" }], ["4209102", { attentionLevel: "elevated" }],
      ["4216602", { observationPeriod: "ultimas_24h" }], ["4204202", { animalCountBand: "mais_20" }],
    ] as const;
    for (const [municipality, override] of variations) {
      const actor = await createActor("veterinarian");
      assert.equal((await post(actor.token, valid(municipality, override))).status, 201);
    }
    for (const municipality of ["4205407", "4209102"]) {
      const actor = await createActor("veterinarian");
      assert.equal((await post(actor.token, valid(municipality, { species: "equinos", signalGroup: "digestivo", observedPattern: "manifestacao_digestiva_observada" }))).status, 201);
    }

    const noToken = await loadSummary(new Request("http://localhost/api/v2/sapsa/summary"));
    const vetDenied = await loadSummary(new Request("http://localhost/api/v2/sapsa/summary", { headers: { Authorization: `Bearer ${veterinarian.token}` } }));
    assert.equal(noToken.status, 401);
    assert.equal(vetDenied.status, 403);
    for (const actor of [analyst, administrator]) {
      const response = await loadSummary(new Request("http://localhost/api/v2/sapsa/summary", { headers: { Authorization: `Bearer ${actor.token}` } }));
      assert.equal(response.status, 200);
      const text = await response.text();
      assert.doesNotMatch(text, /submissionId|originDigest|fingerprint|receivedAt|municipalityCode|legacy-contract-e2e/);
      const summary = JSON.parse(text) as { cells: Array<{ species: string; observationCount: number; sourceChannelCount: number }>; suppressedCellCount: number; methodology: { version: string; scientificallyValidated: boolean } };
      assert.equal(summary.cells.some((cell) => cell.species === "bovinos" && cell.observationCount >= 5), true);
      assert.equal(summary.cells.every((cell) => cell.sourceChannelCount >= 1), true);
      assert.equal(summary.cells.some((cell) => cell.species === "equinos"), false);
      assert.ok(summary.suppressedCellCount >= 1);
      assert.equal(summary.methodology.version, "sapsa-v2-exploratory-2");
      assert.equal(summary.methodology.scientificallyValidated, false);
    }
  });

  await t.test("CSV export enforces roles, contains aggregates only, and writes an audit event", async () => {
    const endpoint = "http://localhost/api/v2/sapsa/export";
    assert.equal((await exportSummary(new Request(endpoint))).status, 401);
    assert.equal((await exportSummary(new Request(endpoint, { headers: { Authorization: `Bearer ${veterinarian.token}` } }))).status, 403);
    for (const actor of [analyst, administrator]) {
      const response = await exportSummary(new Request(endpoint, { headers: { Authorization: `Bearer ${actor.token}` } }));
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /text\/csv/);
      const csv = await response.text();
      assert.match(csv, /stateCode,species,signalGroup,observationCount/);
      assert.doesNotMatch(csv, /submissionId|municipalityCode|receivedAt|uid|Digest|fingerprint/);
    }
    const exports = await getAdminFirestore().collection("auditLogsV2").where("event", "==", "aggregate.exported").get();
    assert.equal(exports.size, 2);
    for (const entry of exports.docs) {
      assert.match(entry.get("actorDigest"), /^[a-f0-9]{64}$/);
      assert.equal(entry.get("integrityKeyVersion"), "emulator-key-2026-09");
      assert.equal(entry.get("rowCount") >= 1, true);
    }
  });

  await rulesEnvironment.cleanup();
});
