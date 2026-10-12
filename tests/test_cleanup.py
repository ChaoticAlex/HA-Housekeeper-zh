"""Dry-run cleanup plans: judging candidates and the journal."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.cleanup import (  # noqa: E402
    JOURNAL_MAX_BYTES,
    MAX_OPEN_PREVIEWS,
    build_plan,
    judge_action,
)

NOW = datetime(2026, 10, 7, tzinfo=UTC)


def entity(object_id: str, status: str = "orphaned", **extra):
    return {
        "object_type": "entity",
        "object_id": object_id,
        "name": object_id.title(),
        "status": status,
        **extra,
    }


def snapshot(objects, edges=()):
    return {"meta": {"scanned_at": NOW.isoformat()}, "objects": list(objects), "edges": list(edges)}


def use(source: str, target: str, confidence: str = "certain", relation: str = "TARGETS"):
    return {
        "source": source,
        "target": f"entity:{target}",
        "relation": relation,
        "confidence": confidence,
    }


def verdict(objects, edges, object_id, kind="disable_entity", **extra):
    index = {o["object_id"]: o for o in objects}
    return judge_action(kind, object_id, index, list(edges), **extra)


def test_unused_orphan_is_ok() -> None:
    result = verdict([entity("sensor.old")], [], "sensor.old")
    assert result["verdict"] == "ok" and result["reasons"] == []


def test_certain_use_blocks_and_probable_use_needs_review() -> None:
    objects = [entity("sensor.a"), entity("sensor.b")]
    edges = [
        use("automation:automation.x", "sensor.a"),
        use("dashboard:main", "sensor.b", "probable", "SHOWS"),
    ]
    a, b = verdict(objects, edges, "sensor.a"), verdict(objects, edges, "sensor.b")
    assert a["verdict"] == "blocked" and "used_certain" in a["reasons"]
    assert b["verdict"] == "review" and "used_probable" in b["reasons"]
    assert a["used_by"][0]["source"] == "automation:automation.x"


def test_working_entities_are_never_removable() -> None:
    result = verdict([entity("light.on", "active")], [], "light.on")
    assert result["verdict"] == "blocked" and "entity_working" in result["reasons"]


def test_statistics_and_unknown_objects() -> None:
    kept = verdict([entity("sensor.s", has_statistics=True)], [], "sensor.s")
    assert kept["verdict"] == "review" and kept["has_statistics"] is True
    assert verdict([], [], "sensor.nope")["reasons"] == ["not_found"]
    assert verdict([entity("sensor.a")], [], "sensor.a", kind="delete_device")["reasons"] == [
        "unsupported_action"
    ]


def test_plan_summary_dedupes_and_never_executes() -> None:
    objects = [entity("sensor.a"), entity("sensor.b", "active")]
    plan = build_plan(
        snapshot(objects),
        [{"kind": "disable_entity", "object_id": "sensor.a"}] * 2
        + [{"kind": "disable_entity", "object_id": "sensor.b"}],
        NOW,
    )
    assert plan["status"] == "dry_run" and plan["executed"] is False
    assert plan["summary"] == {
        "total": 2,
        "ok": 1,
        "review": 0,
        "blocked": 1,
        "uses": 0,
        "statistics": 0,
    }
    assert plan["events"][0]["type"] == "created"


def _journal():
    from custom_components.ha_housekeeper.cleanup import JournalStore

    journal = JournalStore.__new__(JournalStore)
    journal._plans = []
    journal._save = lambda: None
    return journal


def _executed_plan(plan_id: str, object_id: str = "sensor.a", file_before: str | None = None):
    source = {"source": "automation:x", "before": "item", "state": "done"}
    if file_before is not None:
        source |= {"file_before": file_before, "file_after_hash": "abc"}
    return {
        "plan_id": plan_id,
        "executed": True,
        "run": {"started_at": "2026-09-01T00:00:00+00:00"},
        "actions": [
            {
                "kind": "disable_entity",
                "object_id": object_id,
                "result": {"state": "done", "at": "2026-09-01T00:00:00+00:00", "sources": [source]},
            }
        ],
    }


def test_journal_limits_only_previews_and_removes_only_dry_runs() -> None:
    journal = _journal()
    for number in range(MAX_OPEN_PREVIEWS + 5):
        journal.add({"plan_id": str(number), "executed": False})
    assert len(journal.plans) == MAX_OPEN_PREVIEWS
    assert journal.plans[0]["plan_id"] == str(MAX_OPEN_PREVIEWS + 4)
    journal.plans[0]["executed"] = True
    assert journal.remove(journal.plans[0]["plan_id"]) is False
    assert journal.remove(journal.plans[1]["plan_id"]) is True


def test_new_previews_never_push_out_a_plan_that_ran() -> None:
    from custom_components.ha_housekeeper.cleanup import quarantine_entries

    journal = _journal()
    journal.add(_executed_plan("ran"))
    for number in range(MAX_OPEN_PREVIEWS * 3):
        journal.add({"plan_id": f"preview-{number}", "executed": False})
    ids = [plan["plan_id"] for plan in journal.plans]
    assert "ran" in ids and len(ids) == MAX_OPEN_PREVIEWS + 1
    live = [{"object_type": "entity", "object_id": "sensor.a", "disabled_by": "user"}]
    assert [q["object_id"] for q in quarantine_entries(journal.plans, live)] == ["sensor.a"]


def test_a_large_journal_gives_up_old_file_copies_but_not_the_plans() -> None:
    journal = _journal()
    big = "x" * 4_000
    for number in range(4):
        journal.add(_executed_plan(f"p{number}", f"sensor.s{number}", file_before=big))
    journal._compact_to(9_000)  # four copies of 4 kB do not fit

    by_id = {plan["plan_id"]: plan for plan in journal.plans}
    assert set(by_id) == {"p0", "p1", "p2", "p3"}  # nothing is dropped
    oldest = by_id["p0"]["actions"][0]["result"]
    assert (
        "file_before" not in oldest["sources"][0] and "file_after_hash" not in oldest["sources"][0]
    )
    assert (
        oldest["sources"][0]["file_snapshot_dropped"] is True
        and by_id["p0"]["file_snapshot_dropped"]
    )
    assert oldest["state"] == "done" and oldest["at"] and oldest["sources"][0]["before"] == "item"
    assert (
        by_id["p3"]["actions"][0]["result"]["sources"][0]["file_before"] == big
    )  # newest keeps it
    assert JOURNAL_MAX_BYTES >= 1024 * 1024  # the real limit is not tiny


def test_add_compacts_when_the_journal_exceeds_its_limit(monkeypatch) -> None:
    from custom_components.ha_housekeeper import cleanup

    monkeypatch.setattr(cleanup, "JOURNAL_MAX_BYTES", 6_000)
    journal = _journal()
    for number in range(3):
        journal.add(_executed_plan(f"p{number}", f"sensor.s{number}", file_before="y" * 4_000))
    sources = [p["actions"][0]["result"]["sources"][0] for p in reversed(journal.plans)]
    assert [s.get("file_snapshot_dropped", False) for s in sources] == [True, True, False]


def test_quarantine_lists_only_entities_still_disabled_by_the_user() -> None:
    from custom_components.ha_housekeeper.cleanup import quarantine_entries

    def done(object_id: str, at: str, state: str = "done", kind: str = "disable_entity"):
        return {"kind": kind, "object_id": object_id, "result": {"state": state, "at": at}}

    plans = [
        {
            "plan_id": "p1",
            "actions": [
                done("sensor.a", "2026-09-01T00:00:00+00:00"),
                done("sensor.b", "2026-09-02T00:00:00+00:00"),
                done("sensor.c", "2026-09-03T00:00:00+00:00", "undone"),
            ],
        },
        {
            "plan_id": "p2",
            "actions": [
                done("sensor.a", "2026-09-10T00:00:00+00:00"),
                done("sensor.d", "2026-09-04T00:00:00+00:00", kind="remove_entity"),
                {"kind": "disable_entity", "object_id": "sensor.e"},
            ],
        },
    ]
    entities = [
        {"object_id": "sensor.a", "disabled_by": "user"},
        {"object_id": "sensor.b", "disabled_by": None},  # re-enabled by the user
        {"object_id": "sensor.c", "disabled_by": "user"},  # undone
        {"object_id": "sensor.d", "disabled_by": "user"},
    ]
    entries = quarantine_entries(plans, entities)
    assert [e["object_id"] for e in entries] == [
        "sensor.a"
    ]  # latest disable wins, undone/re-enabled drop out
    assert entries[0] == {
        "object_type": "entity",
        "object_id": "sensor.a",
        "plan_id": "p2",
        "since": "2026-09-10T00:00:00+00:00",
    }


def test_not_restorable_removals_need_review() -> None:
    objects = [entity("sensor.old", "disabled")]
    quarantine = {"sensor.old": "2020-01-01T00:00:00+00:00"}
    index = {o["object_id"]: o for o in objects}
    fine = judge_action("remove_entity", "sensor.old", index, [], quarantine, True, NOW)
    risky = judge_action("remove_entity", "sensor.old", index, [], quarantine, False, NOW)
    assert fine["verdict"] == "ok"
    assert risky["verdict"] == "review" and "not_restorable" in risky["reasons"]


def test_the_journal_list_says_until_when_a_plan_is_watched() -> None:
    from custom_components.ha_housekeeper.cleanup import plan_summary

    plan = {
        "plan_id": "p",
        "actions": [],
        "followup": {"state": "watching", "until": "2026-10-11T10:00:00+00:00", "baseline": ["f"]},
    }
    listed = plan_summary(plan)
    assert (
        listed["followup"] == "watching" and listed["followup_until"] == "2026-10-11T10:00:00+00:00"
    )
    assert plan_summary({"plan_id": "q", "actions": []})["followup_until"] is None


async def test_a_run_cut_off_by_a_restart_loads_as_partial_or_aborted(hass, hass_storage) -> None:
    """A plan still marked as running on disk was stopped from outside; it must not stay running."""
    from custom_components.ha_housekeeper.cleanup import JournalStore
    from custom_components.ha_housekeeper.const import JOURNAL_STORAGE_KEY

    def plan(plan_id, status, executed):
        done = {"state": "done", "at": "x"}
        return {
            "plan_id": plan_id,
            "status": status,
            "executed": executed,
            "run": {"started_at": "x", "finished_at": None},
            "events": [],
            "actions": [{"object_id": "a", "result": done} if executed else {"object_id": "a"}]
            + [{"object_id": "b"}],
        }

    hass_storage[JOURNAL_STORAGE_KEY] = {
        "version": 1,
        "data": {"plans": [plan("1", "running", True), plan("2", "backup", False)]},
    }
    journal = JournalStore(hass)
    await journal.async_load()
    ran, backed = journal.plans
    assert ran["status"] == "partial" and backed["status"] == "aborted"
    assert ran["actions"][0]["result"]["state"] == "done"
    assert ran["actions"][1]["result"]["reason"] == "interrupted"
    assert ran["run"]["finished_at"] and ran["events"][-1]["type"] == "interrupted"


def test_plans_that_ran_go_after_a_year_or_beyond_the_count_unless_they_hold_a_quarantine() -> None:
    from custom_components.ha_housekeeper.cleanup import JOURNAL_MAX_PLANS

    def ran(plan_id: str, ended: str, kind: str = "remove_entity"):
        done = {"state": "done", "at": ended}
        return {
            "plan_id": plan_id,
            "executed": True,
            "status": "verified",
            "run": {"started_at": ended, "finished_at": ended},
            "actions": [{"kind": kind, "object_id": "sensor.a", "result": done}],
        }

    old, recent = "2020-01-01T00:00:00+00:00", datetime.now(UTC).isoformat()
    journal = _journal()
    journal._plans = [ran("old", old), ran("quarantine", old, "disable_entity")]
    journal.add(ran("new", recent))
    assert [p["plan_id"] for p in journal.plans] == ["new", "quarantine"]

    journal._plans = [ran(str(n), recent) for n in range(JOURNAL_MAX_PLANS)]  # newest first
    journal.add(ran("one more", recent))
    ids = [p["plan_id"] for p in journal.plans]
    assert (
        len(ids) == JOURNAL_MAX_PLANS
        and ids[0] == "one more"
        and str(JOURNAL_MAX_PLANS - 1) not in ids
    )


def test_a_blocked_automation_may_be_disabled_but_a_working_one_may_not() -> None:
    stuck = entity("automation.stuck", "active", blocked_automation=True)
    fine = entity("automation.fine", "active")
    assert "entity_working" not in verdict([stuck], [], "automation.stuck")["reasons"]
    assert "entity_working" in verdict([fine], [], "automation.fine")["reasons"]
    assert (
        "entity_working"
        in verdict([stuck], [], "automation.stuck", kind="remove_entity")["reasons"]
    )
