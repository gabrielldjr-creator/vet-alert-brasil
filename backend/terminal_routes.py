"""FastAPI routes for terminal-facing VetAlert event feeds."""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.events import get_events
from backend.signal_engine import generate_signal_alerts
from backend.projection import project_trend

terminal_router = APIRouter(prefix="/terminal", tags=["terminal"])


def _timestamp_sort_key(event: dict[str, Any]) -> datetime:
    value = event.get("timestamp")
    if isinstance(value, str) and value.strip():
        raw = value.strip()
        try:
            # Handle trailing Z and standard ISO-8601 values.
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            pass

    return datetime.min.replace(tzinfo=timezone.utc)


@terminal_router.get("/events")
def get_terminal_events() -> list[dict[str, Any]]:
    """Returns the latest 100 normalized events sorted by timestamp (descending)."""
    events = get_events(limit=100)
    return sorted(events, key=_timestamp_sort_key, reverse=True)


def _sequenced_events() -> list[dict[str, Any]]:
    """Loads and orders events to simulate real-time playback."""
    events = get_events(limit=100)
    # Playback from older to newer to mimic a live timeline.
    return sorted(events, key=_timestamp_sort_key)


def _demo_events() -> list[dict[str, Any]]:
    now = datetime.now(tz=timezone.utc)
    return [
        {
            "timestamp": (now - timedelta(minutes=6)).isoformat(),
            "state": "SC",
            "city": "Florianópolis",
            "species": "Bovinos",
            "alert_type": "Síndrome digestiva",
            "number_of_cases": 3,
        },
        {
            "timestamp": (now - timedelta(minutes=4)).isoformat(),
            "state": "PR",
            "city": "Londrina",
            "species": "Equinos",
            "alert_type": "Suspeita de intoxicação",
            "number_of_cases": 5,
        },
        {
            "timestamp": (now - timedelta(minutes=2)).isoformat(),
            "state": "MG",
            "city": "Uberlândia",
            "species": "Aves",
            "alert_type": "Síndrome respiratória",
            "number_of_cases": 7,
        },
    ]


def _load_replay_events() -> list[dict[str, Any]]:
    now = datetime.now(tz=timezone.utc)
    cutoff = now - timedelta(days=90)

    try:
        historical = get_events(limit=5000)
    except Exception:
        historical = []

    replay_events = [event for event in historical if _timestamp_sort_key(event) >= cutoff]
    replay_events.sort(key=_timestamp_sort_key)

    return replay_events if replay_events else _demo_events()


def _load_live_events_pool() -> list[dict[str, Any]]:
    try:
        recent = get_events(limit=120)
    except Exception:
        recent = []

    if recent:
        return sorted(recent, key=_timestamp_sort_key)

    return _demo_events()


@terminal_router.websocket("/stream")
async def terminal_stream(websocket: WebSocket) -> None:
    """Supports replay/live modes and keeps connection alive with heartbeats."""
    await websocket.accept()

    mode = websocket.query_params.get("mode", "live").strip().lower()
    if mode not in {"live", "replay"}:
        mode = "live"

    try:
        # Immediate frame so proxies/load-balancers do not close idle sockets.
        await websocket.send_json({"type": "heartbeat", "message": "alive", "mode": mode})

        if mode == "replay":
            try:
                replay_events = await asyncio.wait_for(asyncio.to_thread(_load_replay_events), timeout=60)
            except asyncio.TimeoutError:
                replay_events = _demo_events()

            for event in replay_events:
                await websocket.send_json({"type": "event", "data": event, "mode": "replay"})
                await asyncio.sleep(random.uniform(1.0, 2.0))

            # Replay finished: continue heartbeat keepalive.
            while True:
                await websocket.send_json({"type": "heartbeat", "message": "alive", "mode": mode})
                await asyncio.sleep(2)
        else:
            try:
                live_pool = await asyncio.wait_for(asyncio.to_thread(_load_live_events_pool), timeout=10)
            except asyncio.TimeoutError:
                live_pool = _demo_events()

            index = 0
            while True:
                event = live_pool[index % len(live_pool)]
                await websocket.send_json({"type": "event", "data": event, "mode": "live"})
                index += 1
                await asyncio.sleep(random.uniform(1.0, 2.0))
    except WebSocketDisconnect:
        return



def _confidence_score(signal_alert: dict[str, Any]) -> float:
    """Basic heuristic confidence score in [0, 1]."""
    rule_type = str(signal_alert.get("rule") or "").lower()
    event_count = int(signal_alert.get("event_count") or 0)
    municipalities = signal_alert.get("municipalities") or []
    municipality_count = len(municipalities) if isinstance(municipalities, list) else 0

    base_by_rule = {
        "cluster": 0.60,
        "growth": 0.55,
        "spread": 0.58,
    }
    base = base_by_rule.get(rule_type, 0.50)

    volume_boost = min(event_count / 25, 0.25)
    spread_boost = min(municipality_count / 20, 0.15)

    return round(min(base + volume_boost + spread_boost, 0.99), 2)


def _related_events(signal_alert: dict[str, Any], events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    alert_type = str(signal_alert.get("alert_type") or "").strip()
    target_municipalities = signal_alert.get("municipalities")
    municipalities = set(target_municipalities) if isinstance(target_municipalities, list) else set()

    related: list[dict[str, Any]] = []
    for event in events:
        if str(event.get("alert_type") or "").strip() != alert_type:
            continue

        municipality = f"{str(event.get('city') or event.get('municipality') or 'unknown').strip() or 'unknown'}-{str(event.get('state') or 'unknown').strip() or 'unknown'}"

        if municipalities and municipality not in municipalities:
            continue

        related.append(event)

    return related[:25]


def _trend_direction(signal_alert: dict[str, Any], trends: list[dict[str, Any]]) -> str:
    alert_type = str(signal_alert.get("alert_type") or "").strip()
    location = str(signal_alert.get("region") or "").strip()

    if not alert_type:
        return "stable"

    matches = [item for item in trends if str(item.get("signal_type") or "").strip() == alert_type]
    if location:
        exact = [item for item in matches if str(item.get("region") or "").strip() == location]
        if exact:
            matches = exact

    if not matches:
        return "stable"

    trend_counts: dict[str, int] = {"increasing": 0, "stable": 0, "decreasing": 0}
    for item in matches:
        trend = str(item.get("trend") or "stable").lower()
        if trend in trend_counts:
            trend_counts[trend] += 1

    # Prefer stronger signals first.
    if trend_counts["increasing"] > 0:
        return "increasing"
    if trend_counts["decreasing"] > 0:
        return "decreasing"
    return "stable"


def _escalation_probability(signal_alert: dict[str, Any], trend_direction: str) -> float:
    """Simple heuristic probability of escalation in [0, 1]."""
    confidence = _confidence_score(signal_alert)
    rule_type = str(signal_alert.get("rule") or "").lower()

    base = confidence

    if trend_direction == "increasing":
        base += 0.15
    elif trend_direction == "decreasing":
        base -= 0.10

    if rule_type == "growth":
        base += 0.10
    elif rule_type == "cluster":
        base += 0.07
    elif rule_type == "spread":
        base += 0.05
    elif rule_type == "anomaly":
        base += 0.03

    return round(min(max(base, 0.01), 0.99), 2)


def _demo_alerts() -> list[dict[str, Any]]:
    return [
        {
            "type": "cluster",
            "location": "SC:Florianópolis",
            "confidence_score": 0.72,
            "trend_direction": "increasing",
            "probability_of_escalation": 0.81,
            "related_events": _demo_events(),
        }
    ]


@terminal_router.get("/alerts")
def get_terminal_alerts() -> list[dict[str, Any]]:
    """Returns detected signal alerts based on normalized terminal events."""
    events = get_terminal_events()
    detected = generate_signal_alerts(events)
    trends = project_trend(events)

    response: list[dict[str, Any]] = []
    for signal_alert in detected:
        rule_type = str(signal_alert.get("rule") or "unknown").lower()
        location = str(signal_alert.get("region") or "unknown")

        trend_direction = _trend_direction(signal_alert, trends)
        response.append(
            {
                "type": rule_type,
                "location": location,
                "confidence_score": _confidence_score(signal_alert),
                "trend_direction": trend_direction,
                "probability_of_escalation": _escalation_probability(signal_alert, trend_direction),
                "related_events": _related_events(signal_alert, events),
            }
        )

    return response if response else _demo_alerts()
