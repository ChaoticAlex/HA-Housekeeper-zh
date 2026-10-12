"""Calls of services that do not exist; many callers of one missing service make one cause."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.causes import apply_causes  # noqa: E402
from custom_components.ha_housekeeper.service_check import (  # noqa: E402
    missing_service_findings,
    service_calls,
)

KNOWN = {"light.turn_on", "script.night"}


def _script(object_id, actions):
    return {"object_type": "script", "object_id": object_id, "actions": actions}


def test_only_literal_services_that_are_not_registered_are_found() -> None:
    actions = [
        {"action": "light.turn_on", "data": {"action": "gone.never"}},
        {"action": "notify.old_phone", "data": {"message": "x"}},
        {"action": "{{ states('input_text.s') }}"},
        {"if": [], "then": [{"service": "tado.set_timer"}, {"action": "notify.old_phone"}]},
        {"action": "zwave.broken"},
        {"action": "URI"},
    ]
    found = missing_service_findings(
        [_script("script.a", actions)], lambda d, s: f"{d}.{s}" in KNOWN, {"zwave"}
    )
    assert [f["affected_object"] for f in found] == ["notify.old_phone", "tado.set_timer"]
    assert found[0]["rule_id"] == "script.missing_service"
    assert found[1]["evidence"][0]["location"] == "actions/3/then/0/service"
    assert service_calls([{"action": "a.b"}]) == [("a.b", "actions/0/action")]


def test_a_missing_service_with_several_callers_is_one_cause() -> None:
    def finding(object_id, service):
        return {
            "rule_id": "automation.missing_service",
            "object_id": object_id,
            "classification": "broken_reference",
            "affected_object": service,
            "key": f"k|{object_id}|{service}",
            "ignored": False,
        }

    findings = [
        finding("automation.a", "notify.old"),
        finding("automation.b", "notify.old"),
        finding("automation.c", "tado.x"),
    ]
    causes = apply_causes([], [], findings)
    assert [(c["id"], c["follower_count"]) for c in causes] == [("service_missing:notify.old", 2)]
    assert [f.get("cause_id") for f in findings] == [
        "service_missing:notify.old",
        "service_missing:notify.old",
        None,
    ]
