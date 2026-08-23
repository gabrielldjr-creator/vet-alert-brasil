"""Deterministic observational convergence; no diagnosis or prevalence inference."""
from __future__ import annotations
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from typing import Any


@dataclass(frozen=True)
class Thresholds:
    window_days: int = 30
    recurring_records: int = 2
    emerging_records: int = 3
    emerging_municipalities: int = 2
    sustained_records: int = 5
    sustained_municipalities: int = 3
    persistence_days: int = 7


def _date(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return (value if value.tzinfo else value.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
    if isinstance(value, str):
        try: return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError: return None
    converter = getattr(value, "to_datetime", None)
    return _date(converter()) if callable(converter) else None


def _key(record: dict[str, Any]) -> tuple[str, str, str]:
    return tuple(str(record.get(k) or "unknown").strip().casefold() for k in ("species", "alertGroup", "alertType"))


def evaluate(records: list[dict[str, Any]], thresholds: Thresholds = Thresholds(), as_of: datetime | None = None) -> list[dict[str, Any]]:
    now = as_of or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=thresholds.window_days)
    groups: dict[tuple[str, str, str], list[tuple[dict[str, Any], datetime]]] = {}
    excluded = 0
    for record in records:
        integrity = record.get("integrity") or {}
        if integrity.get("suspicious") or integrity.get("duplicateSuspicion"):
            excluded += 1
            continue
        timestamp = _date(record.get("receivedAt") or record.get("createdAt") or record.get("timestamp"))
        if timestamp is None or timestamp < cutoff or timestamp > now:
            continue
        groups.setdefault(_key(record), []).append((record, timestamp))

    results = []
    for key, rows in sorted(groups.items()):
        rows.sort(key=lambda item: item[1])
        municipalities = sorted({str(r.get("cityCode") or r.get("municipality") or r.get("city") or "unknown") for r, _ in rows})
        sources = sorted({"agro-retail" if r.get("source") == "agro_retail" else "veterinary" for r, _ in rows})
        span = (rows[-1][1] - rows[0][1]).days
        severe = sum(str(r.get("severity", "")).casefold() in {"preocupante", "urgente"} for r, _ in rows)
        count, places = len(rows), len(municipalities)
        level = "isolated"
        if count >= thresholds.recurring_records: level = "recurring"
        if count >= thresholds.emerging_records and places >= thresholds.emerging_municipalities: level = "emerging"
        if count >= thresholds.sustained_records and places >= thresholds.sustained_municipalities and span >= thresholds.persistence_days: level = "sustained"
        results.append({
            "classification": level, "compatibilityKey": list(key), "recordCount": count,
            "municipalities": municipalities, "municipalityCount": places,
            "windowDays": thresholds.window_days, "persistenceDays": span,
            "severityCorroboration": severe, "sourceChannels": sources,
            "crossSourceCorroboration": len(sources) > 1, "suspiciousRecordsExcluded": excluded,
            "methodologyVersion": "convergence-1.0", "thresholds": asdict(thresholds),
            "explanation": f"{count} registros compatíveis distribuídos em {places} município(s), janela de {thresholds.window_days} dias, persistência de {span} dia(s), {severe} registro(s) de maior severidade e {len(sources)} canal(is).",
        })
    return results
