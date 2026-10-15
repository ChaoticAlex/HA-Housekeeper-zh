"""Findings that began at about the time of an event: the window, the grouping and the noise rule."""

from __future__ import annotations

from custom_components.ha_housekeeper.correlation import correlate


def finding(key: str, at: str | None, **fields) -> dict:
    return {"key": key, "first_detected_at": at, "ignored": False, **fields}


def event(kind: str, at: str, **fields) -> dict:
    return {"kind": kind, "at": at, **fields}


def test_a_finding_that_began_near_an_update_is_grouped_with_it() -> None:
    update = event(
        "entry_version", "2026-10-01T10:05:00+00:00", domain="hue", **{"from": "1", "to": "2"}
    )
    found = [
        finding("a", "2026-10-01T10:03:00+00:00"),  # two minutes before the log entry
        finding("b", "2026-10-01T10:50:00+00:00"),  # 45 minutes after the entry: too late
        finding("c", "2026-10-01T09:40:00+00:00"),  # entry logged 25 minutes later: too late
        finding("f", "2026-10-01T10:20:00+00:00"),  # 15 minutes after the entry: inside
        finding("d", None),
        finding("e", "2026-10-01T10:04:00+00:00", ignored=True),
    ]
    result = correlate(found, [update])
    assert [g["total"] for g in result["groups"]] == [2] and result["groups"][0]["domain"] == "hue"
    assert set(result["by_key"]) == {"a", "f"}


def test_restarts_and_plan_runs_only_appear_as_groups_and_bad_input_is_skipped() -> None:
    events = [
        event("start", "2026-10-01T10:00:00+00:00", down_seconds=60),
        {"kind": "plan", "at": "no"},
        {"at": "x"},
    ]
    result = correlate(
        [finding("a", "2026-10-01T10:01:00+00:00"), finding(7, "2026-10-01T10:01:00+00:00")], events
    )
    assert result["groups"][0]["only_group"] is True and result["groups"][0]["total"] == 1
    assert result["by_key"] == {}


def test_updates_close_in_time_and_the_restart_beside_them_are_one_incident() -> None:
    events = [
        event("start", "2026-10-01T10:00:00+00:00"),
        event("entry_version", "2026-10-01T10:05:00+00:00", domain="a", **{"from": "1", "to": "2"}),
        event("entry_version", "2026-10-01T10:05:00+00:00", domain="b", **{"from": "1", "to": "2"}),
        event("start", "2026-10-01T15:00:00+00:00"),
    ]
    found = [finding(k, "2026-10-01T10:06:00+00:00") for k in "xyz"] + [
        finding("w", "2026-10-01T15:01:00+00:00")
    ]
    result = correlate(found, events)
    update = next(g for g in result["groups"] if g["kind"] == "entry_version")
    assert update["total"] == 3 and [a["domain"] for a in update["also"]] == ["b"]
    assert len(result["groups"]) == 2, "the lone restart stays its own group"
    assert set(result["by_key"]) == {"x", "y", "z"}
