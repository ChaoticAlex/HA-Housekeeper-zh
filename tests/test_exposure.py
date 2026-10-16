"""Exposure and privacy: assistants, bridges, webhooks, aliases and the guarantee that no secret leaves."""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant  # noqa: E402
from pytest_homeassistant_custom_component.common import MockConfigEntry  # noqa: E402

from custom_components.ha_housekeeper import exposure as module  # noqa: E402
from custom_components.ha_housekeeper.exposure import (  # noqa: E402
    collect,
    evaluate,
    exposure,
    normalize_alias,
)

SECRETS = ("tok3n-SECRET", "p4ssw0rd-SECRET", "ap1key-SECRET", "s3cret-SECRET", "hook-ID-SECRET")


def entity(name=None, **fields) -> dict:
    domain = fields.pop("domain", "light")
    return {
        "name": name,
        "domain": domain,
        "status": "active",
        "entity_category": None,
        "aliases": [],
        **fields,
    }


def raw(exposed=("light.a",), conversation="ok", **fields) -> dict:
    return {
        "assistants": {
            "conversation": {"status": conversation, "exposed": list(exposed)},
            "cloud.alexa": {"status": "inactive", "exposed": []},
            "cloud.google_assistant": {"status": "inactive", "exposed": []},
        },
        "bridges": [],
        "webhooks": {},
        "live_domains": ["hue"],
        **fields,
    }


def test_nothing_found_for_ordinary_exposure() -> None:
    result = evaluate(raw(), {"light.a": entity("A")}, set())
    assert result["findings"] == []
    assert result["assistants"][0] == {"id": "conversation", "status": "ok", "exposed": 1}


def test_diagnostic_and_config_entities_are_found() -> None:
    entities = {
        "sensor.d": entity("D", domain="sensor", entity_category="diagnostic"),
        "switch.c": entity("C", domain="switch", entity_category="config"),
        "light.a": entity("A"),
    }
    result = evaluate(raw(exposed=entities), entities, set())
    found = next(f for f in result["findings"] if f["kind"] == "diagnostic_exposed")
    assert found["count"] == 2 and found["level"] == "hint"
    assert {i["entity_id"] for i in found["items"]} == {"sensor.d", "switch.c"}


def test_sensitive_classes_are_a_hint_never_a_problem() -> None:
    entities = {
        "lock.door": entity(domain="lock"),
        "alarm_control_panel.home": entity(domain="alarm_control_panel"),
        "person.x": entity(domain="person"),
        "device_tracker.phone": entity(domain="device_tracker"),
        "cover.garage": entity(domain="cover", device_class="garage"),
        "cover.blind": entity(domain="cover", device_class="blind"),
    }
    result = evaluate(raw(exposed=entities), entities, set())
    found = next(f for f in result["findings"] if f["kind"] == "sensitive_exposed")
    assert found["level"] == "hint" and found["count"] == 5
    assert "cover.blind" not in {i["entity_id"] for i in found["items"]}


def test_stale_exposed_disabled_or_orphaned() -> None:
    entities = {
        "light.a": entity(status="disabled"),
        "light.b": entity(status="orphaned"),
        "light.c": entity(status="unavailable"),
    }
    result = evaluate(raw(exposed=entities), entities, set())
    found = next(f for f in result["findings"] if f["kind"] == "stale_exposed")
    assert {i["entity_id"] for i in found["items"]} == {"light.a", "light.b"}


def test_ignored_entities_are_left_out() -> None:
    entities = {"lock.door": entity(domain="lock")}
    result = evaluate(raw(exposed=entities), entities, {"lock.door"})
    assert result["findings"] == [] and result["assistants"][0]["exposed"] == 0


def test_alias_normalisation() -> None:
    assert normalize_alias("Wohn Zimmer") == normalize_alias("wohnzimmer")
    assert normalize_alias("Küche") == normalize_alias("Kueche")
    assert normalize_alias("Straße") == normalize_alias("strasse")
    assert normalize_alias("  ") == ""


def test_alias_duplicate_within_one_assistant_only() -> None:
    entities = {
        "light.a": entity("A", aliases=["Küche"]),
        "light.b": entity("B", aliases=["kueche"]),
        "light.c": entity("C", aliases=["Küche"]),
    }
    result = evaluate(raw(exposed=["light.a", "light.b"]), entities, set())
    found = [f for f in result["findings"] if f["kind"] == "alias_duplicate"]
    assert len(found) == 1 and found[0]["assistant"] == "conversation"
    assert {i["entity_id"] for i in found[0]["items"]} == {"light.a", "light.b"}  # c is not exposed


def test_same_alias_on_one_entity_is_not_a_duplicate() -> None:
    entities = {"light.a": entity("A", aliases=["Küche", "kueche"])}
    assert evaluate(raw(), entities, set())["findings"] == []


def test_unavailable_source_is_not_judged() -> None:
    entities = {
        "light.a": entity("A", aliases=["x"]),
        "light.b": entity("B", aliases=["x"], status="disabled"),
    }
    result = evaluate(raw(exposed=[], conversation="unavailable"), entities, set())
    assert result["assistants"][0]["status"] == "unavailable"
    assert result["findings"] == []


def test_webhook_orphans() -> None:
    result = evaluate(raw(webhooks={"hue": 2, "gone": 3, "": 1}), {}, set())
    orphans = [f for f in result["findings"] if f["kind"] == "webhook_orphan"]
    assert orphans == [{"kind": "webhook_orphan", "level": "warn", "domain": "gone", "count": 3}]
    assert result["webhooks"] == 6


def test_bridge_filter() -> None:
    bridge = {
        "kind": "homekit",
        "title": "Bridge",
        "filter": {"include_domains": ["light"], "exclude_entities": ["light.b"]},
    }
    entities = {"light.a": entity(), "light.b": entity(), "switch.s": entity(domain="switch")}
    result = evaluate(raw(exposed=[], bridges=[bridge]), entities, set())
    assert result["bridges"] == [{"kind": "homekit", "title": "Bridge", "exposed": 1}]


def test_bridge_exposure_feeds_the_findings() -> None:
    bridge = {"kind": "homekit", "title": "Bridge", "filter": {"include_domains": ["lock"]}}
    entities = {"lock.door": entity(domain="lock")}
    result = evaluate(raw(exposed=[], bridges=[bridge]), entities, set())
    found = next(f for f in result["findings"] if f["kind"] == "sensitive_exposed")
    assert found["items"][0]["assistants"] == ["homekit"]


# --- collection from Home Assistant -------------------------------------------------------


def snapshot(*ids: str) -> dict:
    return {
        "objects": [
            {"object_type": "entity", "object_id": i, "name": i, "status": "active", "aliases": []}
            for i in ids
        ],
        "findings": [],
    }


async def test_collect_never_leaks_secrets(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(
        domain="homekit",
        title="Bridge",
        options={
            "filter": {"include_domains": ["light"], "token": SECRETS[0]},
            "password": SECRETS[1],
            "api_key": SECRETS[2],
            "secret": SECRETS[3],
        },
    )
    entry.add_to_hass(hass)
    from homeassistant.components import webhook
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "webhook", {})
    webhook.async_register(
        hass, "mobile_app", "Phone", SECRETS[4], lambda *args: None, allowed_methods=["POST"]
    )
    raw_data = collect(hass, ["light.a"])
    result = exposure(hass, snapshot("light.a"))
    for payload in (raw_data, result):
        text = json.dumps(payload, default=str)
        assert not any(secret in text for secret in SECRETS)
    assert raw_data["webhooks"] == {"mobile_app": 1}
    assert raw_data["bridges"][0]["filter"] == {"include_domains": ["light"]}


async def test_privacy_probe_detects_a_softened_whitelist(hass: HomeAssistant) -> None:
    """Mutation: a filter copied unchecked leaks the token, so the test above would fail."""
    entry = MockConfigEntry(
        domain="homekit",
        title="B",
        options={"filter": {"include_domains": ["light"], "token": SECRETS[0]}},
    )
    entry.add_to_hass(hass)
    with patch.object(module, "_clean_filter", lambda f: f):
        assert SECRETS[0] in json.dumps(collect(hass, []), default=str)


async def test_assistant_source_failing_is_unavailable(hass: HomeAssistant) -> None:
    with patch(
        "homeassistant.components.homeassistant.exposed_entities.async_should_expose",
        side_effect=RuntimeError("boom"),
    ):
        data = collect(hass, ["light.a"])
    assert data["assistants"]["conversation"] == {"status": "unavailable", "exposed": []}


async def test_cloud_assistants_inactive_without_cloud(hass: HomeAssistant) -> None:
    data = collect(hass, ["light.a"])
    assert data["assistants"]["cloud.alexa"]["status"] == "inactive"


async def test_cloud_assistant_switched_off_in_nabu_casa(hass: HomeAssistant) -> None:
    from types import SimpleNamespace

    hass.config.components.add("cloud")
    prefs = SimpleNamespace(alexa_enabled=True, google_enabled=False)
    hass.data["cloud"] = SimpleNamespace(client=SimpleNamespace(prefs=prefs))
    with patch(
        "homeassistant.components.homeassistant.exposed_entities.async_should_expose",
        return_value=True,
    ):
        data = collect(hass, ["light.a"])
    assert data["assistants"]["cloud.google_assistant"] == {"status": "off", "exposed": []}
    assert data["assistants"]["cloud.alexa"] == {"status": "ok", "exposed": ["light.a"]}


async def test_collect_runs_against_real_exposed_entities(hass: HomeAssistant) -> None:
    from homeassistant.components.homeassistant.exposed_entities import async_expose_entity
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "homeassistant", {})
    hass.states.async_set("light.a", "on")
    hass.states.async_set("sensor.z", "1")
    async_expose_entity(hass, "conversation", "light.a", True)
    exposed = collect(hass, ["light.a", "sensor.z"])["assistants"]["conversation"]["exposed"]
    assert "light.a" in exposed and "sensor.z" not in exposed


async def test_webhooks_are_counted_per_integration_from_the_real_registry(
    hass: HomeAssistant,
) -> None:
    from homeassistant.components import webhook
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "webhook", {})
    for index, domain in enumerate(("mobile_app", "mobile_app", "gone")):
        webhook.async_register(hass, domain, "n", f"id{index}", lambda *args: None)
    assert collect(hass, [])["webhooks"] == {"mobile_app": 2, "gone": 1}


def test_a_non_text_alias_is_ignored() -> None:
    entities = {
        "light.a": entity("A", aliases=[object(), "x"]),
        "light.b": entity("B", aliases=["x"]),
    }
    result = evaluate(raw(exposed=["light.a", "light.b"]), entities, set())
    assert [f["kind"] for f in result["findings"]] == ["alias_duplicate"]


def test_every_exposed_entity_is_listed_with_the_assistants_that_reach_it() -> None:
    entities = {"light.b": entity("Bravo"), "light.a": entity("alpha"), "light.c": entity("C")}
    result = evaluate(raw(exposed=["light.b", "light.a"]), entities, set())
    assert [e["entity_id"] for e in result["exposed_entities"]] == ["light.a", "light.b"]
    assert (
        result["exposed_entities"][0]["assistants"] == ["conversation"]
        and result["exposed_total"] == 2
    )
