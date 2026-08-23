"""Privacy-safe validation configuration, aggregation and export."""
from __future__ import annotations
from collections import Counter
from datetime import datetime
from typing import Any

DENIED_FIELD_TOKENS = {"crmv", "name", "nome", "cpf", "producer", "farm", "property", "email", "phone", "address", "coordinate", "latitude", "longitude", "uid", "ip", "device"}
ALLOWED_EXTENSION_TYPES = {"boolean", "enum", "integer-band", "short-observation"}


def validate_extension(question: dict[str, Any]) -> None:
    key = str(question.get("key", "")).casefold()
    if not key or any(token in key for token in DENIED_FIELD_TOKENS):
        raise ValueError("institutional field key is prohibited")
    if question.get("type") not in ALLOWED_EXTENSION_TYPES:
        raise ValueError("institutional field type is not allowlisted")
    if question.get("required") and not question.get("explicitApprovalReference"):
        raise ValueError("required extensions need explicit approval")
    if not question.get("version"):
        raise ValueError("extension version is required")


def validate_period(config: dict[str, Any]) -> None:
    for key in ("startDate", "endDate", "species", "methodologyVersion", "successMetrics"):
        if key not in config: raise ValueError(f"missing validation configuration: {key}")
    if datetime.fromisoformat(config["endDate"]) < datetime.fromisoformat(config["startDate"]):
        raise ValueError("validation period ends before it starts")


def aggregate(records: list[dict[str, Any]], convergence: list[dict[str, Any]], minimum_cell_size: int = 3) -> dict[str, Any]:
    accepted = [r for r in records if not (r.get("integrity") or {}).get("rejected")]
    suspicious = sum(bool((r.get("integrity") or {}).get("suspicious")) for r in accepted)
    municipalities = Counter(str(r.get("municipality") or r.get("city") or "Não informado") for r in accepted)
    species = Counter(str(r.get("species") or "Não informado") for r in accepted)
    sources = Counter("agro-retail" if r.get("source") == "agro_retail" else "veterinary" for r in accepted)
    safe_counts = lambda values: {k: v for k, v in values.items() if v >= minimum_cell_size}
    required = ("species", "alertType", "state", "municipality", "severity", "createdAt")
    completeness = {key: round(sum(r.get(key) not in (None, "") for r in accepted) / len(accepted), 4) if accepted else 0 for key in required}
    return {
        "exportSchemaVersion": "institutional-aggregate-1", "methodologyVersion": "convergence-1.0",
        "totalAcceptedObservations": len(accepted), "geographicCoverage": len(municipalities),
        "activeMonitoredMunicipalities": safe_counts(municipalities), "distributionBySpecies": safe_counts(species),
        "sourceChannelDistribution": safe_counts(sources), "crossSourceCorroboratedSignals": sum(bool(c.get("crossSourceCorroboration")) for c in convergence),
        "convergenceSignals": Counter(c.get("classification") for c in convergence),
        "integrity": {"suspiciousCount": suspicious, "suspiciousRate": round(suspicious / len(accepted), 4) if accepted else 0},
        "dataCompleteness": completeness,
        "privacy": {"minimumCellSize": minimum_cell_size, "suppressedSmallCells": True, "rawIdentifiersExcluded": True},
    }
