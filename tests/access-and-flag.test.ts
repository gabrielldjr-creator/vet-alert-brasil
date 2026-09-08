import assert from "node:assert/strict";
import test from "node:test";
import { getV2OfficialChannelUrl, getV2Policy, isV2Enabled } from "../lib/v2/config";
import { allowsObservationalSubmission, contextualOfficialGuidanceGroups, officialGuidanceCopy, requiresContextualOfficialGuidance } from "../lib/v2/official-guidance";
import { hasSapsaRole } from "../lib/v2/security";
import { AccessError, requireSapsaRole } from "../lib/v2/server-auth";

test("V2 feature flag is disabled by default and requires exact true", () => {
  assert.equal(isV2Enabled({}), false);
  assert.equal(isV2Enabled({ VETALERT_V2_ENABLED: "false" }), false);
  assert.equal(isV2Enabled({ VETALERT_V2_ENABLED: "true" }), true);
});

test("contextual official-channel guidance is limited to the configured observational groups", () => {
  assert.deepEqual([...contextualOfficialGuidanceGroups], ["respiratorio", "digestivo", "locomotor", "neurologico", "dermatologico", "reprodutivo", "populacional"]);
  for (const group of contextualOfficialGuidanceGroups) assert.equal(requiresContextualOfficialGuidance(group), true, group);
  assert.equal(officialGuidanceCopy.title, "Como este registro funciona");
  assert.equal(officialGuidanceCopy.notice, "O VetAlert registra observações independentes para fins de inteligência operacional agregada. Este registro não é uma notificação oficial e não é encaminhado automaticamente ao MAPA, ao e-SISBRAVET ou a outras instituições. O formulário não solicita os dados necessários para uma notificação oficial. Se, considerando o contexto clínico, houver suspeita de doença ou síndrome de notificação obrigatória, o profissional deve comunicar também e de forma independente ao Serviço Veterinário Oficial ou ao e-SISBRAVET. O registro observacional no VetAlert não substitui essa obrigação.");
  assert.equal(allowsObservationalSubmission("respiratorio", null), false);
  assert.equal(allowsObservationalSubmission("respiratorio", "official_channel_also"), true);
  assert.equal(allowsObservationalSubmission("respiratorio", "observational"), true);
});

test("official channel link is optional and restricted to approved HTTPS government hosts", () => {
  assert.equal(getV2OfficialChannelUrl({}), "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html");
  assert.equal(getV2OfficialChannelUrl({ VETALERT_V2_OFFICIAL_CHANNEL_URL: "" }), null);
  assert.equal(getV2OfficialChannelUrl({ VETALERT_V2_OFFICIAL_CHANNEL_URL: "http://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html" }), null);
  assert.equal(getV2OfficialChannelUrl({ VETALERT_V2_OFFICIAL_CHANNEL_URL: "https://example.com/notificacao" }), null);
  assert.equal(
    getV2OfficialChannelUrl({ VETALERT_V2_OFFICIAL_CHANNEL_URL: "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html" }),
    "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html",
  );
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
