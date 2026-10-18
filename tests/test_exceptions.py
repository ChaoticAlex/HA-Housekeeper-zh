"""Exception rules: what covers an object, and what hides or holds back a finding."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.ha_housekeeper.exceptions import Traits, clean_rule, matches, verdict

NOW = datetime(2026, 10, 18, 12, tzinfo=UTC)


def _rule(kind: str, targets: list[str], action: str = "hide", days: int | None = None):
    rule = clean_rule({"kind": kind, "targets": targets, "action": action, "days": days})
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
