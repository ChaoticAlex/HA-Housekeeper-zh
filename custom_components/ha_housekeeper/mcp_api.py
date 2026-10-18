"""What a program gets from Housekeeper through Home Assistant services (AI access).

Every function lives here once: it checks who asks and whether the switch is on, validates the
parameters, answers with a short, fixed shape and writes the call to the log. The services only
hand their data in. Answers are limited so an agent is not flooded: a list is at most ``LIMIT_MAX``
long and comes with a total and a cursor. Names are texts of the user, shortened and cleaned; they
are data for the reader, never instructions.
"""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass
from fnmatch import fnmatchcase
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant

from .const import API_SCHEMA
from .inventory import InventoryScanner
from .marks import mark_key
from .mcp_access import short_params

LEVELS = ("info", "low", "medium", "high")
RANK = {"none": 0, "info": 1, "low": 2, "medium": 3, "high": 4}
LIMIT_DEFAULT = 20
LIMIT_MAX = 50
TEXT_LIMIT = 80
REASON_SHOWN = 120
DECISIONS = ("hide", "include", "only")

_CONTROL = re.compile(r"[\x00-\x1f\x7f]+")


class McpError(Exception):
    """A call that did not go through; ``reason`` is the key of the message."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


def clean_text(value: Any, limit: int = TEXT_LIMIT) -> str:
    """A text of the user as an answer carries it: one line, no control characters, shortened."""
    text = _CONTROL.sub(" ", str(value or "")).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


FINDINGS_SCHEMA = vol.Schema(
    {
        vol.Optional("rule"): vol.All(str, vol.Length(max=80)),
        vol.Optional("level"): vol.In(LEVELS),
        vol.Optional("classification"): vol.All(str, vol.Length(max=40)),
        vol.Optional("object_type"): vol.All(str, vol.Length(max=40)),
        vol.Optional("search"): vol.All(str, vol.Length(max=80)),
        vol.Optional("ignored", default="hide"): vol.In(DECISIONS),
        vol.Optional("limit", default=LIMIT_DEFAULT): vol.All(int, vol.Range(min=1, max=LIMIT_MAX)),
        vol.Optional("cursor"): vol.All(str, vol.Length(max=12), vol.Match(r"^\d+$")),
    }
)
STATUS_SCHEMA = vol.Schema({})
OBJECT_SCHEMA = vol.Schema(
    {
        vol.Required("object_type"): vol.All(str, vol.Length(min=1, max=40)),
        vol.Required("object_id"): vol.All(str, vol.Length(min=1, max=255)),
    }
)
RELATION_LIMIT = 25
USED = ("TRIGGERS_ON", "USES_AS_CONDITION", "TARGETS", "REFERENCES", "SHOWS", "INCLUDES")
BELONGS = ("OWNS", "PROVIDES", "CONTAINS", "VIA_DEVICE")
OBJECT_FIELDS = (
    "status",
    "reason",
    "status_since",
    "platform",
    "domain",
    "device_class",
    "area_id",
    "device_id",
    "config_entry_id",
    "disabled_by",
    "hidden_by",
    "critical",
    "integration_name",
    "manufacturer",
    "model",
)
NOTES_SHOWN = 5
AUDIT_SCHEMA = vol.Schema(
    {
        vol.Optional("kind"): vol.In(("read", "write", "denied")),
        vol.Optional("failed", default=False): bool,
        vol.Optional("limit", default=LIMIT_DEFAULT): vol.All(int, vol.Range(min=1, max=LIMIT_MAX)),
    }
)


def _snapshot(scanner: InventoryScanner) -> dict[str, Any]:
    snapshot = scanner.snapshot
    if snapshot is None:
        raise McpError("no_scan")
    return snapshot


def status(scanner: InventoryScanner, data: dict[str, Any]) -> dict[str, Any]:
    """Where the last scan stands and how many findings there are, no names."""
    snapshot = scanner.snapshot
    result: dict[str, Any] = {
        "schema": API_SCHEMA,
        "version": scanner.version,
        "running": bool(scanner.status.get("running")),
        "warming_up": scanner.warming_up,
        "can_write": scanner.mcp.can_write,
        "scanned_at": None,
    }
    if snapshot is not None:
        active = [f for f in snapshot["findings"] if not f.get("ignored")]
        result.update(
            scanned_at=snapshot["meta"]["scanned_at"],
            preliminary=bool(snapshot["meta"].get("preliminary")),
            findings=len(active),
            hidden=len(snapshot["findings"]) - len(active),
            by_level=dict(Counter(f.get("impact") or "none" for f in active)),
        )
    return result


def findings(scanner: InventoryScanner, data: dict[str, Any]) -> dict[str, Any]:
    """Findings, most important first, filtered and in pages of at most ``LIMIT_MAX``."""
    snapshot = _snapshot(scanner)
    objects: dict[str, dict[str, Any]] = {}
    for item in snapshot["objects"]:
        objects.setdefault(item["object_id"], item)
    rule = data.get("rule", "").lower()
    needle = data.get("search", "").lower()
    floor = RANK[data["level"]] if "level" in data else 0
    mode = data["ignored"]
    rows: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for finding in snapshot["findings"]:
        hidden = bool(finding.get("ignored"))
        if (mode == "hide" and hidden) or (mode == "only" and not hidden):
            continue
        if RANK.get(finding.get("impact") or "none", 0) < floor:
            continue
        if rule and not fnmatchcase(finding["rule_id"].lower(), rule):
            continue
        if "classification" in data and finding["classification"] != data["classification"]:
            continue
        target = objects.get(finding["object_id"], {})
        if "object_type" in data and target.get("object_type") != data["object_type"]:
            continue
        if (
            needle
            and needle not in finding["object_id"].lower()
            and needle not in str(target.get("name") or "").lower()
        ):
            continue
        rows.append((finding, target))
    rows.sort(
        key=lambda row: (
            -RANK.get(row[0].get("impact") or "none", 0),
            row[0].get("first_detected_at") or "",
            row[0]["key"],
        )
    )
    start = int(data.get("cursor", 0))
    page = rows[start : start + data["limit"]]
    items = []
    for finding, target in page:
        item: dict[str, Any] = {
            "key": finding["key"],
            "rule": finding["rule_id"],
            "object_id": finding["object_id"],
            "type": target.get("object_type"),
            "name": clean_text(target.get("name")),
            "level": finding.get("impact") or "none",
            "state": finding["classification"],
            "since": finding.get("first_detected_at"),
        }
        if finding.get("affected_object"):
            item["affected"] = finding["affected_object"]
        if finding.get("ignored"):
            info = finding.get("ignore_info") or {}
            item["decision"] = {
                "kind": info.get("kind") or "ignore",
                "reason": clean_text(info.get("reason"), REASON_SHOWN),
                "until": info.get("until"),
            }
        items.append(item)
    end = start + len(page)
    return {
        "schema": API_SCHEMA,
        "scanned_at": snapshot["meta"]["scanned_at"],
        "preliminary": bool(snapshot["meta"].get("preliminary")),
        "total": len(rows),
        "returned": len(items),
        "next_cursor": str(end) if end < len(rows) else None,
        "by_level": dict(Counter(r[0].get("impact") or "none" for r in rows)),
        "by_rule": dict(Counter(r[0]["rule_id"] for r in rows)),
        "findings": items,
    }


def _related(
    edges: list[dict[str, Any]],
    objects: dict[str, dict[str, Any]],
    me: str,
    relations: tuple[str, ...],
    outgoing: bool,
) -> dict[str, Any]:
    """The objects at the other end of the edges of one kind, a page of them and the total."""
    own, other = ("source", "target") if outgoing else ("target", "source")
    rows = [(e[other], e["relation"]) for e in edges if e[own] == me and e["relation"] in relations]
    items = []
    for ref, relation in rows[:RELATION_LIMIT]:
        kind, _, ident = ref.partition(":")
        items.append(
            {
                "type": kind,
                "id": ident,
                "name": clean_text(objects.get(ref, {}).get("name")),
                "relation": relation,
            }
        )
    return {"total": len(rows), "items": items}


def object_card(scanner: InventoryScanner, data: dict[str, Any]) -> dict[str, Any]:
    """One object: what it is, what was decided about it, its findings and how it is connected."""
    snapshot = _snapshot(scanner)
    kind, ident = data["object_type"], data["object_id"]
    me = f"{kind}:{ident}"
    objects = {f"{o['object_type']}:{o['object_id']}": o for o in snapshot["objects"]}
    item = objects.get(me)
    if item is None:
        raise McpError("not_found")
    card = {k: item[k] for k in OBJECT_FIELDS if item.get(k) not in (None, "")}
    card.update(type=kind, id=ident, name=clean_text(item.get("name")))
    if item.get("labels"):
        card["labels"] = [clean_text(label, 40) for label in item["labels"][:10]]
    found = [f for f in snapshot["findings"] if f["object_id"] == ident]
    best = max(
        (RANK.get(f.get("impact") or "none", 0) for f in found if not f.get("ignored")), default=0
    )
    mark = scanner.marks.items.get(mark_key(kind, ident))
    used_by = _related(snapshot["edges"], objects, me, USED, outgoing=False)
    return {
        "schema": API_SCHEMA,
        "object": card,
        "mark": (
            {
                "kind": mark.get("kind"),
                "reason": clean_text(mark.get("reason"), REASON_SHOWN),
                "until": mark.get("until"),
            }
            if mark
            else None
        ),
        "notes": [
            {
                "at": n["at"],
                "title": clean_text(n.get("title")),
                "note": clean_text(n.get("note"), 300),
            }
            for n in scanner.notes.view()
            if n.get("target") == ident
        ][:NOTES_SHOWN],
        "findings": [
            {
                "key": f["key"],
                "rule": f["rule_id"],
                "level": f.get("impact") or "none",
                "state": f["classification"],
                "since": f.get("first_detected_at"),
                "hidden": bool(f.get("ignored")),
            }
            for f in found[:RELATION_LIMIT]
        ],
        "impact": {
            "level": next((lv for lv, rank in RANK.items() if rank == best), "none"),
            "used_by": used_by["total"],
            "critical": bool(item.get("critical")),
        },
        "used_by": used_by,
        "uses": _related(snapshot["edges"], objects, me, USED, outgoing=True),
        "belongs_to": _related(snapshot["edges"], objects, me, BELONGS, outgoing=False),
        "contains": _related(snapshot["edges"], objects, me, BELONGS, outgoing=True),
    }


def audit(scanner: InventoryScanner, data: dict[str, Any]) -> dict[str, Any]:
    """The log of calls, newest first."""
    rows = scanner.mcp.recent(data.get("kind"), data["failed"])
    return {
        "schema": API_SCHEMA,
        "total": len(rows),
        "calls_24h": scanner.mcp.calls_since(24),
        "entries": rows[: data["limit"]],
    }


@dataclass(frozen=True)
class Function:
    handler: Callable[[InventoryScanner, dict[str, Any]], dict[str, Any]]
    schema: vol.Schema
    kind: str = "read"  # read or write
    logged: bool = True


FUNCTIONS: dict[str, Function] = {
    "status": Function(status, STATUS_SCHEMA),
    "findings": Function(findings, FINDINGS_SCHEMA),
    "object": Function(object_card, OBJECT_SCHEMA),
    "audit": Function(audit, AUDIT_SCHEMA, logged=False),
}


async def _check_user(hass: HomeAssistant, user_id: str | None) -> None:
    """Only an administrator may call; a call without a user (automation, script) is the system's."""
    if user_id is None:
        return
    user = await hass.auth.async_get_user(user_id)
    if user is None or not user.is_admin:
        raise McpError("not_admin")


async def run(
    hass: HomeAssistant,
    scanner: InventoryScanner | None,
    name: str,
    data: dict[str, Any],
    user_id: str | None,
) -> dict[str, Any]:
    """Call one function: check, run, log. Raises ``McpError`` when it is not allowed or fails."""
    if scanner is None:
        raise McpError("not_loaded")
    function = FUNCTIONS[name]
    params = short_params(data)
    result, count = "ok", None
    try:
        await _check_user(hass, user_id)
        if not scanner.mcp.enabled:
            raise McpError("disabled")
        if function.kind == "write" and not scanner.mcp.can_write:
            raise McpError("write_disabled")
        try:
            clean = function.schema(data)
        except vol.Invalid as err:
            raise McpError("invalid_format") from err
        response = function.handler(scanner, clean)
        count = response.get("total", response.get("changed"))
        return response
    except McpError as err:
        result = err.reason
        raise
    except Exception:
        result = "error"
        raise
    finally:
        if function.logged:
            kind = (
                "denied" if result in ("disabled", "write_disabled", "not_admin") else function.kind
            )
            scanner.mcp.log(user_id, name, kind, params, result, count)
