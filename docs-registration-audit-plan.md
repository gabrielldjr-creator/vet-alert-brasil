# VetAlert ↔ SAPSA Split: Registration Surface Audit (No-Code Plan)

## Protected registration surfaces (must stay behaviorally unchanged)

### 1) Routes and entry points
- `/alerta` hard-redirects to `/alerta/novo`; this route behavior is part of intake entry. Do not alter redirect semantics. 
- `/alerta/novo` renders the main registration client form and associated metadata.
- `/agro-signals/new` is a second intake path (field retail) that also persists into the same `alerts` collection and should be treated as intake-critical.

### 2) Registration form state, step flow, and required validations
- `AlertFormClient` owns intake state, step counter (`step`), next/back flow, and required checks before submit (`species`, `alertType`, `herdCount`, `state`, `cityCode`, `severity`).
- Step gating (`validateCurrentStep`, `handleNext`) and final submit validation together define user progression and required field contract.
- Optional modules (feed/pharma/environment/arrival context) are additive around the same submit contract; they should not alter required core fields or submission path.

### 3) Submission handler and persistence contract
- The canonical submit path is `handleSubmit` → `addDoc(collection(db, "alerts"), payload)`.
- Critical persisted fields include top-level keys (`createdAt`, `state`, `cityCode`, `species`, `alertGroup`, `alertType`, `severity`, `cases`, `herdCount`, `source`) and nested keys (`context.*`, `arrival_context.*`).
- Post-submit navigation currently redirects to `/global-alerts-dashboard`; preserve this flow order.

### 4) Auth/session required for intake
- Intake relies on Firebase auth availability (`onAuthStateChanged`, `signInAnonymously`, token fetch).
- `ensurePilotAuth` provides session bootstrap strategy and fallback; treat as protected dependency for route access and registration continuity.

### 5) Shared schema-like contracts used by downstream analytics
- Even if TypeScript interfaces are not strict runtime validators, `AlertRecord`-style usage in dashboards assumes stable key names and value shapes from intake payloads.
- The `alerts` collection acts as shared data contract between VetAlert intake and SAPSA intelligence views; field/key renames are high-risk.

---

## Safe-to-change presentation surfaces (without touching registration logic)

### Branding/copy/layout
- Marketing and informational pages (`/`, `/sobre`, `/privacidade`, `/uso-etico`) can be rebranded for VetAlert/SAPSA separation while preserving legal disclaimers.
- Shared UI components (`Header`, `Footer`, visual-only button/card/input styling) can receive branding, typography, spacing, and navigation-label updates.

### Navigation and IA
- You can reorganize top-level labels and menu grouping (e.g., “VetAlert Intake” vs “SAPSA Intelligence”) as long as links still resolve to the same protected intake routes.
- You can add route-level wrappers/banners/segment switchers that do not intercept or mutate form submission.

### Access control presentation
- Access messaging pages/components (`AccessRestricted`, `AccessDenied`, `AccessButton`, `acesso` pages) can be updated for product language and role framing.
- Keep underlying auth mechanics untouched unless strictly necessary.

### Analytics presentation (SAPSA layer)
- Dashboard framing, cards, charts, labels, filtering UX, and explanatory text in vet/global dashboards can change safely if they only read existing data.
- Add derived view-model adapters in presentation layer rather than changing stored intake fields.

---

## Risks
- **High risk:** any edit inside `AlertFormClient` submit payload object, required-field checks, step transitions, or route redirect after submit.
- **High risk:** changing Firebase collection names, key names, or nested context shapes relied on by dashboards.
- **Medium risk:** auth/session flow changes that appear cosmetic but alter anonymous/session fallback behavior.
- **Medium risk:** dashboard refactors that accidentally back-propagate schema assumptions into intake code.
- **Low risk:** pure text/style/navigation-copy updates outside intake-critical files.

---

## Recommended order of implementation
1. **Freeze intake contract:** mark registration-critical files with explicit “do-not-change-behavior” guardrails and checklist in PR template.
2. **Introduce branding adapters:** add product naming constants/content maps (VetAlert vs SAPSA) in presentation layer only.
3. **Update shell/navigation:** apply layout/header/footer and route-label changes without touching intake handlers.
4. **Update access-control messaging:** revise copy and role wording in access pages/components, no auth logic change.
5. **Refine SAPSA analytics UI:** improve dashboards with purely presentational enhancements and optional derived selectors.
6. **Regression verification:** validate unchanged intake via route, required-field checks, payload snapshot, and post-submit redirect.

---

## File grouping

### registration-critical
- `app/alerta/page.tsx`
- `app/alerta/novo/page.tsx`
- `app/alerta/novo/AlertFormClient.tsx`
- `app/agro-signals/new/page.tsx`
- `app/agro-signals/new/AgroSignalFormClient.tsx`
- `lib/auth.ts`
- `lib/firebase.ts`
- `lib/regions.ts`
- `firestore.rules`

### presentation-only
- `app/page.tsx`
- `app/sobre/page.tsx`
- `app/privacidade/page.tsx`
- `app/uso-etico/page.tsx`
- `components/Header.tsx`
- `components/Footer.tsx`
- `components/Card.tsx`
- `components/Button.tsx`
- `components/Input.tsx`
- `components/Select.tsx`
- `components/Textarea.tsx`
- `components/AccessButton.tsx`
- `components/AccessRestricted.tsx`
- `components/AccessDenied.tsx`

### mixed-risk
- `components/vet-panel/GlobalAlertsDashboard.tsx`
- `components/vet-panel/DashboardVetPanel.tsx`
- `components/vet-panel/VetPanelFilters.tsx`
- `components/vet-panel/VetPanelFeed.tsx`
- `components/vet-panel/VetPanelSummary.tsx`
- `components/vet-panel/AlertCard.tsx`
- `components/vet-panel/types.ts`
- `components/vet-panel/alertLabeling.ts`
- `app/global-alerts-dashboard/page.tsx`
- `app/acesso/page.tsx`
- `app/acesso/AccessLinkClient.tsx`
- `app/layout.tsx`
- `README.md`
