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
    if (c.virtual) return this.t("causeUsers", { n: this.formatNumber(c.follower_count) });
    if (c.kind === "app_down") return this.t("causeBelow", { n: this.formatNumber(c.child_ids.length) });
    if (!c.follower_count && !Object.keys(c.consumers || {}).length) return this.t("causeNone");
    const parts = [this.t("causeN_entity", { n: this.formatNumber(c.follower_count) }), ...["automation", "script", "dashboard"].filter(k => c.consumers?.[k]).map(k => this.t(`causeN_${k}`, { n: c.consumers[k] }))];
    return this.t("causeCounts", { parts: parts.join(", ") });
  }

  // "3 integrations, 1 device" for the to-do row.
  outagesHint(causes) {
    const n = kind => causes.filter(c => c.kind === kind).length;
    return [n("integration_down") ? this.t("outageIntegrations", { n: n("integration_down") }) : "", n("device_down") ? this.t("outageDevices", { n: n("device_down") }) : "", n("service_missing") ? this.t("outageServices", { n: n("service_missing") }) : "", n("app_down") ? this.t("outageApps", { n: n("app_down") }) : "", causes.filter(c => c.virtual && c.kind !== "service_missing").length ? this.t("outageTargets", { n: causes.filter(c => c.virtual && c.kind !== "service_missing").length }) : ""].filter(Boolean).join(", ");
  }

  // The causes at the top of a chain: the entries of the findings list. The ones below hang in their body.
  causeEntries() { return this.causeList().filter(c => !c.parent_id); }

  causeTotal(c) { return c.total_followers ?? c.follower_count ?? 0; }

  // One entry of the list for a cause: a row with a red counter ("12 follow-ups"); it opens into the chain below it
  // (causes and then the findings they explain), each with its own counter. A cause without any follow-up is a plain row.
  // The box that picks the outage's own finding, so it can be hidden, marked as known or snoozed with others at once.
  causeBox(c) {
    return c.finding_key ? `<input type="checkbox" class="selbox" data-fsel="${this.esc(c.finding_key)}" ${this.findSel.has(c.finding_key) ? "checked" : ""} aria-label="${this.esc(c.name)}">` : "";
  }

  causeEntry(c) {
    const total = this.causeTotal(c), link = `${c.object_type}:${c.object_id}`;
    const title = this.esc(this.t(`cause_${c.kind}`, { name: c.name })), decide = this.causeDecide(c);
    const sub = [total ? this.t("causeExplains", { n: this.formatNumber(total) }) : "", this.causeCounts(c), this.causeLine(c)].filter(Boolean).join(" · ");
    if (!total) return `<div class="rowwrap">${this.causeBox(c)}<button class="row rel" data-object="${this.esc(link)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${title}</strong><small>${this.esc(sub)}</small></span></button></div>${decide}`;
    const byId = id => this.causeList().find(x => x.id === id);
    const own = c.virtual ? "" : `<div class="rowwrap">${this.causeBox(c)}<button class="row" data-object="${this.esc(link)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${this.esc(c.name)}</strong></span></button></div>`;
    const below = (c.child_ids || []).map(byId).filter(Boolean).map(x => this.causeEntry(x)).join("");
    const followers = (this.data.findings || []).filter(f => f.cause_id === c.id && !f.ignored && !CAUSE_OWN_RULES.includes(f.rule_id));
    const pg = this.paginate(`cause_${c.id}`, followers.map(f => this.findingRow(f)));
    return this.fold(`cause_${c.id}`, { tone: "red", title, sub, pill: this.t("causeFollowers", { n: this.formatNumber(total) }) }, `${own}${below}${pg.rows.join("")}${pg.footer}${decide}`, false);
  }

  // The entries at the top of the findings list, as the overview shows them: by impact, a chain once at its top.
  findingEntries() {
    const score = e => e.cause ? (IMPACT_RANK[e.cause.impact] ?? 0) + 0.5 + Math.min(this.causeTotal(e.cause), 999) / 2000 : this.impactScore(e.finding);
    return [...this.causeEntries().map(cause => ({ cause })), ...this.sortedFindings().filter(f => !f.cause_id).map(finding => ({ finding }))].sort((a, b) => score(b) - score(a));
  }

  // A cause as a compact row of the overview: the counter says how many findings it explains.
  overviewCause(c) {
    const total = this.causeTotal(c), sub = [this.causeCounts(c), this.causeLine(c)].filter(Boolean).join(" · ");
    const target = c.virtual ? 'data-jump="findingsNav"' : `data-object="${this.esc(`${c.object_type}:${c.object_id}`)}"`;
    return `<button class="row rel" ${target}>${this.tile(c.object_type, "red")}<span class="row-text"><strong>${this.esc(this.t(`cause_${c.kind}`, { name: c.name }))}</strong><small>${this.esc(sub)}</small></span>${total ? `<span class="pill red">${this.esc(this.t("causeFollowers", { n: this.formatNumber(total) }))}</span>` : ""}</button>`;
  }

  // Only in the flat view: "Follow-up of Integration Cloud" next to a finding that a cause explains.
  followOf(f) {
    const c = f.cause_id && !CAUSE_OWN_RULES.includes(f.rule_id) ? this.causeList().find(x => x.id === f.cause_id) : null;
    return this.showFollowers && c ? ` · ${this.esc(this.t("causeFollowOf", { name: c.name }))}` : "";
  }

  // What can be decided about an outage that is a finding of its own: known, snoozed, hidden.
  causeDecide(c) {
    const f = c.finding_key && this.data.findings.find(x => x.key === c.finding_key);
    if (!f) return "";
    if (this.decide && this.decide.key === f.key) return `<div class="pad">${this.decideForm(f)}</div>`;
    const btn = (preset, icon, label) => `<button class="btn" data-decide-open="${this.esc(f.key)}"${preset ? ` data-decide-preset="${preset}"` : ""}><ha-icon icon="${icon}"></ha-icon>${this.t(label)}</button>`;
    return `<div class="pad"><div class="fbtns">${btn("keep", "mdi:bookmark-check-outline", "markKnown")}${btn("snooze", "mdi:clock-outline", "fselSnooze")}${btn("", "mdi:eye-off-outline", "hideFinding")}</div></div>`;
  }

  // The number the findings are counted by: every chain of outages once, at its top, and every finding without an outage behind it; the follow-up findings of an outage are not counted again.
  findingTotal() { return this.causeEntries().length + this.data.findings.filter(f => !f.cause_id && !f.ignored).length; }

  followerCount() { return this.data.findings.filter(f => f.cause_id && !f.ignored && !CAUSE_OWN_RULES.includes(f.rule_id)).length; }
}
Object.assign(TEXT.de, {
  causesTitle: "Ausfälle",
  causeNone: "keine Entität betroffen", outageIntegrations: "{n} Integrationen", outageDevices: "{n} Geräte",
  logTitle: "Im HA-Log", logLine: "Im HA-Log: {what}, zuletzt {when}", logLevel_warning: "{n}× Warnung", logLevel_error: "{n}× Fehler", logLevel_critical: "{n}× kritischer Fehler",
  cause_integration_down: "Integration {name} ist nicht geladen", cause_device_down: "Gerät {name} ist ganz ausgefallen",
  causeFollowers: "{n} Folgen", causeExplains: "erklärt {n} weitere Befunde", causeFollowOf: "Folge von {name}", withFollowers: "Mit Folgen", flatList: "Flache Liste", cause_app_down: "App {name} ist gestoppt", cause_entity_missing: "Entität {name} existiert nicht", cause_device_missing: "Gerät {name} existiert nicht", cause_area_missing: "Bereich {name} existiert nicht", causeUsers: "{n} Automationen, Skripte oder Dashboards verweisen darauf", causeBelow: "{n} Integrationen hängen vermutlich daran", outageApps: "{n} Apps", outageTargets: "{n} fehlende Ziele", cause_service_missing: "Dienst {name} existiert nicht", causeCallers: "{n} Automationen und Skripte rufen ihn auf", outageServices: "{n} fehlende Dienste", causeState: "Zustand: {state}", causeUses_automation: "{n} Automationen betroffen", causeUses_script: "{n} Skripte betroffen", causeUses_dashboard: "{n} Dashboards betroffen",
  findingsFollowSub: "dazu {n} Folgen der Ausfälle", actOutages: "Ausfälle",
});
Object.assign(TEXT.en, {
  causesTitle: "Outages",
  causeNone: "no entity affected", outageIntegrations: "{n} integrations", outageDevices: "{n} devices",
  logTitle: "In the HA log", logLine: "In the HA log: {what}, last {when}", logLevel_warning: "{n}× warning", logLevel_error: "{n}× error", logLevel_critical: "{n}× critical error",
  cause_integration_down: "Integration {name} is not loaded", cause_device_down: "Device {name} is down completely",
  causeFollowers: "{n} follow-ups", causeExplains: "explains {n} more findings", causeFollowOf: "Follow-up of {name}", withFollowers: "With follow-ups", flatList: "Flat list", cause_app_down: "App {name} is stopped", cause_entity_missing: "Entity {name} does not exist", cause_device_missing: "Device {name} does not exist", cause_area_missing: "Area {name} does not exist", causeUsers: "{n} automations, scripts or dashboards point to it", causeBelow: "{n} integrations probably depend on it", outageApps: "{n} apps", outageTargets: "{n} missing targets", cause_service_missing: "Service {name} does not exist", causeCallers: "{n} automations and scripts call it", outageServices: "{n} missing services", causeState: "State: {state}", causeUses_automation: "{n} automations affected", causeUses_script: "{n} scripts affected", causeUses_dashboard: "{n} dashboards affected",
  findingsFollowSub: "plus {n} follow-ups of the outages", actOutages: "Outages",
});
