"""Which findings began at about the time of a logged event (an update, a restart, a plan run).

Only reads the findings of the last scan and Housekeeper's own event log. The result says that two
things happened at about the same time, never that one caused the other. Restarts and plan runs
touch almost everything, so they only appear as groups, not as a line on each finding.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

WINDOW_BEFORE = timedelta(minutes=30)  # an event this long before the finding began still counts
WINDOW_AFTER = timedelta(minutes=10)  # the event may be logged shortly after the finding began
GROUP_ONLY = ("start", "plan", "purge")  # too common to name as a reason on a single finding
GROUP_LIMIT = 50
KEYS_PER_GROUP = 500
BY_KEY_LIMIT = 2000
FIELDS = ("kind", "at", "domain", "from", "to", "down_seconds", "title")


def _parse(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def correlate(findings: list[dict[str, Any]], events: list[dict[str, Any]]) -> dict[str, Any]:
    """Groups of findings per event and, for each finding, the event it began with."""
    parsed = []
    for event in events:
        at = _parse(event.get("at"))
        if at is not None and event.get("kind"):
            parsed.append((at, event))
    groups: dict[str, dict[str, Any]] = {}
    by_key: dict[str, str] = {}
    for finding in findings:
        began = _parse(finding.get("first_detected_at"))
        key = finding.get("key")
        if began is None or not isinstance(key, str) or finding.get("ignored"):
            continue
        for at, event in parsed:
            if not began - WINDOW_BEFORE <= at <= began + WINDOW_AFTER:
                continue
            group_id = f"{event['kind']}|{event['at']}|{event.get('domain', '')}"
            group = groups.get(group_id)
            if group is None:
                group = groups[group_id] = {
                    "id": group_id,
                    **{k: event[k] for k in FIELDS if k in event},
                    "only_group": event["kind"] in GROUP_ONLY,
                    "total": 0,
                    "keys": [],
                }
            group["total"] += 1
            if len(group["keys"]) < KEYS_PER_GROUP:
                group["keys"].append(key)
            if not group["only_group"] and key not in by_key and len(by_key) < BY_KEY_LIMIT:
                by_key[key] = group_id
    ordered = sorted(groups.values(), key=lambda g: g["at"], reverse=True)[:GROUP_LIMIT]
    return {"groups": ordered, "by_key": by_key}
