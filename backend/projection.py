"""Simple time-series trend projection for VetAlert events.

Detects trend direction (increasing, stable, decreasing)
for each signal type per region.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import numpy as np


def _parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.strip().replace("Z", "+00:00")).astimezone(timezone.utc)
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


def _trend_label(slope: float, threshold: float = 0.05) -> str:
    if slope > threshold:
        return "increasing"
    if slope < -threshold:
        return "decreasing"
    return "stable"


def project_trend(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Projects trend direction per signal type and region.

    Returns entries like:
      {
        "signal_type": "Síndrome digestiva",
        "region": "SC:Florianópolis",
        "trend": "increasing",
        "slope": 0.32,
        "points": 7,
        "latest_value": 14,
        "window_start": "2026-01-01T...",
        "window_end": "2026-01-07T..."
      }
    """
    grouped: dict[tuple[str, str], list[tuple[datetime, int]]] = defaultdict(list)

    for event in events:
        ts = _parse_timestamp(event.get("timestamp"))
        if ts is None:
            continue

        signal_type = _normalize_text(event.get("alert_type"))
        region = _region_key(event)

        value = _normalize_int(event.get("number_of_cases") or event.get("cases"), fallback=1)
        grouped[(signal_type, region)].append((ts, value))

    projections: list[dict[str, Any]] = []

    for (signal_type, region), points in grouped.items():
        points.sort(key=lambda item: item[0])
        if len(points) < 2:
            continue

        first_ts = points[0][0]
        x = np.array([(ts - first_ts).total_seconds() / 3600.0 for ts, _ in points], dtype=float)
        y = np.array([value for _, value in points], dtype=float)

        # Degenerate case: if all timestamps collapse, trend is stable.
        if np.allclose(x, x[0]):
            slope = 0.0
        else:
            slope, _intercept = np.polyfit(x, y, deg=1)

        projections.append(
            {
                "signal_type": signal_type,
                "region": region,
                "trend": _trend_label(float(slope)),
                "slope": round(float(slope), 6),
                "points": len(points),
                "latest_value": int(y[-1]),
                "window_start": points[0][0].isoformat(),
                "window_end": points[-1][0].isoformat(),
            }
        )

    projections.sort(key=lambda item: (item["signal_type"], item["region"]))
    return projections
