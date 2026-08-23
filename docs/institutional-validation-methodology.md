# Institutional validation methodology

VetAlert is an anonymous observational signal network. It can report accepted observation volume, territorial coverage, temporal continuity, structured completeness, integrity flags, source-channel corroboration, and deterministic convergence evolution for a configured validation period. It cannot diagnose disease, estimate municipal/state/national prevalence, predict outbreaks, replace mandatory official notification, prove distinct veterinarians without an external eligibility attestation, or independently determine credit decisions.

## Configuration

A versioned validation configuration contains start/end dates, species, optional priority states/municipalities/IBGE regions, target production chain, client-defined hypotheses, methodology version, and success metrics. `clientVisibleToReporter` defaults to false operationally: client name and confidential hypotheses must not be sent to intake clients unless intentionally enabled.

Institutional extension questions are configuration records, not edits to the protected core form. Each has a stable key, version, audit metadata, allowlisted type (`boolean`, `enum`, `integer-band`, `short-observation`), optionality, and display policy. Required status needs an explicit approval reference. Keys associated with professional, producer/property, contact, location-coordinate, auth, network, or device identity are denied. Free-text values still require operational review/redaction. No extension is wired into the production intake in this repository; doing so requires explicit approval and registration regression testing.

## Export privacy

Exports are aggregate-only and include methodology/schema versions. Cells below the configurable minimum (default 3) are suppressed. Raw observations, narratives, Firestore IDs, submission IDs, digests, auth UIDs, IP/network metadata, proof tokens, and device/browser identifiers are excluded. Territory filters should be broadened where sparse combinations create linkage risk.

## Demonstration data

The institutional dashboard demo is prominently labeled **SYNTHETIC**. It demonstrates explainability and evolution only; simulated observations must never be combined with production metrics or presented as evidence of real sanitary conditions.

## Validation limitations and governance

Methodology thresholds are configurable operational hypotheses and are not scientifically validated absent external evidence. Banco do Brasil or another client evaluates data-source fitness during the agreed period; VetAlert does not provide a credit recommendation. Mandatory-notification/MAPA governance remains entirely unchanged and outside this downstream analytics layer.
