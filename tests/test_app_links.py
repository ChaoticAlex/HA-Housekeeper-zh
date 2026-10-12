"""Which integrations hang on which app: by host name or by the Supervisor's own entry."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.app_links import app_edges  # noqa: E402


def _entry(entry_id, domain, title="", source="user", data=None, options=None):
    return SimpleNamespace(
        entry_id=entry_id,
        domain=domain,
        title=title,
        source=source,
        data=data or {},
        options=options or {},
    )


def test_links_by_host_name_and_by_source_but_never_by_name_alone() -> None:
    apps = [
        {"slug": "ccab4aaf_frigate"},
        {"slug": "a0d7b954_adguard"},
        {"slug": "5c53de3b_esphome"},
        {"slug": "core_mosquitto"},
    ]
    entries = [
        _entry("e1", "frigate", "ccab4aaf-frigate:5000"),
        _entry("e2", "adguard", "AdGuard", source="hassio"),
        _entry("e3", "esphome", "ESPHome", source="zeroconf"),
        _entry("e4", "mqtt", "localhost", data={"broker": "core-mosquitto", "password": "x"}),
        _entry("e5", "other", "x", data={"url": "http://notcore-mosquitto-2:80"}),
        _entry("e6", "frigate", "ignored", source="ignore", data={"h": "ccab4aaf-frigate"}),
    ]
    edges = {(e["source"], e["target"]) for e in app_edges(entries, apps)}
    assert edges == {
        ("config_entry:e1", "app:ccab4aaf_frigate"),
        ("config_entry:e2", "app:a0d7b954_adguard"),
        ("config_entry:e4", "app:core_mosquitto"),
    }
    assert all(e["confidence"] == "probable" for e in app_edges(entries, apps))
