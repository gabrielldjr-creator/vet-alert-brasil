"""Signal detection engine for VetAlert event streams.

Rules implemented:
1) Cluster: same alert_type appears > 5 times in the same region within 48h.
2) Growth: number_of_cases increases over time for the same region + alert_type.
3) Spread: same alert_type reported by multiple municipalities.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Any

from backend.anomaly import detect_anomalies


@dataclass(frozen=True)
class SignalAlert:
    rule: str
    alert_type: str
    region: str
    municipalities: list[str]
    event_count: int
    message: str
    latest_timestamp: str


def _parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None

    raw = value.strip()
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _normalize_text(value: Any, fallback: str = "unknown") -> str:
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _normalize_int(value: Any, fallback: int = 0) -> int:
    if isinstance(value, bool):
        return fallback
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        digits = "".join(ch for ch in value if ch.isdigit())
        if digits:
            return int(digits)
    return fallback


def _region_key(event: dict[str, Any]) -> str:
    state = _normalize_text(event.get("state"))
    city = _normalize_text(event.get("city") or event.get("municipality"))
    return f"{state}:{city}"


def _municipality_key(event: dict[str, Any]) -> str:
    state = _normalize_text(event.get("state"))
    city = _normalize_text(event.get("city") or event.get("municipality"))
    return f"{city}-{state}"


def flag_clusters(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Rule 1: same alert_type appears more than 5 times in same region within 48h."""
    grouped: dict[tuple[str, str], list[tuple[datetime, dict[str, Any]]]] = defaultdict(list)

    for event in events:
        alert_type = _normalize_text(event.get("alert_type"))
        region = _region_key(event)
        timestamp = _parse_timestamp(event.get("timestamp"))
        if timestamp is None:
            continue
        grouped[(alert_type, region)].append((timestamp, event))

    alerts: list[dict[str, Any]] = []
    window = timedelta(hours=48)

    for (alert_type, region), records in grouped.items():
        records.sort(key=lambda item: item[0])
        left = 0

        for right in range(len(records)):
            while records[right][0] - records[left][0] > window:
                left += 1

            count = right - left + 1
            if count > 5:
                municipalities = sorted(
                    {_municipality_key(item[1]) for item in records[left : right + 1]}
                )
                signal = SignalAlert(
                    rule="cluster",
                    alert_type=alert_type,
                    region=region,
                    municipalities=municipalities,
                    event_count=count,
                    message=(
                        f"Cluster detected: {count} '{alert_type}' events in region {region} within 48h"
                    ),
                    latest_timestamp=records[right][0].isoformat(),
                )
                alerts.append(asdict(signal))
                break

    return alerts


def flag_growth(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Rule 2: number_of_cases increases over time."""
    grouped: dict[tuple[str, str], list[tuple[datetime, int, dict[str, Any]]]] = defaultdict(list)

    for event in events:
        alert_type = _normalize_text(event.get("alert_type"))
        region = _region_key(event)
        timestamp = _parse_timestamp(event.get("timestamp"))
        if timestamp is None:
            continue
        cases = _normalize_int(event.get("number_of_cases") or event.get("cases"))
        grouped[(alert_type, region)].append((timestamp, cases, event))

    alerts: list[dict[str, Any]] = []

    for (alert_type, region), records in grouped.items():
        records.sort(key=lambda item: item[0])
        if len(records) < 2:
            continue

        increasing_steps = 0
        for i in range(1, len(records)):
            if records[i][1] > records[i - 1][1]:
                increasing_steps += 1

        if increasing_steps > 0 and records[-1][1] > records[0][1]:
            signal = SignalAlert(
                rule="growth",
                alert_type=alert_type,
                region=region,
                municipalities=sorted({_municipality_key(item[2]) for item in records}),
                event_count=len(records),
                message=(
                    f"Growth detected: '{alert_type}' cases increased from {records[0][1]} "
                    f"to {records[-1][1]} in {region}"
                ),
                latest_timestamp=records[-1][0].isoformat(),
            )
            alerts.append(asdict(signal))

    return alerts


def flag_spread(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Rule 3: multiple municipalities report the same signal."""
    grouped: dict[str, list[tuple[datetime, dict[str, Any]]]] = defaultdict(list)

    for event in events:
        alert_type = _normalize_text(event.get("alert_type"))
        timestamp = _parse_timestamp(event.get("timestamp"))
        if timestamp is None:
            continue
        grouped[alert_type].append((timestamp, event))

    alerts: list[dict[str, Any]] = []

    for alert_type, records in grouped.items():
        municipalities = sorted({_municipality_key(item[1]) for item in records})
        if len(municipalities) < 2:
            continue

        latest_ts = max(item[0] for item in records).isoformat()
        regions = sorted({_region_key(item[1]) for item in records})
        region_label = ", ".join(regions)

        signal = SignalAlert(
            rule="spread",
            alert_type=alert_type,
            region=region_label,
            municipalities=municipalities,
            event_count=len(records),
            message=(
                f"Spread detected: '{alert_type}' reported by {len(municipalities)} municipalities"
            ),
            latest_timestamp=latest_ts,
        )
        alerts.append(asdict(signal))

    return alerts


def flag_anomalies(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Adds anomaly-based alerts from Isolation Forest outputs."""
    anomaly_rows = detect_anomalies(events)
    alerts: list[dict[str, Any]] = []

    for row in anomaly_rows:
        dominant_region = _normalize_text(row.get("dominant_region"), fallback="unknown:unknown")
        bucket = _normalize_text(row.get("bucket"), fallback="unknown")
        frequency = _normalize_int(row.get("frequency"), fallback=0)
        score = row.get("anomaly_score")
        score_value = float(score) if isinstance(score, (int, float)) else 0.0

        signal = SignalAlert(
            rule="anomaly",
            alert_type="anomaly",
            region=dominant_region,
            municipalities=[dominant_region.split(":", 1)[-1]],
            event_count=frequency,
            message=(
                f"Anomaly detected on {bucket}: unusual frequency/distribution pattern "
                f"(score={score_value:.2f})"
            ),
            latest_timestamp=f"{bucket}T23:59:59+00:00",
        )
        alerts.append(asdict(signal))

    return alerts


def generate_signal_alerts(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Runs all rules and returns combined alert list."""
    alerts: list[dict[str, Any]] = []
    alerts.extend(flag_clusters(events))
    alerts.extend(flag_growth(events))
    alerts.extend(flag_spread(events))
    alerts.extend(flag_anomalies(events))

    # Keep deterministic ordering: newest first, then rule name.
    return sorted(
        alerts,
        key=lambda alert: (
            _parse_timestamp(alert.get("latest_timestamp")) or datetime.min.replace(tzinfo=timezone.utc),
            _normalize_text(alert.get("rule")),
        ),
        reverse=True,
    )
