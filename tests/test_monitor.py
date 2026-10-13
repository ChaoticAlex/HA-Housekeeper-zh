"""The Hausmonitor only reports defects supported by the latest readable scan."""

from datetime import UTC, datetime, timedelta

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.monitor import (  # noqa: E402
    MonitorStore,
    evaluate,
)

NOW = datetime(2026, 10, 13, 12, tzinfo=UTC)


def definition(*members):
    return {
        "id": "water", "name": "Wasseralarm", "description": "", "notify": True,
        "members": [{"object_key": key, "required": required} for key, required in members],
    }


def snapshot(objects=(), findings=(), *, registry="checked", automations="checked", at=NOW):
    return {
        "objects": list(objects), "findings": list(findings),
        "meta": {
            "scanned_at": at.isoformat(), "preliminary": False,
            "coverage": [
                {"source": "registry", "state": registry},
                {"source": "automations", "state": automations},
            ],
        },
    }


def health(state="ok"):
    return {"state": state, "interval_hours": 24}


def test_required_fault_wins_over_a_gap_and_additional_object_does_not_decide():
    item = definition(("entity:sensor.water", True), ("automation:automation.water", True))
    data = snapshot([{"object_type": "entity", "object_id": "sensor.water", "status": "unavailable"}], automations="skipped")
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
        [{"rule_id": "automation.dead_actions", "object_id": "automation.water", "classification": "broken_reference"}],
    )
    assert evaluate(item, data, health(), NOW)["reason"] == "automation.dead_actions"
    item = definition(("entity:sensor.water", True))
    data = snapshot([{"object_type": "entity", "object_id": "sensor.water", "status": "active", "state": "off"}])
    assert evaluate(item, data, health(), NOW)["state"] == "ok"


def test_two_scans_are_needed_to_report_a_gap(monkeypatch):
    events = []
    store = MonitorStore.__new__(MonitorStore)
    store.hass = object()
    store.items = [definition(("entity:sensor.water", True))]
    store.runtime = {}
    store.results = []
    monkeypatch.setattr(store, "_save", lambda: None)
    monkeypatch.setattr(store, "_event", lambda kind, *_: events.append(kind))
    monkeypatch.setattr(store, "_notify", lambda *_a, **_k: None)
    monkeypatch.setattr("custom_components.ha_housekeeper.monitor.async_dispatcher_send", lambda *_: None)
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
    store.results = []
    monkeypatch.setattr(store, "_save", lambda: None)
    monkeypatch.setattr(store, "_event", lambda kind, *_: events.append(kind))
    monkeypatch.setattr(store, "_notify", lambda *_a, **_k: None)
    monkeypatch.setattr(store, "_dismiss", lambda *_: None)
    monkeypatch.setattr("custom_components.ha_housekeeper.monitor.async_dispatcher_send", lambda *_: None)
    bad = snapshot([{"object_type": "entity", "object_id": "sensor.water", "status": "unavailable"}])
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
