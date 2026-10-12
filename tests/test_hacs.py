"""HACS data: installed and newest version of the integrations HACS installed."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.hacs import hacs_by_domain  # noqa: E402


def repo(**data):
    base = {
        "category": "integration",
        "installed": True,
        "domain": "demo",
        "id": 7,
        "full_name": "me/demo",
    }
    return SimpleNamespace(data=SimpleNamespace(**{**base, **data}))


def test_installed_integrations_by_domain_with_pending_update() -> None:
    old = repo(installed_version="1.0", last_version="1.1")
    skipped = [repo(category="plugin"), repo(installed=False, domain="other"), repo(domain=None)]
    hass = SimpleNamespace(
        data={"hacs": SimpleNamespace(repositories=SimpleNamespace(list_all=[old, *skipped]))}
    )
    found = hacs_by_domain(hass)
    assert list(found) == ["demo"]
    assert found["demo"]["pending_update"] is True
    assert found["demo"]["available_version"] == "1.1" and found["demo"]["id"] == "7"


def test_without_hacs_or_with_an_unknown_layout_the_answer_is_none() -> None:
    assert hacs_by_domain(SimpleNamespace(data={})) is None
    assert hacs_by_domain(SimpleNamespace(data={"hacs": object()})) is None


def test_an_archived_repository_and_a_blocked_update_are_read_from_the_hacs_data() -> None:
    blocked = repo(installed_version="1.0", last_version="1.1", archived=True)
    blocked.can_download = False
    plain = repo(domain="plain", installed_version="1.0", last_version="1.0")
    hass = SimpleNamespace(
        data={"hacs": SimpleNamespace(repositories=SimpleNamespace(list_all=[blocked, plain]))}
    )
    found = hacs_by_domain(hass)
    assert found["demo"]["archived"] is True and found["demo"]["blocked"] is True
    assert found["plain"]["archived"] is False and found["plain"]["blocked"] is False
