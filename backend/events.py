"""VetAlert alert -> event normalization module.

This module is read-only: it only fetches documents from Firestore and maps them
into normalized event objects.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Iterable

try:
    from google.cloud import firestore  # type: ignore
except Exception:  # pragma: no cover - optional import for environments without GCP SDK
    firestore = None


@dataclass(frozen=True)
class NormalizedEvent:
    timestamp: str
    state: str | None
    city: str | None
    species: str | None
    alert_type: str | None
    risk_level: str | None
    tags: list[str]
    herd_size: int | None
    number_of_cases: int | None


def _to_iso8601(value: Any) -> str:
    """Converts common Firestore timestamp representations to UTC ISO-8601."""
    if value is None:
        return datetime.now(tz=timezone.utc).isoformat()

    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()

    # Firestore Timestamp usually exposes .to_datetime()
    to_datetime = getattr(value, "to_datetime", None)
    if callable(to_datetime):
        dt = to_datetime()
        if isinstance(dt, datetime):
            dt = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()

    # If already serialized string, keep as-is.
    if isinstance(value, str) and value.strip():
        return value.strip()

    return datetime.now(tz=timezone.utc).isoformat()


def _parse_herd_size(raw: Any) -> int | None:
    """Converts numeric or label-based herd size values to an integer baseline."""
    if raw is None:
        return None

    if isinstance(raw, int):
        return raw

    if isinstance(raw, str):
        value = raw.strip().lower()
        if value == "1":
            return 1
        if value.startswith("2"):
            return 2
        if value.startswith("6"):
            return 6
        if "mais de 20" in value:
            return 21

        # Generic fallback: extract first integer found
        digits = "".join(ch for ch in value if ch.isdigit())
        if digits:
            return int(digits)

    return None


def _collect_tags(doc: dict[str, Any]) -> list[str]:
    tags: list[str] = []

    details = doc.get("context", {}).get("alertDetails")
    if isinstance(details, list):
        tags.extend(str(item).strip() for item in details if str(item).strip())

    for key in ("alertGroup", "source"):
        value = doc.get(key)
        if isinstance(value, str) and value.strip():
            tags.append(value.strip())

    # Deduplicate preserving order
    deduped: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        if tag not in seen:
            deduped.append(tag)
            seen.add(tag)

    return deduped


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    return text or None


def _parse_int(value: Any) -> int | None:
    if value is None:
        return None

    if isinstance(value, bool):
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    text = str(value).strip()
    if not text:
        return None

    digits = "".join(ch for ch in text if ch.isdigit())
    if digits:
        return int(digits)

    return None


def normalize_event(record: dict[str, Any] | None) -> dict[str, Any]:
    """Maps a raw VetAlert record to a standardized event schema."""
    payload = record or {}

    timestamp = _to_iso8601(
        payload.get("createdAt")
        or payload.get("created_at")
        or payload.get("timestamp")
        or payload.get("reportedAt")
    )

    city = (
        payload.get("city")
        or payload.get("cityName")
        or payload.get("municipality")
        or payload.get("localidadeAproximada")
    )

    herd_size = _parse_herd_size(
        payload.get("herdSize") or payload.get("herd_count") or payload.get("herdCount")
    )

    number_of_cases = _parse_int(payload.get("cases") or payload.get("number_of_cases"))

    tags = _collect_tags(payload)
    if not isinstance(tags, list):
        tags = []

    normalized = NormalizedEvent(
        timestamp=timestamp,
        state=_clean_text(payload.get("state")),
        city=_clean_text(city),
        species=_clean_text(payload.get("species")),
        alert_type=_clean_text(payload.get("alertType") or payload.get("alert_type")),
        risk_level=_clean_text(payload.get("severity") or payload.get("risk_level")),
        tags=[str(tag).strip() for tag in tags if str(tag).strip()],
        herd_size=herd_size,
        number_of_cases=number_of_cases,
    )

    return asdict(normalized)


def get_events(limit: int = 500) -> list[dict[str, Any]]:
    """Reads VetAlert alerts and returns normalized event objects.

    FastAPI-compatible usage example:

        from fastapi import APIRouter
        from backend.events import get_events

        router = APIRouter()

        @router.get("/events")
        def list_events():
            return get_events()

    Notes:
    - Read-only operation (no writes).
    - Expects Google credentials configured in the runtime environment.
    """
    if firestore is None:
        raise RuntimeError(
            "google-cloud-firestore is not available. Install dependency and configure credentials."
        )

    client = firestore.Client(project="vet-alert-brasil")

    query: Iterable[Any] = (
        client.collection("alerts")
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )

    events: list[dict[str, Any]] = []
    for snapshot in query:
        payload = snapshot.to_dict() or {}
        events.append(normalize_event(payload))

    return events
