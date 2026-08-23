"""Trusted, downstream integrity sidecars; never mutates observations."""
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import secrets
from typing import Any

SCHEMA_VERSION = "vetalert-observation-1"
RESERVED_FIELDS = frozenset({"submissionId", "receivedAt", "schemaVersion", "sourceChannel", "integrity"})
PROHIBITED_KEYS = frozenset({
    "crmv", "veterinarianName", "veterinario", "cpf", "producer", "producerName",
    "farm", "farmName", "property", "propertyName", "email", "phone", "telefone",
    "latitude", "longitude", "coordinates", "authUid", "firebaseUid", "uid", "ip",
    "ipAddress", "userAgent", "deviceId",
})


def _walk_keys(value: Any) -> set[str]:
    if not isinstance(value, dict):
        return set()
    found = set(value)
    for child in value.values():
        if isinstance(child, dict):
            found |= _walk_keys(child)
        elif isinstance(child, list):
            for item in child:
                found |= _walk_keys(item)
    return found


def validate_observation(observation: dict[str, Any]) -> None:
    keys = _walk_keys(observation)
    forbidden = sorted(keys & (RESERVED_FIELDS | PROHIBITED_KEYS))
    if forbidden:
        raise ValueError(f"client payload contains prohibited/reserved fields: {', '.join(forbidden)}")


def _canonical_dimensions(observation: dict[str, Any]) -> dict[str, Any]:
    return {key: observation.get(key) for key in (
        "state", "cityCode", "species", "alertGroup", "alertType", "severity", "cases", "herdCount", "source"
    )}


def content_digest(observation: dict[str, Any], secret: bytes) -> str:
    encoded = json.dumps(_canonical_dimensions(observation), sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()
    return hmac.new(secret, encoded, hashlib.sha256).hexdigest()


class PrivacyRateLimiter:
    """Transient limiter: only keyed HMACs live in memory; raw identifiers are discarded."""
    def __init__(self, secret: bytes, limit: int = 6, window_seconds: int = 60):
        self.secret, self.limit = secret, limit
        self.window = timedelta(seconds=window_seconds)
        self._events: dict[str, deque[datetime]] = defaultdict(deque)

    def check(self, transient_key: str, now: datetime) -> bool:
        key = hmac.new(self.secret, transient_key.encode(), hashlib.sha256).hexdigest()
        events = self._events[key]
        while events and now - events[0] > self.window:
            events.popleft()
        events.append(now)
        return len(events) > self.limit


class IntegrityProcessor:
    def __init__(self, secret: bytes, duplicate_window_hours: int = 24, limiter: PrivacyRateLimiter | None = None):
        if not secret:
            raise ValueError("an environment-managed integrity secret is required")
        self.secret = secret
        self.duplicate_window = timedelta(hours=duplicate_window_hours)
        self.limiter = limiter or PrivacyRateLimiter(secret)
        self._digests: dict[str, datetime] = {}

    def process(self, observation: dict[str, Any], transient_rate_key: str, now: datetime | None = None) -> dict[str, Any]:
        validate_observation(observation)
        received = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        digest = content_digest(observation, self.secret)
        previous = self._digests.get(digest)
        duplicate = previous is not None and received - previous <= self.duplicate_window
        self._digests[digest] = received
        rate_flag = self.limiter.check(transient_rate_key, received)
        return {
            "submissionId": secrets.token_urlsafe(24),
            "receivedAt": received.isoformat(),
            "schemaVersion": SCHEMA_VERSION,
            "sourceChannel": "agro-retail" if observation.get("source") == "agro_retail" else "veterinary",
            "integrity": {
                "version": "integrity-1", "contentDigest": digest,
                "duplicateSuspicion": duplicate, "rateLimitSuspicion": rate_flag,
                "suspicious": duplicate or rate_flag,
                "professionalEligibility": {"status": "unverified", "eligibleProfessional": None},
            },
        }
