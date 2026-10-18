"""WebSocket commands for the AI access page: the two switches and the log of calls."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .inventory import InventoryScanner
from .mcp_api import LIMIT_MAX, McpError, undo
from .ws_common import _versioned, panel_session_only, with_scanner


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/mcp_set",
        vol.Optional("enabled"): bool,
        vol.Optional("write"): bool,
    }
)
@callback
@with_scanner
def websocket_mcp_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    scanner: InventoryScanner,
) -> None:
    """Switch AI access and the right to change Housekeeper's lists. Both are off by default."""
    if panel_session_only(hass, connection, msg):
        return
    scanner.mcp.set_switches(msg.get("enabled"), msg.get("write"))
    if scanner.snapshot:
        scanner.snapshot["meta"]["mcp"] = {
            "enabled": scanner.mcp.enabled,
            "write": scanner.mcp.write,
        }
    connection.send_result(msg["id"], {"enabled": scanner.mcp.enabled, "write": scanner.mcp.write})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/mcp_audit",
        vol.Optional("kind"): vol.In(("read", "write", "denied")),
        vol.Optional("failed", default=False): bool,
        vol.Optional("limit", default=LIMIT_MAX): vol.All(int, vol.Range(min=1, max=200)),
    }
)
@callback
@with_scanner
def websocket_mcp_audit(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    scanner: InventoryScanner,
) -> None:
    """The log of calls for the panel, newest first. Reading it is no call and is not logged."""
    rows = scanner.mcp.recent(msg.get("kind"), msg["failed"])
    connection.send_result(
        msg["id"],
        _versioned(
            {
                "enabled": scanner.mcp.enabled,
                "write": scanner.mcp.write,
                "calls_24h": scanner.mcp.calls_since(24),
                "total": len(rows),
                "entries": rows[: msg["limit"]],
            }
        ),
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/mcp_undo", vol.Required("at"): str}
)
@callback
@with_scanner
def websocket_mcp_undo(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    scanner: InventoryScanner,
) -> None:
    """Take back one change from the log. It works with the switches off: the change is yours."""
    if panel_session_only(hass, connection, msg):
        return
    user = connection.user.id if connection.user else None
    try:
        undo(scanner, {"at": msg["at"]}, user)
    except McpError as err:
        connection.send_error(msg["id"], err.reason, f"Not taken back: {err.reason}")
        return
    scanner.mcp.log(user, "undo", "write", {"at": msg["at"]}, "ok", 1)
    connection.send_result(msg["id"], {"undone": True})


def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, websocket_mcp_set)
    websocket_api.async_register_command(hass, websocket_mcp_audit)
    websocket_api.async_register_command(hass, websocket_mcp_undo)
