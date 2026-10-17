"""The home functions only report defects supported by the latest readable scan."""

from datetime import UTC, datetime, timedelta

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.monitor import (  # noqa: E402
    MonitorError,
    MonitorStore,
    evaluate,
)

NOW = datetime.now(UTC).replace(microsecond=0)


def definition(*members):
    return {
        "id": "water",
        "name": "Wasseralarm",
        "description": "",
        "notify": True,
        "members": [{"object_key": key, "required": required} for key, required in members],
    }


def snapshot(
    objects=(), findings=(), *, registry="checked", automations="checked", apps="checked", at=NOW
):
    return {
        "objects": list(objects),
        "findings": list(findings),
        "meta": {
            "scanned_at": at.isoformat(),
            "preliminary": False,
            "coverage": [
                {"source": "registry", "state": registry},
                {"source": "automations", "state": automations},
                {"source": "apps", "state": apps},
            ],
        },
    }


def health(state="ok"):
    return {"state": state, "interval_hours": 24}


def test_required_fault_wins_over_a_gap_and_additional_object_does_not_decide():
    item = definition(("entity:sensor.water", True), ("automation:automation.water", True))
    data = snapshot(
        [{"object_type": "entity", "object_id": "sensor.water", "status": "unavailable"}],
        automations="skipped",
    )
    result = evaluate(item, data, health(), NOW)
    assert result["state"] == "problem"
    assert result["members"][1]["state"] == "unverified"
    item["members"][0]["required"] = False
    assert evaluate(item, data, health(), NOW)["state"] == "unverified"


def test_missing_object_needs_checked_source_and_stale_scan_is_unknown():
    item = definition(("entity:sensor.water", True))
    assert evaluate(item, snapshot(), health(), NOW)["state"] == "problem"
    assert evaluate(item, snapshot(registry="partial"), health(), NOW)["state"] == "unverified"
    old = snapshot(at=NOW - timedelta(days=4))
    assert evaluate(item, old, health(), NOW)["state"] == "unverified"
    assert evaluate(item, snapshot(), health("failed"), NOW)["state"] == "unverified"


def test_automation_broken_reference_is_a_problem_but_off_entity_is_not():
    item = definition(("automation:automation.water", True))
    data = snapshot(
        [{"object_type": "automation", "object_id": "automation.water", "status": "active"}],
        [
            {
                "rule_id": "automation.dead_actions",
                "object_id": "automation.water",
                "classification": "broken_reference",
            }
        ],
    )
    assert evaluate(item, data, health(), NOW)["reason"] == "automation.dead_actions"
    item = definition(("entity:sensor.water", True))
    data = snapshot(
        [{"object_type": "entity", "object_id": "sensor.water", "status": "active", "state": "off"}]
    )
    assert evaluate(item, data, health(), NOW)["state"] == "ok"


def test_scenes_scripts_and_selected_apps_have_distinct_fault_rules():
    scene = definition(("scene:scene.arrival", True))
    script = definition(("script:script.arrival", True))
    app = definition(("app:core_mosquitto", True))
    scene_item = {
        "object_type": "scene",
        "object_id": "scene.arrival",
        "status": "active",
        "state": "off",
    }
    script_item = {
        "object_type": "script",
        "object_id": "script.arrival",
        "status": "active",
        "state": "off",
    }
    app_item = {"object_type": "app", "object_id": "core_mosquitto", "status": "stopped"}
    assert evaluate(scene, snapshot([scene_item]), health(), NOW)["state"] == "ok"
    assert evaluate(script, snapshot([script_item]), health(), NOW)["state"] == "ok"
    broken = {
        "rule_id": "scene.missing_entity",
        "object_id": "scene.arrival",
        "classification": "broken_reference",
    }
    assert (
        evaluate(scene, snapshot([scene_item], [broken]), health(), NOW)["reason"]
        == "broken_reference"
    )
    assert (
        evaluate(
            scene, snapshot([scene_item], [{**broken, "runtime_created": True}]), health(), NOW
        )["state"]
        == "ok"
    )
    assert (
        evaluate(
            script,
            snapshot(
                [script_item],
                [{**broken, "rule_id": "script.dead_actions", "object_id": "script.arrival"}],
            ),
            health(),
            NOW,
        )["reason"]
        == "broken_reference"
    )
    assert evaluate(app, snapshot([app_item]), health(), NOW)["reason"] == "stopped"
    assert evaluate(app, snapshot(apps="skipped"), health(), NOW)["state"] == "unverified"


def test_entity_conditions_use_scan_evidence_and_keep_gaps_unknown():
    item = definition(("entity:sensor.battery", True))
    item["members"][0]["rules"] = [
        {"kind": "freshness", "value": 24},
        {"kind": "min_value", "value": 20},
    ]
    object_data = {
        "object_type": "entity",
        "object_id": "sensor.battery",
        "status": "active",
        "state": "19",
        "last_updated": (NOW - timedelta(hours=1)).isoformat(),
    }
    assert evaluate(item, snapshot([object_data]), health(), NOW)["reason"] == "rule_below_min"
    assert (
        evaluate(
            item,
            snapshot(
                [
                    {
                        **object_data,
                        "state": "21",
                        "last_updated": (NOW - timedelta(hours=25)).isoformat(),
                    }
                ]
            ),
            health(),
            NOW,
        )["reason"]
        == "rule_stale"
    )
    assert (
        evaluate(
            item, snapshot([{**object_data, "state": "21", "last_updated": None}]), health(), NOW
        )["state"]
        == "unverified"
    )
    assert (
        evaluate(item, snapshot([object_data], registry="skipped"), health(), NOW)["state"]
        == "unverified"
    )


def test_unavailable_grace_period_and_rule_validation():
    item = definition(("entity:sensor.water", True))
    item["members"][0]["rules"] = [{"kind": "unavailable_for", "value": 10}]
    object_data = {
        "object_type": "entity",
        "object_id": "sensor.water",
        "status": "unavailable",
        "status_since": (NOW - timedelta(minutes=5)).isoformat(),
    }
    assert evaluate(item, snapshot([object_data]), health(), NOW)["reason"] == "rule_waiting"
    assert (
        evaluate(
            item,
            snapshot([{**object_data, "status_since": (NOW - timedelta(minutes=11)).isoformat()}]),
            health(),
            NOW,
        )["reason"]
        == "rule_unavailable_long"
    )
    MonitorStore._validate(item["name"], "", True, item["members"])
    for rules in (
        [{"kind": "freshness", "value": 0}],
        [{"kind": "min_value", "value": float("nan")}],
        [{"kind": "freshness", "value": 24}, {"kind": "freshness", "value": 12}],
    ):
        item["members"][0]["rules"] = rules
        with pytest.raises(MonitorError):
            MonitorStore._validate(item["name"], "", True, item["members"])


def test_disabled_monitor_keeps_its_definition_without_evaluating_or_alerting(monkeypatch):
    item = {**definition(("entity:sensor.water", True)), "enabled": False}
    bad = snapshot(
        [{"object_type": "entity", "object_id": "sensor.water", "status": "unavailable"}]
    )
    assert evaluate(item, bad, health(), NOW)["state"] == "disabled"
    with pytest.raises(MonitorError):
        MonitorStore._validate(item["name"], "", True, item["members"], "no")
    events = []
    store = MonitorStore.__new__(MonitorStore)
    store.hass = object()
    store.items = [item]
    store.runtime = {}
    store.history = {}
    store.retention_days = 90
    store.results = []
    monkeypatch.setattr(store, "_save", lambda: None)
    monkeypatch.setattr(store, "_event", lambda kind, *_: events.append(kind))
    monkeypatch.setattr(store, "_notify", lambda *_a, **_k: events.append("notification"))
    monkeypatch.setattr(
        "custom_components.ha_housekeeper.monitor.async_dispatcher_send", lambda *_: None
    )
    store.refresh(bad, health(), new_scan=True)
    assert store.results[0]["state"] == "disabled"
    assert store.results[0]["incident_open"] is False
    assert events == []


def test_two_scans_are_needed_to_report_a_gap(monkeypatch):
    events = []
    store = MonitorStore.__new__(MonitorStore)
    store.hass = object()
    store.items = [definition(("entity:sensor.water", True))]
    store.runtime = {}
    store.history = {}
    store.retention_days = 90
    store.results = []
    monkeypatch.setattr(store, "_save", lambda: None)
    monkeypatch.setattr(store, "_event", lambda kind, *_: events.append(kind))
    monkeypatch.setattr(store, "_notify", lambda *_a, **_k: None)
    monkeypatch.setattr(
        "custom_components.ha_housekeeper.monitor.async_dispatcher_send", lambda *_: None
    )
    good = snapshot([{"object_type": "entity", "object_id": "sensor.water", "status": "active"}])
    gap = snapshot(registry="skipped")
    store.refresh(good, health(), new_scan=True)
    store.refresh(gap, health(), new_scan=True)
    assert events == []
    store.refresh(gap, health(), new_scan=True)
    assert events == ["pruefung_unvollstaendig"]


def test_incident_stays_open_during_gap_and_closes_after_proven_recovery(monkeypatch):
    events = []
    store = MonitorStore.__new__(MonitorStore)
    store.hass = object()
    store.items = [definition(("entity:sensor.water", True))]
    store.runtime = {}
    store.history = {}
    store.retention_days = 90
    store.results = []
    monkeypatch.setattr(store, "_save", lambda: None)
    monkeypatch.setattr(store, "_event", lambda kind, *_: events.append(kind))
    monkeypatch.setattr(store, "_notify", lambda *_a, **_k: None)
    monkeypatch.setattr(store, "_dismiss", lambda *_: None)
    monkeypatch.setattr(
        "custom_components.ha_housekeeper.monitor.async_dispatcher_send", lambda *_: None
    )
    bad = snapshot(
        [{"object_type": "entity", "object_id": "sensor.water", "status": "unavailable"}]
    )
    good = snapshot([{"object_type": "entity", "object_id": "sensor.water", "status": "active"}])
    store.refresh(bad, health(), new_scan=True)
    assert events == []  # The first evaluation is the comparison basis.
    store.refresh(bad, health("failed"), new_scan=False)
    assert store.results[0]["incident_open"] is True
    assert store.results[0]["last_problem_reason"] == "unavailable"
    store.refresh(good, health(), new_scan=True)
    assert events == ["wieder_unauffaellig"]
    store.refresh(bad, health(), new_scan=True)
    assert events == ["wieder_unauffaellig", "beeintraechtigt"]


def test_history_records_changes_and_drops_what_is_older_than_the_retention(monkeypatch):
    store = MonitorStore.__new__(MonitorStore)
    store.history, store.retention_days = {}, 30
    now = datetime.now(UTC)
    assert store._log(
        "water",
        "problem",
        now - timedelta(days=40),
        reason="unavailable",
        key="entity:sensor.water",
    )
    assert not store._log(
        "water",
        "problem",
        now - timedelta(days=39),
        reason="unavailable",
        key="entity:sensor.water",
    )
    assert store._log("water", "edited", now, added=["entity:sensor.leak"])
    assert [e["kind"] for e in store.history_of("water")] == ["edited"]
    assert MonitorStore._history_entry({"at": "x", "kind": "ok"}) is None


def test_quick_state_changes_become_one_flapping_entry_that_later_changes_extend():
    store = MonitorStore.__new__(MonitorStore)
    store.history, store.retention_days = {}, 30
    start = datetime.now(UTC) - timedelta(hours=2)
    for i, kind in enumerate(("problem", "ok", "problem", "ok", "problem")):
        store._log(
            "water",
            kind,
            start + timedelta(minutes=10 * i),
            reason="unavailable" if kind == "problem" else None,
        )
    [entry] = store.history_of("water")
    assert (entry["kind"], entry["count"], entry["state"], entry["at"]) == (
        "flapping",
        5,
        "problem",
        start.isoformat(),
    )
    store._log("water", "ok", start + timedelta(minutes=50))
    assert store.history["water"][0]["count"] == 6 and "reason" not in store.history["water"][0]
    assert MonitorStore._history_entry(store.history["water"][0]) == store.history["water"][0]


def test_availability_counts_known_stretches_and_leaves_out_gaps_and_disabled_time():
    from custom_components.ha_housekeeper.monitor import availability

    now = datetime(2026, 10, 14, 12, tzinfo=UTC)
    at = lambda hours: (now - timedelta(hours=hours)).isoformat()  # noqa: E731
    entries = [
        {"at": at(30), "kind": "created"},
        {"at": at(29), "kind": "ok"},
        {"at": at(10), "kind": "problem", "reason": "unavailable"},
        {"at": at(8), "kind": "ok"},
        {"at": at(6), "kind": "disabled"},
        {"at": at(4), "kind": "enabled"},
        {"at": at(3), "kind": "unverified"},
    ]
    result = availability(entries, now, 30)
    assert (result["ok_seconds"], result["problem_seconds"], result["unknown_seconds"]) == (
        (19 + 2) * 3600,
        2 * 3600,
        3 * 3600,
    )
    assert (result["incidents"], result["longest_seconds"]) == (1, 2 * 3600)
    assert (
        result["since"] == at(29)
        and len(result["days"]) == 31
        and result["days"][-1]["state"] == "problem"
    )
    assert result["days"][0]["state"] is None
    assert sum(day["problem_seconds"] for day in result["days"]) == 2 * 3600


def test_last_problem_is_the_end_of_the_latest_impaired_stretch():
    store = MonitorStore.__new__(MonitorStore)
    now = datetime(2026, 10, 14, 12, tzinfo=UTC)
    store.history = {
        "w": [
            {"at": (now - timedelta(hours=9)).isoformat(), "kind": "problem"},
            {"at": (now - timedelta(hours=8)).isoformat(), "kind": "ok"},
        ]
    }
    assert store.last_problem_at("w", now) == (now - timedelta(hours=8)).isoformat()
    store.history["w"].append({"at": (now - timedelta(hours=1)).isoformat(), "kind": "problem"})
    assert store.last_problem_at("w", now) == now.isoformat()
    assert store.last_problem_at("none", now) is None
