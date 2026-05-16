## Summary
- What changed and why?

## VetAlert ↔ SAPSA Guardrail Checklist
- [ ] I did **not** change registration-critical route semantics (`/alerta` → `/alerta/novo`, intake routes).
- [ ] I did **not** change intake step order, required validations, or submit progression behavior.
- [ ] I did **not** change `alerts` persistence contract (field names, nested keys, collection name, payload structure).
- [ ] I did **not** change auth bootstrap/fallback behavior used by intake flows.
- [ ] I did **not** change post-submit redirect flow.
- [ ] If I touched mixed-risk surfaces, I validated no intake behavior change and documented checks.

## Regression checks run
- [ ] Route redirect check
- [ ] Required-field gating check
- [ ] Submit payload shape check
- [ ] Firestore target collection check
- [ ] Post-submit redirect check
- [ ] Auth bootstrap/fallback check

## Notes
- Link to `docs/vetalert-sapsa-guardrails.md` and `docs-registration-audit-plan.md` if relevant.
