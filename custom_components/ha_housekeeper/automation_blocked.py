"""Automations that cannot start because every one of their triggers watches a dead entity.

An automation with a time trigger next to a dead sensor still runs, so it counts only when each
trigger refers to entities and all of them are out of order. A trigger without an entity (time,
sun, webhook, template, device) counts as working: it is not known to be dead. "Dead" is what the
entity findings already say (not available for longer than the grace, or orphaned), so what the
person has marked or hidden stays out here as well.
"""

from __future__ import annotations

import re
from typing import Any

TRIGGER_PATH = re.compile(r"^triggers?/(\d+)/")
DEAD = ("unavailable", "orphaned")
LIST_LIMIT = 10  # entities named in the evidence


def dead_entities(findings: list[dict[str, Any]]) -> set[str]:
    """The entities with an open "not available" or "orphaned" finding."""
    return {
        f["object_id"]
        for f in findings
        if f["rule_id"].startswith("entity.")
        and f["classification"] in DEAD
        and not f.get("ignored")
    }


def blocked_automation_findings(
    automations: list[dict[str, Any]], findings: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """One finding for each active automation whose triggers are all dead."""
    dead = dead_entities(findings)
    if not dead:
        return []
    result = []
    for item in automations:
        if item["object_type"] != "automation" or item["status"] != "active":
            continue
        count = item.get("trigger_count") or 0
        if not count:
            continue
        by_trigger: dict[int, list[str]] = {}
        for ref in item.get("references") or []:
            match = TRIGGER_PATH.match(ref.get("location") or "")
            if ref.get("relation") == "TRIGGERS_ON" and ref["kind"] == "entity" and match:
                by_trigger.setdefault(int(match[1]), []).append(ref["object_id"])
        if len(by_trigger) != count or not all(set(ids) <= dead for ids in by_trigger.values()):
            continue
        entities = sorted({i for ids in by_trigger.values() for i in ids})
        result.append(
            {
                "rule_id": "automation.blocked",
                "object_id": item["object_id"],
                "classification": "problem",
                "confidence": 0.8,
                "first_detected_at": None,
                "evidence": [
                    {
                        "kind": "dead_triggers",
                        "source": "automation_config",
                        "entities": entities[:LIST_LIMIT],
                        "total": len(entities),
                    }
                ],
            }
        )
    return result
