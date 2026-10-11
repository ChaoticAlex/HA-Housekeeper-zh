"""Tests for dashboard reference extraction (no Home Assistant required)."""

from __future__ import annotations

from custom_components.ha_housekeeper.dashboard_analysis import extract_dashboard_references

KNOWN = {"sensor.temp", "light.kitchen", "sun.sun"}

CONFIG = {
    "title": "Home",
    "views": [
        {
            "title": "Main",
            "badges": ["sun.sun"],
            "cards": [
                {"type": "entities", "entities": ["sensor.temp", {"entity": "light.gone"}]},
                {"type": "gauge", "entity": "sensor.temp"},
                {
                    "type": "markdown",
                    "content": "{{ states('light.kitchen') }} and mdi:lamp and 1.5",
                },
                {"type": "markdown", "content": "{{ states('sensor.not_real') }}"},
                {"type": "custom", "name": "light.kitchen"},
            ],
        }
    ],
}


def _by_location(refs: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {ref["location"]: ref for ref in refs}


def test_explicit_entity_keys_are_certain_and_located() -> None:
    refs = _by_location(extract_dashboard_references(CONFIG, KNOWN))

    assert refs["views/0/cards/0/entities/0"]["object_id"] == "sensor.temp"
    assert refs["views/0/cards/0/entities/1/entity"]["object_id"] == "light.gone"
    assert refs["views/0/cards/1/entity"]["confidence"] == "certain"
    assert refs["views/0/badges/0"]["object_id"] == "sun.sun"
    assert all(ref["relation"] == "SHOWS" for ref in refs.values())


def test_template_mentions_are_probable_and_only_for_existing_entities() -> None:
    refs = extract_dashboard_references(CONFIG, KNOWN)
    probable = [ref for ref in refs if ref["confidence"] == "probable"]

    assert [ref["object_id"] for ref in probable] == ["light.kitchen"]
    assert not any(ref["object_id"] == "sensor.not_real" for ref in refs)


def test_free_text_values_are_not_references() -> None:
    refs = extract_dashboard_references(CONFIG, KNOWN)

    assert not any(ref["location"].endswith("/name") for ref in refs)
    assert extract_dashboard_references(None, KNOWN) == []


def test_helper_options_reference_their_source_entities() -> None:
    from custom_components.ha_housekeeper.dashboard_analysis import extract_helper_references

    options = {
        "name": "Energy",
        "source": "sensor.temp",
        "entity_ids": ["light.kitchen", "sensor.gone"],
        "state": "{{ states('sun.sun') }} {{ states('sensor.unknown_thing') }}",
    }
    refs = {(r["object_id"], r["confidence"]) for r in extract_helper_references(options, KNOWN)}

    assert refs == {
        ("sensor.temp", "certain"),
        ("light.kitchen", "certain"),
        ("sensor.gone", "certain"),
        ("sun.sun", "probable"),
    }


def test_location_names_view_section_and_card() -> None:
    from custom_components.ha_housekeeper.dashboard_analysis import describe_location

    config = {
        "views": [
            {"title": "A"},
            {
                "path": "archiv",
                "sections": [
                    {"cards": []},
                    {
                        "cards": [
                            {
                                "type": "custom:charger-card",
                                "details": {"x": [{"entity_id": "a.b"}]},
                            }
                        ]
                    },
                ],
            },
        ]
    }

    place = describe_location(config, "views/1/sections/1/cards/0/details/x/0/entity_id")

    assert place == {
        "view": "archiv",
        "view_index": 1,
        "section": 2,
        "card": "custom:charger-card",
        "card_path": "views/1/sections/1/cards/0",
    }
    assert describe_location(config, "preferences/0") == {}


def test_suggestions_need_close_names_and_findings_count_the_card() -> None:
    from custom_components.ha_housekeeper.dashboard_analysis import (
        annotate_findings,
        suggest_replacements,
    )

    known = {
        "sensor.keba_p30_charging_power",
        "sensor.keba_p30_maximum_current_system",
        "sensor.keba_p30_status",
    }

    assert suggest_replacements("sensor.keba_p30_power", known) == [
        "sensor.keba_p30_charging_power"
    ]
    assert suggest_replacements("sensor.keba_p30_max_current", known) == [
        "sensor.keba_p30_maximum_current_system"
    ]
    assert suggest_replacements("binary_sensor.keba_p30_status", known) == [
        "sensor.keba_p30_status"
    ]
    assert suggest_replacements("binary_sensor.keba_p30_basic_schedule", known) == []

    config = {"views": [{"cards": [{"type": "entities", "entities": ["a.gone", "a.here"]}]}]}
    refs = [
        {"location": "views/0/cards/0/entities/0", "object_id": "a.gone"},
        {"location": "views/0/cards/0/entities/1", "object_id": "a.here"},
    ]
    findings = [{"evidence": [{"location": "views/0/cards/0/entities/0"}]}]
    annotate_findings(findings, config, refs)

    place = findings[0]["evidence"][0]["place"]
    assert (place["card"], place["card_refs"], place["card_missing"]) == ("entities", 2, 1)
