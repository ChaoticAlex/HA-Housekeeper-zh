"""The AI access services: registered with an answer, and a refusal is a translated error."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant, SupportsResponse  # noqa: E402
from homeassistant.exceptions import ServiceValidationError  # noqa: E402

from custom_components.ha_housekeeper.const import DOMAIN  # noqa: E402
from custom_components.ha_housekeeper.services import async_register_services  # noqa: E402


async def test_services_answer_and_refuse_with_a_translated_error(hass: HomeAssistant) -> None:
    hass.data.setdefault(DOMAIN, {})
    async_register_services(hass)
    for name in ("status", "summary", "findings", "audit"):
        assert hass.services.supports_response(DOMAIN, name) is SupportsResponse.ONLY
    assert hass.services.supports_response(DOMAIN, "scan") is SupportsResponse.OPTIONAL
    with pytest.raises(ServiceValidationError) as refused:
        await hass.services.async_call(DOMAIN, "findings", {}, blocking=True, return_response=True)
    assert refused.value.translation_key == "not_loaded"


def test_panel_session_only_refuses_long_lived_tokens() -> None:
    """The switches for AI access need a signed-in session: no long-lived and no system token."""
    from types import SimpleNamespace
    from unittest.mock import MagicMock

    from homeassistant.auth.models import (
        TOKEN_TYPE_LONG_LIVED_ACCESS_TOKEN,
        TOKEN_TYPE_NORMAL,
        TOKEN_TYPE_SYSTEM,
    )

    from custom_components.ha_housekeeper.ws_common import panel_session_only

    def refused(token_type: str | None) -> tuple[bool, MagicMock]:
        token = SimpleNamespace(token_type=token_type) if token_type else None
        hass = SimpleNamespace(auth=SimpleNamespace(async_get_refresh_token=lambda _id: token))
        connection = MagicMock(refresh_token_id="t1")
        return panel_session_only(hass, connection, {"id": 7}), connection

    refused_long, connection = refused(TOKEN_TYPE_LONG_LIVED_ACCESS_TOKEN)
    assert refused_long
    assert connection.send_error.call_args.args[:2] == (7, "panel_only")
    assert refused(TOKEN_TYPE_SYSTEM)[0]  # ha-mcp as an app runs as the Supervisor
    assert not refused(TOKEN_TYPE_NORMAL)[0]
    assert refused(None)[0]  # the Supervisor socket (ha-mcp as an app) has no token
