"""Tests for dependency-free automation analysis helpers."""

from __future__ import annotations

import importlib.util
from pathlib import Path

MODULE_PATH = (
    Path(__file__).parents[1] / "custom_components" / "ha_housekeeper" / "automation_analysis.py"
)
SPEC = importlib.util.spec_from_file_location("automation_analysis", MODULE_PATH)
assert SPEC and SPEC.loader
analysis = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(analysis)


def test_extracts_references_with_semantic_relations_and_locations() -> None:
    config = {
        "triggers": [{"trigger": "state", "entity_id": "binary_sensor.motion"}],
        "conditions": [{"condition": "state", "entity_id": "input_boolean.guest"}],
        "actions": [
            {
                "action": "light.turn_on",
                "target": {"entity_id": ["light.hall", "light.stairs"]},
            }
        ],
    }

    references = analysis.extract_references(config)

    assert references == [
        {
            "kind": "entity",
            "object_id": "binary_sensor.motion",
            "relation": "TRIGGERS_ON",
            "location": "triggers/0/entity_id",
            "confidence": "certain",
        },
        {
            "kind": "entity",
            "object_id": "input_boolean.guest",
            "relation": "USES_AS_CONDITION",
            "location": "conditions/0/entity_id",
            "confidence": "certain",
        },
        {
            "kind": "entity",
            "object_id": "light.hall",
            "relation": "TARGETS",
            "location": "actions/0/target/entity_id",
            "confidence": "certain",
        },
        {
            "kind": "entity",
            "object_id": "light.stairs",
            "relation": "TARGETS",
            "location": "actions/0/target/entity_id",
            "confidence": "certain",
        },
    ]


def test_summarizes_singular_legacy_keys() -> None:
    result = analysis.summarize_automation_config(
        {
            "description": "Hall light",
            "trigger": {"platform": "state", "entity_id": "sensor.one"},
            "condition": [],
            "action": [{"service": "light.turn_on"}],
        }
    )

    assert result["trigger_count"] == 1
    assert result["condition_count"] == 0
    assert result["action_count"] == 1
    assert result["description"] == "Hall light"


def test_missing_references_ignore_dynamic_and_existing_targets() -> None:
    references = [
        {"kind": "entity", "object_id": "light.present"},
        {"kind": "entity", "object_id": "light.missing"},
        {"kind": "device", "object_id": "missing-device"},
        {"kind": "label", "object_id": "dynamic-name"},
    ]
    missing = analysis.missing_references(
        references,
        {
            "entity": {"light.present"},
            "device": set(),
            "label": {"dynamic-name"},
        },
    )

    assert [item["object_id"] for item in missing] == ["light.missing", "missing-device"]


def test_unknown_tag_is_missing_only_for_a_trigger_and_only_with_a_tag_store() -> None:
    config = {
        "triggers": [{"trigger": "tag", "tag_id": "gone"}],
        "actions": [{"action": "tag.scan_tag", "data": {"tag_id": "new"}}],
    }
    references = analysis.extract_references(config)

    missing = analysis.missing_references(references, {"tag": {"kept"}})
    assert [item["object_id"] for item in missing] == ["gone"]
    assert analysis.missing_references(references, {"entity": set()}) == []


def test_none_entity_is_a_blueprint_placeholder_not_missing() -> None:
    references = [
        {"kind": "entity", "object_id": "scene.none"},
        {"kind": "entity", "object_id": "scene.gone"},
    ]
    missing = analysis.missing_references(references, {"entity": set()})

    assert [item["object_id"] for item in missing] == ["scene.gone"]


def test_template_reference_is_left_to_home_assistant_runtime_extraction() -> None:
    references = analysis.extract_references(
        {"actions": [{"target": {"entity_id": "{{ states('input_text.target') }}"}}]}
    )
    assert references == []


def test_selector_values_and_blueprint_inputs_are_not_references() -> None:
    references = analysis.extract_references(
        {
            "actions": [
                {"target": {"entity_id": "all", "area_id": "none", "device_id": "!input device"}},
                {"target": {"floor_id": "none", "label_id": "all", "entity_id": "light.hall"}},
            ]
        }
    )

    assert [(item["kind"], item["object_id"]) for item in references] == [("entity", "light.hall")]


def test_a_template_object_is_no_concrete_id() -> None:
    class Template:  # Home Assistant may hand over unevaluated template objects
        pass

    assert not analysis.is_concrete_id(Template())
    assert analysis.is_concrete_id("light.kitchen")
