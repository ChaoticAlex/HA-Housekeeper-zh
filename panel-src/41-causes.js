// CausesMixin: one note for the common cause behind many "not available" findings (see causes.py).
class CausesMixin {
  causeList() { return this.data?.causes || []; }

  // Follow-up findings of a cause stay out of the list until asked for; the export keeps them.
  collapseFollowers(list) { return this.showFollowers ? list : list.filter(f => !f.cause_id); }

  // "In the HA log: 3 errors, last 2 hours ago" (see log_facts.py: numbers and times, never a text).
  logLine(log) {
    if (!log) return "";
    return this.t("logLine", { what: this.t(`logLevel_${log.level}`, { n: this.formatNumber(log.count) }), when: this.relTime(log.last) });
  }

  causeLine(c) {
    const used = ["automation", "script", "dashboard"].filter(k => c.consumers?.[k]).map(k => this.t(`causeUses_${k}`, { n: c.consumers[k] }));
    const why = c.kind === "integration_down" ? [c.state ? this.t("causeState", { state: c.state }) : "", c.error || "", this.logLine(c.log)].filter(Boolean) : [];
    return [...why, ...used, c.impact && c.impact !== "none" ? this.t(`impact_${c.impact}`) : ""].filter(Boolean).join(" · ");
  }

  // One headline per cause with the counts of what it touches; the follow-up findings sit in a fold.
  causeCounts(c) {
    if (c.kind === "service_missing") return this.t("causeCallers", { n: this.formatNumber(c.follower_count) });
    if (!c.follower_count && !Object.keys(c.consumers || {}).length) return this.t("causeNone");
    const parts = [this.t("causeN_entity", { n: this.formatNumber(c.follower_count) }), ...["automation", "script", "dashboard"].filter(k => c.consumers?.[k]).map(k => this.t(`causeN_${k}`, { n: c.consumers[k] }))];
    return this.t("causeCounts", { parts: parts.join(", ") });
  }

  // "3 integrations, 1 device" for the to-do row.
  outagesHint(causes) {
    const n = kind => causes.filter(c => c.kind === kind).length;
    return [n("integration_down") ? this.t("outageIntegrations", { n: n("integration_down") }) : "", n("device_down") ? this.t("outageDevices", { n: n("device_down") }) : "", n("service_missing") ? this.t("outageServices", { n: n("service_missing") }) : ""].filter(Boolean).join(", ");
  }

  causesCard() {
    const causes = this.causeList();
    if (!causes.length) return "";
    const followers = id => (this.data.findings || []).filter(f => f.cause_id === id && !f.ignored && f.rule_id !== "config_entry.not_loaded");
    const rows = causes.map(c => {
      const head = { tone: "red", title: this.esc(this.t(`cause_${c.kind}`, { name: c.name })), sub: [this.causeCounts(c), this.causeLine(c)].filter(Boolean).join(" · "), pill: this.t("causeFollowers", { n: this.formatNumber(c.follower_count) }) };
      const decide = this.causeDecide(c);
      if (!c.follower_count) return `<button class="row rel" data-object="${this.esc(`${c.object_type}:${c.object_id}`)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${head.title}</strong><small>${this.esc(head.sub)}</small></span></button>${decide}`;
      const own = c.kind === "service_missing" ? "" : `<button class="row" data-object="${this.esc(`${c.object_type}:${c.object_id}`)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${this.esc(c.name)}</strong></span></button>`;
      const pg = this.paginate(`cause_${c.id}`, followers(c.id).map(f => this.findingRow(f)));
      const body = `${own}${pg.rows.join("")}${pg.footer}`;
      return this.fold(`cause_${c.id}`, head, body + decide, false);
    }).join("");
    const sub = this.t("causesSub", { n: this.formatNumber(causes.length), m: this.formatNumber(this.data.findings.filter(f => !f.cause_id && !f.ignored).length) });
    // From four causes on the heading folds, so the list of findings below does not sink; up to five stay open.
    if (causes.length > 3) return `<div class="panel">${this.fold("causes_all", { tone: "red", title: this.t("causesTitle"), sub, pill: this.formatNumber(causes.length) }, rows, causes.length <= 5)}</div>`;
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("causesTitle")}</h2><p>${sub}</p></div></div>${rows}</div>`;
  }

  // What can be decided about an outage that is a finding of its own: known, snoozed, hidden.
  causeDecide(c) {
    const f = c.finding_key && this.data.findings.find(x => x.key === c.finding_key);
    if (!f) return "";
    if (this.decide && this.decide.key === f.key) return `<div class="pad">${this.decideForm(f)}</div>`;
    const btn = (preset, icon, label) => `<button class="btn" data-decide-open="${this.esc(f.key)}"${preset ? ` data-decide-preset="${preset}"` : ""}><ha-icon icon="${icon}"></ha-icon>${this.t(label)}</button>`;
    return `<div class="pad"><div class="fbtns">${btn("keep", "mdi:bookmark-check-outline", "markKnown")}${btn("snooze", "mdi:clock-outline", "fselSnooze")}${btn("", "mdi:eye-off-outline", "hideFinding")}</div></div>`;
  }

  // The number the findings are counted by: every outage once and every finding without an outage behind it; the follow-up findings of an outage are not counted again.
  findingTotal() { return this.causeList().length + this.data.findings.filter(f => !f.cause_id && !f.ignored).length; }

  followerCount() { return this.data.findings.filter(f => f.cause_id && !f.ignored && f.rule_id !== "config_entry.not_loaded").length; }
}
Object.assign(TEXT.de, {
  causesTitle: "Ausfälle", causesSub: "{n} Ausfälle (Ursachen) · {m} einzelne Befunde. Behebe zuerst die Ausfälle, sie erklären oft viele Befunde.",
  causeNone: "keine Entität betroffen", outageIntegrations: "{n} Integrationen", outageDevices: "{n} Geräte", singleFindings: "Einzelne Befunde",
  logTitle: "Im HA-Log", logLine: "Im HA-Log: {what}, zuletzt {when}", logLevel_warning: "{n}× Warnung", logLevel_error: "{n}× Fehler", logLevel_critical: "{n}× kritischer Fehler",
  cause_integration_down: "Integration {name} ist nicht geladen", cause_device_down: "Gerät {name} ist ganz ausgefallen",
  causeFollowers: "{n} Folgebefunde", cause_service_missing: "Dienst {name} existiert nicht", causeCallers: "{n} Automationen und Skripte rufen ihn auf", outageServices: "{n} fehlende Dienste", causeState: "Zustand: {state}", causeUses_automation: "{n} Automationen betroffen", causeUses_script: "{n} Skripte betroffen", causeUses_dashboard: "{n} Dashboards betroffen",
  causeShow: "Folgebefunde anzeigen", findingsFollowSub: "dazu {n} Folgebefunde der Ausfälle", causeHide: "Folgebefunde ausblenden", actOutages: "Ausfälle",
});
Object.assign(TEXT.en, {
  causesTitle: "Outages", causesSub: "{n} outages (causes) · {m} single findings. Fix the outages first, they often explain many findings.",
  causeNone: "no entity affected", outageIntegrations: "{n} integrations", outageDevices: "{n} devices", singleFindings: "Single findings",
  logTitle: "In the HA log", logLine: "In the HA log: {what}, last {when}", logLevel_warning: "{n}× warning", logLevel_error: "{n}× error", logLevel_critical: "{n}× critical error",
  cause_integration_down: "Integration {name} is not loaded", cause_device_down: "Device {name} is down completely",
  causeFollowers: "{n} follow-up findings", cause_service_missing: "Service {name} does not exist", causeCallers: "{n} automations and scripts call it", outageServices: "{n} missing services", causeState: "State: {state}", causeUses_automation: "{n} automations affected", causeUses_script: "{n} scripts affected", causeUses_dashboard: "{n} dashboards affected",
  causeShow: "Show follow-up findings", findingsFollowSub: "plus {n} follow-up findings of the outages", causeHide: "Hide follow-up findings", actOutages: "Outages",
});
