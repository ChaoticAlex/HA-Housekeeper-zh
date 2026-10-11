"""More quality rules for policies.py: naming, tidiness, automation habits, exposure and recorder.

Every function only reads the snapshot (and a few numbers the caller hands over) and yields the
objects that break the rule. Several rules are heuristics; their texts in the panel say so.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from typing import Any

from .exposure import SENSITIVE_COVERS, SENSITIVE_DOMAINS
from .hygiene import low_battery_ids

SUFFIX = re.compile(r"_(\d+)$")
_OCTET = r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)"
_HEX = r"[0-9a-f]{2}"
# An address in an id: a private IPv4 (192.168.x.x, 10.x.x.x, 172.16-31.x.x; other four numbers
# such as ``sensor_1_2_3_4`` are not taken for one), or a MAC as six pairs or twelve hex digits
# with at least one digit and one letter.
ADDRESS = re.compile(
    rf"(?<![0-9a-z])(?:(?:192_168|10_{_OCTET}|172_(?:1[6-9]|2\d|3[01]))_{_OCTET}_{_OCTET}"
    rf"|{_HEX}(?:_{_HEX}){{5}}"
    rf"|(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{{12}})(?![0-9a-z])"
)
DEFAULT_NAME = re.compile(
    r"^(neue[rsn]?\s+|new\s+)?(automation|automatisierung|skript|script)(\s+\d+)?$", re.IGNORECASE
)
LITERAL_ID = re.compile(
    r"(?:states|is_state|state_attr|is_state_attr|expand)\(\s*['\"]([a-z_]+\.[a-z0-9_]+)['\"]"
)
TRIGGER_LIMIT = 10  # triggers from which an automation is hard to maintain
RECORDER_MIN_PER_DAY = 200  # state changes per day from which an unused entity is worth a hint
RETENTION_DAYS = 30
RETENTION_BYTES = 2 * 1024**3
DASHBOARD_CARDS = 200  # cards from which one dashboard is slow to load and hard to keep
LISTED = 20
SWITCHABLE = ("switch", "light", "fan", "input_boolean", "humidifier")
ERROR_HANDLING_KEYS = ("continue_on_error", "on_error")
BRANCHING_KEYS = ("choose", "if", "condition", "wait_template", "wait_for_trigger")


def _walk(value: Any) -> Iterable[tuple[str, Any]]:
    """Every (key, value) pair of nested dicts and lists."""
    if isinstance(value, dict):
        for key, inner in value.items():
            yield str(key), inner
            yield from _walk(inner)
    elif isinstance(value, list):
        for inner in value:
            yield from _walk(inner)


def _strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for inner in value.values():
            yield from _strings(inner)
    elif isinstance(value, list):
        for inner in value:
            yield from _strings(inner)


def _entity_ids(value: Any) -> set[str]:
    """Entity ids named under an ``entity_id`` key (text or list) anywhere inside ``value``."""
    found: set[str] = set()
    for key, inner in _walk(value):
        if key != "entity_id":
            continue
        for text in [inner] if isinstance(inner, str) else inner if isinstance(inner, list) else []:
            if isinstance(text, str) and "." in text and "{" not in text:
                found.add(text.strip())
    return found


def _config_automations(automations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in automations if item.get("source") != "state_fallback"]


def has_address(object_id: str) -> bool:
    """Whether the id (without its domain) carries an IP or MAC address."""
    return bool(ADDRESS.search(object_id.split(".", 1)[-1]))


def entity_id_address(entities: dict[str, dict[str, Any]]):
    """Ids built from an IP or MAC address: they say nothing about the device."""
    for item in entities.values():
        if has_address(item["object_id"]) and not item.get("disabled_by"):
            yield item


def entity_id_suffix(entities: dict[str, dict[str, Any]]):
    """Ids that end in a counter (``_2``) the name does not carry: a leftover of a rename.

    An id with an address (``..._192_168_79_138``) is no counter; ``entity_id_address`` has it.
    """
    for item in entities.values():
        match = SUFFIX.search(item["object_id"])
        if not match or int(match.group(1)) < 2 or item.get("disabled_by"):
            continue
        if has_address(item["object_id"]):
            continue
        if not str(item.get("name") or "").rstrip().endswith(match.group(1)):
            yield item


def default_name(automations: list[dict[str, Any]], scripts: list[dict[str, Any]]):
    """Automations and scripts that still carry the name the editor proposes."""
    for item in [*automations, *scripts]:
        if DEFAULT_NAME.match(str(item.get("name") or "").strip()):
            yield item


def script_description(scripts: list[dict[str, Any]]):
    for item in scripts:
        if not str(item.get("description") or "").strip():
            yield item


def script_label(scripts: list[dict[str, Any]], with_labels: dict[str, bool]):
    for item in scripts:
        if with_labels.get(item["object_id"]) is False:
            yield item


def device_model(devices: dict[str, dict[str, Any]]):
    """Active, real devices (no service, no sub-device) that name neither manufacturer nor model."""
    for item in devices.values():
        if (
            item.get("status") == "active"
            and item.get("device_kind") != "child"
            and item.get("entry_type") != "service"
            and not (item.get("manufacturer") and item.get("model"))
        ):
            yield item


def area_empty(
    areas: list[dict[str, Any]],
    entities: dict[str, dict[str, Any]],
    devices: dict[str, dict[str, Any]],
):
    used = {i.get("area_id") for i in entities.values()} | {
        i.get("area_id") for i in devices.values()
    }
    for item in areas:
        if item["object_id"] not in used:
            yield item


def label_unused(labels: list[dict[str, Any]], used: set[str], ignore_label: str):
    for item in labels:
        if item["object_id"] != ignore_label and item["object_id"] not in used:
            yield item


def automation_error_handling(automations: list[dict[str, Any]]):
    """Two or more actions, no condition and nothing that handles a failing step (a hint)."""
    for item in _config_automations(automations):
        actions = item.get("actions") or []
        keys = {key for key, _ in _walk(actions)}
        if (
            len(actions) >= 2
            and not item.get("conditions")
            and not keys & set(ERROR_HANDLING_KEYS)
            and not keys & set(BRANCHING_KEYS)
        ):
            yield item


def automation_triggers(automations: list[dict[str, Any]]):
    for item in _config_automations(automations):
        if (item.get("trigger_count") or 0) > TRIGGER_LIMIT:
            yield {**item, "count": item["trigger_count"]}


def automation_literal_ids(automations: list[dict[str, Any]]):
    """Templates that name an entity id as text; a rename breaks them without a warning."""
    for item in _config_automations(automations):
        ids = sorted(
            {
                found
                for block in ("triggers", "conditions", "actions")
                for text in _strings(item.get(block) or [])
                if "{{" in text or "{%" in text
                for found in LITERAL_ID.findall(text)
            }
        )
        if ids:
            yield {**item, "also": ids[:3]}


def automation_self_trigger(automations: list[dict[str, Any]]):
    """A state trigger on an entity the same automation changes (a possible loop)."""
    for item in _config_automations(automations):
        triggered = set()
        for trigger in item.get("triggers") or []:
            if (
                isinstance(trigger, dict)
                and (trigger.get("platform") or trigger.get("trigger")) == "state"
            ):
                triggered |= _entity_ids(trigger)
        changed = _entity_ids(item.get("actions") or [])
        both = sorted(triggered & changed)
        if both:
            yield {**item, "also": both[:3]}


def turn_on_only(
    automations: list[dict[str, Any]],
    scripts: list[dict[str, Any]],
    entities: dict[str, dict[str, Any]],
):
    """Entities that automations or scripts turn on and nothing ever turns off (a hint)."""
    on: set[str] = set()
    off: set[str] = set()
    for item in [*_config_automations(automations), *scripts]:
        for block in item.get("actions") or []:
            if not isinstance(block, dict):
                continue
            service = str(block.get("action") or block.get("service") or "")
            ids = _entity_ids(block)
            if service.endswith(".turn_on"):
                on |= ids
            elif service.endswith((".turn_off", ".toggle")) or service.startswith("scene."):
                off |= ids
    for entity_id in sorted(on - off):
        item = entities.get(entity_id)
        if item is not None and entity_id.split(".", 1)[0] in SWITCHABLE:
            yield item


def referenced(edges: list[dict[str, Any]]) -> set[str]:
    """Entity ids that something refers to."""
    return {
        e["target"].split(":", 1)[1]
        for e in edges
        if str(e.get("target", "")).startswith("entity:")
    }


def exposure_unused(
    exposed: dict[str, list[str]], entities: dict[str, dict[str, Any]], used: set[str]
):
    for entity_id in sorted(exposed):
        item = entities.get(entity_id)
        if item is not None and entity_id not in used:
            yield {**item, "also": exposed[entity_id][:3]}


def exposure_sensitive(exposed: dict[str, list[str]], entities: dict[str, dict[str, Any]]):
    for entity_id in sorted(exposed):
        item = entities.get(entity_id)
        if item is None:
            continue
        domain = entity_id.split(".", 1)[0]
        if domain in SENSITIVE_DOMAINS or (
            domain == "cover" and item.get("device_class") in SENSITIVE_COVERS
        ):
            yield {**item, "also": exposed[entity_id][:3]}


def battery_no_automation(entities: dict[str, dict[str, Any]], used: set[str], threshold: int):
    for entity_id in low_battery_ids(list(entities.values()), threshold):
        if entity_id not in used:
            yield entities[entity_id]


def recorder_unused(entities: dict[str, dict[str, Any]], rates: dict[str, int], used: set[str]):
    for entity_id, per_day in sorted(rates.items()):
        item = entities.get(entity_id)
        if (
            item is not None
            and per_day >= RECORDER_MIN_PER_DAY
            and entity_id not in used
            and not item.get("disabled_by")
        ):
            yield {**item, "rate": per_day}


def recorder_retention(db: dict[str, Any]):
    """One item for the recorder when it keeps long and the database is big."""
    days, size = db.get("keep_days"), db.get("db_bytes")
    if (
        isinstance(days, int)
        and isinstance(size, int)
        and days > RETENTION_DAYS
        and size > RETENTION_BYTES
    ):
        yield {
            "object_type": "recorder",
            "object_id": "recorder",
            "name": "Recorder",
            "keep_days": days,
            "db_bytes": size,
        }


def statistics_issue(kind: str, issues: list[dict[str, Any]], entities: dict[str, dict[str, Any]]):
    """Entities whose statistics changed their ``unit`` or their state ``class`` (see hygiene)."""
    for issue in issues:
        item = entities.get(issue["object_id"])
        if item is not None and issue["kind"] == kind:
            yield {**item, "also": [f"{issue['was']} → {issue['now']}"]}


def dashboard_navigation(dashboards: list[dict[str, Any]]):
    """Buttons that open a view of a dashboard that has no such view."""
    for item in dashboards:
        broken = (item.get("health") or {}).get("broken_navigation")
        if broken:
            yield {**item, "also": broken}


def dashboard_disabled_entities(
    dashboards: list[dict[str, Any]], entities: dict[str, dict[str, Any]]
):
    """Dashboards that show entities which are disabled."""
    for item in dashboards:
        shown = sorted(
            {
                ref["object_id"]
                for ref in item.get("references") or []
                if (entities.get(ref["object_id"]) or {}).get("status") == "disabled"
            }
        )
        if shown:
            yield {**item, "also": shown[:LISTED]}


def dashboard_duplicate_cards(dashboards: list[dict[str, Any]]):
    for item in dashboards:
        doubles = (item.get("health") or {}).get("doubles") or 0
        if doubles:
            yield {**item, "also": [str(doubles)]}


def dashboard_size(dashboards: list[dict[str, Any]]):
    for item in dashboards:
        cards = (item.get("health") or {}).get("cards") or 0
        if cards > DASHBOARD_CARDS:
            yield {**item, "also": [str(cards)]}


def dashboard_custom_cards(dashboards: list[dict[str, Any]]):
    """Custom cards although no dashboard resource is registered at all.

    Whether a given card is loaded cannot be told from the server, so only this sure case counts.
    """
    for item in dashboards:
        health = item.get("health") or {}
        if health.get("custom") and health.get("resources") == 0:
            yield {**item, "also": health["custom"]}
