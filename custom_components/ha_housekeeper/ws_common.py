"""What the WebSocket commands share: the loaded scanner, the API version mark, time limits."""

from __future__ import annotations

import functools
import inspect
import logging
from collections.abc import Callable
from typing import Any

from homeassistant.auth.models import TOKEN_TYPE_NORMAL
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers.json import json_bytes

from .const import API_SCHEMA, DOMAIN
from .inventory import InventoryScanner

BACKUP_HEALTH_TIMEOUT = 20  # seconds; a cloud backup target can answer slowly
RUNS_TIMEOUT = 20
EXPOSURE_TIMEOUT = 20  # seconds
STATISTICS_LAST_IDS = 50
RELIABILITY_TIMEOUT = 120  # seconds; the recorder query is slow on a large database

_LOGGER = logging.getLogger(__name__)
INT_MIN, INT_MAX = -(2**63), 2**64 - 1  # what orjson writes; a larger number fails the whole reply


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
    """Refuse a command that did not come from a signed-in session; True when it was refused.

    The panel runs in a signed-in session (a normal token). Programs bring other tokens: ha-mcp as
    an app connects through the Supervisor's socket, which has no token at all, others use a
    long-lived access token. The switches for AI
    access must not be flipped by the program they are meant to limit. This is a guard for the usual
    setup, not a seal: any signed-in administrator session can still use them.
    """
    token = (
        hass.auth.async_get_refresh_token(connection.refresh_token_id)
        if connection.refresh_token_id
        else None
    )
    if token is None or token.token_type != TOKEN_TYPE_NORMAL:
        connection.send_error(msg["id"], "panel_only", "Only the panel may do this")
        return True
    return False


def _versioned(result: dict[str, Any]) -> dict[str, Any]:
    """Mark a reply with the version of the API contract.

    Fields may be added without a new version; renaming or removing one needs ``API_SCHEMA`` to
    be raised. A copy is sent so cached snapshots never carry the marker.
    """
    return {**result, "schema": API_SCHEMA}


def _plain(value: Any, path: str, bad: list[str]) -> Any:
    """Copy ``value`` down to what JSON holds, noting the path of every value that had to change."""
    if isinstance(value, int) and not isinstance(value, bool) and not INT_MIN <= value <= INT_MAX:
        bad.append(path)
        return str(value)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            if not isinstance(key, str):
                bad.append(f"{path}/{key!r}")
            out[str(key)] = _plain(item, f"{path}/{key}", bad)
        return out
    if isinstance(value, (list, tuple, set, frozenset)):
        items = sorted(value, key=str) if isinstance(value, (set, frozenset)) else value
        if not isinstance(value, (list, tuple)):
            bad.append(path)
        return [_plain(item, f"{path}[{i}]", bad) for i, item in enumerate(items)]
    bad.append(path)
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def json_safe(result: dict[str, Any]) -> dict[str, Any]:
    """Return ``result`` unchanged if Home Assistant can send it, else a cleaned copy.

    A value JSON cannot hold makes Home Assistant answer only "Invalid JSON in response" and
    the panel shows nothing; entity attributes are the usual source. The cleaned copy keeps the page working and the log names the
    paths to fix.
    """
    try:
        json_bytes(result)
    except (TypeError, ValueError, OverflowError):
        bad: list[str] = []
        cleaned = _plain(result, "", bad)
        _LOGGER.warning(
            "The reply held values JSON cannot carry and was cleaned before sending: %s",
            ", ".join(bad[:10]) or "unknown path",
        )
        return cleaned
    return result
