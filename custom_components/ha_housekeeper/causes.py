"""Common causes behind many "not available" findings: one failed integration, one dead device.

Only reads the objects, edges and findings of the last scan. A cause is a hint, not a proof: when
an integration is not loaded, every entity it provides is unavailable, and one note at the top is
more useful than a hundred findings. The follow-up findings get a ``cause_id`` and stay in the
list; hidden or marked findings do not count. An integration that is not loaded is a cause even
without follow-up findings (``follower_count`` 0), so the outage never goes unnoticed.
"""

from __future__ import annotations

from typing import Any

from .impact import RANK, USAGE

DEVICE_MIN_ENTITIES = 3  # a device with fewer entities is not a pattern
KEY_LIMIT = 500


def _visible(finding: dict[str, Any]) -> bool:
    return finding["classification"] == "unavailable" and not finding.get("ignored")


def _consumers(entity_ids: list[str], users: dict[str, set[str]]) -> dict[str, int]:
    """How many automations, scripts and dashboards use the entities of a cause."""
    sources = {s for entity_id in entity_ids for s in users.get(f"entity:{entity_id}", ())}
    counts = {"automation": 0, "script": 0, "dashboard": 0}
    for source in sources:
        kind = source.split(":", 1)[0]
        if kind in counts:
            counts[kind] += 1
    return {kind: n for kind, n in counts.items() if n}


def _cause(
    kind: str,
    item: dict[str, Any],
    followers: list[dict[str, Any]],
    users: dict[str, set[str]],
    entity_ids: list[str],
) -> dict[str, Any]:
    cause = {
        "id": f"{kind}:{item['object_id']}",
        "kind": kind,
        "object_type": item["object_type"],
        "object_id": item["object_id"],
        "name": item.get("name") or item["object_id"],
        "follower_count": len(followers),
        "follower_keys": [f["key"] for f in followers[:KEY_LIMIT]],
        "consumers": _consumers(entity_ids, users),
        "impact": max(
            (f.get("impact", "none") for f in followers), default="none", key=RANK.__getitem__
        ),
    }
    if kind == "integration_down":
        cause.update(domain=item.get("domain"), state=item.get("state"), error=item.get("error"))
    return cause


def apply_causes(
    objects: list[dict[str, Any]], edges: list[dict[str, Any]], findings: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Set ``cause_id`` on the follow-up findings and return the causes, most followers first.

    Call it after the marks and the impact are applied: it counts only findings that are shown.
    """
    for finding in findings:
        finding.pop("cause_id", None)
    entity = {o["object_id"]: o for o in objects if o["object_type"] == "entity"}
    by_object = {
        f["object_id"]: f
        for f in findings
        if f["rule_id"].startswith("entity.") and _visible(f) and f["object_id"] in entity
    }
    causes: list[dict[str, Any]] = []
    # Who uses what, built once: looking it up per cause in all edges grew with causes x edges.
    users: dict[str, set[str]] = {}
    for edge in edges:
        if edge["relation"] in USAGE:
            users.setdefault(edge["target"], set()).add(edge["source"])

    def take(
        kind: str, item: dict[str, Any], entity_ids: list[str], *, alone: bool = False
    ) -> None:
        followers = [
            by_object[i] for i in entity_ids if i in by_object and "cause_id" not in by_object[i]
        ]
        if not followers and not alone:
            return
        # An integration that is down is an outage even when no entity of it is flagged. Its
        # consumers are counted from all its entities, so the note says what it touches.
        cause = _cause(
            kind,
            item,
            followers,
            users,
            entity_ids if alone else [f["object_id"] for f in followers],
        )
        for finding in followers:
            finding["cause_id"] = cause["id"]
        causes.append(cause)

    provided: dict[str, list[str]] = {}
    for item in entity.values():
        if item.get("config_entry_id"):
            provided.setdefault(item["config_entry_id"], []).append(item["object_id"])
    for item in objects:
        if item["object_type"] == "config_entry" and item["status"] == "problem":
            take("integration_down", item, provided.get(item["object_id"], []), alone=True)

    members: dict[str, list[str]] = {}
    for item in entity.values():
        if item.get("device_id"):
            members.setdefault(item["device_id"], []).append(item["object_id"])
    for item in objects:
        if item["object_type"] != "device":
            continue
        ids = members.get(item["object_id"], [])
        if len(ids) >= DEVICE_MIN_ENTITIES and all(
            entity[i]["status"] == "unavailable" for i in ids
        ):
            take("device_down", item, ids)

    return sorted(causes, key=lambda c: (-c["follower_count"], c["id"]))
