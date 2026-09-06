# Next/Firebase compatibility validation

Date: 6 September 2026

## Scope

This branch is a narrow compatibility proposal layered on the draft V2 branch. It does not enable V2, change `/alerta/novo`, change `/agro-signals/new`, alter Firestore rules or collections, change navigation, modify Vercel settings, migrate data, or delete data.

Changed package versions:

- `next`: `16.1.1` to `16.3.4`;
- `eslint-config-next`: `16.1.1` to `16.3.4`;
- `firebase`: resolved from the `^12.7.0` range to exact `12.18.0`;
- `firebase-admin`: deliberately unchanged at `14.3.0`.

The removed `experimental.turbopackUseSystemTlsCerts` configuration is no longer part of the Next.js 16.3.4 `NextConfig` contract. Leaving it in place fails TypeScript validation. No replacement Vercel environment variable or production setting was introduced.

No major-version codemod or bulk dependency update was run because this is a same-major patch compatibility review. `npm audit fix` and `npm audit fix --force` were not run.

## Runtime audit comparison

`npm audit --omit=dev --json`:

| Severity | Before | After |
| --- | ---: | ---: |
| Critical | 1 | 1 |
| High | 8 | 0 |
| Moderate | 12 | 6 |
| Low | 0 | 0 |
| Total | 21 | 7 |

The Next.js advisories and the Firebase Firestore/gRPC high-severity chain no longer appear after the selected upgrades.

The remaining critical advisory is `websocket-driver <0.7.5`, reached through `firebase -> @firebase/database -> faye-websocket`. VetAlert imports Firebase Auth and Firestore, not Realtime Database. That makes the vulnerable protocol handler unreachable through the application code reviewed here, but the package remains installed by the Firebase umbrella package and therefore remains a supply-chain finding. It is not marked resolved.

The six remaining moderate findings are the Firebase Admin/Google Cloud Storage dependency family (`@google-cloud/storage`, `gaxios`, `retry-request`, `teeny-request`, `uuid`, and the direct `firebase-admin` report). VetAlert's V2 server code imports Admin Auth and Firestore only; it does not import Admin Storage. npm proposes a breaking downgrade to `firebase-admin@10.3.0`, which was rejected as unsafe and outside this narrow branch. These findings remain open pending upstream packages or a separately tested dependency strategy.

## Compatibility evidence

- `npm ci`: PASS, lockfile reproduced the selected versions.
- `npm test`: PASS, 20/20 tests.
- `npm run typecheck`: PASS after removal of the unsupported Next.js experimental option.
- `npm run build`: PASS; all legacy and V2 routes were generated under Next.js 16.3.4.
- `npm run test:emulator`: PASS, 7/7 tests against the local Auth and Firestore emulators using project `demo-vetalert-v2`.
- `npm run test:e2e`: PASS, 5/5 Chromium scenarios, including exact legacy `/alerta/novo` and `/agro-signals/new` persistence contracts.
- `npm run lint`: FAIL only in the unchanged protected `app/alerta/novo/AlertFormClient.tsx` (5 pre-existing `no-explicit-any` errors and 3 warnings). No lint failure was introduced in a changed source file because this branch changes no application source.
- `git diff --check`: PASS.

The protected intake regression test passed and the protected form files remain unchanged. Firestore rules are unchanged on this branch.

## Reproducible emulator environment

The existing clean-checkout instructions in `docs/emulator-validation.md` remain unchanged and authoritative: Node.js 20.9+, Java 21 LTS on `PATH`, `npm ci`, then the unit, emulator and browser suites. The Firebase project is the local-only `demo-vetalert-v2`; no production Firebase project was used.

## Privacy boundary

This dependency update does not change the earlier privacy assessment. V2 remains designed for privacy-safe server-side handling and aggregate SAPSA output. The legacy system still permits authenticated raw reads from `alerts`; therefore the product as a whole must not be described as privacy-safe until legacy dashboards and permissions are migrated under separate approval.

## Rollback

Close this draft PR or revert its single compatibility commit. That restores `package.json`, `package-lock.json`, and `next.config.ts` to the draft V2 base without touching application data, Firestore permissions, Vercel settings, routes, flags, or legacy records.
