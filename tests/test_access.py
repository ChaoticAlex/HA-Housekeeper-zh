"""System access, data flow and the rights of the apps: classification and the WebSocket command."""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant  # noqa: E402
from homeassistant.helpers import entity_registry as er  # noqa: E402
from pytest_homeassistant_custom_component.common import MockConfigEntry  # noqa: E402

from custom_components.ha_housekeeper import access as module  # noqa: E402
from custom_components.ha_housekeeper.access import (  # noqa: E402
    access_report,
    classify,
    classify_app,
    matches,
)
from custom_components.ha_housekeeper.const import DOMAIN  # noqa: E402
from custom_components.ha_housekeeper.inventory import InventoryScanner  # noqa: E402

PASSWORD = "p4ss-SECRET"


@pytest.fixture(autouse=True)
def _enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Allow loading the integration from custom_components."""


def test_domain_tokens_match_whole_parts_only() -> None:
    assert matches("alexa_media", "alexa")
    assert matches("google_generative_ai_conversation", "google_generative")
    assert matches("zha", "zha")
    assert not matches("metalexa", "alexa")
    assert not matches("tuya_cloud", "cloud"), "generic words only match the whole domain"
    assert not matches("metoffice", "met")
    assert matches("cloud", "cloud")


def test_classify_risk_follows_access_location_and_cloud() -> None:
    assert classify("zha", "local_polling", set())["risk"] == "high"
    assert classify("hassio", None, set())["access"] == [
        {"kind": "system_root", "detail": "Supervisor"}
    ]
    assert classify("mobile_app", "local_push", {"device_tracker"})["gps"] is True
    dwd = classify("dwd_weather", "cloud_polling", {"weather"})
    assert dwd["external"] and dwd["risk"] == "medium" and not dwd["access"]
    assert classify("reolink", "local_push", {"camera"})["risk"] == "high"
    assert classify("hue", "local_push", {"light"})["risk"] == "low"


async def test_access_report_on_config_entries(hass: HomeAssistant) -> None:
    MockConfigEntry(domain="alexa_media", title="Alexa", data={"password": PASSWORD}).add_to_hass(
        hass
    )
    tracker = MockConfigEntry(domain="mobile_app", title="Phone")
    tracker.add_to_hass(hass)
    er.async_get(hass).async_get_or_create(
        "device_tracker", "mobile_app", "p1", config_entry=tracker
    )
    MockConfigEntry(domain="hue", title="Ignored", source="ignore").add_to_hass(hass)

    report = await access_report(hass)
    by_domain = {item["domain"]: item for item in report["entries"]}
    assert "hue" not in by_domain, "ignored discoveries are left out"
    assert by_domain["mobile_app"]["risk"] == "high" and by_domain["mobile_app"]["gps"]
    assert by_domain["alexa_media"]["external"]
    assert report["entries"][0]["risk"] == "high", "the riskiest come first"
    assert PASSWORD not in json.dumps(report), "no credential is read"


async def test_access_needs_an_administrator(
    hass: HomeAssistant, hass_ws_client, hass_read_only_access_token
) -> None:
    from homeassistant.setup import async_setup_component

    from custom_components.ha_housekeeper import async_setup

    assert await async_setup(hass, {})
    hass.data[DOMAIN]["scanner"] = InventoryScanner(hass)
    assert await async_setup_component(hass, "websocket_api", {})
    client = await hass_ws_client(hass, hass_read_only_access_token)
    for command in ("access", "system_usage"):
        await client.send_json_auto_id({"type": f"{DOMAIN}/{command}"})
        answer = await client.receive_json()
        assert answer["success"] is False and answer["error"]["code"] == "unauthorized", command


def test_classify_app_levels_follow_the_rights() -> None:
    ssh = classify_app(
        {
            "full_access": True,
            "privileged": ["SYS_ADMIN"],
            "hassio_api": True,
            "hassio_role": "manager",
            "apparmor": False,
        }
    )
    kinds = {a["kind"]: a for a in ssh["access"]}
    assert ssh["risk"] == "high"
    assert kinds["privileged"]["detail"] == "SYS_ADMIN"
    assert kinds["supervisor_api"] == {
        "kind": "supervisor_api",
        "detail": "manager",
        "level": "high",
    }
    assert kinds["apparmor_off"]["level"] == "medium"
    broker = classify_app({"host_network": True, "homeassistant_api": True, "apparmor": "default"})
    assert broker["risk"] == "medium" and {a["kind"] for a in broker["access"]} == {
        "host_network",
        "ha_api",
    }
    assert (
        classify_app({"hassio_api": True, "hassio_role": "default"})["access"][0]["level"]
        == "medium"
    )
    assert classify_app({"usb": True, "devices": ["/dev/ttyUSB0"]})["risk"] == "low"
    assert classify_app({}) == {"access": [], "risk": "low"}


async def test_apps_report_reads_every_app_and_marks_one_without_answer(
    hass: HomeAssistant,
) -> None:
    answers = {
        "/addons": {
            "addons": [
                {"slug": "core_ssh", "name": "SSH"},
                {"slug": "broken", "name": "Broken"},
                {"name": "no slug"},
            ]
        },
        "/addons/core_ssh/info": {
            "name": "Advanced SSH",
            "state": "started",
            "version": "1",
            "full_access": True,
        },
        "/addons/broken/info": None,
    }

    async def fake(_hass, path, **_kwargs):
        return answers[path]

    with (
        patch.object(module, "supervisor_token", return_value="t"),
        patch.object(module, "supervisor_get", fake),
    ):
        report = await module.apps_report(hass)
    assert report["available"] is True
    assert [a["slug"] for a in report["apps"]] == ["core_ssh", "broken"], (
        "the riskiest first, the unchecked last"
    )
    assert report["apps"][0]["name"] == "Advanced SSH" and report["apps"][0]["risk"] == "high"
    assert report["apps"][1]["checked"] is False and report["apps"][1]["risk"] is None

    with patch.object(module, "supervisor_token", return_value=None):
        assert await module.apps_report(hass) == {"available": False, "apps": []}
        result = await access_report(hass)
    assert result["apps_available"] is False and result["apps"] == []
