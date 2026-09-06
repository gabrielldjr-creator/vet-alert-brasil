import { expect, test, type Page } from "@playwright/test";

const contextualPatterns = [
  "manifestacao_respiratoria_observada",
  "alteracao_neurologica_observada",
  "alteracao_reprodutiva_observada",
] as const;

const officialGuidanceParagraphs = [
  "O VetAlert é um registro observacional independente. O conteúdo enviado não é encaminhado automaticamente ao MAPA, ao e-SISBRAVET ou a qualquer outro sistema ou instituição.",
  "O formulário não solicita nome do veterinário, CRMV, nome do produtor, propriedade, fabricante, marca ou coordenada individual. Por isso, o VetAlert não é um canal de notificação oficial.",
  "Se, considerando o contexto clínico, houver suspeita de doença ou síndrome de notificação obrigatória, o profissional deve comunicar imediatamente o Serviço Veterinário Oficial ou o e-SISBRAVET. O registro no VetAlert nunca substitui essa obrigação.",
] as const;

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
  await dialog.getByRole("button", { name: "Entendi — continuar registro observacional" }).click();
  await expect(dialog).toBeHidden();
}

async function reachReview(page: Page) {
  await reachObservationForm(page);
  await selectContextualPattern(page, "manifestacao_respiratoria_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Etapa 2 de 3")).toBeVisible();
  await page.getByLabel("Município (opcional)").selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Etapa 3 de 3")).toBeVisible();
}

test("contextual modal covers configured categories while the official link remains optional", async ({ page }) => {
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
    for (const paragraph of officialGuidanceParagraphs) await expect(dialog.getByText(paragraph, { exact: true })).toBeVisible();
    const officialLink = dialog.getByRole("link", { name: "Abrir canal oficial" });
    await expect(officialLink).toHaveAttribute("href", "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html");
    await expect(officialLink).toHaveAttribute("target", "_blank");
    await expect(officialLink).toHaveAttribute("rel", /noopener/);
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
    const acknowledge = dialog.getByRole("button", { name: "Entendi — continuar registro observacional" });
    await expect(acknowledge).toBeFocused();
    await acknowledge.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel("Manifestação observada")).toBeFocused();
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
    expect(officialChannelRequests).toBe(0);
  }

  await page.getByLabel("Manifestação observada").selectOption("manifestacao_digestiva_observada");
  await expect(page.getByRole("dialog", { name: "Como este registro funciona" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
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
    territory: { stateCode: "SC" },
    species: "bovinos",
    signalGroup: "respiratorio",
    observedPattern: "manifestacao_respiratoria_observada",
    animalCountBand: "2_5",
    attentionLevel: "observed",
    observationPeriod: "ultimos_7d",
    consentVersion: "vetalert-v2-2026-09-05",
  });
  for (const prohibitedMetadata of ["disease", "suspectedDisease", "suspicion", "officialNotification", "officialGuidanceAcknowledged"]) {
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

test("territory lookup failure is announced and municipality remains optional", async ({ page }) => {
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
  await expect(page.getByRole("status")).toContainText("município continua opcional");
  await expect(page.getByLabel("Município (opcional)")).toHaveValue("");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
});

test("SAPSA UI denies an unauthenticated browser and exposes no raw record fields", async ({ page }) => {
  await page.goto("/sapsa/v2");
  await expect(page.getByRole("heading", { name: "Acesso não autorizado" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/submissionId|originDigest|fingerprint|municipalityCode|receivedAt/);
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
