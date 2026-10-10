"""Entries you write yourself in the history."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from homeassistant.core import HomeAssistant

from custom_components.ha_housekeeper.correlation import correlate
from custom_components.ha_housekeeper.notes import NoteError, NoteStore

NOW = datetime(2026, 10, 10, 14, 0, tzinfo=UTC)


async def test_notes_are_checked_kept_newest_first_and_feed_the_correlation(
    hass: HomeAssistant,
) -> None:
    store = NoteStore(hass)
    first = store.upsert(
        None, " Zigbee stick replaced ", "2026-10-08T18:05:00+00:00", "device:zha", "", NOW
    )
    store.upsert(None, "Router update", "2026-10-09T20:15:00+00:00", "", "new channel", NOW)
    assert [i["title"] for i in store.view()] == ["Router update", "Zigbee stick replaced"]
    store.upsert(
        first, "Stick replaced", "2026-10-08T18:05:00", "device:zha", "", NOW
    )  # no zone: UTC
    assert next(i for i in store.items if i["id"] == first)["at"].endswith("+00:00")
    for title, at in (
        ("", "2026-10-08T18:05:00+00:00"),
        ("x" * 81, "2026-10-08T18:05:00+00:00"),
        ("ok", "nope"),
        ("ok", (NOW + timedelta(days=3)).isoformat()),
    ):
        with pytest.raises(NoteError):
            store.upsert(None, title, at, "", "", NOW)
    suggested = store.upsert(
        None, "Replaced", "2026-10-09T20:15:00+00:00", "entity:sensor.x", "", NOW, "housekeeper", "p1"
    )
    entry = next(i for i in store.items if i["id"] == suggested)
    assert entry["source"] == "housekeeper" and entry["ref"] == "p1"
    assert next(i for i in store.items if i["id"] == first)["source"] == "me"
    with pytest.raises(NoteError):
        store.upsert(None, "x", "2026-10-09T20:15:00+00:00", "", "", NOW, "robot")
    store.delete(suggested)
    with pytest.raises(NoteError):
        store.delete("missing")
    # a finding that began shortly after the entry is named with it, as an event of the log
    finding = {"key": "f1", "first_detected_at": "2026-10-08T18:25:00+00:00", "ignored": False}
    found = correlate([finding], store.as_events())
    group = found["groups"][0]
    assert (
        group["kind"] == "note" and group["title"] == "Stick replaced" and not group["only_group"]
    )
    assert found["by_key"]["f1"] == group["id"]
    store.delete(first)
    assert [i["title"] for i in store.view()] == ["Router update"]
