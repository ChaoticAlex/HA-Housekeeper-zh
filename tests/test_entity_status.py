"""Table tests for the conservative entity classification and snapshot builders."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.inventory import (  # noqa: E402
    _entity_findings,
    _entity_status,
    _split_details,
    _structure_edges,
)


def _entry(**overrides):
    values = {
        "entity_id": "sensor.test",
        "disabled_by": None,
        "device_id": None,
        "config_entry_id": None,
    }
    return SimpleNamespace(**{**values, **overrides})


ENABLED_DEVICE = SimpleNamespace(disabled_by=None)
DISABLED_DEVICE = SimpleNamespace(disabled_by="user")
LOADED_ENTRY = SimpleNamespace(disabled_by=None)
DISABLED_ENTRY = SimpleNamespace(disabled_by="user")


@pytest.mark.parametrize(
    ("entry", "state", "devices", "config_entries", "expected"),
    [
        (_entry(disabled_by="user"), None, {}, {}, ("disabled", "entity_disabled")),
        (_entry(device_id="d"), "on", {}, {}, ("orphaned", "device_missing")),
        (_entry(device_id="d"), "on", {"d": DISABLED_DEVICE}, {}, ("disabled", "device_disabled")),
        (_entry(config_entry_id="c"), "on", {}, {}, ("orphaned", "config_entry_missing")),
        (
            _entry(config_entry_id="c"),
            "on",
            {},
            {"c": DISABLED_ENTRY},
            ("disabled", "integration_disabled"),
        ),
        (
            _entry(device_id="d", config_entry_id="c"),
            None,
            {"d": ENABLED_DEVICE},
            {"c": LOADED_ENTRY},
            ("orphaned", "state_missing"),
        ),
        (_entry(), "unavailable", {}, {}, ("unavailable", "state_unavailable")),
        (_entry(), "unknown", {}, {}, ("unknown", "state_unknown")),
        (_entry(), "42", {}, {}, ("active", "state_available")),
    ],
)
def test_entity_status_table(entry, state, devices, config_entries, expected) -> None:
    state_object = None if state is None else SimpleNamespace(state=state)
    assert _entity_status(entry, state_object, config_entries, devices) == expected


def test_restored_placeholder_counts_as_not_provided_only_while_loaded() -> None:
    from homeassistant.config_entries import ConfigEntryState

    state = SimpleNamespace(state="unavailable", attributes={"restored": True})
    entry = _entry(config_entry_id="c")
    loaded = {"c": SimpleNamespace(disabled_by=None, state=ConfigEntryState.LOADED)}
    failed = {"c": SimpleNamespace(disabled_by=None, state=ConfigEntryState.SETUP_RETRY)}
    assert _entity_status(entry, state, loaded, {}) == ("orphaned", "not_provided")
    assert _entity_status(entry, state, failed, {}) == ("unavailable", "state_unavailable")


def test_restored_yaml_entity_counts_as_not_provided_only_while_its_platform_runs() -> None:
    state = SimpleNamespace(state="unavailable", attributes={"restored": True})
    entry = _entry(entity_id="sensor.old", platform="template")
    assert _entity_status(entry, state, {}, {}, {"template.sensor"}) == ("orphaned", "not_provided")
    assert _entity_status(entry, state, {}, {}, {"template"}) == (
        "unavailable",
        "state_unavailable",
    )


def test_an_entity_not_provided_waits_like_an_outage_before_it_is_a_finding() -> None:
    from datetime import UTC, datetime

    now = datetime(2026, 10, 19, 12, tzinfo=UTC)
    item = {
        "object_id": "sensor.x",
        "status": "orphaned",
        "reason": "not_provided",
        "status_since": None,
        "last_changed": "2026-10-19T11:58:00+00:00",
    }
    levels = (15, 1, 24, 168)
    assert _entity_findings([item], now, levels) == []
    assert (
        len(_entity_findings([{**item, "last_changed": "2026-10-19T11:00:00+00:00"}], now, levels))
        == 1
    )


def test_an_entity_not_provided_keeps_the_observation_period_of_its_outage() -> None:
    from custom_components.ha_housekeeper.inventory import _observed_as

    assert _observed_as({"status": "orphaned", "reason": "not_provided"}) == "unavailable"
    assert _observed_as({"status": "orphaned", "reason": "state_missing"}) == "orphaned"


async def test_the_day_without_the_entity_survives_restarts_and_ends_when_it_is_back(
    hass,
) -> None:
    from datetime import UTC, datetime, timedelta

    from custom_components.ha_housekeeper.inventory import _not_provided_settled
    from custom_components.ha_housekeeper.observations import ObservationStore

    store, start = ObservationStore(hass), datetime(2026, 10, 19, 15, tzinfo=UTC)
    await store.async_update({"not_provided:sensor.x": "not_provided"}, start)
    later = start + timedelta(hours=25)
    await store.async_update({"not_provided:sensor.x": "not_provided"}, later)
    assert _not_provided_settled(store.since("not_provided:sensor.x", "not_provided"), later)
    await store.async_update({}, later)  # provided again: the period ends
    await store.async_update({"not_provided:sensor.x": "not_provided"}, later)
    assert not _not_provided_settled(store.since("not_provided:sensor.x", "not_provided"), later)


def test_unavailable_is_never_reported_as_orphaned() -> None:
    state = SimpleNamespace(state="unavailable")
    assert _entity_status(_entry(), state, {}, {})[0] == "unavailable"


def test_disabled_takes_precedence_over_missing_state() -> None:
    assert _entity_status(_entry(disabled_by="integration"), None, {}, {})[0] == "disabled"


def test_entity_findings_only_cover_orphaned_and_unavailable() -> None:
    entities = [
        {
            "object_id": "a",
            "status": "orphaned",
            "reason": "config_entry_missing",
            "status_since": "t",
        },
        {
            "object_id": "b",
            "status": "unavailable",
            "reason": "state_unavailable",
            "status_since": None,
        },
        {"object_id": "c", "status": "disabled", "reason": "entity_disabled", "status_since": None},
        {"object_id": "d", "status": "active", "reason": "state_available", "status_since": None},
    ]
    findings = _entity_findings(entities)

    assert [item["object_id"] for item in findings] == ["a", "b"]
    assert findings[0]["confidence"] == 0.98
    assert findings[1]["confidence"] == 0.75


def test_structure_edges_cover_registry_relationships() -> None:
    entities = [
        {"object_id": "light.a", "device_id": "d1", "config_entry_id": "c1", "area_id": "kitchen"}
    ]
    devices = [
        {"object_id": "d1", "config_entry_ids": ["c1"], "via_device_id": "hub", "area_id": None}
    ]
    areas = [{"object_id": "kitchen", "floor_id": "ground"}]

    edges = {
        (e["source"], e["target"], e["relation"])
        for e in _structure_edges(entities, devices, areas)
    }

    assert edges == {
        ("device:d1", "entity:light.a", "PROVIDES"),
        ("config_entry:c1", "entity:light.a", "PROVIDES"),
        ("area:kitchen", "entity:light.a", "CONTAINS"),
        ("config_entry:c1", "device:d1", "OWNS"),
        ("device:hub", "device:d1", "VIA_DEVICE"),
        ("floor:ground", "area:kitchen", "CONTAINS"),
    }


def test_split_details_moves_bulky_fields_out_of_the_list_payload() -> None:
    objects = [
        {
            "object_type": "entity",
            "object_id": "sensor.a",
            "attributes": {"unit": "W"},
            "state": "1",
        },
        {
            "object_type": "automation",
            "object_id": "automation.b",
            "triggers": [{"p": 1}],
            "actions": [],
        },
        {"object_type": "area", "object_id": "kitchen"},
    ]
    details = _split_details(objects)

    assert details == {
        "entity:sensor.a": {"attributes": {"unit": "W"}},
        "automation:automation.b": {"triggers": [{"p": 1}], "actions": []},
    }
    assert "attributes" not in objects[0]
    assert objects[0]["state"] == "1"
    assert "triggers" not in objects[1]


def test_unavailable_threshold_hides_short_outages_only() -> None:
    from datetime import UTC, datetime

    now = datetime(2026, 10, 10, tzinfo=UTC)
    entities = [
        {
            "object_id": "old",
            "status": "unavailable",
            "reason": "r",
            "status_since": "2026-10-01T00:00:00+00:00",
        },
        {
            "object_id": "new",
            "status": "unavailable",
            "reason": "r",
            "status_since": "2026-10-09T00:00:00+00:00",
        },
        {"object_id": "none", "status": "unavailable", "reason": "r", "status_since": None},
        {
            "object_id": "orph",
            "status": "orphaned",
            "reason": "r",
            "status_since": "2026-10-09T00:00:00+00:00",
        },
    ]
    # info after 2 days: the outage of one day is too young, the one without a start is unknown
    ids = lambda info: [  # noqa: E731
        f["object_id"] for f in _entity_findings(entities, now, (info, 50, 60, 200))
    ]
    assert ids(5) == ["old", "new", "orph"]
    assert ids(2880) == ["old", "orph"]
    assert [f["object_id"] for f in _entity_findings(entities, now)] == [
        "old",
        "new",
        "none",
        "orph",
    ]
