"""AI access: the switch, who may call, the shape and size of the answers, the log."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant  # noqa: E402
from pytest_homeassistant_custom_component.common import async_capture_events  # noqa: E402

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
    assert "ha_housekeeper.object" in first["next_steps"]["object"]
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
    assert bad.value.detail.startswith("limit:")
    for _ in range(3):
        first = await mcp_api.run(hass, scanner, "status", {}, None)
    assert "findings" in first["guide"]
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


async def test_changes_need_their_own_switch_and_can_be_taken_back(hass: HomeAssistant) -> None:
    from custom_components.ha_housekeeper.ignored import IgnoreStore
    from custom_components.ha_housekeeper.marks import MarkStore
    from custom_components.ha_housekeeper.notes import NoteStore

    scanner = scanner_with(hass, 3)
    scanner.mcp.enabled = True
    scanner.ignored, scanner.marks, scanner.notes = (
        IgnoreStore(hass),
        MarkStore(hass),
        NoteStore(hass),
    )
    scanner.snapshot["objects"].append(
        {"object_type": "entity", "object_id": "sensor.s2", "name": "S2"}
    )
    scanner.set_finding_ignored = lambda key, ignored, **kw: (
        scanner.ignored.decide(
            key, kw["kind"], datetime.now(UTC), reason=kw["reason"], via=kw["via"]
        )
        if ignored
        else scanner.ignored.set_ignored(key, False, datetime.now(UTC)) or True
    )
    scanner.restore_decision = scanner.ignored.restore
    key = "entity.state_unavailable|sensor.s1|"
    with pytest.raises(mcp_api.McpError) as off:
        await mcp_api.run(hass, scanner, "note_set", {"action": "save", "title": "t"}, None)
    assert off.value.reason == "write_disabled"
    scanner.mcp.write = True
    seen = async_capture_events(hass, "ha_housekeeper_ai_change")
    with pytest.raises(mcp_api.McpError) as reason:
        await mcp_api.run(
            hass, scanner, "finding_decide", {"key": key, "action": "decide", "kind": "keep"}, None
        )
    assert reason.value.reason == "reason_required"
    with pytest.raises(mcp_api.McpError) as plain:
        await mcp_api.run(hass, scanner, "finding_decide", {"key": key, "action": "decide"}, None)
    assert plain.value.reason == "reason_required"
    await mcp_api.run(
        hass, scanner, "finding_decide", {"key": key, "action": "decide", "reason": "spare"}, None
    )
    assert scanner.ignored.entry(key)["via"] == "mcp"
    assert [(e.data["function"], e.data["changed"]) for e in seen] == [("finding_decide", 1)]
    note = await mcp_api.run(
        hass, scanner, "note_set", {"action": "save", "title": "Checked"}, None
    )
    assert scanner.notes.items[0]["source"] == "agent" and note["note_id"]
    log = await mcp_api.run(hass, scanner, "audit", {"kind": "write"}, None)
    done = [e for e in log["entries"] if e["result"] == "ok"]
    assert [e["fn"] for e in done] == ["note_set", "finding_decide"]
    assert all(e["undoable"] and "undo" not in e for e in done)
    for entry in done:
        await mcp_api.run(hass, scanner, "undo", {"at": entry["at"]}, None)
    assert scanner.ignored.entry(key) is None and scanner.notes.items == []
    with pytest.raises(mcp_api.McpError) as twice:
        await mcp_api.run(hass, scanner, "undo", {"at": done[0]["at"]}, None)
    assert twice.value.reason == "not_found"
    # everything at once, but only what the hours allow
    now = datetime.now(UTC)
    for hours_ago, title in ((5, "old"), (0, "new")):
        await mcp_api.run(hass, scanner, "note_set", {"action": "save", "title": title}, None)
        scanner.mcp.entries[-1]["at"] = (now - timedelta(hours=hours_ago)).isoformat()
    assert mcp_api.undo_all(scanner, 2) == 1
    assert [n["title"] for n in scanner.notes.items] == ["old"]
    assert mcp_api.undo_all(scanner, None) == 1 and scanner.notes.items == []
    assert mcp_api.undo_all(scanner, None) == 0


async def test_changes_are_limited_and_a_refusal_is_logged_as_denied(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 3)
    scanner.mcp.enabled = scanner.mcp.write = True
    scanner.notes = SimpleNamespace(items=[])
    now = datetime.now(UTC)
    for _ in range(mcp_api.WRITE_LIMIT):
        scanner.mcp.log(None, "note_set", "write", {}, "ok", 1, now=now - timedelta(minutes=6))
    assert scanner.mcp.writes_since(5) == 0
    for _ in range(mcp_api.WRITE_LIMIT):
        scanner.mcp.log(None, "note_set", "write", {}, "ok", 1)
    with pytest.raises(mcp_api.McpError) as limited:
        await mcp_api.run(hass, scanner, "note_set", {"action": "save", "title": "t"}, None)
    assert limited.value.reason == "rate_limited"
    assert scanner.mcp.entries[-1]["kind"] == "denied"


async def test_no_secret_reaches_an_answer(hass: HomeAssistant) -> None:
    """Answers are built field by field: a secret kept on an object or a finding is not copied."""
    scanner = scanner_with(hass, 3)
    scanner.mcp.enabled = True
    secret = "S3CRET-VALUE"
    scanner.snapshot["objects"][1].update(
        token=secret, webhook_id=secret, password=secret, options={"api_key": secret}
    )
    scanner.snapshot["findings"][1].update(secret=secret, evidence=[{"value": secret}])
    scanner.snapshot["edges"] = []
    scanner.marks = SimpleNamespace(items={})
    scanner.notes = SimpleNamespace(view=lambda: [])
    answers = [
        await mcp_api.run(hass, scanner, "status", {}, None),
        await mcp_api.run(hass, scanner, "findings", {"ignored": "include"}, None),
        await mcp_api.run(
            hass, scanner, "object", {"object_type": "entity", "object_id": "sensor.s1"}, None
        ),
        await mcp_api.run(hass, scanner, "audit", {}, None),
    ]
    assert secret not in json.dumps(answers)


async def test_ai_access_switches_itself_off_after_its_time(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 3)
    store = scanner.mcp
    store.set_switches(True, True, 1)
    assert store.off_at is not None and store.meta()["auto_off_hours"] == 1
    assert not store.expire()
    assert store.expire(datetime.now(UTC) + timedelta(hours=2))
    assert not store.enabled and not store.write and store.off_at is None
    assert store.entries[-1]["fn"] == "auto_off"
    store.set_switches(True)  # a new start counts from now
    assert store.off_at is not None
    store.set_switches(auto_off_hours=0)
    assert store.off_at is None and not store.expire(datetime.now(UTC) + timedelta(days=9))


async def test_sensitive_objects_stay_out_of_every_answer(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 3)
    scanner.mcp.enabled = scanner.mcp.write = True
    scanner.snapshot["objects"].append(
        {"object_type": "entity", "object_id": "lock.front", "name": "Front door"}
    )
    scanner.snapshot["findings"].append(
        {
            "key": "entity.state_unavailable|lock.front|",
            "rule_id": "entity.state_unavailable",
            "object_id": "lock.front",
            "classification": "unavailable",
            "impact": "high",
        }
    )
    scanner.snapshot["edges"] = [
        {"source": "automation:a", "target": "entity:lock.front", "relation": "TRIGGERS_ON"},
        {"source": "entity:lock.front", "target": "entity:sensor.s1", "relation": "TARGETS"},
    ]
    scanner.marks = SimpleNamespace(items={})
    scanner.notes = SimpleNamespace(view=lambda: [])
    listed = await mcp_api.run(hass, scanner, "findings", {"limit": 50}, None)
    assert "lock.front" not in json.dumps(listed) and listed["withheld"] == 1
    status = await mcp_api.run(hass, scanner, "status", {}, None)
    open_findings = [f for f in scanner.snapshot["findings"] if not f.get("ignored")]
    assert status["findings"] == len(open_findings) - 1  # the lock's finding is not counted
    with pytest.raises(mcp_api.McpError) as card:
        await mcp_api.run(
            hass, scanner, "object", {"object_type": "entity", "object_id": "lock.front"}, None
        )
    assert card.value.reason == "withheld"
    with pytest.raises(mcp_api.McpError) as decide:
        await mcp_api.run(
            hass,
            scanner,
            "finding_decide",
            {"key": "entity.state_unavailable|lock.front|", "action": "decide", "reason": "x"},
            None,
        )
    assert decide.value.reason == "finding_not_found"
    other = await mcp_api.run(
        hass, scanner, "object", {"object_type": "entity", "object_id": "sensor.s1"}, None
    )
    assert "lock.front" not in json.dumps(other)
    scanner.mcp.hide_sensitive = False
    assert "lock.front" in json.dumps(
        await mcp_api.run(hass, scanner, "findings", {"limit": 50}, None)
    )


async def test_reads_are_limited_per_minute(hass: HomeAssistant) -> None:
    scanner = scanner_with(hass, 3)
    scanner.mcp.enabled = True
    for _ in range(mcp_api.READ_LIMIT):
        scanner.mcp.log(None, "status", "read", {}, "ok", None)
    with pytest.raises(mcp_api.McpError) as limited:
        await mcp_api.run(hass, scanner, "status", {}, None)
    assert limited.value.reason == "too_many_calls"
    await mcp_api.run(hass, scanner, "audit", {}, None)  # the log can always be read
