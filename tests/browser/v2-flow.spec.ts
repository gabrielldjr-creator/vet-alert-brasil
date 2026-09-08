import { expect, test, type Page } from "@playwright/test";

const contextualPatterns = [
  "manifestacao_respiratoria_observada",
  "manifestacao_digestiva_observada",
  "alteracao_locomotora_observada",
  "alteracao_neurologica_observada",
  "alteracao_dermatologica_observada",
  "alteracao_reprodutiva_observada",
  "aumento_percebido_ocorrencias",
  "mudanca_observada_periodo",
] as const;

const officialNotice = "O VetAlert registra observações independentes para fins de inteligência operacional agregada. Este registro não é uma notificação oficial e não é encaminhado automaticamente ao MAPA, ao e-SISBRAVET ou a outras instituições. O formulário não solicita os dados necessários para uma notificação oficial. Se, considerando o contexto clínico, houver suspeita de doença ou síndrome de notificação obrigatória, o profissional deve comunicar também e de forma independente ao Serviço Veterinário Oficial ou ao e-SISBRAVET. O registro observacional no VetAlert não substitui essa obrigação.";

async function mockTerritories(page: Page) {
  await page.route("**/api/v2/territories?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ code: 4205407, name: "Florianópolis" }]),
  }));
}

async function reachObservationForm(page: Page) {
  await mockTerritories(page);
  await page.goto("/v2/onboarding");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Território de atuação (UF)").selectOption("SC");
  await page.getByLabel("Espécie ou grupo de produção").selectOption("bovinos");
  await page.getByRole("button", { name: "Continuar para o registro" }).click();
  await expect(page.getByText("Etapa 1 de 3")).toBeVisible();
  await expect(page.getByText("Etapa 1 de 3").locator("..")).toBeFocused();
}

async function selectContextualPattern(page: Page, value: typeof contextualPatterns[number]) {
  await page.getByLabel("Manifestação observada").selectOption(value);
  const dialog = page.getByRole("dialog", { name: "Como este registro funciona" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Não — continuar registro observacional" }).click();
  await expect(dialog).toBeHidden();
}

async function reachReview(page: Page) {
  await reachObservationForm(page);
  await selectContextualPattern(page, "manifestacao_respiratoria_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Etapa 2 de 3")).toBeVisible();
  await page.getByLabel("Município", { exact: true }).selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Etapa 3 de 3")).toBeVisible();
}

test("contextual decision covers every configured observational category while the official link remains optional", async ({ page }) => {
  let officialChannelRequests = 0;
  page.on("request", (request) => {
    if (request.url().startsWith("https://sistemasweb.agricultura.gov.br/")) officialChannelRequests += 1;
  });
  await reachObservationForm(page);
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");

  for (const pattern of contextualPatterns) {
    await page.getByLabel("Manifestação observada").selectOption(pattern);
    const dialog = page.getByRole("dialog", { name: "Como este registro funciona" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(officialNotice, { exact: true })).toBeVisible();
    await expect(dialog.getByText("Este registro é apenas descritivo e observacional. Não é diagnóstico, notificação oficial nem sistema oficial de alerta.", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Considerando seu julgamento profissional, esta observação indica suspeita de doença ou síndrome de notificação obrigatória?", { exact: true })).toBeVisible();
    const officialLink = dialog.getByRole("link", { name: "Abrir canal oficial" });
    await expect(officialLink).toHaveAttribute("href", "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html");
    await expect(officialLink).toHaveAttribute("target", "_blank");
    await expect(officialLink).toHaveAttribute("rel", /noopener/);
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
    const acknowledge = dialog.getByRole("button", { name: "Não — continuar registro observacional" });
    await expect(dialog.getByRole("heading", { name: "Como este registro funciona" })).toBeFocused();
    await acknowledge.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel("Manifestação observada")).toBeFocused();
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
    expect(officialChannelRequests).toBe(0);
  }
});

test("the yes path offers the official channel and still saves only the descriptive V2 observation", async ({ page }) => {
  let observationRequests = 0;
  let officialChannelRequests = 0;
  let submittedPayload: Record<string, unknown> | undefined;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v2/observations")) {
      observationRequests += 1;
      submittedPayload = request.postDataJSON() as Record<string, unknown>;
    }
    if (request.url().startsWith("https://sistemasweb.agricultura.gov.br/")) officialChannelRequests += 1;
  });
  await reachObservationForm(page);
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByLabel("Manifestação observada").selectOption("alteracao_neurologica_observada");
  const dialog = page.getByRole("dialog", { name: "Como este registro funciona" });
  await dialog.getByRole("button", { name: "Sim — comunicar também ao canal oficial" }).click();
  await expect(dialog.getByText("Comunicação oficial independente", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Use o canal oficial aplicável. O registro descritivo no VetAlert continua disponível e não será encaminhado automaticamente a nenhuma instituição.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Abrir canal oficial" })).toBeVisible();
  expect(observationRequests).toBe(0);
  expect(officialChannelRequests).toBe(0);
  await dialog.getByRole("button", { name: "Continuar registro no VetAlert" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Município", { exact: true }).selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Enviar observação" }).click();
  await expect(page).toHaveURL(/\/v2\/confirmacao$/, { timeout: 15_000 });
  expect(observationRequests).toBe(1);
  expect(officialChannelRequests).toBe(0);
  expect(submittedPayload).toEqual({
    territory: { stateCode: "SC", municipalityCode: "4205407" },
    species: "bovinos",
    signalGroup: "neurologico",
    observedPattern: "alteracao_neurologica_observada",
    animalCountBand: "2_5",
    attentionLevel: "observed",
    observationPeriod: "ultimos_7d",
    consentVersion: "vetalert-v2-2026-09-05",
  });
  for (const prohibitedMetadata of ["officialGuidanceDecision", "reportableSuspicion", "notificationDecision", "disease", "diagnosis", "suspicion", "notification"]) {
    expect(submittedPayload).not.toHaveProperty(prohibitedMetadata);
  }
});

test("optional economic/operational context submits only its versioned controlled categories", async ({ page }) => {
  await reachObservationForm(page);
  await selectContextualPattern(page, "manifestacao_digestiva_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Município", { exact: true }).selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByText("Contexto econômico e operacional (opcional) · versão 1", { exact: true }).click();
  await page.getByLabel("Acesso ao atendimento veterinário").selectOption("delayed");
  await page.getByLabel("Acesso aos insumos ou serviços necessários").selectOption("limited");
  await page.getByLabel("Capacidade de implementar medidas preventivas").selectOption("not_limited");
  await page.getByLabel("Pressão logística ou financeira afetando o cuidado").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText(/Contexto econômico e operacional opcional incluído/)).toBeVisible();

  let submittedPayload: Record<string, unknown> | undefined;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v2/observations")) submittedPayload = request.postDataJSON() as Record<string, unknown>;
  });
  await page.getByRole("button", { name: "Enviar observação" }).click();
  await expect(page).toHaveURL(/\/v2\/confirmacao$/, { timeout: 15_000 });
  expect(submittedPayload).toHaveProperty("economicOperationalContext", {
    schemaVersion: "economic-operational-context-v1",
    accessToVeterinaryCare: "delayed",
    accessToNecessaryInputsOrServices: "limited",
    abilityToImplementPreventiveMeasures: "not_limited",
    logisticalOrFinancialPressureAffectingCare: "observed",
  });
  const serialized = JSON.stringify(submittedPayload);
  expect(serialized).not.toMatch(/income|amount|debt|credit|financing|producer|property|company|crmv|gps|address|notes|diagnosis|suspectedDisease|reportable|outbreak|notification/i);
});

test("optional technical note is fail-closed in the client and submits only the versioned safe module", async ({ page }) => {
  const externalAnalysisRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") externalAnalysisRequests.push(request.url());
  });
  await reachObservationForm(page);
  await selectContextualPattern(page, "manifestacao_digestiva_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Município", { exact: true }).selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByText("Nota técnica protegida (opcional) · versão 1", { exact: true }).click();

  const note = page.getByLabel("Nota técnica (opcional)");
  const noteError = page.getByRole("alert").filter({ hasText: "A nota técnica não pode ser enviada" });
  for (const unsafeText of [
    "Animais apresentam alteração na empresa Zoetis.",
    "Animais apresentam resposta do fabricante Bayer.",
    "Animais apresentam melhora com a marca Bravecto.",
    "Animais apresentam resposta após Draxxin.",
    "Animais apresentam alteração. CRMV-SC 1234.",
    "Animais apresentam alteração e contato 48999999999.",
  ]) {
    await note.fill(unsafeText);
    await expect(noteError).toContainText("reformule usando somente linguagem observacional genérica");
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
  }

  await note.fill("Animais apresentam dificuldade de locomoção no período recente.");
  await expect(noteError).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText(/Nota técnica opcional validada no schema technical-note-v1/)).toBeVisible();

  let submittedPayload: Record<string, unknown> | undefined;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v2/observations")) submittedPayload = request.postDataJSON() as Record<string, unknown>;
  });
  await page.getByRole("button", { name: "Enviar observação" }).click();
  await expect(page).toHaveURL(/\/v2\/confirmacao$/, { timeout: 15_000 });
  expect(submittedPayload).toHaveProperty("technicalNote", {
    schemaVersion: "technical-note-v1",
    text: "Animais apresentam dificuldade de locomoção no período recente.",
  });
  expect(submittedPayload).not.toHaveProperty("technicalNote.validationPolicyVersion");
  expect(submittedPayload).not.toHaveProperty("technicalNote.dictionaryVersion");
  expect(externalAnalysisRequests).toEqual([]);
});

test("mobile onboarding, keyboard activation, in-app back navigation and valid single submission", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockTerritories(page);
  await page.goto("/v2/onboarding");
  await expect(page.getByText("Inteligência de campo independente e agregada para decisões operacionais.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Como funciona" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/recebe uma observação estruturada/)).toBeVisible();
  await expect(page.getByText("Os resultados agregados podem apoiar decisões operacionais de seguradoras, empresas de saúde animal, distribuidores, bancos e produtores. Não constituem diagnóstico, notificação oficial ou sistema oficial de alerta.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Território de atuação (UF)").selectOption("SC");
  await page.getByLabel("Espécie ou grupo de produção").selectOption("bovinos");
  await page.getByRole("button", { name: "Continuar para o registro" }).click();
  await selectContextualPattern(page, "manifestacao_respiratoria_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Município", { exact: true }).selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByLabel("Manifestação observada")).toHaveValue("manifestacao_respiratoria_observada");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  let submissions = 0;
  let submittedPayload: Record<string, unknown> | undefined;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v2/observations")) {
      submissions += 1;
      submittedPayload = request.postDataJSON() as Record<string, unknown>;
    }
  });
  const submit = page.getByRole("button", { name: "Enviar observação" });
  await submit.dblclick({ delay: 20 });
  await expect(page).toHaveURL(/\/v2\/confirmacao$/, { timeout: 15_000 });
  expect(submissions).toBe(1);
  expect(submittedPayload).toEqual({
    territory: { stateCode: "SC", municipalityCode: "4205407" },
    species: "bovinos",
    signalGroup: "respiratorio",
    observedPattern: "manifestacao_respiratoria_observada",
    animalCountBand: "2_5",
    attentionLevel: "observed",
    observationPeriod: "ultimos_7d",
    consentVersion: "vetalert-v2-2026-09-05",
  });
  for (const prohibitedMetadata of ["disease", "suspectedDisease", "suspicion", "officialNotification", "officialGuidanceAcknowledged", "officialGuidanceDecision", "reportableSuspicion", "notificationDecision"]) {
    expect(submittedPayload).not.toHaveProperty(prohibitedMetadata);
  }
});

test("network failure keeps the observation unsent and refresh returns safely to onboarding", async ({ page }) => {
  await reachReview(page);
  await page.route("**/api/v2/observations", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Enviar observação" }).click();
  const submissionError = page.getByText(/Seus dados não foram enviados/);
  await expect(submissionError).toBeVisible();
  await expect(submissionError).toBeFocused();
  await expect(page).toHaveURL(/\/v2\/onboarding$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Começar" })).toBeVisible();
});

test("territory lookup failure is announced and fail-closed municipality requirement blocks continuation", async ({ page }) => {
  await page.route("**/api/v2/territories?*", (route) => route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "territory_lookup_failed" }) }));
  await page.goto("/v2/onboarding");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Território de atuação (UF)").selectOption("SC");
  await page.getByLabel("Espécie ou grupo de produção").selectOption("bovinos");
  await page.getByRole("button", { name: "Continuar para o registro" }).click();
  await selectContextualPattern(page, "manifestacao_respiratoria_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("envio permanece bloqueado");
  await expect(page.getByLabel("Município", { exact: true })).toBeDisabled();
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
});

test("SAPSA UI denies an unauthenticated browser and exposes no raw record fields", async ({ page }) => {
  await page.goto("/sapsa/v2");
  await expect(page.getByRole("heading", { name: "Acesso não autorizado" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/submissionId|originDigest|fingerprint|municipalityCode|technicalNote|receivedAt/);
});

test("all V2 screens avoid obsolete optional-municipality and retail-field language", async ({ page }) => {
  for (const path of ["/v2/onboarding", "/v2/privacidade", "/v2/confirmacao", "/sapsa/v2"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/Município\s*\(opcional\)|Produto vendido/i);
  }
});

test("legacy and agro registration routes remain available while V2 is isolated", async ({ page }) => {
  await page.goto("/alerta/novo");
  await expect(page).toHaveURL(/\/alerta\/novo$/);
  await expect(page.locator("body")).not.toContainText("404");
  await page.goto("/agro-signals/new");
  await expect(page).toHaveURL(/\/agro-signals\/new$/);
  await expect(page.locator("body")).not.toContainText("404");
});

test("protected legacy veterinarian flow still authenticates anonymously and writes its existing alerts contract", async ({ page, request }) => {
  await page.route("https://ipapi.co/json/", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ country_name: "Brasil", region_code: "SC" }),
  }));
  await page.route("**/servicodados.ibge.gov.br/api/v1/localidades/estados/SC/municipios?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: 4205407, nome: "Florianópolis", microrregiao: { nome: "Florianópolis" }, mesorregiao: { nome: "Grande Florianópolis" } }]),
  }));

  await page.goto("/alerta/novo");
  const ethicsDialog = page.getByRole("heading", { name: "Declaração de ciência" });
  await expect(ethicsDialog).toBeVisible();
  await page.getByText("Li e estou ciente. Desejo prosseguir.").click();
  await page.getByRole("button", { name: "Prosseguir para registrar sinal" }).click();
  await expect(ethicsDialog).toBeHidden();
  await page.getByRole("button", { name: "Síndrome respiratória", exact: true }).click();
  await page.getByRole("button", { name: "Próximo" }).click();
  await page.getByRole("button", { name: "Bovinos", exact: true }).click();
  await page.getByRole("button", { name: "2 a 5", exact: true }).click();
  await page.getByRole("button", { name: "Atenção", exact: true }).click();
  await page.getByRole("button", { name: "Próximo" }).click();
  await expect(page.getByLabel("Município")).toBeEnabled();
  await page.getByLabel("Município").fill("Florianópolis");
  await page.getByRole("button", { name: "Próximo" }).click();
  await expect(page.getByText("Revisão antes do envio")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar e enviar" }).click();
  await expect(page).toHaveURL(/\/global-alerts-dashboard$/, { timeout: 15_000 });

  const response = await request.get("http://127.0.0.1:8080/v1/projects/demo-vetalert-v2/databases/(default)/documents/alerts", {
    headers: { Authorization: "Bearer owner" },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json() as { documents?: Array<{ fields: Record<string, unknown> }> };
  expect(result.documents).toHaveLength(1);
  const fields = result.documents![0].fields;
  expect(fields).toHaveProperty("species.stringValue", "Bovinos");
  expect(fields).toHaveProperty("alertType.stringValue", "Síndrome respiratória");
  expect(fields).toHaveProperty("herdCount.stringValue", "2 a 5");
  expect(fields).toHaveProperty("state.stringValue", "SC");
  expect(fields).toHaveProperty("cityCode.integerValue", "4205407");
  expect(fields).toHaveProperty("severity.stringValue", "Atenção");
  expect(fields).toHaveProperty("source.stringValue", "pilot");
  expect(fields).toHaveProperty("context.mapValue");
});

test("protected agro flow still authenticates anonymously and writes its exact legacy alerts contract", async ({ page, request }) => {
  await page.route("**/servicodados.ibge.gov.br/api/v1/localidades/estados/SC/municipios?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: 4205407, nome: "Florianópolis", microrregiao: { nome: "Florianópolis" }, mesorregiao: { nome: "Grande Florianópolis" } }]),
  }));

  await page.goto("/agro-signals/new");
  await page.getByLabel("Espécie").selectOption("Bovinos");
  await page.getByLabel("Sintoma reportado").selectOption("Sintoma respiratório");
  await page.getByLabel("Descrição adicional do sintoma").fill("observação sintética de emulador");
  await page.getByLabel("Produto vendido").fill("produto sintético de emulador");
  await page.getByLabel("Categoria do produto").selectOption("Antibiótico");
  await expect(page.getByLabel("Município")).toBeEnabled();
  await page.getByLabel("Município").selectOption("4205407");
  await page.getByLabel("Prescrição veterinária?").selectOption("Sim");
  await page.getByLabel("Duração do problema").selectOption("ongoing");
  await page.getByLabel("Quantidade de dias").fill("3");
  await page.getByLabel("Observações").fill("nota sintética exclusiva do emulador");
  await page.getByRole("button", { name: "Registrar Sinal de Campo" }).click();
  await expect(page).toHaveURL(/\/global-alerts-dashboard$/, { timeout: 15_000 });

  const response = await request.get("http://127.0.0.1:8080/v1/projects/demo-vetalert-v2/databases/(default)/documents/alerts", {
    headers: { Authorization: "Bearer owner" },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json() as { documents?: Array<{ fields: Record<string, unknown> }> };
  const agroFields = result.documents?.map((item) => item.fields).find((fields) =>
    (fields.source as { stringValue?: string } | undefined)?.stringValue === "agro_retail"
  );
  expect(agroFields).toBeDefined();
  expect(agroFields).toHaveProperty("signalType.stringValue", "field_retail");
  expect(agroFields).toHaveProperty("state.stringValue", "SC");
  expect(agroFields).toHaveProperty("cityCode.integerValue", "4205407");
  expect(agroFields).toHaveProperty("city.stringValue", "Florianópolis");
  expect(agroFields).toHaveProperty("species.stringValue", "Bovinos");
  expect(agroFields).toHaveProperty("alertType.stringValue", "Sintoma respiratório");
  expect(agroFields).toHaveProperty("severity.stringValue", "Não classificado");
  expect(agroFields).toHaveProperty("alertGroup.stringValue", "Sinal de Campo");
  expect(agroFields).toHaveProperty("cases.nullValue", null);
  expect(agroFields).toHaveProperty("herdCount.stringValue", "Não informado");
  expect(agroFields).toHaveProperty("context.mapValue.fields.retailSignal.mapValue.fields.productSold.stringValue", "produto sintético de emulador");
  expect(agroFields).toHaveProperty("context.mapValue.fields.retailSignal.mapValue.fields.productCategory.stringValue", "Antibiótico");
  expect(agroFields).toHaveProperty("context.mapValue.fields.retailSignal.mapValue.fields.veterinaryPrescription.stringValue", "Sim");
  expect(agroFields).toHaveProperty("context.mapValue.fields.retailSignal.mapValue.fields.durationType.stringValue", "ongoing");
  expect(agroFields).toHaveProperty("context.mapValue.fields.retailSignal.mapValue.fields.durationDays.integerValue", "3");
});
