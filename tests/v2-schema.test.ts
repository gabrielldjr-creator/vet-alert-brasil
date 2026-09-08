import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { V2_CONSENT_VERSION } from "../lib/v2/config";
import { ECONOMIC_OPERATIONAL_CONTEXT_VERSION, buildObservationDocument, validateObservationV2 } from "../lib/v2/schema";
import { TECHNICAL_NOTE_DICTIONARY_VERSION, TECHNICAL_NOTE_POLICY_VERSION, TECHNICAL_NOTE_SCHEMA_VERSION, validateTechnicalNoteText } from "../lib/v2/technical-note";

const valid = { territory: { stateCode: "SC", municipalityCode: "4205407" }, species: "bovinos", signalGroup: "respiratorio", observedPattern: "manifestacao_respiratoria_observada", animalCountBand: "2_5", attentionLevel: "observed", observationPeriod: "ultimos_7d", consentVersion: V2_CONSENT_VERSION } as const;

test("V2 accepts the canonical controlled input", () => assert.equal(validateObservationV2(valid).ok, true));

test("V2 accepts an optional versioned economic/operational context made only of controlled categories", () => {
  const result = validateObservationV2({
    ...valid,
    economicOperationalContext: {
      schemaVersion: ECONOMIC_OPERATIONAL_CONTEXT_VERSION,
      accessToVeterinaryCare: "delayed",
      accessToNecessaryInputsOrServices: "limited",
      abilityToImplementPreventiveMeasures: "not_limited",
      logisticalOrFinancialPressureAffectingCare: "observed",
    },
  });
  assert.equal(result.ok, true);
});

test("economic/operational context rejects invalid versions, values, empty modules and unknown fields", () => {
  const invalidContexts = [
    { schemaVersion: "economic-operational-context-v0", accessToVeterinaryCare: "adequate" },
    { schemaVersion: ECONOMIC_OPERATIONAL_CONTEXT_VERSION, accessToVeterinaryCare: "sometimes" },
    { schemaVersion: ECONOMIC_OPERATIONAL_CONTEXT_VERSION },
    { schemaVersion: ECONOMIC_OPERATIONAL_CONTEXT_VERSION, accessToVeterinaryCare: "adequate", comment: "texto livre" },
  ];
  for (const economicOperationalContext of invalidContexts) {
    assert.equal(validateObservationV2({ ...valid, economicOperationalContext }).ok, false, JSON.stringify(economicOperationalContext));
  }
});

test("V2 accepts a short fail-closed technical note from the versioned observational vocabulary", () => {
  const technicalNote = { schemaVersion: TECHNICAL_NOTE_SCHEMA_VERSION, text: "Animais apresentam dificuldade de locomoção no período recente." } as const;
  assert.equal(validateTechnicalNoteText(technicalNote.text).ok, true);
  assert.equal(validateObservationV2({ ...valid, technicalNote }).ok, true);
});

test("technical note rejects company, manufacturer, brand, commercial medicine, CRMV and identifiers", () => {
  const unsafeNotes = [
    "Animais apresentam alteração na empresa Zoetis.",
    "Animais apresentam resposta do fabricante Bayer.",
    "Animais apresentam melhora com a marca Bravecto.",
    "Animais apresentam resposta após Draxxin.",
    "Animais apresentam alteração. CRMV-SC 1234.",
    "Animais apresentam alteração e contato 48999999999.",
    "Animais apresentam alteração; contato vet@example.com.",
    "Animais apresentam alteração em https://example.com.",
    "Animais apresentam alteração na Fazenda Bela Vista.",
    "Animais apresentam termo totalmente desconhecido.",
  ];
  for (const text of unsafeNotes) {
    assert.equal(validateTechnicalNoteText(text).ok, false, text);
    assert.equal(validateObservationV2({ ...valid, technicalNote: { schemaVersion: TECHNICAL_NOTE_SCHEMA_VERSION, text } }).ok, false, text);
  }
});

test("technical note rejects forged versions, unknown fields and text without an observational anchor", () => {
  for (const technicalNote of [
    { schemaVersion: "technical-note-v0", text: "Animais apresentam dificuldade de locomoção no período recente." },
    { schemaVersion: TECHNICAL_NOTE_SCHEMA_VERSION, text: "Contexto de campo recente." },
    { schemaVersion: TECHNICAL_NOTE_SCHEMA_VERSION, text: "Animais apresentam dificuldade de locomoção no período recente.", matchedTerm: "forged" },
  ]) assert.equal(validateObservationV2({ ...valid, technicalNote }).ok, false, JSON.stringify(technicalNote));
});

test("V2 endpoint returns no validator details and contains no application logging of rejected request bodies", () => {
  const route = readFileSync("app/api/v2/observations/route.ts", "utf8");
  assert.doesNotMatch(route, /details\s*:/);
  assert.doesNotMatch(route, /console\.(?:log|warn|error)|request\s*body/i);
});

test("V2 application sources contain no application logger calls", () => {
  const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
  const source = ["app/api/v2", "app/v2", "app/sapsa/v2", "lib/v2"]
    .flatMap(sourceFiles)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.doesNotMatch(source, /console\.(?:log|warn|error)|\blogger\s*\./i);
});

test("V2 rejects identity, commercial, free-text and forged server fields recursively", () => {
  for (const field of ["name", "veterinarianName", "crmv", "cpf", "email", "phone", "producer", "farm", "property", "company", "empresa", "brand", "manufacturer", "address", "gps", "latitude", "longitude", "coordinates", "ip", "userAgent", "device", "productSold", "notes", "freeText", "uid", "authUid", "role", "organization", "submissionId", "receivedAt", "schemaVersion", "source", "sourceChannel", "qualityFlags", "integrity", "expiresAt", "income", "monetaryAmount", "debt", "creditScore", "financingStatus", "ranking", "riskScore", "insuranceRisk", "commercialDecision", "disease", "diagnosis", "suspeitaClinica", "outbreak", "notification", "causalConclusion", "officialGuidanceDecision", "reportableSuspicion", "notificationDecision"]) {
    const result = validateObservationV2({ ...valid, therapeuticContext: { [field]: "forged" } });
    assert.equal(result.ok, false, field);
  }
});

test("economic/operational context rejects prohibited financial, identity and free-text fields", () => {
  for (const field of ["income", "amount", "debt", "credit", "creditScore", "financing", "producer", "property", "company", "crmv", "gps", "address", "notes"]) {
    const result = validateObservationV2({
      ...valid,
      economicOperationalContext: {
        schemaVersion: ECONOMIC_OPERATIONAL_CONTEXT_VERSION,
        accessToVeterinaryCare: "adequate",
        [field]: "forged",
      },
    });
    assert.equal(result.ok, false, field);
  }
});

test("server metadata overrides no client value and contains no identity", () => {
  const parsed = validateObservationV2({ ...valid, technicalNote: { schemaVersion: TECHNICAL_NOTE_SCHEMA_VERSION, text: "Animais apresentam dificuldade de locomoção no período recente." } });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const document = buildObservationDocument(parsed.value, { submissionId: "server-id", receivedAt: "server-time", expiresAt: "expiry", duplicateSuspected: false, rateLimitExceeded: false });
  assert.equal(document.submissionId, "server-id");
  assert.equal(document.schemaVersion, 2);
  assert.equal(document.source, "veterinary");
  assert.equal(document.sourceChannel, "vetalert_v2");
  assert.deepEqual(document.technicalNote, {
    schemaVersion: TECHNICAL_NOTE_SCHEMA_VERSION,
    text: "Animais apresentam dificuldade de locomoção no período recente.",
    validationPolicyVersion: TECHNICAL_NOTE_POLICY_VERSION,
    dictionaryVersion: TECHNICAL_NOTE_DICTIONARY_VERSION,
  });
  const serialized = JSON.stringify(document).toLowerCase();
  for (const prohibited of ["crmv", "cpf", "email", "producer", "farm", "manufacturer", "productsold", '"uid"']) assert.equal(serialized.includes(prohibited), false, prohibited);
});
