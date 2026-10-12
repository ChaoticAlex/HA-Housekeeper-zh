"""Credential overview: kind and set or empty per field, and never a value."""

from __future__ import annotations

import json

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant  # noqa: E402
from pytest_homeassistant_custom_component.common import MockConfigEntry  # noqa: E402

from custom_components.ha_housekeeper.sensitive_fields import (  # noqa: E402
    kind_of,
    sensitive_fields,
)

VALUE = "s3cr3t-VALUE-12345"


def test_kind_follows_the_field_name() -> None:
    assert kind_of("password") == "password"
    assert kind_of("refresh_token") == "token"
    assert kind_of("client_secret") == "secret"
    assert kind_of("api_key") == "api_key"
    assert kind_of("webhook_id") == "webhook"
    assert kind_of("pin") == "pin"
    for harmless in (
        "token_type",
        "expires_at",
        "public_key",
        "keyboard",
        "host",
        "ping",
        "client_id",
    ):
        assert kind_of(harmless) is None, harmless


async def test_overview_has_kind_and_set_but_no_value(hass: HomeAssistant) -> None:
    MockConfigEntry(
        domain="demo_cloud",
        title="Demo",
        data={"host": "h", "password": VALUE, "api_key": "", "token": {"access_token": VALUE}},
        options={"pin": VALUE},
    ).add_to_hass(hass)
    MockConfigEntry(domain="plain", title="Plain", data={"host": "h"}).add_to_hass(hass)

    result = sensitive_fields(hass)

    assert [e["domain"] for e in result["entries"]] == ["demo_cloud"], (
        "entries without any are left out"
    )
    fields = {
        (f["source"], f["key"]): (f["kind"], f["set"]) for f in result["entries"][0]["fields"]
    }
    assert fields == {
        ("data", "password"): ("password", True),
        ("data", "api_key"): ("api_key", False),
        ("data", "token.access_token"): ("token", True),
        ("options", "pin"): ("pin", True),
    }
    assert VALUE not in json.dumps(result), "no value, no mask, nothing derived from one"
