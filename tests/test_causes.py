"""Many unavailable entities with one cause become one cause with follow-up findings."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.causes import apply_causes  # noqa: E402


def _entity(object_id, **extra):
    return {"object_type": "entity", "object_id": object_id, "status": "unavailable", **extra}


def _finding(object_id, **extra):
    return {
        "rule_id": "entity.state_unavailable",
        "object_id": object_id,
        "classification": "unavailable",
        "key": f"k|{object_id}",
        "ignored": False,
        **extra,
    }


ENTRY = {"object_type": "config_entry", "object_id": "e1", "name": "Cloud", "status": "problem"}
DEVICE = {"object_type": "device", "object_id": "d1", "name": "Lamp", "status": "active"}


def test_a_failed_integration_collects_its_unavailable_entities() -> None:
    objects = [
        ENTRY,
        _entity("sensor.a", config_entry_id="e1"),
        _entity("sensor.b", config_entry_id="e1"),
    ]
    objects.append(_entity("sensor.c", config_entry_id="other"))
    objects.append({"object_type": "automation", "object_id": "automation.x", "status": "active"})
    edges = [
        {
            "source": "automation:automation.x",
            "target": "entity:sensor.a",
            "relation": "TRIGGERS_ON",
        }
    ]
    findings = [_finding("sensor.a"), _finding("sensor.b", ignored=True), _finding("sensor.c")]
    causes = apply_causes(objects, edges, findings)
    assert [c["id"] for c in causes] == ["integration_down:e1"]
    assert causes[0]["follower_count"] == 1, "a hidden finding does not count"
    assert causes[0]["consumers"] == {"automation": 1}
    assert [f.get("cause_id") for f in findings] == ["integration_down:e1", None, None]


def test_a_working_integration_is_no_cause_and_a_dead_device_is() -> None:
    objects = [{**ENTRY, "status": "active"}, DEVICE]
    objects += [_entity(f"sensor.{n}", config_entry_id="e1", device_id="d1") for n in "abc"]
    findings = [_finding(f"sensor.{n}") for n in "abc"]
    causes = apply_causes(objects, [], findings)
    assert [(c["kind"], c["follower_count"]) for c in causes] == [("device_down", 3)]
    objects[3]["status"] = "active"
    assert apply_causes(objects, [], findings) == [], "one entity works: no pattern"
    assert all("cause_id" not in f for f in findings), "old causes are cleared"
    assert apply_causes(objects[:3], [], findings[:2]) == [], "fewer than three entities"


def test_the_integration_wins_over_the_device() -> None:
    objects = [ENTRY, DEVICE] + [
        _entity(f"sensor.{n}", config_entry_id="e1", device_id="d1") for n in "abc"
    ]
    findings = [_finding(f"sensor.{n}") for n in "abc"]
    assert [c["kind"] for c in apply_causes(objects, [], findings)] == ["integration_down"]


def test_an_integration_that_is_down_is_a_cause_even_without_follow_up_findings() -> None:
    objects = [ENTRY, _entity("sensor.a", config_entry_id="e1")]
    edges = [
        {
            "source": "automation:automation.x",
            "target": "entity:sensor.a",
            "relation": "TRIGGERS_ON",
        }
    ]
    causes = apply_causes(objects, edges, [])
    assert [(c["id"], c["follower_count"], c["impact"]) for c in causes] == [
        ("integration_down:e1", 0, "none")
    ]
    assert causes[0]["consumers"] == {"automation": 1}
