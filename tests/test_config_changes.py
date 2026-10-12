"""A configuration change is known from the second fingerprint on; runs are compared around it."""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.config_changes import (  # noqa: E402
    before_after,
    fingerprint,
)
from custom_components.ha_housekeeper.runs import ERROR, FIELDS, RUNS  # noqa: E402


def _day(runs, errors):
    counters = [0] * FIELDS
    counters[RUNS], counters[ERROR] = runs, errors
    return {"c": counters}


def test_the_fingerprint_follows_the_configuration_only() -> None:
    a = {"triggers": [{"x": 1}], "conditions": [], "actions": [{"y": 2}], "name": "A"}
    assert fingerprint(a) == fingerprint({**a, "name": "B", "mode": "single"})
    assert fingerprint(a) != fingerprint({**a, "actions": [{"y": 3}]})


def test_runs_before_and_after_leave_out_the_day_of_the_change() -> None:
    days = {
        "2026-10-05": _day(5, 4),
        "2026-10-08": _day(9, 9),  # the day of the change: in neither side
        "2026-10-09": _day(6, 0),
        "2026-10-10": _day(4, 0),
    }
    at = datetime(2026, 10, 8, 15, tzinfo=UTC).isoformat()
    result = before_after(days, at, date(2026, 10, 11))
    assert result["before"] == {"runs": 5, "errors": 4, "days": 7}
    assert result["after"] == {"runs": 10, "errors": 0, "days": 3}
    assert before_after(days, None, date(2026, 10, 11)) is None
    assert before_after({"2026-10-09": _day(1, 0)}, at, date(2026, 10, 11)) is None
