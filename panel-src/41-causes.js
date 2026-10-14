// CausesMixin: one note for the common cause behind many "not available" findings (see causes.py).
class CausesMixin {
  causeList() { return this.data?.causes || []; }

  // Follow-up findings of a cause stay out of the list until asked for; the export keeps them.
  // The finding of an outage itself stays when the list is not the grouped one (a status or a filter is set): there it is its own row.
  collapseFollowers(list, keepOwn = false) { return this.showFollowers ? list : list.filter(f => !f.cause_id || (keepOwn && CAUSE_OWN_RULES.includes(f.rule_id))); }

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

  // How long an integration has not been loaded and when that becomes more serious: "for 6 h · Medium in 18 h".
  outageLine(c) {
    const f = c.finding_key && this.data.findings.find(x => x.key === c.finding_key);
    const since = f && Date.parse(f.first_detected_at);
    if (!since) return "";
    const hours = Math.max(0, (Date.now() - since) / 3600000), high = Math.max(24, (this.data.meta?.min_unavailable_days || 0) * 24);
    const span = h => h < 1 ? `${Math.max(1, Math.round(h * 60))} ${this.t("unitMin")}` : h < 48 ? `${Math.round(h)} ${this.t("unitHour")}` : `${Math.round(h / 24)} ${this.t("unitDay")}`;
    const next = hours < 1 ? [1, "low"] : hours < 24 ? [24, "medium"] : hours < high ? [high, "high"] : null;
    return [this.t("outageFor", { span: span(hours) }), next ? this.t("outageNext", { level: this.t(`chip_${next[1]}`), span: span(next[0] - hours) }) : ""].filter(Boolean).join(" · ");
  }

  // The short line of a row: the counts and, for an integration, how long it has been down; reason and log are for the detail page.
  causeShort(c) { return c.kind === "integration_down" ? [this.causeCounts(c), this.outageLine(c)].filter(Boolean).join(" · ") : [this.causeCounts(c), this.causeLine(c)].filter(Boolean).join(" · "); }

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
  // The box that picks an outage, so it can be hidden, marked as known or snoozed with others at once.
  causeBox(c) {
    const key = c.finding_key;
    return key ? `<input type="checkbox" class="selbox" data-fsel="${this.esc(key)}" ${this.findSel.has(key) ? "checked" : ""} aria-label="${this.esc(c.name)}">` : "";
  }

  // The impact as a chip of its own at the right of a row: how much the entry matters, or how long an outage has lasted.
  impactChip(level) {
    if (!level || level === "none") return "";
    const tone = { high: "red", medium: "warn", low: "blue", info: "mute" }[level] || "mute";
    return `<span class="pill ${tone}">${this.esc(this.t(`chip_${level}`))}</span>`;
  }

  // The reason of an entry (outage, unused, broken reference): a neutral outlined chip, it only names; the colour belongs to the impact.
  kindChip(label) { return `<span class="pill kind">${this.esc(label)}</span>`; }

  // The menu at the end of a row: what can be decided about the finding, and where it applies the removal.
  // An open decision shows its form below the row.
  rowMenu(f) {
    if (!f || f.ignored) return "";
    const key = this.esc(f.key);
    const item = (icon, label, attr) => `<button type="button" class="menuitem" ${attr}><ha-icon icon="${icon}"></ha-icon>${this.t(label)}</button>`;
    const del = ["automation.never_triggered", "automation.stale", "automation.disabled_long"].includes(f.rule_id) ? item("mdi:delete-outline", "autoDelete", `data-auto-delete="${this.esc(f.object_id)}"`) : "";
    return `<details class="rowmenu"><summary aria-label="${this.esc(this.t("rowMenu"))}"><ha-icon icon="mdi:dots-vertical"></ha-icon></summary><div class="menupop">${item("mdi:bookmark-check-outline", "markKnown", `data-decide-open="${key}" data-decide-preset="keep"`)}${item("mdi:clock-outline", "fselSnooze", `data-decide-open="${key}" data-decide-preset="snooze"`)}${item("mdi:eye-off-outline", "hideFinding", `data-decide-open="${key}"`)}${del}</div></details>`;
  }

  rowDecide(f) { return f && this.decide && this.decide.key === f.key ? `<div class="pad">${this.decideForm(f)}</div>` : ""; }

  causeEntry(c) {
    const total = this.causeTotal(c), link = `${c.object_type}:${c.object_id}`;
    const title = this.esc(this.t(`cause_${c.kind}`, { name: c.name })), own1 = c.finding_key && this.data.findings.find(x => x.key === c.finding_key);
    const sub = [total ? this.t("causeExplains", { n: this.formatNumber(total) }) : "", this.causeShort(c)].filter(Boolean).join(" · ");
    if (!total) return `<div class="rowwrap">${this.causeBox(c)}<button class="row rel" data-object="${this.esc(link)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${title}</strong><small>${this.esc(sub)}</small></span>${this.kindChip(this.t("chip_outage"))}${this.impactChip(c.impact)}</button>${this.rowMenu(own1)}</div>${this.rowDecide(own1)}`;
    return this.fold(`cause_${c.id}`, { tone: "red", title, sub, pill: this.t("causeFollowers", { n: this.formatNumber(total) }) }, this.causeChildren(c), false);
  }

  causeChildren(c, includeOwn = true) {
    const link = `${c.object_type}:${c.object_id}`, own1 = c.finding_key && this.data.findings.find(x => x.key === c.finding_key);
    const byId = id => this.causeList().find(x => x.id === id);
    const own = !includeOwn || c.virtual ? "" : `<div class="rowwrap">${this.causeBox(c)}<button class="row" data-object="${this.esc(link)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${this.esc(c.name)}</strong></span>${this.kindChip(this.t("chip_outage"))}${this.impactChip(own1 ? own1.impact : "")}</button>${this.rowMenu(own1)}</div>${this.rowDecide(own1)}`;
    const below = (c.child_ids || []).map(byId).filter(Boolean).map(x => this.causeEntry(x)).join("");
    const followers = (this.data.findings || []).filter(f => f.cause_id === c.id && !f.ignored && !CAUSE_OWN_RULES.includes(f.rule_id));
    const pg = this.paginate(`cause_${c.id}`, followers.map(f => this.findingRow(f)));
    return `${own}${below}${pg.rows.join("")}${pg.footer}`;
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
