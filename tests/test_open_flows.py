"""Open flows: discoveries and set-up requests, never a login request or a flow a person started."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.open_flows import open_flows  # noqa: E402


def test_discoveries_and_reconfigure_requests_are_listed_and_the_rest_is_not() -> None:
    def flow(flow_id, handler, source, **context):
        return {"flow_id": flow_id, "handler": handler, "context": {"source": source, **context}}

    flows = [
        flow("a", "hue", "zeroconf", title_placeholders={"name": "Hue Bridge"}),
        flow("b", "fritz", "reconfigure", entry_id="e1"),
        flow("c", "tibber", "reauth", entry_id="e2"),
        flow("d", "sonos", "user"),
        flow("e", "mqtt", "ignore"),
    ]
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(
            async_entries=lambda: [SimpleNamespace(entry_id="e1", title="Fritz!Box")],
            flow=SimpleNamespace(async_progress=lambda: flows),
        )
    )
    assert [(f["name"], f["kind"], f["source"]) for f in open_flows(hass)] == [
        ("Hue Bridge", "discovered", "zeroconf"),
        ("Fritz!Box", "reconfigure", "reconfigure"),
    ]
