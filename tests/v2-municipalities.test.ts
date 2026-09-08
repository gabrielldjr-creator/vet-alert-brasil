import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOfficialMunicipalitiesByState,
  getOfficialMunicipalityCatalogStats,
  IBGE_MUNICIPALITY_CATALOG_VERSION,
  isOfficialMunicipalityPair,
} from "../lib/v2/municipalities";
import { V2_CONSENT_VERSION } from "../lib/v2/config";
import { validateObservationV2 } from "../lib/v2/schema";
import catalog from "../lib/v2/data/ibge-municipalities-2025.json";

const valid = { territory: { stateCode: "SC", municipalityCode: "4205407" }, species: "bovinos", signalGroup: "respiratorio", observedPattern: "manifestacao_respiratoria_observada", animalCountBand: "2_5", attentionLevel: "observed", observationPeriod: "ultimos_7d", consentVersion: V2_CONSENT_VERSION } as const;

const officialStatePrefixes: Record<string, string> = {
  RO: "11", AC: "12", AM: "13", RR: "14", PA: "15", AP: "16", TO: "17",
  MA: "21", PI: "22", CE: "23", RN: "24", PB: "25", PE: "26", AL: "27", SE: "28", BA: "29",
  MG: "31", ES: "32", RJ: "33", SP: "35", PR: "41", SC: "42", RS: "43",
  MS: "50", MT: "51", GO: "52", DF: "53",
};

test("versioned static IBGE catalog is complete across 27 UFs and includes the current official municipality", () => {
  assert.equal(IBGE_MUNICIPALITY_CATALOG_VERSION, "ibge-municipalities-2025");
  assert.deepEqual(getOfficialMunicipalityCatalogStats(), { municipalityCount: 5571, stateCount: 27 });
  assert.equal(getOfficialMunicipalitiesByState("MT").some((item) => item.code === 5101837 && item.name === "Boa Esperança do Norte"), true);
});

test("all 5,571 municipality codes are unique and every name and UF mapping is valid", () => {
  const municipalities = catalog.municipalities;
  assert.equal(municipalities.length, 5571);
  assert.equal(new Set(municipalities.map((municipality) => municipality.code)).size, 5571);
  assert.deepEqual(new Set(municipalities.map((municipality) => municipality.stateCode)), new Set(Object.keys(officialStatePrefixes)));

  for (const municipality of municipalities) {
    assert.equal(Number.isInteger(municipality.code), true, JSON.stringify(municipality));
    assert.match(String(municipality.code), /^\d{7}$/, JSON.stringify(municipality));
    assert.equal(municipality.name.length > 0 && municipality.name === municipality.name.trim(), true, JSON.stringify(municipality));
    assert.equal(String(municipality.code).startsWith(officialStatePrefixes[municipality.stateCode] ?? "invalid"), true, JSON.stringify(municipality));
    assert.equal(isOfficialMunicipalityPair(municipality.stateCode, String(municipality.code)), true, JSON.stringify(municipality));
  }
});

test("municipality is mandatory and the server catalog rejects incompatible UF plus municipality", () => {
  assert.equal(validateObservationV2({ ...valid, territory: { stateCode: "SC" } }).ok, false);
  assert.equal(isOfficialMunicipalityPair("SC", "4205407"), true);
  assert.equal(isOfficialMunicipalityPair("PR", "4205407"), false);
  assert.equal(isOfficialMunicipalityPair("SC", "9999999"), false);
});

test("V2 territory route uses only the bundled catalog and contains no runtime IBGE request", () => {
  const route = readFileSync("app/api/v2/territories/route.ts", "utf8");
  assert.doesNotMatch(route, /fetch\s*\(|servicodados\.ibge\.gov\.br/);
});

test("V2 territory route returns the local state subset with its catalog version", async () => {
  const previous = process.env.VETALERT_V2_ENABLED;
  process.env.VETALERT_V2_ENABLED = "true";
  try {
    const { GET } = await import("../app/api/v2/territories/route");
    const response = await GET(new Request("http://localhost/api/v2/territories?state=SC"));
    const municipalities = await response.json() as Array<{ code: number; name: string }>;
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-ibge-catalog-version"), "ibge-municipalities-2025");
    assert.equal(municipalities.some((item) => item.code === 4205407 && item.name === "Florianópolis"), true);
  } finally {
    if (previous === undefined) delete process.env.VETALERT_V2_ENABLED;
    else process.env.VETALERT_V2_ENABLED = previous;
  }
});
