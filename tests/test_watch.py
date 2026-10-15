"""The watch after an update: judged by objects, not by findings; unread is unknown."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.watch import (  # noqa: E402
    WatchStore,
    evaluate,
    make_before,
    merge_triggers,
    next_due,
)

START = datetime(2026, 10, 14, 3, 0, tzinfo=UTC)


def _watch(before, samples, hours=24):
    return {
        "started_at": START.isoformat(),
        "until": (START + timedelta(hours=hours)).isoformat(),
        "before": before,
        "samples": samples,
        "triggers": [],
    }


def _state(bad=(), findings=(), unchecked=(), at=START):
    return {
        "at": at.isoformat(),
        "bad": {k: "unavailable" for k in bad},
        "bad_total": len(bad),
        "findings": list(findings),
        "unchecked": list(unchecked),
    }


def test_the_verdict_names_what_changed_and_never_guesses() -> None:
    before = _state(bad=["entity:a"], findings=["f1"])
    assert evaluate(_watch(before, []))["verdict"] == "pending"
    assert evaluate(_watch(None, [_state()]))["reason"] == "no_before"
    stable = evaluate(_watch(before, [_state(bad=["entity:a"], findings=["f1"])]))
    assert stable["verdict"] == "stable"
    worse = evaluate(_watch(before, [_state(bad=["entity:a", "entity:b"], findings=["f1"])]))
    assert (worse["verdict"], worse["new"]) == ("worse", ["entity:b"])
    assert (
        evaluate(_watch(before, [_state(bad=["entity:a"], findings=["f1", "f2"])]))["verdict"]
        == "worse"
    )
    short = [_state(bad=["entity:a", "entity:c"]), _state(bad=["entity:a"], findings=["f1"])]
    assert evaluate(_watch(before, short))["verdict"] == "transient"
    fixed = evaluate(_watch(before, [_state(findings=["f1"])]))
    assert (fixed["verdict"], fixed["fixed"]) == ("stable", ["entity:a"])


def test_an_unread_source_is_unknown_unless_something_worse_is_known() -> None:
    before = _state(bad=[], unchecked=[])
    now = _state(bad=["dashboard:x"], unchecked=["dashboard"])
    assert evaluate(_watch(before, [now]))["verdict"] == "unknown"
    worse = _state(bad=["entity:b"], unchecked=["dashboard"])
    assert evaluate(_watch(before, [worse]))["verdict"] == "worse"


def test_the_next_scan_is_the_first_point_no_sample_has_reached() -> None:
    watch = _watch(_state(), [])
    assert next_due(watch) == START + timedelta(minutes=30)
    watch["samples"] = [_state(at=START + timedelta(minutes=40))]
    assert next_due(watch) == START + timedelta(hours=2)
    watch["samples"].append(_state(at=START + timedelta(hours=25)))
    assert next_due(watch) is None


def test_the_store_waits_for_the_calm_and_closes_at_the_end() -> None:
    store = WatchStore.__new__(WatchStore)
    store.watches = []
    store._save = lambda: None
    store.start(
        START, START, 24, [{"kind": "ha_version", "from": "1", "to": "2"}], make_before(None)
    )

    def snapshot(at, status="active"):
        return {
            "objects": [{"object_type": "entity", "object_id": "a", "status": status}],
            "findings": [],
            "meta": {"scanned_at": at.isoformat()},
        }

    early = START + timedelta(minutes=5)
    store.sample(snapshot(early, "unavailable"), early)
    assert store.active()["samples"] == [], "the restart is still settling"
    mid = START + timedelta(hours=1)
    store.sample(snapshot(mid), mid)
    assert store.active() and len(store.active()["samples"]) == 1
    end = START + timedelta(hours=24)
    store.sample(snapshot(end), end)
    assert store.active() is None
    assert store.report()[0]["verdict"] == "unknown", "there was no scan before the restart"
    assert not store.expire(end)


def test_a_watch_can_be_ended_by_hand() -> None:
    store = WatchStore.__new__(WatchStore)
    store.watches = []
    store._save = lambda: None
    assert not store.end(START)
    store.start(START, START, 24, [{"kind": "ha_version", "from": "1", "to": "2"}], None)
    assert store.end(START + timedelta(hours=1))
    assert store.active() is None and store.report()[0]["verdict"] == "unknown"


def test_a_second_update_joins_the_open_watch_once() -> None:
    first = [{"kind": "ha_version", "from": "1", "to": "2"}]
    again = [*first, {"kind": "entry_version", "domain": "hue", "from": "1", "to": "2"}]
    assert len(merge_triggers(first, again)) == 2


def test_silent_objects_are_a_group_of_their_own_and_marked_ones_make_nothing_worse() -> None:
    before = _state()
    after = {**_state(bad=["entity:a"]), "silent": {"entity:q": "unknown"}}
    result = evaluate(_watch(before, [after]))
    assert (result["verdict"], result["new"], result["silent"]) == (
        "worse",
        ["entity:a"],
        ["entity:q"],
    )
    quiet = evaluate(_watch(before, [{**_state(), "silent": {"entity:q": "unknown"}}]))
    assert (quiet["verdict"], quiet["silent"]) == ("stable", ["entity:q"])
    marked = evaluate(_watch(before, [after]), frozenset({"entity:a"}))
    assert (marked["verdict"], marked["new"], marked["marked"]) == ("stable", [], ["entity:a"])
