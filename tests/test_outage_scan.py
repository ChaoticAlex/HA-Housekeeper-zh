"""Scans that follow outages: what starts them, when they run, how the duration is read."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace as NS

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.outage_scan import (  # noqa: E402
    next_due,
    outage_start,
    plan_time,
    state_filter,
)

NOW = datetime(2026, 10, 15, 12, 0, tzinfo=UTC)


def _change(old, new):
    return {"old_state": NS(state=old) if old else None, "new_state": NS(state=new) if new else None}


def test_only_a_change_into_or_out_of_a_bad_state_is_looked_at() -> None:
    assert state_filter(_change("21.5", "unavailable"))
    assert state_filter(_change("unavailable", "unknown"))
    assert state_filter(_change("unavailable", "21.5"))
    assert not state_filter(_change("21.5", "21.6"))
    assert not state_filter(_change("unavailable", "unavailable"))
    assert not state_filter(_change("21.5", None))


def test_the_outage_starts_at_the_earlier_of_what_was_seen_and_what_home_assistant_kept() -> None:
    seen, kept = "2026-10-15T09:00:00+00:00", "2026-10-15T08:00:00+00:00"
    assert outage_start(seen, kept) == (kept, "home_assistant")
    assert outage_start(kept, seen) == (kept, "first_housekeeper_observation")
    assert outage_start(None, kept) == (kept, "home_assistant")
    assert outage_start(seen, None) == (seen, "first_housekeeper_observation")


def test_the_next_scan_is_planned_for_the_next_level_of_an_open_outage() -> None:
    info, low = timedelta(minutes=15), timedelta(hours=1)
    began = (NOW - timedelta(minutes=5)).isoformat()
    objects = [
        {"status": "active", "status_since": (NOW - timedelta(days=9)).isoformat()},
        {"status": "unavailable", "status_since": began},
        {"status": "problem", "status_since": (NOW - timedelta(days=2)).isoformat()},
    ]
    assert next_due(objects, NOW, info, low) == NOW + timedelta(minutes=10)
    objects[1]["status_since"] = (NOW - timedelta(minutes=30)).isoformat()
    assert next_due(objects, NOW, info, low) == NOW + timedelta(minutes=30)
    assert next_due(objects[:1] + objects[2:], NOW, info, low) is None


def test_a_scan_is_not_planned_before_the_pause_after_the_last_one_is_over() -> None:
    gap = timedelta(minutes=15)
    assert plan_time(NOW, NOW, None, gap) == NOW
    assert plan_time(NOW, NOW, NOW - timedelta(minutes=5), gap) == NOW + timedelta(minutes=10)
    later = NOW + timedelta(hours=1)
    assert plan_time(later, NOW, NOW - timedelta(minutes=5), gap) == later


def test_the_old_option_keeps_its_meaning_until_the_new_ones_are_saved() -> None:
    from custom_components.ha_housekeeper.outage_levels import (
        thresholds_from_options,
        thresholds_rise,
    )

    assert thresholds_from_options({}) == {
        "outage_info_minutes": 15,
        "outage_low_hours": 1,
        "outage_medium_hours": 24,
        "outage_high_hours": 168,
    }
    wide = thresholds_from_options({"min_unavailable_days": 30})
    assert (wide["outage_medium_hours"], wide["outage_high_hours"]) == (720, 744)
    near = thresholds_from_options({"min_unavailable_days": 3})
    assert (near["outage_medium_hours"], near["outage_high_hours"]) == (24, 72)
    assert thresholds_from_options({"min_unavailable_days": 0}) == thresholds_from_options({})
    saved = thresholds_from_options({"min_unavailable_days": 30, "outage_high_hours": 100})
    assert saved["outage_high_hours"] == 100 and saved["outage_medium_hours"] == 24
    assert thresholds_rise(thresholds_from_options({}))
    assert not thresholds_rise({**thresholds_from_options({}), "outage_low_hours": 24})
