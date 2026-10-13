"""User-defined important functions, evaluated from the last inventory scan.

Only direct, explicitly selected objects affect a function. A scan gap is never
treated as a repair, and a normal entity state such as ``off`` is not a fault.
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import (
    DOMAIN,
    MONITOR_STORAGE_KEY,
    PANEL_URL,
    SIGNAL_MONITOR_DEFINITIONS,
    SIGNAL_MONITOR_EVENT,
    STORAGE_VERSION,
)
from .scan_health import stale_after

SAVE_DELAY = 5
MAX_ITEMS = 30
MAX_MEMBERS = 12
NAME_MAX = 80
DESCRIPTION_MAX = 240
MEMBER_TYPES = frozenset({"entity", "device", "automation", "config_entry", "scene", "script", "app"})
AUTOMATION_RULES = frozenset(
    {"automation.blocked", "automation.dead_actions", "automation.dead_condition"}
)
STATE_OK = "ok"
STATE_PROBLEM = "problem"
STATE_UNVERIFIED = "unverified"
MANUAL_STALE_AFTER = timedelta(days=7)
EVENT_NAME = f"{DOMAIN}_monitor"
REASONS_DE = {
    "missing": "Objekt fehlt", "disabled": "deaktiviert", "orphaned": "verwaist",
    "unavailable": "nicht verfügbar", "problem": "Integration nicht geladen",
    "source_unread": "Quelle nicht gelesen", "scan_unverified": "Scan nicht verlässlich",
    "automation.blocked": "Automation blockiert",
    "automation.dead_actions": "Automationsaktion mit defektem Verweis",
    "automation.dead_condition": "Automationsbedingung mit defektem Verweis",
    "broken_reference": "Defekter Verweis", "stopped": "App gestoppt",
}
REASONS_EN = {
    "missing": "object missing", "disabled": "disabled", "orphaned": "orphaned",
    "unavailable": "unavailable", "problem": "integration not loaded",
    "source_unread": "source unread", "scan_unverified": "scan not reliable",
    "automation.blocked": "automation blocked",
    "automation.dead_actions": "automation action has a broken reference",
    "automation.dead_condition": "automation condition has a broken reference",
    "broken_reference": "broken reference", "stopped": "app stopped",
}


class MonitorError(Exception):
    """A definition is invalid; the message names the field."""


def _time(value: Any) -> datetime | None:
    try:
        return datetime.fromisoformat(value) if isinstance(value, str) else None
    except ValueError:
        return None


def _source(member_type: str) -> str:
    if member_type in {"automation", "script", "scene"}:
        return "automations"
    return "apps" if member_type == "app" else "registry"


def _member_state(
    member: dict[str, Any],
    objects: dict[str, dict[str, Any]],
    findings: dict[str, list[dict[str, Any]]],
    coverage: dict[str, str],
) -> dict[str, Any]:
    key = member["object_key"]
    kind, _ = key.split(":", 1)
    item = objects.get(key)
    source_state = coverage.get(_source(kind), "unknown")
    if item is None:
        state = STATE_PROBLEM if source_state == "checked" else STATE_UNVERIFIED
        reason = "missing" if state == STATE_PROBLEM else "source_unread"
    elif source_state in {"skipped", "unknown", "absent"}:
        state, reason = STATE_UNVERIFIED, "source_unread"
    else:
        status = item.get("status")
        bad = {
            "entity": {"disabled", "orphaned", "unavailable"},
            "device": {"disabled"},
            "automation": {"disabled", "unavailable"},
            "config_entry": {"disabled", "problem"},
            "scene": {"unavailable"},
            "script": {"unavailable"},
            "app": {"stopped"},
        }[kind]
        uncertain = {
            "entity": {"unknown"},
            "device": {"empty"},
            "automation": {"unknown"},
            "config_entry": {"ignored"},
            "scene": {"unknown"},
            "script": {"unknown"},
            "app": {"unknown"},
        }[kind]
        if status in bad:
            state, reason = STATE_PROBLEM, str(status)
        elif status in uncertain or status != "active":
            state, reason = STATE_UNVERIFIED, str(status or "status_unknown")
        else:
            state, reason = STATE_OK, "active"
        if kind in {"automation", "script", "scene"} and state == STATE_OK:
            broken = next(
                (
                    finding for finding in findings.get(key, ())
                    if not finding.get("ignored") and not finding.get("runtime_created")
                    and (finding.get("classification") == "broken_reference"
                         or kind == "automation" and finding.get("rule_id") in AUTOMATION_RULES)
                ),
                None,
            )
            if broken is not None:
                state, reason = STATE_PROBLEM, str(broken["rule_id"] if kind == "automation" else "broken_reference")
    return {"object_key": key, "state": state, "reason": reason, "required": member["required"]}


def evaluate(
    definition: dict[str, Any],
    snapshot: dict[str, Any] | None,
    health: dict[str, Any] | None,
    now: datetime,
) -> dict[str, Any]:
    """Evaluate one function without changing the stored definition or incident."""
    meta = (snapshot or {}).get("meta") or {}
    scanned_at = meta.get("scanned_at")
    limit = stale_after(int((health or {}).get("interval_hours") or 0)) or MANUAL_STALE_AFTER
    scanned = _time(scanned_at)
    stale = scanned is None or now - scanned > limit
    scan_unreliable = meta.get("preliminary") or (health or {}).get("state") in {
        "failed", "stale", "preliminary"
    }
    if not snapshot or stale or scan_unreliable:
        members = [
            {"object_key": m["object_key"], "state": STATE_UNVERIFIED, "reason": "scan_unverified", "required": m["required"]}
            for m in definition["members"]
        ]
    else:
        objects = {f"{o['object_type']}:{o['object_id']}": o for o in snapshot.get("objects", ())}
        findings: dict[str, list[dict[str, Any]]] = {}
        for finding in snapshot.get("findings", ()):
            key = f"{str(finding.get('rule_id', '')).split('.')[0]}:{finding.get('object_id')}"
            findings.setdefault(key, []).append(finding)
        coverage = {item["source"]: item["state"] for item in meta.get("coverage", ())}
        members = [_member_state(m, objects, findings, coverage) for m in definition["members"]]
    required = [m for m in members if m["required"]]
    if any(m["state"] == STATE_PROBLEM for m in required):
        state = STATE_PROBLEM
    elif not required or any(m["state"] == STATE_UNVERIFIED for m in required):
        state = STATE_UNVERIFIED
    else:
        state = STATE_OK
    reason = next((m for m in required if m["state"] == state), None)
    return {
        "id": definition["id"],
        "name": definition["name"],
        "description": definition["description"],
        "notify": definition["notify"],
        "members": members,
        "state": state,
        "reason": reason["reason"] if reason else "no_required_members",
        "reason_key": reason["object_key"] if reason else None,
        "scanned_at": scanned_at,
        "fully_verified": bool(required) and all(m["state"] != STATE_UNVERIFIED for m in required),
    }


class MonitorStore:
    """Definitions and the small amount of state needed to avoid duplicate alarms."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, MONITOR_STORAGE_KEY)
        self.items: list[dict[str, Any]] = []
        self.runtime: dict[str, dict[str, Any]] = {}
        self.results: list[dict[str, Any]] = []

    async def async_load(self) -> None:
        data = await self._store.async_load()
        if not isinstance(data, dict):
            return
        seen_ids: set[str] = set()
        for item in data.get("items", ()) if isinstance(data.get("items"), list) else ():
            if not isinstance(item, dict):
                continue
            try:
                self._validate(item.get("name"), item.get("description"), item.get("notify"), item.get("members"))
            except MonitorError:
                continue
            if isinstance(item.get("id"), str) and item["id"] and item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                self.items.append({
                    **{key: item[key] for key in ("id", "name", "description", "notify", "members")},
                    "created_at": item.get("created_at") if _time(item.get("created_at")) else None,
                    "updated_at": item.get("updated_at") if _time(item.get("updated_at")) else None,
                })
        self.items = self.items[:MAX_ITEMS]
        saved = data.get("runtime")
        if isinstance(saved, dict):
            for item in self.items:
                value = saved.get(item["id"])
                if isinstance(value, dict):
                    self.runtime[item["id"]] = {
                        "primed": value.get("primed") is True,
                        "state": value.get("state") if value.get("state") in {STATE_OK, STATE_PROBLEM, STATE_UNVERIFIED} else STATE_UNVERIFIED,
                        "open_incident": value.get("open_incident") is True,
                        "notified": value.get("notified") is True,
                        "unknown_notified": value.get("unknown_notified") is True,
                        "unknown_count": max(0, min(2, value.get("unknown_count", 0))) if isinstance(value.get("unknown_count"), int) else 0,
                        "last_verified_at": value.get("last_verified_at") if _time(value.get("last_verified_at")) else None,
                        "last_problem_reason": value.get("last_problem_reason") if isinstance(value.get("last_problem_reason"), str) else None,
                        "last_problem_key": value.get("last_problem_key") if isinstance(value.get("last_problem_key"), str) else None,
                    }

    def _save(self) -> None:
        self._store.async_delay_save(
            lambda: {"items": self.items, "runtime": self.runtime}, SAVE_DELAY
        )

    @staticmethod
    def _validate(name: Any, description: Any, notify: Any, members: Any) -> None:
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > NAME_MAX:
            raise MonitorError("name")
        if not isinstance(description, str) or len(description) > DESCRIPTION_MAX:
            raise MonitorError("description")
        if not isinstance(notify, bool):
            raise MonitorError("notify")
        if not isinstance(members, list) or not 1 <= len(members) <= MAX_MEMBERS:
            raise MonitorError("members")
        keys: set[str] = set()
        for member in members:
            if not isinstance(member, dict) or not isinstance(member.get("required"), bool):
                raise MonitorError("members")
            key = member.get("object_key")
            if not isinstance(key, str) or ":" not in key or len(key) > 260:
                raise MonitorError("members")
            kind, object_id = key.split(":", 1)
            if kind not in MEMBER_TYPES or not object_id or key in keys:
                raise MonitorError("members")
            keys.add(key)

    def upsert(
        self,
        item_id: str | None,
        name: str,
        description: str,
        notify: bool,
        members: list[dict[str, Any]],
        snapshot: dict[str, Any] | None,
        health: dict[str, Any] | None,
    ) -> str:
        self._validate(name, description, notify, members)
        old = next((item for item in self.items if item["id"] == item_id), None)
        if item_id and old is None:
            raise MonitorError("not_found")
        if old is None and len(self.items) >= MAX_ITEMS:
            raise MonitorError("too_many")
        existing = {m["object_key"] for m in old["members"]} if old else set()
        available = {
            f"{o['object_type']}:{o['object_id']}" for o in (snapshot or {}).get("objects", ())
            if o.get("status") != "ignored"
        }
        if any(m["object_key"] not in available | existing for m in members):
            raise MonitorError("object_key")
        changed_members = old is None or members != old["members"]
        enabled_notification = old is not None and not changed_members and not old["notify"] and notify
        if old is None:
            item_id = secrets.token_hex(6)
            old = {"id": item_id, "created_at": datetime.now(UTC).isoformat()}
            self.items.append(old)
        old.update(
            name=name.strip(), description=description.strip(), notify=notify,
            members=[{"object_key": m["object_key"], "required": m["required"]} for m in members],
            updated_at=datetime.now(UTC).isoformat(),
        )
        if changed_members:
            self._dismiss(item_id)
            self.runtime.pop(item_id, None)
        elif not notify and self.runtime.get(item_id, {}).get("notified"):
            self._dismiss(item_id)
            self.runtime[item_id]["notified"] = False
        self._save()
        async_dispatcher_send(self.hass, SIGNAL_MONITOR_DEFINITIONS)
        self.refresh(snapshot, health, new_scan=False)
        if enabled_notification:
            runtime = self.runtime.get(item_id, {})
            result = next((value for value in self.results if value["id"] == item_id), None)
            if result and (runtime.get("open_incident") or runtime.get("unknown_notified")):
                self._notify(result, uncertain=result["state"] == STATE_UNVERIFIED)
                runtime["notified"] = True
                self._save()
        return item_id

    def delete(self, item_id: str) -> None:
        if not any(item["id"] == item_id for item in self.items):
            raise MonitorError("not_found")
        self.items = [item for item in self.items if item["id"] != item_id]
        self.runtime.pop(item_id, None)
        self.results = [result for result in self.results if result["id"] != item_id]
        self._dismiss(item_id)
        self._save()
        async_dispatcher_send(self.hass, SIGNAL_MONITOR_DEFINITIONS)

    def _dismiss(self, item_id: str) -> None:
        persistent_notification.async_dismiss(self.hass, f"{DOMAIN}_monitor_{item_id}")

    def _notify(self, result: dict[str, Any], *, uncertain: bool = False) -> None:
        if not result["notify"]:
            return
        language = self.hass.config.language.split("-")[0]
        if language == "de":
            reason = REASONS_DE.get(result["reason"], result["reason"])
            last_reason = REASONS_DE.get(result.get("last_problem_reason"), result.get("last_problem_reason") or reason)
            title = f"Housekeeper: {result['name']}"
            body = (
                f"Prüfung unvollständig; letzter bestätigter Defekt ({last_reason}) bleibt ungeklärt."
                if uncertain and result["incident_open"]
                else "Prüfung unvollständig."
                if uncertain
                else f"Wichtige Funktion beeinträchtigt: {reason}"
            )
            link = "Hausmonitor öffnen"
        else:
            reason = REASONS_EN.get(result["reason"], result["reason"])
            last_reason = REASONS_EN.get(result.get("last_problem_reason"), result.get("last_problem_reason") or reason)
            title = f"Housekeeper: {result['name']}"
            body = (
                f"Check incomplete; the last confirmed fault ({last_reason}) remains unresolved."
                if uncertain and result["incident_open"]
                else "Check incomplete."
                if uncertain
                else f"Important function impaired: {reason}"
            )
            link = "Open home monitor"
        persistent_notification.async_create(
            self.hass,
            f"{body} [{link}](/{PANEL_URL}?view=monitor&function={result['id']})",
            title=title,
            notification_id=f"{DOMAIN}_monitor_{result['id']}",
        )

    def _event(self, kind: str, result: dict[str, Any], now: datetime) -> None:
        payload = {
            "function_id": result["id"],
            "name": result["name"],
            "reason": result["reason"],
            "at": now.isoformat(),
        }
        self.hass.bus.async_fire(EVENT_NAME, {"event_type": kind, **payload})
        async_dispatcher_send(self.hass, SIGNAL_MONITOR_EVENT, kind, payload)

    def refresh(
        self,
        snapshot: dict[str, Any] | None,
        health: dict[str, Any] | None,
        *,
        new_scan: bool,
    ) -> None:
        now = datetime.now(UTC)
        changed = False
        results = []
        for item in self.items:
            result = evaluate(item, snapshot, health, now)
            runtime = self.runtime.setdefault(item["id"], {})
            old = runtime.get("state")
            state = result["state"]
            if (snapshot or {}).get("meta", {}).get("preliminary"):
                result["incident_open"] = bool(runtime.get("open_incident"))
                result["last_verified_at"] = runtime.get("last_verified_at")
                result["last_problem_reason"] = runtime.get("last_problem_reason")
                result["last_problem_key"] = runtime.get("last_problem_key")
                results.append(result)
                continue
            if result["fully_verified"] and new_scan:
                runtime["last_verified_at"] = result["scanned_at"]
                changed = True
            if not runtime.get("primed"):
                if new_scan or (
                    snapshot is not None
                    and not snapshot.get("meta", {}).get("preliminary")
                    and (health or {}).get("state") == "ok"
                ):
                    runtime.update(
                        primed=True, state=state,
                        open_incident=state == STATE_PROBLEM,
                        notified=False, unknown_notified=False,
                        unknown_count=1 if state == STATE_UNVERIFIED and new_scan else 0,
                    )
                    if result["fully_verified"]:
                        runtime["last_verified_at"] = result["scanned_at"]
                    if state == STATE_PROBLEM:
                        runtime["last_problem_reason"] = result["reason"]
                        runtime["last_problem_key"] = result["reason_key"]
                    changed = True
            elif old != state:
                runtime["state"] = state
                changed = True
                if state == STATE_PROBLEM and not runtime.get("open_incident"):
                    runtime["open_incident"] = True
                    runtime["last_problem_reason"] = result["reason"]
                    runtime["last_problem_key"] = result["reason_key"]
                    runtime["unknown_notified"] = False
                    self._event("beeintraechtigt", result, now)
                    if item["notify"]:
                        self._notify({**result, "incident_open": True})
                        runtime["notified"] = True
                elif state == STATE_PROBLEM:
                    runtime["last_problem_reason"] = result["reason"]
                    runtime["last_problem_key"] = result["reason_key"]
                    if runtime.get("notified"):
                        self._notify({**result, "incident_open": True})
                elif state == STATE_OK:
                    if runtime.get("open_incident"):
                        self._event("wieder_unauffaellig", result, now)
                    elif runtime.get("unknown_notified"):
                        self._event("pruefung_wieder_moeglich", result, now)
                    if runtime.get("notified"):
                        self._dismiss(item["id"])
                    runtime.update(open_incident=False, notified=False, unknown_notified=False)
                    runtime["last_problem_reason"] = None
                    runtime["last_problem_key"] = None
                elif state == STATE_UNVERIFIED and runtime.get("open_incident") and runtime.get("notified"):
                    self._notify({**result, "incident_open": True, "last_problem_reason": runtime.get("last_problem_reason")}, uncertain=True)
            elif state == STATE_PROBLEM and runtime.get("open_incident") and (
                runtime.get("last_problem_reason") != result["reason"]
                or runtime.get("last_problem_key") != result["reason_key"]
            ):
                runtime["last_problem_reason"] = result["reason"]
                runtime["last_problem_key"] = result["reason_key"]
                changed = True
                if runtime.get("notified"):
                    self._notify({**result, "incident_open": True})
            if state == STATE_UNVERIFIED:
                if new_scan:
                    runtime["unknown_count"] = min(2, runtime.get("unknown_count", 0) + 1 if old == STATE_UNVERIFIED else 1)
                    changed = True
                old_scan = _time(result["scanned_at"])
                limit = stale_after(int((health or {}).get("interval_hours") or 0)) or MANUAL_STALE_AFTER
                overdue = old_scan is not None and now - old_scan > limit
                if runtime.get("primed") and not runtime.get("unknown_notified") and (
                    runtime.get("unknown_count", 0) >= 2 or overdue
                ):
                    runtime["unknown_notified"] = True
                    self._event("pruefung_unvollstaendig", result, now)
                    if item["notify"]:
                        self._notify({**result, "incident_open": bool(runtime.get("open_incident")), "last_problem_reason": runtime.get("last_problem_reason")}, uncertain=True)
                        runtime["notified"] = True
                    changed = True
            else:
                runtime["unknown_count"] = 0
                runtime["unknown_notified"] = False
            result["incident_open"] = bool(runtime.get("open_incident"))
            result["last_verified_at"] = runtime.get("last_verified_at")
            result["last_problem_reason"] = runtime.get("last_problem_reason")
            result["last_problem_key"] = runtime.get("last_problem_key")
            results.append(result)
        self.results = results
        if changed:
            self._save()
        async_dispatcher_send(self.hass, SIGNAL_MONITOR_DEFINITIONS)

    def report(self) -> list[dict[str, Any]]:
        return list(self.results)
