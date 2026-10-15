"""The language of the notifications and logbook entries Housekeeper writes on its own."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.cleanup_exec import LOGBOOK_DEVICE  # noqa: E402
from custom_components.ha_housekeeper.monitor import MONITOR_REASONS, MONITOR_TEXTS  # noqa: E402
from custom_components.ha_housekeeper.texts import language_of, pick  # noqa: E402


def hass(language: str) -> SimpleNamespace:
    return SimpleNamespace(config=SimpleNamespace(language=language))


def test_the_region_does_not_matter_and_english_is_the_fallback() -> None:
    assert language_of(hass("de_AT")) == language_of(hass("DE-ch")) == "de"
    assert pick(hass("de-AT"), LOGBOOK_DEVICE) is LOGBOOK_DEVICE["de"]
    assert pick(hass("fr"), LOGBOOK_DEVICE) is LOGBOOK_DEVICE["en"]


def test_every_language_has_the_same_texts() -> None:
    assert MONITOR_TEXTS["de"].keys() == MONITOR_TEXTS["en"].keys()
    assert MONITOR_REASONS["de"].keys() == MONITOR_REASONS["en"].keys()
