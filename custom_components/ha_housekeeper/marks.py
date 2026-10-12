"""Notes on objects that tell Housekeeper what to expect: offline on purpose, seasonal, a spare, keep.

Stored by Housekeeper only; Home Assistant stays untouched. A mark of an object hides the
"not available" findings of that object (of a device: of its entities; of an integration or app: its
"not loaded" and "app stopped" findings), never a broken reference.
"Keep" also blocks every cleanup step on the object. A mark with a review date that has passed no
longer hides anything; the finding comes back as due.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import MARKS_STORAGE_KEY, STORAGE_VERSION
from .ignored import REASON_LIMIT, due

SAVE_DELAY = 10
KINDS = ("expected_offline", "seasonal", "spare", "keep", "replaced")
HIDING_KINDS = ("expected_offline", "seasonal", "spare", "replaced")  # "keep" hides nothing
OBJECT_TYPES = ("entity", "device", "config_entry", "app")
KINDS_OF = {  # what an integration or an app can be marked as; "keep" and "replaced" need an entity or device
    "config_entry": ("expected_offline", "seasonal", "spare"),
    "app": ("expected_offline", "seasonal", "spare"),
}
ITEM_LIMIT = 2000
TARGET_LIMIT = 255


def mark_key(object_type: str, object_id: str) -> str:
    return f"{object_type}:{object_id}"


def _text(value: dict[str, Any], name: str) -> str | None:
    return value[name] if isinstance(value.get(name), str) else None


def _clean(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict) or value.get("kind") not in KINDS:
        return None
    return {
        "kind": value["kind"],
        "at": _text(value, "at") or "",
        "reason": str(value.get("reason") or "")[:REASON_LIMIT],
        "until": _text(value, "until"),
        "target": (_text(value, "target") or "")[:TARGET_LIMIT] or None,
        "by": _text(value, "by"),
    }


class MarkStore:
    """One mark per entity or device."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, MARKS_STORAGE_KEY)
        self.items: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        """Load the marks; anything of an unknown shape is dropped."""
        data = await self._store.async_load()
        if not isinstance(data, dict) or not isinstance(data.get("items"), dict):
            return
        cleaned = ((key, _clean(value)) for key, value in data["items"].items())
        self.items = {
            key: item
            for key, item in cleaned
            if isinstance(key, str) and key.split(":", 1)[0] in OBJECT_TYPES and item is not None
        }

    def set(
        self,
        key: str,
        kind: str,
        now: datetime,
        *,
        reason: str = "",
        until: datetime | None = None,
        target: str | None = None,
        by: str | None = None,
    ) -> bool:
        """Record a mark; False when the kind is unknown or the store is full."""
        if kind not in KINDS or (key not in self.items and len(self.items) >= ITEM_LIMIT):
            return False
        self.items[key] = {
            "kind": kind,
            "at": now.isoformat(),
            "reason": reason.strip()[:REASON_LIMIT],
            "until": until.isoformat() if until else None,
            "target": (target or "")[:TARGET_LIMIT] or None,
            "by": by,
        }
        self._save()
        return True

    def clear(self, key: str) -> bool:
        if self.items.pop(key, None) is None:
            return False
        self._save()
        return True

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"items": self.items}, SAVE_DELAY)


def apply_marks(
    objects: list[dict[str, Any]],
    findings: list[dict[str, Any]],
    marks: dict[str, dict[str, Any]],
    now: datetime | None = None,
) -> None:
    """Put the marks on the objects and let them hide or revive "not available" findings.

    Call it after the ignore flags of the findings are set: a finding that is hidden already stays so.
    """
    now = now or datetime.now(UTC)
    device_of: dict[str, str | None] = {}
    devices: dict[str, dict[str, Any]] = {}
    for item in objects:
        item.pop("mark", None)
        item.pop("mark_due", None)
        item.pop("marked_keep", None)
        if item["object_type"] == "entity":
            device_of[item["object_id"]] = item.get("device_id")
        elif item["object_type"] == "device":
            devices[item["object_id"]] = item
        mark = marks.get(mark_key(item["object_type"], item["object_id"]))
        if mark is None:
            continue
        item["mark"] = mark
        if due(mark, now):
            item["mark_due"] = True
        elif mark["kind"] == "keep":
            item["marked_keep"] = True
    for item in objects:  # an entity of a device that is to be kept is kept as well
        device = devices.get(item.get("device_id") or "")
        if item["object_type"] == "entity" and device and device.get("marked_keep"):
            item["marked_keep"] = True
    for finding in findings:
        finding.pop("mark", None)
        if finding.get("rule_id") == "config_entry.not_loaded":
            keys = (mark_key("config_entry", finding["object_id"]),)
        elif finding.get("rule_id") == "device.down":
            keys = (mark_key("device", finding["object_id"]),)
        elif finding.get("rule_id") == "app.stopped_in_use":
            keys = (
                mark_key("app", finding["object_id"]),
                mark_key("config_entry", finding.get("affected_object") or ""),
            )
        elif finding["classification"] in ("unavailable", "stale"):
            entity_id = finding["object_id"]
            keys = (
                mark_key("entity", entity_id),
                mark_key("device", device_of.get(entity_id) or ""),
            )
        else:
            continue
        for key in keys:
            mark = marks.get(key)
            if mark is None or mark["kind"] not in HIDING_KINDS:
                continue
            if due(mark, now):
                finding["resurfaced"] = bool(finding.get("resurfaced")) or not finding["ignored"]
            elif not finding["ignored"]:
                finding["ignored_by"], finding["ignored"], finding["mark"] = "mark", True, mark
                break
