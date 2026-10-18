"""What the WebSocket commands share: the loaded scanner, the API version mark, time limits."""

from __future__ import annotations

import functools
import inspect
from collections.abc import Callable
from typing import Any

from homeassistant.auth.models import TOKEN_TYPE_LONG_LIVED_ACCESS_TOKEN
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import API_SCHEMA, DOMAIN
from .inventory import InventoryScanner

BACKUP_HEALTH_TIMEOUT = 20  # seconds; a cloud backup target can answer slowly
RUNS_TIMEOUT = 20
EXPOSURE_TIMEOUT = 20  # seconds
STATISTICS_LAST_IDS = 50
RELIABILITY_TIMEOUT = 120  # seconds; the recorder query is slow on a large database


def _scanner(hass: HomeAssistant) -> InventoryScanner | None:
    """Return the configured scanner, or None while the entry is not loaded."""
    return hass.data.get(DOMAIN, {}).get("scanner")


def with_scanner(handler: Callable[..., Any]) -> Callable[..., Any]:
    """Hand a command the loaded scanner; while the entry is not loaded, answer ``not_loaded``."""

    def loaded(
        hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
    ) -> InventoryScanner | None:
        scanner = _scanner(hass)
        if scanner is None:
            connection.send_error(msg["id"], "not_loaded", "HA Housekeeper is not loaded")
        return scanner

    if inspect.iscoroutinefunction(handler):

        @functools.wraps(handler)
        async def run_async(
            hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
        ) -> None:
            if (scanner := loaded(hass, connection, msg)) is not None:
                await handler(hass, connection, msg, scanner)

        return run_async

    @functools.wraps(handler)
    def run(
        hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
    ) -> None:
        if (scanner := loaded(hass, connection, msg)) is not None:
            handler(hass, connection, msg, scanner)

    return run


def scanner_plans(hass: HomeAssistant) -> list[dict[str, Any]]:
    """The plans of the journal, or none while the entry is not loaded."""
    scanner = _scanner(hass)
    return scanner.journal.plans if scanner else []


def panel_session_only(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> bool:
    """Refuse a command that came with a long-lived access token; True when it was refused.

    The panel runs in a signed-in session. Programs such as ha-mcp bring a long-lived token. The
    switches for AI access must not be flipped by the program they are meant to limit. This is a
    guard for the usual setup, not a seal: any admin session can still use them.
    """
    token = (
        hass.auth.async_get_refresh_token(connection.refresh_token_id)
        if connection.refresh_token_id
        else None
    )
    if token is not None and token.token_type == TOKEN_TYPE_LONG_LIVED_ACCESS_TOKEN:
        connection.send_error(msg["id"], "panel_only", "Only the panel may do this")
        return True
    return False


def _versioned(result: dict[str, Any]) -> dict[str, Any]:
    """Mark a reply with the version of the API contract.

    Fields may be added without a new version; renaming or removing one needs ``API_SCHEMA`` to
    be raised. A copy is sent so cached snapshots never carry the marker.
    """
    return {**result, "schema": API_SCHEMA}
