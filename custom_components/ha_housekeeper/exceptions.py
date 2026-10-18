"""Exception rules: objects in an area, with a label, of an integration or of a type are left out.

Stored by Housekeeper only; Home Assistant stays untouched. A rule names areas, labels, integrations or domains (one or
more of them) and an action: ``hide`` hides every finding of the matching objects, ``delay``
holds back only the findings about an outage until it lasted ``days`` days. An entity counts with
its own area, or the one of its device when it has none, and with its own labels and those of
its device. A finding of a matching object that is hidden by a rule cannot be shown again one by
one: what the object is (its area, label, integration or domain) is what decides.
An ``integration`` rule matches the platform of an entity, or the integrations of a device; a ``domain``
rule the part of the entity id before the dot.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Any, NamedTuple

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from .const import EXCEPTIONS_STORAGE_KEY, STORAGE_VERSION

SAVE_DELAY = 5
KINDS = ("area", "label", "integration", "domain")
ACTIONS = ("hide", "delay")
ITEM_LIMIT = 100
TARGET_LIMIT = 50
TARGET_LENGTH = 255
NOTE_MAX = 200
DAYS_MAX = 365
DAYS_DEFAULT = 7
AVAILABILITY = frozenset({"unavailable", "unknown", "stale"})  # what a delay rule holds back


class Traits(NamedTuple):
    """What a rule can look at: the area, the labels, the integrations and the domain."""

    area: str | None
    labels: frozenset[str]
    platforms: frozenset[str] = frozenset()
    domain: str | None = None


def clean_rule(raw: Any) -> dict[str, Any] | None:
    """One rule in its known shape, or None when it cannot be one."""
    if not isinstance(raw, dict) or raw.get("kind") not in KINDS:
        return None
    targets = raw.get("targets")
    if not isinstance(targets, list):
        return None
    clean = list(
        dict.fromkeys(t for t in targets if isinstance(t, str) and 0 < len(t) <= TARGET_LENGTH)
    )
    if not clean or len(clean) > TARGET_LIMIT:
        return None
    action = raw.get("action") if raw.get("action") in ACTIONS else "hide"
    days = raw.get("days")
    days = (
        min(max(days, 1), DAYS_MAX)
        if isinstance(days, int) and not isinstance(days, bool)
        else DAYS_DEFAULT
    )
    rule_id = raw.get("id")
    return {
        "id": rule_id
        if isinstance(rule_id, str) and 0 < len(rule_id) <= 40
        else secrets.token_hex(4),
        "kind": raw["kind"],
        "targets": clean,
        "action": action,
        "days": days if action == "delay" else None,
        "enabled": raw.get("enabled") is not False,
        "note": str(raw.get("note") or "").strip()[:NOTE_MAX],
    }


def traits(hass: HomeAssistant, object_type: str, object_id: str) -> Traits | None:
    """The area and the labels that count for an entity or a device; None for anything else."""
    devices = dr.async_get(hass)
    if object_type == "device":
        device = devices.async_get(object_id)
        if device is None:
            return None
        entries = (hass.config_entries.async_get_entry(i) for i in device.config_entries)
        return Traits(
            device.area_id,
            frozenset(device.labels),
            frozenset(e.domain for e in entries if e is not None),
        )
    if object_type != "entity":
        return None
    entry = er.async_get(hass).async_get(object_id)
    if entry is None:
        return None
    device = devices.async_get(entry.device_id) if entry.device_id else None
    area = entry.area_id or (device.area_id if device is not None else None)
    return Traits(
        area,
        frozenset(entry.labels) | frozenset(device.labels if device is not None else ()),
        frozenset({entry.platform}),
        entry.entity_id.partition(".")[0],
    )


def matches(rule: dict[str, Any], found: Traits) -> bool:
    """Whether an enabled rule covers an object with this area and these labels."""
    if not rule["enabled"]:
        return False
    targets = rule["targets"]
    if rule["kind"] == "area":
        return found.area is not None and found.area in targets
    if rule["kind"] == "integration":
        return not found.platforms.isdisjoint(targets)
    if rule["kind"] == "domain":
        return found.domain is not None and found.domain in targets
    return not found.labels.isdisjoint(targets)


def _since(finding: dict[str, Any]) -> datetime | None:
    try:
        return datetime.fromisoformat(finding["first_detected_at"])
    except (KeyError, TypeError, ValueError):
        return None


def is_outage(finding: dict[str, Any]) -> bool:
    """Whether a finding is about an object that is not reachable, which a delay can wait for."""
    return finding.get("classification") in AVAILABILITY or finding.get("rule_id") == "device.down"


def verdict(
    rules: list[dict[str, Any]], found: Traits, finding: dict[str, Any], now: datetime
) -> dict[str, Any] | None:
    """What the rules do with one finding of an object with these traits.

    ``state`` is ``hide`` (hidden for good), ``hold`` (an outage not yet old enough, with the
    moment it is, in ``until``) or ``due`` (the delay has passed, so the finding shows with a note).
    ``hide`` beats ``delay``; of several delays the longest counts.
    """
    hits = [rule for rule in rules if matches(rule, found)]
    for rule in hits:
        if rule["action"] == "hide":
            return {"state": "hide", "rule": _brief(rule), "until": None}
    delays = [rule for rule in hits if rule["action"] == "delay"]
    since = _since(finding)
    if not delays or not is_outage(finding) or since is None:
        return None
    rule = max(delays, key=lambda r: r["days"])
    until = since + timedelta(days=rule["days"])
    return {
        "state": "hold" if now < until else "due",
        "rule": _brief(rule),
        "until": until.isoformat(),
    }


def _brief(rule: dict[str, Any]) -> dict[str, Any]:
    return {k: rule[k] for k in ("id", "kind", "targets", "action", "days")}


class ExceptionStore:
    """The list of exception rules."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, EXCEPTIONS_STORAGE_KEY)
        self.rules: list[dict[str, Any]] = []

    async def async_load(self) -> None:
        data = await self._store.async_load()
        items = data.get("rules") if isinstance(data, dict) else None
        cleaned = (clean_rule(item) for item in items) if isinstance(items, list) else ()
        self.rules = [rule for rule in cleaned if rule is not None][:ITEM_LIMIT]

    def set_rules(self, raw: list[Any]) -> str | None:
        """Replace all rules; the reason it failed, or None."""
        if len(raw) > ITEM_LIMIT:
            return "too_many"
        cleaned = [clean_rule(item) for item in raw]
        if any(rule is None for rule in cleaned):
            return "invalid"
        self.rules = [rule for rule in cleaned if rule is not None]
        self._store.async_delay_save(lambda: {"rules": self.rules}, SAVE_DELAY)
        return None


def preview(
    hass: HomeAssistant, rule: dict[str, Any], snapshot: dict[str, Any], now: datetime
) -> dict[str, Any]:
    """What one rule does to the findings of the last scan: counts, and the ones of high impact."""
    names = {i["object_id"]: i["name"] for i in snapshot.get("objects", []) if i.get("name")}
    counts = {"hide": 0, "hold": 0, "due": 0}
    objects: set[str] = set()
    important: list[dict[str, str]] = []
    for finding in snapshot.get("findings", []):
        if finding.get("ignored_by") not in (None, "rule"):
            continue
        object_id = finding["object_id"]
        found = traits(hass, "entity" if "." in object_id else "device", object_id)
        result = verdict([rule], found, finding, now) if found is not None else None
        if result is None:
            continue
        counts[result["state"]] += 1
        objects.add(object_id)
        if result["state"] != "due" and finding.get("impact") == "high" and len(important) < 5:
            important.append({"object_id": object_id, "name": names.get(object_id, object_id)})
    return {**counts, "objects": len(objects), "important": important}
