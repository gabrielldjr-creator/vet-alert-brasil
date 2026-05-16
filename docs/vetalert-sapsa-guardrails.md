# VetAlert ↔ SAPSA Split Guardrails (Developer)

**Purpose:** protect VetAlert intake behavior while enabling SAPSA presentation changes.

## 1) Protected registration surfaces (no behavioral changes)

### Routes / entry
- `/alerta` must continue redirecting to `/alerta/novo`.
- `/alerta/novo` remains the canonical VetAlert registration flow.
- `/agro-signals/new` remains intake path that also writes to `alerts`.

### Form and validation contract
- Do **not** change step order, required field logic, or progression checks.
- Do **not** change required checks for core intake fields.
- Optional modules can only remain additive; they must not change required submit conditions.

### Submit and persistence contract
- Keep submit flow as `handleSubmit` → `addDoc(collection(db, "alerts"), payload)`.
- Do **not** rename/remove persisted fields in `alerts` (top-level or nested `context` / `arrival_context`).
- Do **not** change Firestore collection names.
- Keep post-submit redirect behavior unchanged.

### Auth bootstrap dependency
- Keep auth bootstrap and fallback behavior unchanged (`onAuthStateChanged`, technical/anonymous session path).

## 2) Safe-to-change surfaces (presentation only)
- Branding and copy in informational/marketing pages.
- Layout, visual style, navigation labels/grouping.
- Access-control **messaging** copy (without auth-flow logic changes).
- SAPSA dashboard presentation (cards/charts/labels/filter UX) reading existing data contracts.

## 3) Known risks
- **High:** edits to intake submit payload, required validation, step gating, or submit redirect.
- **High:** field/key or collection-name changes in Firestore persistence.
- **Medium:** auth/session “cleanup” that changes fallback behavior.
- **Medium:** analytics refactors that feed schema changes back into intake code.

## 4) Regression checks required for split-related PRs
1. Route check: `/alerta` still redirects to `/alerta/novo`.
2. Required-field check: current required fields still block submit when missing.
3. Payload check: unchanged `alerts` document shape (keys/types) for VetAlert and Agro intake.
4. Persistence check: writes still target `alerts` collection.
5. Flow check: successful submit still redirects to `/global-alerts-dashboard`.
6. Auth check: session bootstrap fallback behavior remains intact.

## 5) File classification baseline
- See `docs-registration-audit-plan.md` for the canonical file grouping:
  - `registration-critical`
  - `presentation-only`
  - `mixed-risk`
