"""The recorder purge only touches orphaned statistics, never an existing entity or the Energy dashboard."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")


def test_a_purge_action_needs_an_orphan_without_entity_and_is_always_a_review() -> None:
    from custom_components.ha_housekeeper.cleanup import judge_purge_action

    orphans = {"sensor.gone": {"in_energy": False}, "sensor.energy": {"in_energy": True}}
    ok = judge_purge_action("sensor.gone", orphans, False, True, True)
    assert ok["verdict"] == "review" and ok["reasons"] == ["irreversible", "with_states"]
    for sid, exists, recorder, reason in (
        ("sensor.energy", False, True, "in_energy"),
        ("sensor.gone", True, True, "entity_exists"),
        ("sensor.other", False, True, "not_orphaned"),
        ("sensor.gone", False, False, "no_recorder"),
    ):
        action = judge_purge_action(sid, orphans, exists, False, recorder)
        assert action["verdict"] == "blocked" and reason in action["reasons"]


def test_the_recorder_choice_of_a_removal_is_a_review_and_blocked_for_energy_or_no_recorder() -> (
    None
):
    from custom_components.ha_housekeeper.cleanup import apply_recorder_choice
    from custom_components.ha_housekeeper.simulation import simulate

    def action(used_by=()):
        return {
            "kind": "remove_entity",
            "object_id": "sensor.a",
            "reasons": [],
            "used_by": list(used_by),
        }

    kept = action()
    apply_recorder_choice(kept, "keep", True)
    assert "recorder" not in kept and kept["reasons"] == []
    chosen = action()
    apply_recorder_choice(chosen, "states", True)
    assert chosen["verdict"] == "review" and chosen["reasons"] == ["irreversible", "with_states"]
    energy = action([{"source": "dashboard:energy", "confidence": "certain"}])
    apply_recorder_choice(energy, "statistics", True)
    assert energy["verdict"] == "blocked" and "in_energy" in energy["reasons"]
    none = action()
    apply_recorder_choice(none, "statistics", False)
    assert none["verdict"] == "blocked" and "no_recorder" in none["reasons"]

    chosen.update(executable=True, history={"states": 5, "statistics": 3}, has_statistics=True)
    stats = {**chosen, "recorder": "statistics"}
    assert simulate([chosen])["purge_rows"] == 8
    sim = simulate([stats])
    assert (
        sim["purge_rows"] == 3
        and sim["history_rows_kept"] == 5
        and sim["statistics_orphaned_count"] == 0
    )


def _recorder(monkeypatch: pytest.MonkeyPatch):
    """A recorder that only records what is cleared; returns the ``hass`` stand-in and that list."""
    from types import SimpleNamespace
    from unittest.mock import MagicMock

    cleared: list[list[str]] = []
    instance = MagicMock()
    instance.async_clear_statistics = cleared.append

    async def done():
        return None

    async def run_job(job):
        return job()

    instance.async_block_till_done = done
    instance.async_add_executor_job = run_job
    monkeypatch.setattr("homeassistant.components.recorder.get_instance", lambda hass: instance)
    monkeypatch.setattr(
        "homeassistant.components.recorder.statistics.get_metadata", lambda hass, **kw: {}
    )
    return SimpleNamespace(data={}, states=SimpleNamespace(get=lambda sid: None)), cleared


async def test_the_purge_waits_for_a_running_query_and_gives_up_without_deleting(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import asyncio

    from custom_components.ha_housekeeper import recorder_purge

    hass, cleared = _recorder(monkeypatch)
    monkeypatch.setattr(recorder_purge, "QUERY_WAIT", 0.05)
    lock = hass.data.setdefault("ha_housekeeper", {}).setdefault("reliability_lock", asyncio.Lock())
    await lock.acquire()  # a slow recorder query holds the shared lock
    removed, left, error = await recorder_purge.delete_statistics(
        hass, ["sensor.gone"], states=False
    )
    assert (removed, left, error) == ([], [], "recorder_busy") and cleared == []
    lock.release()
    removed, left, error = await recorder_purge.delete_statistics(
        hass, ["sensor.gone"], states=False
    )
    assert removed == ["sensor.gone"] and error is None and cleared == [["sensor.gone"]]
    assert not lock.locked()


async def test_trimming_waits_for_every_batch_and_stops_when_nothing_moves(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from homeassistant.components import recorder

    from custom_components.ha_housekeeper import recorder_purge

    hass, _ = _recorder(monkeypatch)
    rows = {"n": 9000, "batch": 4000}

    async def done():  # each wait lets the recorder run one more batch
        rows["n"] = max(0, rows["n"] - rows["batch"])

    recorder.get_instance(hass).async_block_till_done = done

    async def call(*args, **kwargs):
        return None

    async def counted(hass_, ids, keep_days, locked=False):
        assert locked  # trim_states holds the shared lock while it counts
        return {i: {"rows": rows["n"], "oldest": None} for i in ids}

    hass.services = type("S", (), {"async_call": staticmethod(call)})()
    monkeypatch.setattr(recorder_purge, "count_older", counted)
    assert await recorder_purge.trim_states(hass, "sensor.power", 14) == (0, None)

    rows.update(n=5000, batch=0)  # a recorder that stops deleting
    assert await recorder_purge.trim_states(hass, "sensor.power", 14) == (5000, None)


def test_simulation_splits_the_purged_rows_into_statistics_and_states():
    from custom_components.ha_housekeeper.simulation import simulate

    action = {"kind": "purge_statistics", "object_id": "sensor.old", "executable": True, "history": {"states": 5, "statistics": 3}}
    both = simulate([{**action, "states": True}])
    assert (both["purge_stat_rows"], both["purge_states_rows"], both["purge_rows"]) == (3, 5, 8)
    only = simulate([{**action, "states": False}])
    assert (only["purge_stat_rows"], only["purge_states_rows"]) == (3, 0)
