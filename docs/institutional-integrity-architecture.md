# Institutional integrity architecture

## Protected production contract

The current registration pipeline is a protected contract. `/alerta/novo` validates the existing six required values, obtains a Firebase session/token, writes the existing payload with `addDoc(collection(db, "alerts"), payload)`, and redirects to `/global-alerts-dashboard`. `/agro-signals/new` follows the same direct-write pattern and collection. This phase therefore adds a **downstream** integrity processor and does not alter either form, required field, payload, nested shape, authentication fallback, MAPA copy/flow, collection name, or redirect.

The processor is intended to run in a trusted backend/Firestore-trigger environment after an `alerts` create. Deployment of that trigger and service credentials is an operational prerequisite; until then, legacy and newly direct-written records remain readable but have no integrity sidecar.

## Current metadata and privacy audit

### Stored in `alerts`

* Firestore document ID (random client-generated ID) and server-resolved `createdAt` timestamp.
* Municipality name and IBGE municipality code, state, IBGE microregion/region group, and optional free-text `localidadeAproximada`.
* Species, observational group/type, severity, affected-count band and numeric lower bound.
* Optional notes, arrival context, feed/pharmaceutical/environment context, parasite/physical-integrity observations, and agro-retail product/prescription/duration context.
* `source` (`pilot` or `agro_retail`) and, for retail, `signalType`.

No CRMV, name, CPF, producer/farm identity, email, phone, coordinates, or auth UID is explicitly included in either current `alerts` payload. Free-text fields can nevertheless contain identity voluntarily entered by a user; the current client has no content redaction. Municipality plus a rare event, precise timestamp, free text, and small local professional population can permit linkage.

### Authentication and adjacent stores

* Firebase Authentication necessarily holds an anonymous UID. The veterinary fallback in `ensurePilotAuth` can create a synthetic technical email containing a persistent browser-local random session ID; Firebase Auth then holds that UID/email even though the alert document does not. `vetProfiles/{uid}` and `doctors/{uid}` are UID-keyed adjacent collections. A privileged Firebase operator could correlate authenticated writes through platform audit/security logs even when the UID is absent from the document.
* Browser `localStorage` holds `vet-alert-session-id` and the ethics acknowledgement. These are device/browser identifiers, not alert fields.
* Firebase/Google infrastructure, hosting, reverse proxies, browser network requests, and the IP geolocation provider may process IP address, user agent, request time, auth token and other request metadata. Firestore client SDK/network logs, Firebase Auth logs, Google Cloud audit logs, hosting/CDN logs, and local browser/devtools logs may make correlation possible according to deployment configuration and retention. The repository does not configure those external retention policies.
* `ipapi.co` receives the reporter IP when `/alerta/novo` attempts region detection. Only returned country/state are placed in form state; the IP and exact provider response are not stored in the alert by repository code.
* The IBGE municipality API receives a request containing the selected state and ordinary network metadata.
* No analytics SDK is present in this repository. Console errors may expose Firebase error objects locally or to any externally configured console capture, but the repository defines no such collector.

### Indirect identification risks

Exact submission time, municipality-level location, uncommon species/syndrome combinations, narrative text, product details, arrival notes, and a sequence of records can be identifying in sparse territories. Firestore document IDs and future `submissionId` values are hidden technical identifiers and must never be included in institutional exports. Municipality is the maximum supported institutional export precision; small-cell suppression is applied to public/institutional aggregate rows.

## Threat model

The layer addresses client forgery of integrity fields, replay/bursts, exact duplicates, accidental identity in structured extensions, unsafe institutional exports, and duplicate inflation of convergence. It assumes a trusted processor runtime and secret HMAC key. It does not protect against a privileged cloud operator correlating Auth/audit/network logs, compromised clients entering identity in free text, collusion, traffic analysis, or an institution combining sparse aggregates with outside knowledge.

## Sidecar model and immutability

For every processed accepted observation, the trusted processor creates an immutable `observation_integrity/{alertDocumentId}` sidecar containing:

* server-generated random `submissionId`;
* server-generated UTC `receivedAt`;
* `schemaVersion` and `sourceChannel` derived from the observation;
* a canonical content HMAC (`contentDigest`) rather than raw identity/device material;
* deterministic `duplicateSuspicion` and abuse flags;
* an eligibility attestation envelope reserved for a future external verifier.

Rules deny client reads/writes to sidecars. The processor rejects client-supplied reserved integrity keys and never copies them. Sidecars never store auth UID, IP, CRMV, names, contact data, device ID, user agent, coordinates, or raw rate-limit keys. Original observations are never overwritten or deleted.

## Eligibility-provider interface

The stable envelope supports `eligibleProfessional`, `provider`, `attestationVersion`, `verifiedAt`, `expiresAt`, and a provider-issued opaque proof digest. It deliberately has no CRMV/name field. A future independent verifier can issue a signed, single-purpose, unlinkable/rotating attestation; the trusted processor validates it and stores only the eligibility result and non-identifying proof digest. No CRMV integration or eligibility claim is simulated now: the default status is `unverified`.

## Abuse and duplicate handling

Rate limiting uses an in-memory/sliding-window keyed HMAC of transient transport/auth material. Raw IP, UID and user agent are neither returned nor persisted. Deployments should replace the in-memory store with a TTL store that retains only keyed digests. Exceeding a threshold flags the sidecar for review; it does not delete or mutate the observation. Duplicate suspicion compares a canonical digest over defensible observational dimensions in a configurable time window. Suspicious records are retained and excluded from convergence by the documented default rule.

## Anonymity guarantees and limitations

The application-level guarantee is data minimization: prohibited professional/property identity is not part of the observation, sidecar, derived convergence result, or export schema. Institutional exports omit all document/submission/auth/digest identifiers and suppress small aggregate cells. This is pseudonymity/anonymity at the application dataset boundary, not mathematical anonymity against a privileged infrastructure operator or linkage attacker. Operational validation requires log minimization/retention controls, restricted IAM, processor deployment, secret rotation, incident response, DPIA/LGPD review, free-text handling policy, and verification that Firebase/hosting telemetry is disabled or appropriately governed.

## Exact implementation changes

1. Add a pure trusted integrity processor, prohibited-field/privacy validator, transient rate limiter, sidecar contract and tests.
2. Tighten Firestore rules so clients cannot create reserved integrity fields or access integrity/derived institutional collections, while preserving existing `alerts` creates and reads.
3. Add deterministic, read-only convergence computation and institutional aggregation/export downstream of `alerts`.
4. Add an institutional dashboard and explicitly synthetic demo dataset without changing intake routes.
5. Preserve historical records: missing timestamps/integrity metadata are handled as legacy inputs, and dashboards continue to consume the existing fields.

## Before/after payload compatibility

The client-written `alerts` payload is byte-for-field unchanged by this work. The “after” state adds a separate server-owned sidecar keyed by the Firestore document ID. No existing key is renamed, removed, nested differently, or made newly required.
