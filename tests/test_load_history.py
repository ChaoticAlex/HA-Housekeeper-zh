"""The load line of the storage page: one sample every five minutes, kept for seven days."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.load_history import (  # noqa: E402
    KEEP_SECONDS,
    MAX_POINTS,
    LoadStore,
)


class _Saved:
    def async_delay_save(self, *_: object) -> None:
        pass


def _store() -> LoadStore:
    store = LoadStore.__new__(LoadStore)
    store._store = _Saved()  # type: ignore[assignment]
    store.samples = []
    return store


def test_samples_are_spaced_pruned_and_grouped() -> None:
    store = _store()
    assert store.record(0, {"disk": 40, "ram": 50, "cpu": 10, "swap": None})
    assert not store.record(60, {"disk": 41})  # too soon after the last one
    assert not store.record(400, {"disk": 150, "ram": "x"})  # nothing usable
    for i in range(1, 3000):
        store.record(i * 300, {"disk": 40, "ram": 50, "cpu": 10 + i % 5, "swap": 1})
    assert store.samples[0][0] >= store.samples[-1][0] - KEEP_SECONDS
    series = store.series()
    assert len(series["points"]) <= MAX_POINTS
    assert series["span"] > 3600
    assert all(row[5] >= row[3] for row in series["points"])  # the CPU peak is never below its mean
    assert _store().series() == {"points": [], "span": 0}
