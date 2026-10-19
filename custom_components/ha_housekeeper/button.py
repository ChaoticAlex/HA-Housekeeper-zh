"""The button that starts a scan, for dashboards."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, NAME
from .scan_trigger import ScanRefused


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Create the scan button."""
    async_add_entities([ScanButton(entry)])


class ScanButton(ButtonEntity):
    """Starts a scan. It stays available while one runs: Housekeeper would see its own button as
    failing, and a press then joins the running scan or says why none can start (issue 35)."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = "scan"
    _attr_icon = "mdi:magnify-scan"

    def __init__(self, entry: ConfigEntry) -> None:
        self._attr_unique_id = f"{entry.entry_id}_scan"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name=NAME, entry_type=DeviceEntryType.SERVICE
        )

    async def async_press(self) -> None:
        scanner = self.hass.data.get(DOMAIN, {}).get("scanner")
        if scanner is None:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_loaded")
        try:
            await scanner.async_request_scan(False)
        except ScanRefused as err:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key=err.reason
            ) from err
