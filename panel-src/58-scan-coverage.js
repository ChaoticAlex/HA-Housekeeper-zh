// What the last scan read and what it could not (the coverage of the sources): a line in the overview,
// a list in Settings > Info. Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  covLine: "Prüfung: {n} von {m} Quellen",
  covAll: "Prüfung: alle {m} Quellen gelesen",
  covGaps: "Nicht vollständig gelesen: {list}. Befunde dort fehlen in den Zahlen.",
  covDetails: "Details",
  covListTitle: "Was zuletzt geprüft wurde",
  covListHint: "Scan von {date}. Quellen mit Lücke stehen oben. „Nicht vorhanden“ heißt: Diese Quelle gibt es in deiner Installation nicht.",
  covPartial: "{read} gelesen, {failed} nicht",
  covUnread: "{n} Objekte aus nicht gelesenen Quellen zählen weder als neu noch als entfernt.",
  covSrc_registry: "Register (Entitäten, Geräte, Bereiche)",
  covSrc_automations: "Automationen, Skripte und Szenen",
  covSrc_dashboards: "Dashboards",
  covSrc_energy: "Energie-Dashboard",
  covSrc_apps: "Apps",
  covSrc_statistics: "Langzeitstatistik",
  covSrc_database: "Datenbank-Größe",
  covState_checked: "Gelesen",
  covState_partial: "Teilweise",
  covState_skipped: "Übersprungen",
  covState_absent: "Nicht vorhanden",
  covState_unknown: "Unbekannt",
  covReason_no_supervisor: "Kein Supervisor",
  covReason_not_reachable: "Supervisor antwortet nicht",
  covReason_no_recorder: "Kein Recorder",
  covReason_not_ready: "Noch nicht bereit",
  covReason_unavailable: "Nicht verfügbar",
  covReason_unreadable: "Nicht lesbar",
  covReason_not_set_up: "Nicht eingerichtet",
  covReason_resources_unknown: "Dashboard-Ressourcen unbekannt",
  covReason_automation_not_ready: "Automationen noch nicht bereit",
  covReason_script_not_ready: "Skripte noch nicht bereit",
  endedUncheckedSrc: "Quelle nicht gelesen: {source}",
});
Object.assign(TEXT.en, {
  covLine: "Check: {n} of {m} sources",
  covAll: "Check: all {m} sources read",
  covGaps: "Not read in full: {list}. Findings there are missing from the numbers.",
  covDetails: "Details",
  covListTitle: "What was checked last",
  covListHint: "Scan of {date}. Sources with a gap come first. \"Not present\" means this source does not exist in your installation.",
  covPartial: "{read} read, {failed} not",
  covUnread: "{n} objects of sources that were not read count neither as new nor as removed.",
  covSrc_registry: "Registry (entities, devices, areas)",
  covSrc_automations: "Automations, scripts and scenes",
  covSrc_dashboards: "Dashboards",
  covSrc_energy: "Energy dashboard",
  covSrc_apps: "Apps",
  covSrc_statistics: "Long-term statistics",
  covSrc_database: "Database size",
  covState_checked: "Read",
  covState_partial: "Partly",
  covState_skipped: "Skipped",
  covState_absent: "Not present",
  covState_unknown: "Unknown",
  covReason_no_supervisor: "No Supervisor",
  covReason_not_reachable: "Supervisor does not answer",
  covReason_no_recorder: "No recorder",
  covReason_not_ready: "Not ready yet",
  covReason_unavailable: "Not available",
  covReason_unreadable: "Not readable",
  covReason_not_set_up: "Not set up",
  covReason_resources_unknown: "Dashboard resources unknown",
  covReason_automation_not_ready: "Automations not ready yet",
  covReason_script_not_ready: "Scripts not ready yet",
  endedUncheckedSrc: "Source not read: {source}",
});

// The source behind an owner type of a finding: what "not checked" means for it.
const SCAN_SOURCE_OF_TYPE = { dashboard: "dashboards", app: "apps" };

class ScanCoverageMixin {
  scanCoverageItems() { return this.data?.meta?.coverage || []; }

  // The sources that are missing something: skipped, partial or never reached. Absent ones are not a gap.
  scanCoverageGaps() { return this.scanCoverageItems().filter(c => ["skipped", "partial", "unknown"].includes(c.state)); }

  scanCoverageLabel(item) {
    const reason = item.reason ? this.t(`covReason_${item.reason}`) : "";
    const part = item.state === "partial" && item.failed ? this.t("covPartial", { read: item.read ?? 0, failed: item.failed }) : "";
    return [reason, part].filter(Boolean).join(" · ");
  }

  // One row in the overview, grey while everything was read and yellow with the names once something was not.
  scanCoverageLine() {
    const items = this.scanCoverageItems().filter(c => c.state !== "absent");
    if (!items.length) return "";
    const gaps = this.scanCoverageGaps(), read = items.length - gaps.length;
    const text = gaps.length ? this.t("covLine", { n: read, m: items.length }) : this.t("covAll", { m: items.length });
    const list = gaps.map(c => this.t(`covSrc_${c.source}`)).join(", ");
    return `<div class="panel u-mb14" data-coverage><div class="row"><span class="tile ${gaps.length ? "warn" : "mute"}"><ha-icon icon="${gaps.length ? "mdi:shield-alert-outline" : "mdi:shield-check-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(text)}</strong>${gaps.length ? `<small>${this.esc(this.t("covGaps", { list }))}</small>` : ""}</span><button class="btn" data-cov-details>${this.t("covDetails")}</button></div></div>`;
  }

  // The list in Settings > Info: every source with its state, the reason and the time of the scan; gaps first.
  scanCoverageCard() {
    const items = this.scanCoverageItems();
    if (!items.length) return "";
    const rank = { skipped: 0, partial: 1, unknown: 2, checked: 3, absent: 4 };
    const rows = [...items].sort((a, b) => rank[a.state] - rank[b.state]).map(c => {
      const tone = c.state === "checked" ? "ok" : c.state === "absent" ? "mute" : "warn";
      const reason = this.scanCoverageLabel(c);
      return `<div class="row" data-coverage-source="${this.esc(c.source)}"><span class="tile mute"><ha-icon icon="mdi:shield-search"></ha-icon></span><span class="row-text"><strong>${this.t(`covSrc_${c.source}`)}</strong>${reason ? `<small>${this.esc(reason)}</small>` : ""}</span><span class="pill ${tone}">${this.t(`covState_${c.state}`)}</span></div>`;
    }).join("");
    const at = this.data?.meta?.scanned_at ? this.formatDate(this.data.meta.scanned_at) : "–";
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("covListTitle")}</h2><p>${this.t("covListHint", { date: at })}</p></div></div>${rows}</section>`;
  }

  // "not checked" with the source that was not read, where the owner type tells which one.
  endedSourceLabel(f) {
    const source = SCAN_SOURCE_OF_TYPE[f.rule_id.split(".")[0]];
    return source ? this.t("endedUncheckedSrc", { source: this.t(`covSrc_${source}`) }) : this.t("endedUnchecked");
  }
}
