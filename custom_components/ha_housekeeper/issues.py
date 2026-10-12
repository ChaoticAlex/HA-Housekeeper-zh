"""Repairs hints. One aggregated, non-fixable issue per finding category."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN, PANEL_URL

ISSUE_FILTERS = {
    "orphaned_entities": "orphaned",
    "unavailable_entities": "unavailable",
    "broken_automations": "broken_reference",
}

ISSUE_IDS = ("orphaned_entities", "unavailable_entities", "broken_automations")


CATEGORIES = {
    "broken_reference": "broken_automations",
    "orphaned": "orphaned_entities",
    "unavailable": "unavailable_entities",
}


def async_sync_issues(hass: HomeAssistant, findings: list[dict[str, Any]]) -> None:
    """Create, update or clear the hints. Housekeeper never offers a fix."""
    counts = dict.fromkeys(ISSUE_IDS, 0)
    for finding in findings:
        # Only these three kinds are repairs; every other kind (duplicates, unused, stale,
        # failed config entries, ...) stays a finding in the panel, so no hint links to an empty filter.
        category = CATEGORIES.get(finding["classification"])
        if category and not finding.get("ignored"):
            counts[category] += 1

    for issue_id, count in counts.items():
        if count:
            link = f"/{PANEL_URL}?view=findingsNav&filter={ISSUE_FILTERS[issue_id]}"
            ir.async_create_issue(
                hass,
                DOMAIN,
                issue_id,
                is_fixable=False,
                learn_more_url=link,
                severity=ir.IssueSeverity.WARNING,
                translation_key=issue_id,
                translation_placeholders={"count": str(count), "link": link},
            )
        else:
            ir.async_delete_issue(hass, DOMAIN, issue_id)


def async_clear_issues(hass: HomeAssistant) -> None:
    """Remove all hints, for example when the integration is unloaded."""
    for issue_id in ISSUE_IDS:
        ir.async_delete_issue(hass, DOMAIN, issue_id)
