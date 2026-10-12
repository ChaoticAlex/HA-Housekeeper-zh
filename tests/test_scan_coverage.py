"""The coverage report of a scan: a source is checked, partial, skipped, absent or unknown."""

from __future__ import annotations

from custom_components.ha_housekeeper.scan_coverage import SOURCES, ScanCoverage, gaps


def test_a_source_the_scan_never_reached_is_unknown_and_the_order_is_fixed() -> None:
    coverage = ScanCoverage()
    coverage.checked("registry")
    report = coverage.report()
    assert [item["source"] for item in report] == list(SOURCES)
    assert report[0]["state"] == "checked"
    assert {item["state"] for item in report[1:]} == {"unknown"}


def test_a_gap_noted_earlier_is_not_overwritten_by_checked() -> None:
    coverage = ScanCoverage()
    coverage.skipped("automations", "automation_not_ready")
    coverage.checked("automations")
    coverage.partial("dashboards", "unreadable", read=3, failed=1)
    coverage.checked("dashboards")
    coverage.absent("apps", "no_supervisor")
    by_source = {item["source"]: item for item in coverage.report()}
    assert by_source["automations"]["state"] == "skipped"
    assert by_source["dashboards"]["state"] == "partial" and by_source["dashboards"]["failed"] == 1
    assert by_source["apps"]["state"] == "absent"


def test_gaps_name_skipped_partial_and_unknown_sources_but_not_absent_ones() -> None:
    coverage = ScanCoverage()
    for source in SOURCES:
        coverage.checked(source)
    coverage.skipped("statistics", "not_ready")
    coverage.partial("dashboards", "resources_unknown")
    coverage.absent("energy", "not_set_up")
    assert gaps(coverage.report()) == ["dashboards", "statistics"]
    coverage.reset()
    assert gaps(coverage.report()) == list(SOURCES)
