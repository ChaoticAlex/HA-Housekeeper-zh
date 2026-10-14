"""Blueprint check: unused files, paths nobody answers, files that fail to load."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.blueprints import (  # noqa: E402
    blueprint_path,
    evaluate,
    missing_blueprint_findings,
)


def test_unused_missing_and_broken_blueprints() -> None:
    available = {
        "automation": {
            "a/used.yaml": {"ok": True, "name": "Used"},
            "a/idle.yaml": {"ok": True, "name": "Idle"},
            "a/bad.yaml": {"ok": False, "name": "a/bad.yaml"},
        },
        "script": {},
    }
    users = {
        "automation": {
            "a/used.yaml": [{"id": "automation.x", "name": "X"}],
            "a/gone.yaml": [{"id": "automation.y", "name": "Y"}],
        },
        "script": {},
    }
    result = evaluate(available, users)
    auto = result["domains"][0]
    assert [b["path"] for b in auto["unused"]] == ["a/idle.yaml"]
    assert [b["path"] for b in auto["missing"]] == ["a/gone.yaml"]
    assert [b["path"] for b in auto["broken"]] == ["a/bad.yaml"]
    assert (result["unused"], result["missing"], result["broken"]) == (1, 1, 1)


def test_a_missing_blueprint_file_is_found_but_a_broken_or_unread_one_is_not() -> None:
    class Unloaded:  # Home Assistant keeps an automation whose blueprint is gone like this
        referenced_blueprint = None
        raw_config = {"use_blueprint": {"path": "a/gone.yaml"}}

    assert blueprint_path(Unloaded()) == "a/gone.yaml"
    assert blueprint_path(type("T", (), {"raw_config": {"use_blueprint": {"path": 5}}})()) is None
    assert blueprint_path(type("N", (), {"raw_config": {}})()) is None

    items = [
        {"object_type": "automation", "object_id": "automation.a", "blueprint": "a/gone.yaml"},
        {"object_type": "automation", "object_id": "automation.b", "blueprint": "a/bad.yaml"},
        {"object_type": "script", "object_id": "script.c", "blueprint": "a/gone.yaml"},
        {"object_type": "automation", "object_id": "automation.d", "blueprint": None},
    ]
    found = missing_blueprint_findings(items, {"automation": {"a/bad.yaml"}, "script": set()})
    assert [(f["rule_id"], f["object_id"], f["affected_object"]) for f in found] == [
        ("automation.missing_blueprint", "automation.a", "a/gone.yaml"),
        ("script.missing_blueprint", "script.c", "a/gone.yaml"),
    ]
    assert missing_blueprint_findings(items, None) == [], "an unread list says nothing"
