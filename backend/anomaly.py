"""Anomaly detection for VetAlert events using Isolation Forest.

Detects unusual patterns in:
- frequency of signals over time (daily buckets)
- distribution of signals by region
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest


def _parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.strip().replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _region_key(event: dict[str, Any]) -> str:
    state = str(event.get("state") or "unknown").strip() or "unknown"
    city = str(event.get("city") or event.get("municipality") or "unknown").strip() or "unknown"
    return f"{state}:{city}"


def _build_feature_rows(events: list[dict[str, Any]]) -> tuple[np.ndarray, list[dict[str, Any]]]:
    """Builds per-day feature vectors capturing frequency and regional distribution."""
    valid_events: list[tuple[datetime, str]] = []
    for event in events:
        ts = _parse_timestamp(event.get("timestamp"))
        if ts is None:
            continue
        valid_events.append((ts, _region_key(event)))

    if not valid_events:
        return np.empty((0, 0)), []

    # Per-day counters
    day_total: Counter[str] = Counter()
    day_region: dict[str, Counter[str]] = defaultdict(Counter)
    global_region: Counter[str] = Counter()

    for ts, region in valid_events:
        day = ts.date().isoformat()
        day_total[day] += 1
        day_region[day][region] += 1
        global_region[region] += 1

    all_days = sorted(day_total.keys())
    common_regions = [region for region, _ in global_region.most_common(8)]

    rows: list[list[float]] = []
    meta: list[dict[str, Any]] = []

    for day in all_days:
        total = day_total[day]
        region_counts = day_region[day]

        # Frequency features
        max_region_count = max(region_counts.values()) if region_counts else 0
        unique_regions = len(region_counts)

        # Distribution features: share for top regions + entropy-like concentration proxy
        shares = [region_counts.get(region, 0) / total for region in common_regions]
        concentration = sum((count / total) ** 2 for count in region_counts.values()) if total else 0.0

        row = [
            float(total),
            float(unique_regions),
            float(max_region_count),
            float(concentration),
            *shares,
        ]
        rows.append(row)
        meta.append(
            {
                "bucket": day,
                "frequency": total,
                "unique_regions": unique_regions,
                "top_region_count": max_region_count,
                "dominant_region": region_counts.most_common(1)[0][0] if region_counts else "unknown",
            }
        )

    return np.array(rows, dtype=float), meta


def detect_anomalies(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Detects anomalous daily patterns and returns anomalies with score.

    Output shape:
      [
        {
          "bucket": "YYYY-MM-DD",
          "anomaly_score": 0.91,
          "frequency": 27,
          "unique_regions": 5,
          "top_region_count": 14,
          "dominant_region": "SC:Florianópolis"
        },
        ...
      ]
    """
    X, meta = _build_feature_rows(events)
    if X.size == 0 or len(meta) < 3:
        return []

    model = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42,
    )
    model.fit(X)

    # predict: -1 anomaly, 1 normal
    labels = model.predict(X)
    # decision_function: higher = more normal; invert for anomaly intensity
    raw_scores = -model.decision_function(X)

    anomalies: list[dict[str, Any]] = []
    for idx, label in enumerate(labels):
        if label != -1:
            continue

        # Normalize score to 0..1 across current batch for readability
        score = float(raw_scores[idx])
        min_score = float(np.min(raw_scores))
        max_score = float(np.max(raw_scores))
        if max_score > min_score:
            normalized = (score - min_score) / (max_score - min_score)
        else:
            normalized = 0.0

        anomalies.append(
            {
                **meta[idx],
                "anomaly_score": round(normalized, 4),
            }
        )

    # Highest anomaly score first
    anomalies.sort(key=lambda item: item["anomaly_score"], reverse=True)
    return anomalies
