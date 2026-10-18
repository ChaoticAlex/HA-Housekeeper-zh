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
    for name in ("status", "findings", "audit"):
        assert hass.services.supports_response(DOMAIN, name) is SupportsResponse.ONLY
    assert hass.services.supports_response(DOMAIN, "scan") is SupportsResponse.OPTIONAL
    with pytest.raises(ServiceValidationError) as refused:
        await hass.services.async_call(DOMAIN, "findings", {}, blocking=True, return_response=True)
    assert refused.value.translation_key == "not_loaded"
