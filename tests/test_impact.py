"""A finding's impact follows what depends on the object and whether it is critical."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.impact import apply_impact  # noqa: E402


def _entity(object_id, **extra):
    return {"object_type": "entity", "object_id": object_id, "status": "unavailable", **extra}


def _auto(object_id, status="active"):
    return {"object_type": "automation", "object_id": object_id, "status": status}


def _edge(source, target, relation="TRIGGERS_ON"):
    return {"source": source, "target": target, "relation": relation}


def _impact(objects, edges, finding):
    apply_impact(objects, edges, [finding])
    return finding["impact"], [f["fact"] for f in finding["impact_facts"]]


def _unavailable(object_id):
    return {
        "rule_id": "entity.state_unavailable",
        "object_id": object_id,
        "classification": "unavailable",
    }


def test_critical_things_rank_above_unused_ones() -> None:
    objects = [
        _entity("sensor.unused"),
        _entity("sensor.read"),
        _entity("lock.front"),
        _entity("binary_sensor.leak", device_class="moisture"),
        _auto("automation.a"),
    ]
    edges = [_edge("automation:automation.a", "entity:sensor.read")]
    assert _impact(objects, edges, _unavailable("sensor.unused")) == ("info", [])
    assert _impact(objects, edges, _unavailable("sensor.read")) == ("medium", ["used_by_active"])
    assert _impact(objects, edges, _unavailable("lock.front")) == ("high", ["critical"])
    assert _impact(objects, edges, _unavailable("binary_sensor.leak"))[0] == "high"


def test_a_label_on_the_area_or_device_makes_an_entity_critical() -> None:
    objects = [
        {"object_type": "area", "object_id": "garden", "labels": ["housekeeper_critical"]},
        {"object_type": "device", "object_id": "d1", "area_id": "garden"},
        _entity("sensor.pump", device_id="d1"),
    ]
    assert _impact(objects, [], _unavailable("sensor.pump")) == ("high", ["critical"])


def test_a_broken_reference_counts_by_what_the_automation_controls_and_whether_it_runs() -> None:
    objects = [_auto("automation.door"), _auto("automation.off", "disabled"), _entity("lock.front")]
    edges = [_edge("automation:automation.door", "entity:lock.front", "TARGETS")]
    broken = lambda oid, **kw: {  # noqa: E731
        "rule_id": "automation.missing_entity",
        "object_id": oid,
        "classification": "broken_reference",
        "affected_object": "light.gone",
        **kw,
    }
    assert _impact(objects, edges, broken("automation.door")) == (
        "high",
        ["controls_critical", "runs_active"],
    )
    assert _impact(objects, edges, broken("automation.off")) == ("low", ["runs_inactive"])
    assert _impact(objects, [], broken("automation.off", affected_object="lock.back")) == (
        "high",
        ["target_critical", "runs_inactive"],
    )


def test_many_dependents_are_high_on_their_own() -> None:
    objects = [_entity("sensor.hub")] + [
        {"object_type": "dashboard", "object_id": f"d{i}", "status": "active"} for i in range(5)
    ]
    edges = [_edge(f"dashboard:d{i}", "entity:sensor.hub", "SHOWS") for i in range(5)]
    assert _impact(objects, edges, _unavailable("sensor.hub")) == (
        "high",
        ["on_dashboards", "many_dependents"],
    )


def test_cleanup_asks_for_a_separate_confirmation_for_critical_objects() -> None:
    from custom_components.ha_housekeeper.cleanup import judge_action

    objects = [_entity("lock.front"), _entity("sensor.plain")]
    apply_impact(objects, [], [])
    entities = {o["object_id"]: o for o in objects}
    assert (
        entities["lock.front"]["critical"] == "kind" and "critical" not in entities["sensor.plain"]
    )
    critical = judge_action("disable_entity", "lock.front", entities, [])
    assert critical["verdict"] == "review" and "critical_object" in critical["reasons"]
    assert judge_action("disable_entity", "sensor.plain", entities, [])["verdict"] == "ok"


def test_an_outage_is_at_least_as_important_as_it_is_old() -> None:
    from custom_components.ha_housekeeper.impact import apply_impact

    findings = [
        {"rule_id": "config_entry.not_loaded", "object_id": "e1", "outage_level": "info"},
        {"rule_id": "config_entry.not_loaded", "object_id": "e2", "outage_level": "medium"},
    ]
    apply_impact([], [], findings)
    assert [f["impact"] for f in findings] == ["info", "medium"]
    assert all("outage_level" not in f for f in findings)
