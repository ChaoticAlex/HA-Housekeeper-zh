"""When a scan may be started by the service or the button."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.ha_housekeeper.scan_trigger import ScanRefused, scan_request  # noqa: E402


def test_one_scan_for_many_requests_and_none_in_a_plan_or_a_boot() -> None:
    idle = {"running": False, "cleanup_busy": False, "warming_up": False, "since_last": None}
    assert scan_request(**idle) == "start"
    assert scan_request(**{**idle, "since_last": 300}) == "start"
    assert scan_request(**{**idle, "since_last": 10}) == "recent"
    assert scan_request(**{**idle, "running": True, "since_last": 10}) == "join"
    with pytest.raises(ScanRefused) as plan:
        scan_request(**{**idle, "cleanup_busy": True, "running": True})
    assert plan.value.reason == "cleanup_busy"
    with pytest.raises(ScanRefused) as boot:
        scan_request(**{**idle, "warming_up": True})
    assert boot.value.reason == "starting"
