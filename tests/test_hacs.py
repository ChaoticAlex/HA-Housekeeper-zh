"""HACS data: installed and newest version of the integrations HACS installed."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.hacs import hacs_by_domain  # noqa: E402


def repo(**data):
    base = {"category": "integration", "installed": True, "domain": "demo", "id": 7, "full_name": "me/demo"}
    return SimpleNamespace(data=SimpleNamespace(**{**base, **data}))


def test_installed_integrations_by_domain_with_pending_update() -> None:
    old = repo(installed_version="1.0", last_version="1.1")
    skipped = [repo(category="plugin"), repo(installed=False, domain="other"), repo(domain=None)]
    hass = SimpleNamespace(data={"hacs": SimpleNamespace(repositories=SimpleNamespace(list_all=[old, *skipped]))})
    found = hacs_by_domain(hass)
    assert list(found) == ["demo"]
    assert found["demo"]["pending_update"] is True
    assert found["demo"]["available_version"] == "1.1" and found["demo"]["id"] == "7"


def test_without_hacs_or_with_an_unknown_layout_the_answer_is_none() -> None:
    assert hacs_by_domain(SimpleNamespace(data={})) is None
    assert hacs_by_domain(SimpleNamespace(data={"hacs": object()})) is None
