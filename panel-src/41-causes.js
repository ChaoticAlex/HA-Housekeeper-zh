// CausesMixin: one note for the common cause behind many "not available" findings (see causes.py).
class CausesMixin {
  causeList() { return this.data?.causes || []; }

  // Follow-up findings of a cause stay out of the list until asked for; the export keeps them.
  collapseFollowers(list) { return this.showFollowers ? list : list.filter(f => !f.cause_id); }

  causeLine(c) {
    const used = ["automation", "script", "dashboard"].filter(k => c.consumers?.[k]).map(k => this.t(`causeUses_${k}`, { n: c.consumers[k] }));
    const why = c.kind === "integration_down" ? [c.state ? this.t("causeState", { state: c.state }) : "", c.error || ""].filter(Boolean) : [];
    return [...why, ...used, c.impact && c.impact !== "none" ? this.t(`impact_${c.impact}`) : ""].filter(Boolean).join(" · ");
  }

  // One headline per cause with the counts of what it touches; the follow-up findings sit in a fold.
  causeCounts(c) {
    if (!c.follower_count && !Object.keys(c.consumers || {}).length) return this.t("causeNone");
    const parts = [this.t("causeN_entity", { n: this.formatNumber(c.follower_count) }), ...["automation", "script", "dashboard"].filter(k => c.consumers?.[k]).map(k => this.t(`causeN_${k}`, { n: c.consumers[k] }))];
    return this.t("causeCounts", { parts: parts.join(", ") });
  }

  // "3 integrations, 1 device" for the to-do row.
  outagesHint(causes) {
    const n = kind => causes.filter(c => c.kind === kind).length;
    return [n("integration_down") ? this.t("outageIntegrations", { n: n("integration_down") }) : "", n("device_down") ? this.t("outageDevices", { n: n("device_down") }) : ""].filter(Boolean).join(", ");
  }

  causesCard() {
    const causes = this.causeList();
    if (!causes.length) return "";
    const followers = id => (this.data.findings || []).filter(f => f.cause_id === id && !f.ignored);
    const rows = causes.map(c => {
      const head = { tone: "red", title: this.esc(this.t(`cause_${c.kind}`, { name: c.name })), sub: [this.causeCounts(c), this.causeLine(c)].filter(Boolean).join(" · "), pill: this.t("causeFollowers", { n: this.formatNumber(c.follower_count) }) };
      if (!c.follower_count) return `<button class="row rel" data-object="${this.esc(`${c.object_type}:${c.object_id}`)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${head.title}</strong><small>${this.esc(head.sub)}</small></span></button>`;
      const body = `<button class="row" data-object="${this.esc(`${c.object_type}:${c.object_id}`)}">${this.tile(c.object_type, "red")}<span class="row-text"><strong>${this.esc(c.name)}</strong></span></button>${followers(c.id).slice(0, 20).map(f => this.findingRow(f)).join("")}`;
      return this.fold(`cause_${c.id}`, head, body, false);
    }).join("");
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("causesTitle")}</h2><p>${this.t("causesSub", { n: this.formatNumber(causes.length), m: this.formatNumber(this.data.findings.filter(f => !f.cause_id && !f.ignored).length) })}</p></div></div>${rows}</div>`;
  }

  followerCount() { return this.data.findings.filter(f => f.cause_id && !f.ignored).length; }
}
Object.assign(TEXT.de, {
  causesTitle: "Ausfälle", causesSub: "{n} Ausfälle (Ursachen) · {m} einzelne Befunde. Behebe zuerst die Ausfälle, sie erklären oft viele Befunde.",
  causeNone: "keine Entität betroffen", outageIntegrations: "{n} Integrationen", outageDevices: "{n} Geräte", singleFindings: "Einzelne Befunde",
  cause_integration_down: "Integration {name} ist nicht geladen", cause_device_down: "Gerät {name} ist ganz ausgefallen",
  causeFollowers: "{n} Folgebefunde", causeState: "Zustand: {state}", causeUses_automation: "{n} Automationen betroffen", causeUses_script: "{n} Skripte betroffen", causeUses_dashboard: "{n} Dashboards betroffen",
  causeShow: "Folgebefunde anzeigen", causeHide: "Folgebefunde ausblenden", actOutages: "Ausfälle",
});
Object.assign(TEXT.en, {
  causesTitle: "Outages", causesSub: "{n} outages (causes) · {m} single findings. Fix the outages first, they often explain many findings.",
  causeNone: "no entity affected", outageIntegrations: "{n} integrations", outageDevices: "{n} devices", singleFindings: "Single findings",
  cause_integration_down: "Integration {name} is not loaded", cause_device_down: "Device {name} is down completely",
  causeFollowers: "{n} follow-up findings", causeState: "State: {state}", causeUses_automation: "{n} automations affected", causeUses_script: "{n} scripts affected", causeUses_dashboard: "{n} dashboards affected",
  causeShow: "Show follow-up findings", causeHide: "Hide follow-up findings", actOutages: "Outages",
});
