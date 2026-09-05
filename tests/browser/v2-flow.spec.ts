import { expect, test, type Page } from "@playwright/test";

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
}

async function reachReview(page: Page) {
  await reachObservationForm(page);
  await page.getByLabel("Manifestação observada").selectOption("manifestacao_respiratoria_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Etapa 2 de 3")).toBeVisible();
  await page.getByLabel("Município (opcional)").selectOption("4205407");
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("Etapa 3 de 3")).toBeVisible();
}

test("mobile onboarding, keyboard activation, in-app back navigation and valid single submission", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockTerritories(page);
  await page.goto("/v2/onboarding");

  await page.getByRole("button", { name: "Como funciona" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/recebe uma observação estruturada/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Território de atuação (UF)").selectOption("SC");
  await page.getByLabel("Espécie ou grupo de produção").selectOption("bovinos");
  await page.getByRole("button", { name: "Continuar para o registro" }).click();
  await page.getByLabel("Manifestação observada").selectOption("manifestacao_respiratoria_observada");
  await page.getByLabel("Faixa de animais envolvidos").selectOption("2_5");
  await page.getByLabel("Nível de atenção percebido").selectOption("observed");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Período da observação").selectOption("ultimos_7d");
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByLabel("Manifestação observada")).toHaveValue("manifestacao_respiratoria_observada");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  let submissions = 0;
  page.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/api/v2/observations")) submissions += 1; });
  const submit = page.getByRole("button", { name: "Enviar observação" });
  await submit.dblclick({ delay: 20 });
  await expect(page).toHaveURL(/\/v2\/confirmacao$/, { timeout: 15_000 });
  expect(submissions).toBe(1);
});

test("network failure keeps the observation unsent and refresh returns safely to onboarding", async ({ page }) => {
  await reachReview(page);
  await page.route("**/api/v2/observations", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Enviar observação" }).click();
  await expect(page.getByText(/Seus dados não foram enviados/)).toBeVisible();
  await expect(page).toHaveURL(/\/v2\/onboarding$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Começar" })).toBeVisible();
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

