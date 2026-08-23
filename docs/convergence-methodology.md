# Convergence methodology (version 1.0)

VetAlert produces **observational intelligence**, not diagnosis, prevalence, outbreak prediction, or official sanitary notification. A result describes “registros compatíveis distribuídos” and “convergência territorial de registros”; it never claims independent veterinarians because distinct eligible sources are not yet technically proven.

## Compatibility and window

Records are compatible only when normalized species, alert group, and alert type all match. The default rolling window is 30 days. Municipality/IBGE identity describes distribution; state and region can be used by a deployment to pre-partition evaluation. Historical records use `createdAt`/`timestamp`; new sidecars may provide `receivedAt`. Records without a usable date cannot enter a time-window result but remain preserved.

## Deterministic levels

Defaults are configurable in `Thresholds` and are operational hypotheses, **not scientifically validated thresholds**:

* **Isolated observation:** one eligible compatible record.
* **Recurring signal:** at least 2 compatible records.
* **Emerging territorial convergence:** at least 3 records across at least 2 municipalities.
* **Sustained/strong convergence:** at least 5 records across at least 3 municipalities, spanning at least 7 days.

The explanation includes record and municipality counts, configured window, persistence, severe-context corroboration, source channels, cross-source corroboration, excluded suspicious count, methodology version, and exact threshold snapshot. Severity and affected counts are explanatory corroboration only and do not diagnose or independently change the current level.

## Integrity safeguard

Records whose trusted integrity sidecar has `suspicious=true` or `duplicateSuspicion=true` are excluded (weight zero) by default. They are never deleted and the result visibly reports the excluded count. This conservative rule prevents one duplicate burst from creating convergence; future down-weighting requires a new methodology version.

## Geography and time limitations

“Nearby” means records sharing an explicitly selected territorial partition (normally state/IBGE region) and distributed municipalities; the engine does not infer physical distance without defensible coordinates. Records beyond the time window do not converge. Different syndromes/types never converge. Cross-source means veterinary intake plus agro-retail intake, not proof of independent persons.
