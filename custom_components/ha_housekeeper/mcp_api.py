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
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from fnmatch import fnmatchcase
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant

from .const import API_SCHEMA
from .ignored import REASON_LIMIT as IGNORE_REASON_LIMIT
from .inventory import InventoryScanner
from .marks import KINDS as MARK_KINDS
from .marks import OBJECT_TYPES, mark_key
from .mcp_access import short_params
from .notes import NOTE_MAX, TARGET_MAX, TITLE_MAX, NoteError

LEVELS = ("info", "low", "medium", "high")
RANK = {"none": 0, "info": 1, "low": 2, "medium": 3, "high": 4}
LIMIT_DEFAULT = 20
LIMIT_MAX = 50
TEXT_LIMIT = 80
REASON_SHOWN = 120
DECISIONS = ("hide", "include", "only")
VIA = "mcp"
IGNORE_KINDS = ("ignore", "keep", "snooze")

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
_REASON = vol.All(str, vol.Length(max=IGNORE_REASON_LIMIT))
_DAYS = vol.All(int, vol.Range(min=1, max=3650))
DECIDE_SCHEMA = vol.Schema(
    {
        vol.Required("key"): vol.All(str, vol.Length(min=1, max=300)),
        vol.Required("action"): vol.In(("decide", "restore")),
        vol.Optional("kind", default="ignore"): vol.In(IGNORE_KINDS),
        vol.Optional("reason", default=""): _REASON,
        vol.Optional("days"): _DAYS,
    }
)
MARK_SCHEMA = vol.Schema(
    {
        vol.Required("action"): vol.In(("set", "clear")),
        vol.Required("object_type"): vol.In(OBJECT_TYPES),
        vol.Required("object_id"): vol.All(str, vol.Length(min=1, max=255)),
        vol.Optional("kind"): vol.In(MARK_KINDS),
        vol.Optional("reason", default=""): _REASON,
        vol.Optional("days"): _DAYS,
        vol.Optional("target"): vol.All(str, vol.Length(max=255)),
    }
)
NOTE_SCHEMA = vol.Schema(
    {
        vol.Required("action"): vol.In(("save", "delete")),
        vol.Optional("note_id"): vol.All(str, vol.Length(max=64)),
        vol.Optional("title", default=""): vol.All(str, vol.Length(max=TITLE_MAX)),
        vol.Optional("note", default=""): vol.All(str, vol.Length(max=NOTE_MAX)),
        vol.Optional("target", default=""): vol.All(str, vol.Length(max=TARGET_MAX)),
    }
)
UNDO_SCHEMA = vol.Schema({vol.Required("at"): vol.All(str, vol.Length(max=40))})
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


def status(
    scanner: InventoryScanner, data: dict[str, Any], _user: str | None = None
) -> dict[str, Any]:
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


def findings(
    scanner: InventoryScanner, data: dict[str, Any], _user: str | None = None
) -> dict[str, Any]:
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


def object_card(
    scanner: InventoryScanner, data: dict[str, Any], _user: str | None = None
) -> dict[str, Any]:
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


def finding_decide(
    scanner: InventoryScanner, data: dict[str, Any], user: str | None
) -> dict[str, Any]:
    """Hide, keep or put off one finding, or show it again. Only Housekeeper's own list changes."""
    key, deciding = data["key"], data["action"] == "decide"
    if deciding and data["kind"] == "keep" and not data["reason"].strip():
        raise McpError("reason_required")
    if deciding and data["kind"] == "snooze" and "days" not in data:
        raise McpError("days_required")
    previous = scanner.ignored.entry(key)
    if not scanner.set_finding_ignored(
        key,
        deciding,
        kind=data["kind"],
        reason=data["reason"],
        days=data.get("days"),
        by=user,
        via=VIA,
    ):
        raise McpError("finding_not_found")
    return {
        "schema": API_SCHEMA,
        "changed": 1,
        "_undo": {"what": "finding", "key": key, "previous": previous},
    }


def mark(scanner: InventoryScanner, data: dict[str, Any], user: str | None) -> dict[str, Any]:
    """Tell Housekeeper what to expect of an object, or take that back. Only its own list changes."""
    kind, ident = data["object_type"], data["object_id"]
    previous = deepcopy(scanner.marks.items.get(mark_key(kind, ident)))
    if data["action"] == "set":
        if "kind" not in data:
            raise McpError("invalid_format")
        error = scanner.set_mark(
            kind,
            ident,
            data["kind"],
            reason=data["reason"],
            days=data.get("days"),
            target=data.get("target"),
            by=user,
            via=VIA,
        )
        if error:
            raise McpError(error)
    elif not scanner.clear_mark(kind, ident):
        raise McpError("not_found")
    return {
        "schema": API_SCHEMA,
        "changed": 1,
        "_undo": {"what": "mark", "type": kind, "id": ident, "previous": previous},
    }


def note_set(scanner: InventoryScanner, data: dict[str, Any], user: str | None) -> dict[str, Any]:
    """Add, change or delete an entry of the logbook. Only Housekeeper's own list changes."""
    note_id = data.get("note_id")
    previous = deepcopy(next((i for i in scanner.notes.items if i["id"] == note_id), None))
    try:
        if data["action"] == "save":
            note_id = scanner.notes.upsert(
                note_id,
                data["title"],
                datetime.now(UTC).isoformat(),
                data["target"],
                data["note"],
                datetime.now(UTC),
                "agent",
            )
        elif previous is None:
            raise McpError("not_found")
        else:
            scanner.notes.delete(note_id or "")
    except NoteError as err:
        raise McpError("not_found" if str(err) == "not_found" else "invalid_format") from err
    return {
        "schema": API_SCHEMA,
        "changed": 1,
        "note_id": note_id,
        "_undo": {"what": "note", "id": note_id, "previous": previous},
    }


def undo(scanner: InventoryScanner, data: dict[str, Any], user: str | None) -> dict[str, Any]:
    """Take back one change from the log, as it was before."""
    entry = next((e for e in scanner.mcp.entries if e["at"] == data["at"] and e.get("undo")), None)
    if entry is None or entry.get("undone"):
        raise McpError("not_found")
    step = entry["undo"]
    if step["what"] == "finding":
        scanner.restore_decision(step["key"], step["previous"])
    elif step["what"] == "mark":
        scanner.restore_mark(step["type"], step["id"], step["previous"])
    else:
        scanner.notes.restore(step["id"], step["previous"])
    scanner.mcp.mark_undone(entry)
    return {"schema": API_SCHEMA, "changed": 1}


def audit(
    scanner: InventoryScanner, data: dict[str, Any], _user: str | None = None
) -> dict[str, Any]:
    """The log of calls, newest first."""
    rows = scanner.mcp.recent(data.get("kind"), data["failed"])
    return {
        "schema": API_SCHEMA,
        "total": len(rows),
        "calls_24h": scanner.mcp.calls_since(24),
        "entries": [
            {**{k: v for k, v in e.items() if k != "undo"}, "undoable": bool(e.get("undo"))}
            for e in rows[: data["limit"]]
        ],
    }


@dataclass(frozen=True)
class Function:
    handler: Callable[[InventoryScanner, dict[str, Any], str | None], dict[str, Any]]
    schema: vol.Schema
    kind: str = "read"  # read or write
    logged: bool = True


FUNCTIONS: dict[str, Function] = {
    "status": Function(status, STATUS_SCHEMA),
    "findings": Function(findings, FINDINGS_SCHEMA),
    "object": Function(object_card, OBJECT_SCHEMA),
    "finding_decide": Function(finding_decide, DECIDE_SCHEMA, kind="write"),
    "mark": Function(mark, MARK_SCHEMA, kind="write"),
    "note_set": Function(note_set, NOTE_SCHEMA, kind="write"),
    "undo": Function(undo, UNDO_SCHEMA, kind="write"),
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
    result, count, undo = "ok", None, None
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
        response = function.handler(scanner, clean, user_id)
        undo = response.pop("_undo", None)
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
            scanner.mcp.log(user_id, name, kind, params, result, count, undo)
