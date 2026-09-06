import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { adaptLegacyAlertInMemory } from "../lib/v2/legacy-alert-adapter";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test("legacy adapter returns only the explicit analytical allowlist without mutating raw data", () => {
  const raw = {
    createdAt: { seconds: 1_757_030_400 }, state: "sc", cityCode: 4205407, city: "Florianópolis",
    species: "Bovinos", alertType: "Síndrome respiratória", severity: "Atenção", herdCount: "2 a 5", source: "pilot",
    uid: "secret-uid", name: "Pessoa", crmv: "123", productSold: "Marca", notes: "texto livre",
    context: { notes: "detalhe identificável", retailSignal: { productSold: "Produto" } },
  };
  const before = structuredClone(raw);
  const adapted = adaptLegacyAlertInMemory(raw);
  assert.deepEqual(raw, before);
  assert.deepEqual(adapted, {
    adapterVersion: "legacy-alerts-allowlist-v1", sourceChannel: "legacy_veterinary", stateCode: "SC",
    municipalityCode: "4205407", species: "bovinos", signalGroup: "respiratorio", attentionBand: "observed",
    animalCountBand: "2_5", timeBucket: "2025-W36",
  });
  const serialized = JSON.stringify(adapted);
  for (const forbidden of ["secret-uid", "Pessoa", "123", "Marca", "texto livre", "Florianópolis", "context", "notes", "productSold"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("legacy adapter handles agro source without returning retail details", () => {
  const adapted = adaptLegacyAlertInMemory({
    state: "SC", cityCode: "4205407", species: "Bovinos", alertType: "Sintoma respiratório",
    severity: "Não classificado", herdCount: "Não informado", source: "agro_retail",
    context: { retailSignal: { productSold: "Produto", veterinaryPrescription: "Sim" } },
  });
  assert.deepEqual(adapted, {
    adapterVersion: "legacy-alerts-allowlist-v1", sourceChannel: "legacy_agro_retail", stateCode: "SC",
    municipalityCode: "4205407", species: "bovinos", signalGroup: "respiratorio",
    attentionBand: "unclassified", animalCountBand: "unknown",
  });
});

test("legacy adapter rejects unsupported, malformed, or free-text signal categories", () => {
  assert.equal(adaptLegacyAlertInMemory(null), null);
  assert.equal(adaptLegacyAlertInMemory({ state: "SC", species: "Bovinos", alertType: "Diagnóstico inventado" }), null);
  assert.equal(adaptLegacyAlertInMemory({ state: "Santa Catarina", species: "Bovinos", alertType: "Síndrome respiratória" }), null);
  assert.equal(adaptLegacyAlertInMemory({ state: "SC", species: "espécie livre", alertType: "Síndrome respiratória" }), null);
});

test("legacy adapter stays server-only and unwired from application clients", () => {
  const adapterSource = readFileSync("lib/v2/legacy-alert-adapter.ts", "utf8");
  assert.doesNotMatch(adapterSource, /["']use client["']/);
  assert.doesNotMatch(adapterSource, /from\s+["']firebase/);
  assert.doesNotMatch(adapterSource, /addDoc|setDoc|updateDoc|deleteDoc|collection\s*\(/);

  for (const path of sourceFiles("app")) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /legacy-alert-adapter/, path);
  }
});
