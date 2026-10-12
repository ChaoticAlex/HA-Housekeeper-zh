"""An automation is blocked when every trigger watches only dead entities."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.automation_blocked import (  # noqa: E402
    blocked_automation_findings,
)


def _automation(object_id, triggers, status="active"):
    refs = [
        {
            "kind": "entity",
            "object_id": e,
            "relation": "TRIGGERS_ON",
            "location": f"triggers/{i}/entity_id",
        }
        for i, ids in enumerate(triggers)
        for e in ids
    ]
    return {
        "object_type": "automation",
        "object_id": object_id,
        "status": status,
        "trigger_count": len(triggers),
        "references": refs,
    }


def _dead(entity_id, ignored=False):
    return {
        "rule_id": "entity.state_unavailable",
        "object_id": entity_id,
        "classification": "unavailable",
        "ignored": ignored,
    }


def test_only_automations_without_a_working_trigger_are_blocked() -> None:
    automations = [
        _automation("automation.dead", [["sensor.a"], ["sensor.b", "sensor.a"]]),
        _automation("automation.half", [["sensor.a"], ["sensor.ok"]]),
        _automation("automation.timer", [["sensor.a"], []]),  # a trigger without an entity
        _automation("automation.off", [["sensor.a"]], status="disabled"),
        _automation("automation.known", [["sensor.c"]]),
    ]
    findings = [_dead("sensor.a"), _dead("sensor.b"), _dead("sensor.c", ignored=True)]
    found = blocked_automation_findings(automations, findings)
    assert [f["object_id"] for f in found] == ["automation.dead"]
    assert found[0]["evidence"][0]["entities"] == ["sensor.a", "sensor.b"]
