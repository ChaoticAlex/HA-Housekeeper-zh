"""Tests for scan checkpoints and comparison; they need Home Assistant only for the Store."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.history import (  # noqa: E402
    ScanHistory,
    diff_checkpoints,
    make_checkpoint,
)


def _snapshot(at: str, objects: list[tuple[str, str, str]], findings: list[dict] | None = None):
    return {
        "meta": {"scanned_at": at},
        "objects": [
            {"object_type": t, "object_id": oid, "name": oid.upper(), "status": status}
            for t, oid, status in objects
        ],
        "edges": [],
        "findings": findings or [],
    }


FINDING = {"rule_id": "entity.state_missing", "object_id": "sensor.b", "classification": "orphaned"}


def test_diff_reports_new_removed_changed_and_findings() -> None:
    old = _snapshot(
        "2026-10-06T10:00:00+00:00",
        [
            ("entity", "sensor.a", "active"),
            ("entity", "sensor.b", "active"),
            ("device", "d1", "active"),
        ],
        [FINDING],
    )
    new = _snapshot(
        "2026-10-07T10:00:00+00:00",
        [
            ("entity", "sensor.a", "unavailable"),
            ("entity", "sensor.c", "active"),
            ("device", "d1", "active"),
        ],
        [
            {
                "rule_id": "entity.state_unavailable",
                "object_id": "sensor.a",
                "classification": "unavailable",
            }
        ],
    )

    diff = diff_checkpoints(make_checkpoint(old), new)

    assert [o["object_id"] for o in diff["new_objects"]["items"]] == ["sensor.c"]
    assert [o["object_id"] for o in diff["removed_objects"]["items"]] == ["sensor.b"]
    change = diff["status_changes"]["items"][0]
    assert (change["object_id"], change["from"], change["to"], change["name"]) == (
        "sensor.a",
        "active",
        "unavailable",
        "SENSOR.A",
    )
    assert [f["rule_id"] for f in diff["new_findings"]["items"]] == ["entity.state_unavailable"]
    assert diff["resolved_findings"]["items"] == [
        {"rule_id": "entity.state_missing", "object_id": "sensor.b", "affected_object": None}
    ]


def test_identical_scans_have_no_differences() -> None:
    snap = _snapshot("2026-10-07T10:00:00+00:00", [("entity", "sensor.a", "active")], [FINDING])
    diff = diff_checkpoints(make_checkpoint(snap), snap)
    assert all(
        diff[key]["total"] == 0
        for key in (
            "new_objects",
            "removed_objects",
            "status_changes",
            "new_findings",
            "resolved_findings",
        )
    )


def test_history_keeps_previous_and_one_checkpoint_per_day(hass) -> None:
    history = ScanHistory(hass)
    day1 = _snapshot("2026-10-05T08:00:00+00:00", [("entity", "x.a", "active")])
    day1b = _snapshot("2026-10-05T20:00:00+00:00", [("entity", "x.a", "active")])
    day2 = _snapshot("2026-10-06T08:00:00+00:00", [("entity", "x.a", "unavailable")])

    assert history.compare(day1, "previous")["available"] is False
    history.record(day1)
    history.record(day1b)
    history.record(day2)

    options = history.baselines()
    assert options[0]["id"] == "previous" and options[0]["at"] == day1b["meta"]["scanned_at"]
    assert options[0]["findings"] == 0 and options[0]["objects"] == 1
    # the day's last scan is already the previous one, so it is listed once
    assert len(options) == 1

    result = history.compare(day2, "previous")
    assert result["available"] and result["status_changes"]["total"] == 1
    assert history.compare(day2, "unknown")["available"] is False


def test_history_drops_checkpoints_older_than_the_retention(hass) -> None:
    history = ScanHistory(hass)
    history.retention_days = 3
    for day in range(1, 8):
        history.record(_snapshot(f"2026-10-0{day}T08:00:00+00:00", [("entity", "x.a", "active")]))

    ats = [o["at"][:10] for o in history.baselines()]
    assert ats[0] == "2026-10-06"
    assert min(ats) >= "2026-10-04"
    result = history.compare(_snapshot("2026-10-07T09:00:00+00:00", []), "previous")
    assert result["retention_days"] == 3 and result["current"] == {"objects": 0, "findings": 0}


def test_series_lists_the_days_and_the_latest_scan_with_unavailable(hass) -> None:
    history = ScanHistory(hass)
    assert history.series()["points"] == []
    history.record(_snapshot("2026-10-05T08:00:00+00:00", [("entity", "x.a", "active")]))
    history.record(
        _snapshot(
            "2026-10-06T08:00:00+00:00",
            [("entity", "x.a", "unavailable"), ("entity", "x.b", "active")],
        )
    )
    history.record(_snapshot("2026-10-06T20:00:00+00:00", [("entity", "x.a", "unavailable")]))

    points = history.series()["points"]
    assert [(p["at"][:10], p["objects"], p["unavailable"]) for p in points] == [
        ("2026-10-05", 1, 0),
        ("2026-10-06", 1, 1),
    ]


def test_series_carries_open_findings_classes_and_the_share_for_the_sparklines(hass) -> None:
    def snap(at: str, findings: list[dict]) -> dict:
        base = _snapshot(at, [("entity", "x.a", "active"), ("entity", "x.b", "active")])
        base["findings"] = findings
        return base

    def finding(rule: str, object_id: str, classification: str, ignored: bool = False) -> dict:
        return {
            "rule_id": rule,
            "object_id": object_id,
            "classification": classification,
            "ignored": ignored,
        }

    history = ScanHistory(hass)
    history.record(snap("2026-10-05T08:00:00+00:00", []))
    history.record(
        snap(
            "2026-10-06T08:00:00+00:00",
            [
                finding("entity.unused", "x.a", "unused"),
                finding("entity.broken", "x.a", "broken_reference"),
                finding("entity.unused", "x.b", "unused", ignored=True),
            ],
        )
    )
    points = history.series()["points"]
    assert [(p["open"], p["share"]) for p in points] == [(0, 100), (2, 50)]
    assert points[0]["classes"] == {} and points[1]["classes"] == {
        "unused": 1,
        "broken_reference": 1,
    }


def test_a_pinned_scan_point_is_named_compared_kept_beyond_the_retention_and_deleted(hass) -> None:
    from custom_components.ha_housekeeper.history import PIN_LIMIT, PinError

    history = ScanHistory(hass)
    history.retention_days = 2
    early = _snapshot("2026-10-01T08:00:00+00:00", [("entity", "x.a", "active")])
    history.record(early)
    history.pin(early, "  Before the rebuild ")
    with pytest.raises(PinError):
        history.pin(early, "again")
    with pytest.raises(PinError):
        history.pin(
            {**early, "meta": {"scanned_at": "2026-10-02T08:00:00+00:00", "preliminary": True}}, ""
        )
    for day in range(2, 8):
        history.record(_snapshot(f"2026-10-0{day}T08:00:00+00:00", [("entity", "x.a", "active")]))

    pinned = [o for o in history.baselines() if o.get("pinned")]
    assert [(o["id"], o["name"]) for o in pinned] == [
        ("pin:2026-10-01T08:00:00+00:00", "Before the rebuild")
    ]
    now = _snapshot("2026-10-08T09:00:00+00:00", [("entity", "x.a", "unavailable")])
    assert history.compare(now, pinned[0]["id"])["status_changes"]["total"] == 1
    history.unpin(pinned[0]["id"])
    with pytest.raises(PinError):
        history.unpin(pinned[0]["id"])
    assert history.compare(now, pinned[0]["id"])["available"] is False
    for day in range(PIN_LIMIT):
        history.pin(_snapshot(f"2026-11-{day + 1:02d}T08:00:00+00:00", []), str(day))
    with pytest.raises(PinError):
        history.pin(_snapshot("2026-12-01T08:00:00+00:00", []), "one too many")
