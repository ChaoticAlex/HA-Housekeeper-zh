"""Tests for the duplicate and unused-automation heuristics (no Home Assistant required)."""

from __future__ import annotations

from datetime import UTC, datetime

from custom_components.ha_housekeeper.hygiene import (
    automation_hygiene_findings,
    duplicate_findings,
    mark_duplicates,
)

NOW = datetime(2026, 10, 7, tzinfo=UTC)


def _entity(object_id: str, status: str, platform: str = "cast", since: str | None = None) -> dict:
    return {"object_id": object_id, "status": status, "platform": platform, "status_since": since}


def test_unavailable_suffixed_twin_of_an_active_entity_is_a_duplicate() -> None:
    entities = [
        _entity("media_player.tv", "active"),
        _entity("media_player.tv_2", "unavailable"),
        _entity("media_player.tv_3", "orphaned"),
    ]
    mark_duplicates(entities)

    assert [e["duplicate_of"] for e in entities] == [None, "media_player.tv", "media_player.tv"]


def test_two_active_entities_or_other_integrations_are_not_duplicates() -> None:
    entities = [
        _entity("sensor.power", "active", "shelly"),
        _entity("sensor.power_2", "active", "shelly"),
        _entity("light.lamp", "active", "hue"),
        _entity("light.lamp_2", "unavailable", "zha"),
        _entity("sensor.other_2", "unavailable", "hue"),
    ]
    mark_duplicates(entities)

    assert all(e["duplicate_of"] is None for e in entities)


def test_a_leftover_without_suffix_points_to_its_one_working_suffixed_twin() -> None:
    entities = [
        {**_entity("sensor.level", "orphaned", "victron"), "original_name": "Level"},
        {**_entity("sensor.level_2", "active", "victron"), "original_name": "Level"},
        {**_entity("sensor.pm2", "unavailable", "air"), "original_name": "PM2"},
        {**_entity("sensor.pm2_5", "active", "air"), "original_name": "PM2.5"},
    ]
    mark_duplicates(entities)

    assert [e["duplicate_of"] for e in entities] == ["sensor.level_2", None, None, None]


def test_a_lamp_and_a_room_without_names_on_other_devices_are_no_duplicates() -> None:
    entities = [
        {
            **_entity("light.living", "unavailable", "hue"),
            "original_name": None,
            "device_id": "lamp",
        },
        {**_entity("light.living_2", "active", "hue"), "original_name": None, "device_id": "room"},
        {**_entity("light.desk", "unavailable", "hue"), "original_name": None, "device_id": "d1"},
        {**_entity("light.desk_2", "active", "hue"), "original_name": None, "device_id": "d1"},
    ]
    mark_duplicates(entities)

    assert [e["duplicate_of"] for e in entities] == [None, None, "light.desk_2", None]


def test_duplicate_findings_respect_the_outage_filter() -> None:
    entities = [
        _entity("a.x", "active"),
        _entity("a.x_2", "unavailable", since="2026-10-06T00:00:00+00:00"),
    ]
    mark_duplicates(entities)

    assert duplicate_findings(entities, lambda item: False) == []
    finding = duplicate_findings(entities, lambda item: True)[0]
    assert (finding["rule_id"], finding["affected_object"], finding["classification"]) == (
        "entity.possible_duplicate",
        "a.x",
        "possible_duplicate",
    )


def _automation(object_id: str, status: str, **extra) -> dict:
    return {"object_type": "automation", "object_id": object_id, "status": status, **extra}


def test_automation_hygiene_rules() -> None:
    automations = [
        _automation("automation.old_never", "active", created_at="2026-01-01T00:00:00+00:00"),
        _automation("automation.new_never", "active", created_at="2026-10-01T00:00:00+00:00"),
        _automation("automation.stale", "active", last_triggered="2026-05-01T00:00:00+00:00"),
        _automation("automation.fresh", "active", last_triggered="2026-10-06T00:00:00+00:00"),
        _automation("automation.off_long", "disabled", status_since="2026-06-01T00:00:00+00:00"),
        _automation("automation.off_short", "disabled", status_since="2026-10-01T00:00:00+00:00"),
        _automation("automation.broken", "unavailable", created_at="2025-01-01T00:00:00+00:00"),
        {"object_type": "script", "object_id": "script.x", "status": "active"},
    ]
    findings = automation_hygiene_findings(automations, NOW, 90)

    assert {(f["rule_id"], f["object_id"]) for f in findings} == {
        ("automation.never_triggered", "automation.old_never"),
        ("automation.stale", "automation.stale"),
        ("automation.disabled_long", "automation.off_long"),
    }
    assert all(f["classification"] == "unused" for f in findings)
    assert next(f for f in findings if f["rule_id"] == "automation.disabled_long")[
        "first_detected_at"
    ]
    assert automation_hygiene_findings(automations, NOW, 0) == []


def test_automation_without_any_age_information_is_never_reported() -> None:
    assert automation_hygiene_findings([_automation("automation.a", "active")], NOW, 90) == []


def _battery(
    object_id: str, state: str, status: str = "active", device_class: str = "battery"
) -> dict:
    return {"object_id": object_id, "state": state, "status": status, "device_class": device_class}


def test_battery_levels_and_low_flags() -> None:
    from custom_components.ha_housekeeper.hygiene import battery_level, low_battery_ids

    entities = [
        _battery("sensor.low", "12"),
        _battery("sensor.edge", "20"),
        _battery("sensor.ok", "85.5"),
        _battery("sensor.broken", "unknown"),
        _battery("sensor.off", "5", status="unavailable"),
        _battery("sensor.temp", "3", device_class="temperature"),
        _battery("binary_sensor.low_flag", "on"),
        _battery("binary_sensor.fine_flag", "off"),
    ]

    assert battery_level(entities[2]) == (85.5, False)
    assert battery_level(entities[3]) == (None, False)
    volts = {**_battery("sensor.cell", "3.2"), "unit": "V"}  # volts are no percentage
    assert battery_level(volts) == (None, False) and low_battery_ids([volts], 20) == []
    assert low_battery_ids(entities, 20) == ["sensor.low", "sensor.edge", "binary_sensor.low_flag"]


def test_orphaned_statistics_skip_existing_entities_and_external_sources() -> None:
    from custom_components.ha_housekeeper.hygiene import orphan_statistics

    stats = [
        {"statistic_id": "sensor.alive", "source": "recorder"},
        {
            "statistic_id": "sensor.gone",
            "source": "recorder",
            "has_sum": True,
            "display_unit_of_measurement": "kWh",
        },
        {"statistic_id": "sensor.in_energy", "source": "recorder", "has_mean": True},
        {"statistic_id": "ext:import", "source": "ext"},
        {"statistic_id": "weird id", "source": "recorder"},
    ]
    orphans = orphan_statistics(stats, {"sensor.alive"}, {"sensor.in_energy"})
    assert [o["statistic_id"] for o in orphans] == ["sensor.gone", "sensor.in_energy"]
    assert (
        orphans[0]["has_sum"] is True
        and orphans[0]["unit"] == "kWh"
        and orphans[0]["in_energy"] is False
    )
    assert orphans[1]["in_energy"] is True
