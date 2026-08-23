# Institutional readiness report

Date: 2026-08-22

| Area | Status | Evidence / remaining condition |
|---|---|---|
| Anonymity | **PASS (application schema)** | Prohibited structured identity is rejected; sidecars/exports omit auth, transport and hidden identifiers. Infrastructure log retention and free-text linkage require operational controls. |
| Integrity | **PASS (implementation), DEPLOYMENT REQUIRED** | Trusted processor generates immutable sidecar values, flags duplicates/rate bursts and reserves fields in rules. A Firestore trigger/service account and secret/TTL store must be deployed before production records receive sidecars. |
| Convergence | **PASS** | Deterministic, explainable four-level engine; suspicious records excluded; raw records untouched; synthetic scenarios pass. Thresholds are configurable and not claimed as validated. |
| Institutional export | **PASS** | Aggregate-only model, small-cell suppression, completeness, coverage, sources, integrity and methodology versions; no raw/hidden IDs. Authorization and delivery mechanism remain deployment responsibilities. |
| Backward compatibility | **PASS** | Intake source files were not modified; registration contract tests pass; historical records without sidecars are supported; production build passes. |
| Notification governance | **PASS** | Existing mandatory-notification/MAPA/official-flow copy and behavior are unchanged and protected by regression tests. |

## Before/after payload

**Before and after client document:** unchanged `alerts` payload, including `createdAt`, location/IBGE fields, species/group/type/severity/counts, `arrival_context`, `context`, and `source`. Neither intake route was edited.

**New downstream data:** trusted-only `observation_integrity/{alertDocumentId}` sidecar with `submissionId`, `receivedAt`, `schemaVersion`, `sourceChannel`, content HMAC, suspicion flags, and an unverified future-provider envelope. This is not merged into or writable through the client observation.

## Remaining risks

1. Deploy and integration-test the Firestore create trigger; repository unit tests cannot prove cloud IAM/log configuration.
2. Replace process-local rate/dedup state with encrypted/managed TTL storage containing keyed digests only.
3. Configure Firebase/Google/hosting audit, access, retention and deletion policies; prevent institutional users from accessing raw Auth/audit data.
4. Add free-text warning/redaction or reviewed data-loss prevention without changing core required intake behavior.
5. Validate small-cell threshold and territorial partitions with privacy/legal and epidemiological reviewers.
6. Add Firebase Emulator end-to-end browser tests in CI; the current repository has no emulator/browser harness.
7. Obtain external scientific review before representing any threshold as validated.
