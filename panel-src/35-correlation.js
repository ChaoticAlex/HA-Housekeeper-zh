// CorrelationMixin: findings that began at about the time of an update or restart; mixed in by 99-register.js.
// Always worded "at about the same time as", never as a cause.
class CorrelationMixin {
  async loadCorrelations() {
    try { this.corr = await this._hass.callWS({ type: "ha_housekeeper/correlations" }); }
    catch (_) { this.corr = { groups: [], by_key: {} }; }
    this.render();
  }

  // Loads once, and again after every new scan.
  ensureCorrelations() {
    const key = this.data?.meta?.scanned_at || "";
    if (!this.data || (this._corrKey === key && this._corrRequested)) return;
    this._corrRequested = true; this._corrKey = key;
    setTimeout(() => this.loadCorrelations(), 0);
  }

  corrText(group) {
    const vars = { title: this.esc(group.title || ""), domain: this.esc(group.domain || ""), from: this.esc(group.from ?? ""), to: this.esc(group.to ?? "") };
    return this.t(`corr_${group.kind}`, vars);
  }

  // The sentence on one finding, or "" when it began with nothing the log knows.
  corrLine(key) {
    const id = this.corr?.by_key?.[key];
    const group = id && this.corr.groups.find(g => g.id === id);
    return group ? this.t("corrAfter", { what: this.corrText(group), when: this.formatDate(group.at) }) : "";
  }

  corrFindingCount() { return Object.keys(this.corr?.by_key || {}).length; }

  // What the findings of one group have in common: how many, which classes, and over what time they began.
  corrSummary(group, findings) {
    const reasons = {};
    findings.forEach(f => { const r = this.findingReason(f); reasons[r] = (reasons[r] || 0) + 1; });
    const parts = Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `<span class="pill mute">${this.esc(this.t("corrReason", { n: this.formatNumber(n), what: this.reasonLabel(r) }))}</span>`).join(" ");
    const times = findings.map(f => Date.parse(f.first_detected_at)).filter(Number.isFinite).sort((a, b) => a - b);
    const span = times.length ? this.t("corrSpan", { first: this.formatDate(new Date(times[0]).toISOString()), last: this.formatDate(new Date(times[times.length - 1]).toISOString()) }) : "";
    const more = group.total > findings.length ? ` ${this.t("corrMore", { n: this.formatNumber(group.total - findings.length) })}` : "";
    return `<p class="sub u-mb14">${this.esc(span)}${more}</p><div class="chips u-mb14">${parts}</div>`;
  }

  corrGroupBody(group) {
    const findings = group.keys.map(k => this.data.findings.find(x => x.key === k)).filter(Boolean);
    const pg = this.paginate(`corr_${group.id}`, findings);
    return `${this.corrSummary(group, findings)}${pg.rows.map(f => this.findingRow(f)).join("")}${pg.footer}`;
  }

  // Closed by default; one fold per group inside. Sits on the findings page next to the tile that filters by it.
  corrGroupsCard() {
    const groups = this.corr?.groups || [];
    if (!groups.length) return "";
    const pg = this.paginate("corr", groups);
    const rows = pg.rows.map(g => {
      const icon = g.kind === "start" ? "mdi:restart" : g.kind === "plan" ? "mdi:broom" : g.kind === "purge" ? "mdi:database-remove" : g.kind === "note" ? "mdi:pin-outline" : "mdi:package-up";
      const head = { tone: g.only_group ? "mute" : "warn", title: this.corrText(g), sub: this.formatDate(g.at), pill: this.t("corrCount", { n: this.formatNumber(g.total) }) };
      const open = this.foldOpen(`corr_${g.id}`, false);
      return this.fold(`corr_${g.id}`, head, open ? this.corrGroupBody(g) : "", false).replace(/<ha-icon icon="mdi:chevron-(?:down|right)"><\/ha-icon>/, `<ha-icon icon="${open ? "mdi:chevron-down" : icon}"></ha-icon>`);
    }).join("");
    return `<div class="panel">${this.fold("corr", { tone: "warn", title: this.t("corrTitle"), sub: this.t("corrHint"), pill: this.formatNumber(groups.length) }, rows + pg.footer, false)}</div>`;
  }
}
