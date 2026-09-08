/* eslint-disable @typescript-eslint/no-require-imports -- cross-platform test process runner */
const { spawn } = require("node:child_process");

const e2ePort = process.env.VETALERT_E2E_PORT ?? "3100";
if (!/^\d{4,5}$/.test(e2ePort)) throw new Error("VETALERT_E2E_PORT must be a local TCP port");
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

const serverEnvironment = {
  ...process.env,
  VETALERT_V2_ENABLED: "true",
  VETALERT_V2_INTEGRITY_SECRET: "browser-emulator-only-secret-at-least-32-chars",
  VETALERT_V2_MAX_SUBMISSIONS: "10",
  VETALERT_V2_MINIMUM_CELL: "5",
  VETALERT_V2_OFFICIAL_CHANNEL_URL: "https://sistemasweb.agricultura.gov.br/pages/SISBRAVET.html",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-vetalert-v2",
  PLAYWRIGHT_BASE_URL: e2eBaseUrl,
};

let server;

const spawnNext = (command) => spawn(process.execPath, ["./node_modules/next/dist/bin/next", command, ...(command === "start" ? ["--hostname", "127.0.0.1", "--port", e2ePort] : [])], {
  env: serverEnvironment,
  stdio: "inherit",
});

const waitForExit = (child) => new Promise((resolve) => child.once("exit", (code) => resolve(code ?? 1)));

const waitForServer = async () => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (!server || server.exitCode !== null) throw new Error(`Next.js exited with ${server?.exitCode ?? "no process"}`);
    try {
      const response = await fetch(`${e2eBaseUrl}/v2/onboarding`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Next.js did not become ready within 60 seconds");
};

const resetFirestoreEmulator = async () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? "";
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "";
  if (!/^(?:127\.0\.0\.1|localhost):\d+$/.test(emulatorHost) || !/^demo-[a-z0-9-]+$/i.test(projectId)) {
    throw new Error("E2E reset requires a loopback Firestore Emulator and a demo-* project");
  }
  const response = await fetch(`http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Firestore Emulator reset failed with ${response.status}`);
};

const run = async () => {
  try {
    await resetFirestoreEmulator();
    const build = spawnNext("build");
    const buildExitCode = await waitForExit(build);
    if (buildExitCode !== 0) throw new Error(`Next.js build exited with ${buildExitCode}`);
    server = spawnNext("start");
    await waitForServer();
    const playwright = spawn(process.execPath, ["./node_modules/@playwright/test/cli.js", "test"], {
      env: serverEnvironment,
      stdio: "inherit",
    });
    const exitCode = await waitForExit(playwright);
    process.exitCode = exitCode;
  } finally {
    server?.kill("SIGTERM");
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server?.kill("SIGTERM");
});
