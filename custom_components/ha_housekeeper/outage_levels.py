"""The four thresholds that turn the duration of an outage into a level: info, low, medium, high.

They are options. A setup that only has the old ``min_unavailable_days`` (days until an entity became
a finding, and until an integration was "high") keeps what it meant: a larger value moves medium and
high, a smaller one only high. Once the new options are saved the old one is ignored.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .const import (
    CONF_MIN_UNAVAILABLE_DAYS,
    CONF_OUTAGE_HIGH_HOURS,
    CONF_OUTAGE_INFO_MINUTES,
    CONF_OUTAGE_LOW_HOURS,
    CONF_OUTAGE_MEDIUM_HOURS,
    DEFAULT_MIN_UNAVAILABLE_DAYS,
    DEFAULT_OUTAGE_HIGH_HOURS,
    DEFAULT_OUTAGE_INFO_MINUTES,
    DEFAULT_OUTAGE_LOW_HOURS,
    DEFAULT_OUTAGE_MEDIUM_HOURS,
)

OUTAGE_KEYS = (
    CONF_OUTAGE_INFO_MINUTES,
    CONF_OUTAGE_LOW_HOURS,
    CONF_OUTAGE_MEDIUM_HOURS,
    CONF_OUTAGE_HIGH_HOURS,
)


def _whole(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def thresholds_from_options(options: Mapping[str, Any]) -> dict[str, int]:
    """The four thresholds as set; the old option stands in while none of them was ever saved."""
    values = {
        CONF_OUTAGE_INFO_MINUTES: DEFAULT_OUTAGE_INFO_MINUTES,
        CONF_OUTAGE_LOW_HOURS: DEFAULT_OUTAGE_LOW_HOURS,
        CONF_OUTAGE_MEDIUM_HOURS: DEFAULT_OUTAGE_MEDIUM_HOURS,
        CONF_OUTAGE_HIGH_HOURS: DEFAULT_OUTAGE_HIGH_HOURS,
    }
    saved = [key for key in OUTAGE_KEYS if _whole(options.get(key))]
    legacy = options.get(CONF_MIN_UNAVAILABLE_DAYS)
    if not saved and _whole(legacy):
        if legacy > DEFAULT_MIN_UNAVAILABLE_DAYS:
            values[CONF_OUTAGE_MEDIUM_HOURS] = legacy * 24
            values[CONF_OUTAGE_HIGH_HOURS] = legacy * 24 + 24
        elif legacy >= 2:
            values[CONF_OUTAGE_HIGH_HOURS] = legacy * 24
    for key in saved:
        values[key] = options[key]
    return values


def thresholds_rise(values: Mapping[str, int]) -> bool:
    """Whether info < low < medium < high, all in the same unit."""
    steps = (
        values[CONF_OUTAGE_INFO_MINUTES] / 60,
        values[CONF_OUTAGE_LOW_HOURS],
        values[CONF_OUTAGE_MEDIUM_HOURS],
        values[CONF_OUTAGE_HIGH_HOURS],
    )
    return all(a < b for a, b in zip(steps, steps[1:], strict=False))
