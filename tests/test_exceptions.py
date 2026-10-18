"""Exception rules: what covers an object, and what hides or holds back a finding."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from custom_components.ha_housekeeper.exceptions import (
    ExceptionStore,
    Traits,
    Vacation,
    clean_rule,
    matches,
    verdict,
)

NOW = datetime(2026, 10, 18, 12, tzinfo=UTC)


def _rule(
    kind: str,
    targets: list[str],
    action: str = "hide",
    days: int | None = None,
    scope: str = "always",
):
    rule = clean_rule(
        {"kind": kind, "targets": targets, "action": action, "days": days, "scope": scope}
    )
    assert rule is not None
    return rule


def _outage(days: float) -> dict:
    return {
        "classification": "unavailable",
        "rule_id": "entity.unavailable",
        "first_detected_at": (NOW - timedelta(days=days)).isoformat(),
    }


def test_clean_rule_rejects_what_names_nothing() -> None:
    assert clean_rule({"kind": "floor", "targets": ["a"]}) is None
    assert clean_rule({"kind": "area", "targets": []}) is None
    assert _rule("label", ["x", "x"])["targets"] == ["x"]


def test_area_and_label_match_their_own_kind_only() -> None:
    assert matches(_rule("area", ["lager"]), Traits("lager", frozenset()))
    assert not matches(_rule("area", ["lager"]), Traits(None, frozenset({"lager"})))
    assert matches(_rule("label", ["ignore_status"]), Traits(None, frozenset({"ignore_status"})))
    tv = Traits(None, frozenset(), frozenset({"cast"}), "media_player")
    assert matches(_rule("integration", ["cast"]), tv)
    assert matches(_rule("domain", ["media_player"]), tv)
    assert not matches(_rule("domain", ["cast"]), tv)
    off = {**_rule("area", ["lager"]), "enabled": False}
    assert not matches(off, Traits("lager", frozenset()))


def test_hide_beats_delay_and_the_longest_delay_counts() -> None:
    found = Traits("keller", frozenset({"slow"}))
    rules = [_rule("area", ["keller"], "delay", 3), _rule("label", ["slow"], "delay", 10)]
    assert verdict(rules, found, _outage(5), NOW)["state"] == "hold"
    assert verdict(rules, found, _outage(11), NOW)["state"] == "due"
    rules.append(_rule("area", ["keller"]))
    assert verdict(rules, found, _outage(11), NOW)["state"] == "hide"


def test_a_delay_leaves_other_findings_alone() -> None:
    found = Traits("keller", frozenset())
    battery = {"classification": "problem", "rule_id": "entity.battery_low"}
    assert verdict([_rule("area", ["keller"], "delay", 7)], found, battery, NOW) is None
    assert (
        verdict([_rule("area", ["keller"], "delay", 7)], found, {"classification": "unknown"}, NOW)
        is None
    )


def test_a_vacation_rule_always_hides() -> None:
    rule = _rule("area", ["keller"], "delay", 5, scope="vacation")
    assert rule["action"] == "hide" and rule["days"] is None


def test_device_and_entity_rules_match_by_id() -> None:
    found = Traits(None, frozenset(), frozenset(), "media_player", "dev1", "media_player.tv")
    assert matches(_rule("device", ["dev1"]), found)
    assert matches(_rule("entity", ["media_player.tv"]), found)
    assert not matches(_rule("entity", ["media_player.other"]), found)


def test_a_vacation_rule_works_only_while_the_vacation_is_on() -> None:
    found = Traits("keller", frozenset())
    rules = [_rule("area", ["keller"], scope="vacation")]
    assert verdict(rules, found, _outage(5), NOW, Vacation(False)) is None
    result = verdict(rules, found, _outage(5), NOW, Vacation(True))
    assert result["state"] == "hide" and result["phase"] == "vacation"


def test_after_the_vacation_the_outage_counts_from_its_end() -> None:
    found = Traits("keller", frozenset())
    ended = NOW - timedelta(hours=10)
    vacation = Vacation(False, ended, 24)
    rules = [_rule("area", ["keller"], scope="vacation")]
    # no delay rule of its own: the grace period holds it back
    assert verdict(rules, found, _outage(14), NOW, vacation)["state"] == "hold"
    assert verdict(rules, found, _outage(14), NOW + timedelta(hours=15), vacation) is None
    # an own delay replaces the grace period and counts from the end, not from the outage
    rules.append(_rule("domain", ["x"], "delay", 3))  # always applies: the own delay
    found = Traits("keller", frozenset(), frozenset(), "x")
    held = verdict(rules, found, _outage(14), NOW, vacation)
    assert held["state"] == "hold" and held["phase"] == "after"
    assert verdict(rules, found, _outage(14), NOW + timedelta(days=3), vacation)["state"] == "due"
    # an outage that began after the vacation is not shifted
    assert verdict(rules, found, _outage(0.1), NOW, vacation)["state"] == "hold"


def test_rule_schema_takes_the_days_of_a_hide_rule_back_as_none() -> None:
    from voluptuous import Schema

    from custom_components.ha_housekeeper.ws_care import _RULE_SCHEMA

    rule = {"kind": "area", "targets": ["a"], "action": "hide", "days": None, "scope": "always"}
    assert Schema(_RULE_SCHEMA)(rule)["days"] is None


def test_a_rule_for_all_covers_every_object_and_needs_no_target() -> None:
    rule = clean_rule({"kind": "all", "action": "hide", "scope": "vacation"})
    assert rule is not None and rule["targets"] == ["*"]
    assert matches(rule, Traits(None, frozenset()))
    assert not matches({**rule, "enabled": False}, Traits(None, frozenset()))


def _store(states: dict[str, Any], events: list[dict[str, Any]] | None = None) -> ExceptionStore:
    hass = MagicMock()
    hass.states.get.side_effect = states.get
    hass.services.async_call = AsyncMock(return_value={"calendar.main": {"events": events or []}})
    store = ExceptionStore(hass)
    store._store = MagicMock()
    return store


def _state(value: str, message: str = "") -> Any:
    return SimpleNamespace(state=value, attributes={"message": message})


def test_the_default_switch_is_used_until_one_is_chosen() -> None:
    store = _store({"input_boolean.urlaubsmodus": _state("on")})
    assert store.entity == "input_boolean.urlaubsmodus" and store.automatic and store.active()
    store.set_vacation(None, 24, NOW)
    assert store.entity is None and not store.automatic  # left empty on purpose


def test_a_calendar_keyword_looks_at_every_running_event() -> None:
    states = {"calendar.main": _state("on", "Zahnarzt")}
    store = _store(states, [{"summary": "Zahnarzt"}, {"summary": "Urlaub Mallorca"}])
    store.set_vacation("calendar.main", 24, NOW, "urlaub")
    assert not store.active()  # the title shown is only the dentist, until the calendar is asked
    asyncio.run(store.async_refresh_calendar(NOW))
    assert store.active()
    store.hass.services.async_call.return_value = {
        "calendar.main": {"events": [{"summary": "Zahnarzt"}]}
    }
    asyncio.run(store.async_refresh_calendar(NOW))
    assert store.switch_state() == "off"
    store.set_vacation("calendar.main", 24, NOW, "")
    assert store.active()  # no keyword: every running event counts
