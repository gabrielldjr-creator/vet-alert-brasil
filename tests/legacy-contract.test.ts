import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const digest = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();

test("protected production files remain byte-for-byte unchanged", () => {
  assert.equal(digest("app/alerta/novo/AlertFormClient.tsx"), "447AA0D222D910A5B3037406A157D06E5E2529DD6CB31C546E2B0BF181AF3105");
  assert.equal(digest("app/agro-signals/new/AgroSignalFormClient.tsx"), "D9F01EDA26E6A03926288B575CAE4D739F815B669692AE4B5BE9C7748861FD6E");
  assert.equal(digest("app/alerta/page.tsx"), "CBE5199CE141FE3CCE6F8608B0A659F8E1C37FD2DA504AF0BACB07E0B2431545");
  assert.equal(digest("lib/auth.ts"), "F46C3C6F17545C9FD89ED00BC13A4E50F9579E17CD77E6DFA612C991C5376880");
});

test("legacy routes and payload contracts remain available", () => {
  for (const path of ["app/alerta/page.tsx", "app/alerta/novo/page.tsx", "app/agro-signals/new/page.tsx", "app/global-alerts-dashboard/page.tsx", "app/terminal/page.tsx"]) assert.equal(existsSync(path), true, path);
  const vet = read("app/alerta/novo/AlertFormClient.tsx");
  for (const field of ["species", "alertType", "herdCount", "state", "cityCode", "severity"]) assert.match(vet, new RegExp(`if \\(!${field}\\)`));
  assert.match(vet, /addDoc\(collection\(db, "alerts"\)/);
  assert.match(vet, /router\.push\("\/global-alerts-dashboard"\)/);
  const agro = read("app/agro-signals/new/AgroSignalFormClient.tsx");
  assert.match(agro, /addDoc\(collection\(db, "alerts"\)/);
  assert.match(agro, /source: "agro_retail"/);
  assert.match(agro, /router\.push\("\/global-alerts-dashboard"\)/);
  assert.match(read("components/vet-panel/GlobalAlertsDashboard.tsx"), /collection\(db, "alerts"\)/);
});

test("V2 is a separate route and persistence contract", () => {
  for (const path of ["app/v2/onboarding/page.tsx", "app/v2/confirmacao/page.tsx", "app/v2/privacidade/page.tsx", "app/api/v2/observations/route.ts", "app/api/v2/territories/route.ts", "app/sapsa/v2/page.tsx", "app/api/v2/sapsa/summary/route.ts", "app/api/v2/sapsa/export/route.ts"]) assert.equal(existsSync(path), true, path);
  const v2Form = read("app/v2/onboarding/AlertFormClientV2.tsx");
  assert.doesNotMatch(v2Form, /<textarea|ipapi|servicodados|geolocation|getCurrentPosition/i);
  assert.match(v2Form, /fetch\("\/api\/v2\/observations"/);
  const v2Layout = read("app/v2/layout.tsx");
  for (const legacyHref of ["/agro-signals/new", "/global-alerts-dashboard", "/terminal"]) assert.doesNotMatch(v2Layout, new RegExp(legacyHref.replace("/", "\\/")));
  const repository = read("lib/v2/submission.ts");
  assert.match(repository, /collection\("veterinaryObservationsV2"\)/);
  assert.doesNotMatch(repository, /collection\("alerts"\)/);
});

test("legacy Firestore permissions are preserved and V2 is client-denied", () => {
  const rules = read("firestore.rules");
  assert.match(rules, /match \/alerts\/\{alertId\}[\s\S]*allow read: if request\.auth != null;[\s\S]*allow create: if request\.auth != null;[\s\S]*allow update, delete: if false;/);
  for (const collection of ["veterinaryObservationsV2", "submissionIntegrityV2", "auditLogsV2"]) assert.match(rules, new RegExp(`match /${collection}/\\{documentId\\} \\{[\\s\\S]*?allow get, list, create, update, delete: if false;`));
  assert.doesNotMatch(rules, /allow\s+read\s*,\s*write/);
});
