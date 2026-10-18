"""AI access: the switch, who may call, the shape and size of the answers, the log."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant  # noqa: E402

from custom_components.ha_housekeeper import mcp_api  # noqa: E402
from custom_components.ha_housekeeper.mcp_access import McpStore, short_params  # noqa: E402

LEVELS = ["high", "medium", "low", "info"]


def scanner_with(hass: HomeAssistant, count: int = 600) -> SimpleNamespace:
    objects = [
        {"object_type": "entity", "object_id": f"sensor.s{i}", "name": f"Sensor {i}\n{'x' * 200}"}
        for i in range(count)
    ]
    found = [
        {
            "key": f"entity.state_unavailable|sensor.s{i}|",
            "rule_id": "entity.state_unavailable",
            "object_id": f"sensor.s{i}",
            "classification": "unavailable",
            "impact": LEVELS[i % 4],
            "first_detected_at": f"2026-10-{1 + i % 28:02d}T00:00:00+00:00",
            "evidence": [{"kind": "state_unavailable", "source": "entity_registry"}] * 3,
            "impact_facts": [{"fact": "outage_age", "level": "high"}],
            "ignored": i % 10 == 0,
            "ignore_info": {"kind": "ignore", "reason": "r", "until": None},
        }
        for i in range(count)
    ]
    snapshot = {"objects": objects, "findings": found, "meta": {"scanned_at": "t"}}
    return SimpleNamespace(
        snapshot=snapshot,
        mcp=McpStore(hass),
        version="1",
        warming_up=False,
        status={"running": False},
    )


async def test_answers_are_short_sorted_and_paged(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass)
    scanner.mcp.enabled = True
    first = await mcp_api.run(hass, scanner, "findings", {}, None)
    assert len(json.dumps(first)) < 20_000  # 600 findings, one page
    assert first["total"] == 540 and first["returned"] == 20 and first["next_cursor"] == "20"
    assert {f["level"] for f in first["findings"]} == {"high"}  # most important first
    assert "\n" not in first["findings"][0]["name"] and len(first["findings"][0]["name"]) <= 80
    last = await mcp_api.run(hass, scanner, "findings", {"cursor": "520", "limit": 50}, None)
    assert last["returned"] == 20 and last["next_cursor"] is None
    medium = await mcp_api.run(hass, scanner, "findings", {"level": "medium", "search": "s1"}, None)
    assert medium["by_level"].keys() <= {"high", "medium"}
    only = await mcp_api.run(hass, scanner, "findings", {"ignored": "only", "limit": 50}, None)
    assert only["total"] == 60 and only["findings"][0]["decision"]["kind"] == "ignore"


async def test_nothing_without_the_switch_and_every_call_is_logged(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 5)
    with pytest.raises(mcp_api.McpError) as off:
        await mcp_api.run(hass, scanner, "status", {}, None)
    assert off.value.reason == "disabled"
    scanner.mcp.enabled = True
    with pytest.raises(mcp_api.McpError) as bad:
        await mcp_api.run(hass, scanner, "findings", {"limit": 500}, None)
    assert bad.value.reason == "invalid_format"
    for _ in range(3):
        await mcp_api.run(hass, scanner, "status", {}, None)
    log = await mcp_api.run(hass, scanner, "audit", {}, None)
    assert [(e["fn"], e["kind"], e["result"], e["n"]) for e in log["entries"]] == [
        ("status", "read", "ok", 3),
        ("findings", "read", "invalid_format", 1),
        ("status", "denied", "disabled", 1),
    ]
    assert log["calls_24h"] == 5  # a merged line counts all its calls; the log read is no call


async def test_only_an_administrator_may_call(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 5)
    scanner.mcp.enabled = True
    await hass.auth.async_create_user("Owner", group_ids=["system-admin"])  # the first user owns it
    user = await hass.auth.async_create_user("Guest", group_ids=["system-users"])
    with pytest.raises(mcp_api.McpError) as refused:
        await mcp_api.run(hass, scanner, "status", {}, user.id)
    assert refused.value.reason == "not_admin"
    admin = await hass.auth.async_create_user("Boss", group_ids=["system-admin"])
    assert (await mcp_api.run(hass, scanner, "status", {}, admin.id))["findings"] == 4


async def test_the_log_is_limited_in_size_and_age(hass: HomeAssistant) -> None:
    store = McpStore(hass)
    now = datetime.now(UTC)
    store.log(
        "u",
        "findings",
        "read",
        {},
        "ok",
        1,
        now=now - timedelta(days=100),
    )
    assert short_params({"search": "x" * 500, "ids": list(range(9))}) == {
        "search": "x" * 60,
        "ids": "[9]",
    }
    for i in range(2100):
        store.log(f"u{i}", "findings", "read", {}, "ok", 1, now=now)
    assert len(store.entries) == 2000 and all(
        e["at"] >= (now - timedelta(days=90)).isoformat() for e in store.entries
    )


async def test_the_object_card_gathers_findings_and_connections(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 3)
    scanner.mcp.enabled = True
    scanner.snapshot["objects"].append(
        {"object_type": "automation", "object_id": "automation.a", "name": "Lights"}
    )
    scanner.snapshot["edges"] = [
        {
            "source": "automation:automation.a",
            "target": "entity:sensor.s1",
            "relation": "TRIGGERS_ON",
        },
        {"source": "device:d", "target": "entity:sensor.s1", "relation": "PROVIDES"},
    ]
    scanner.marks = SimpleNamespace(items={})
    scanner.notes = SimpleNamespace(view=lambda: [])
    card = await mcp_api.run(
        hass, scanner, "object", {"object_type": "entity", "object_id": "sensor.s1"}, None
    )
    assert card["object"]["name"].startswith("Sensor 1") and card["impact"]["used_by"] == 1
    assert card["used_by"]["items"][0] == {
        "type": "automation",
        "id": "automation.a",
        "name": "Lights",
        "relation": "TRIGGERS_ON",
    }
    assert card["belongs_to"]["total"] == 1 and card["findings"][0]["rule"].startswith("entity.")
    with pytest.raises(mcp_api.McpError) as unknown:
        await mcp_api.run(
            hass, scanner, "object", {"object_type": "entity", "object_id": "x"}, None
        )
    assert unknown.value.reason == "not_found"
