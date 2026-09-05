/* eslint-disable @typescript-eslint/no-require-imports -- cross-platform test process runner */
const { spawn } = require("node:child_process");

const serverEnvironment = {
  ...process.env,
  VETALERT_V2_ENABLED: "true",
  VETALERT_V2_INTEGRITY_SECRET: "browser-emulator-only-secret-at-least-32-chars",
  VETALERT_V2_MAX_SUBMISSIONS: "10",
  VETALERT_V2_MINIMUM_CELL: "5",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-vetalert-v2",
};

const server = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3100"], {
  env: serverEnvironment,
  stdio: "inherit",
});

const waitForServer = async () => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next.js exited with ${server.exitCode}`);
    try {
      const response = await fetch("http://127.0.0.1:3100/v2/onboarding");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Next.js did not become ready within 60 seconds");
};

const run = async () => {
  try {
    await waitForServer();
    const playwright = spawn(process.execPath, ["./node_modules/@playwright/test/cli.js", "test"], {
      env: serverEnvironment,
      stdio: "inherit",
    });
    const exitCode = await new Promise((resolve) => playwright.once("exit", (code) => resolve(code ?? 1)));
    process.exitCode = exitCode;
  } finally {
    server.kill("SIGTERM");
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server.kill("SIGTERM");
});

