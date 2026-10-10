// MaintenanceMixin: recorder costs and the update preflight; mixed into the panel in 99-register.js.
class MaintenanceMixin {
  async loadCosts(refresh = false) {
    this.costsLoading = true; this.costsError = ""; this.render();
    try { this.costs = await this._hass.callWS({ type: "ha_housekeeper/recorder_costs", ...(refresh ? { refresh: true } : {}) }); } catch (err) { this.costs = null; this.costsError = err?.message || String(err); }
    this.costsLoading = false; this.render();
    this.followUp("costs", "recorder", this.costs, r => this.loadCosts(r), refresh);
  }

  // Opening the costs tab starts the analysis once; the backend answers with the last result at once.
  ensureCosts() {
    if (this.costsLoading || this._costsRequested) return;
    this._costsRequested = true;
    setTimeout(() => this.loadCosts(), 0);
  }

  // `action` is "save" (remember the state as the starting point), "clear" (forget it) or nothing (just check).
  async loadPreflight(action) {
    this.preflightLoading = true; this.preflightError = ""; this.render();
    try {
      this.preflight = await this._hass.callWS(action ? { type: "ha_housekeeper/preflight_save", clear: action === "clear" } : { type: "ha_housekeeper/preflight" });
      if (action === "save" && this.data) this.load(false);
    } catch (err) { this.preflightError = err?.message || String(err); }
    this.preflightLoading = false; this.render();
  }

  formatBytes(bytes) {
    if (bytes === null || bytes === undefined) return this.t("recorderSizeUnknown");
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes, i = 0;
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; }
    return `${this.formatNumber(Math.round(value * 10) / 10)} ${units[i]}`;
  }

  // The list as the person sorted it: by the current rate (default) or by the total in the database.
  costRanking() {
    const rows = [...(this.costs?.entities || [])];
    const recent = this.costSort !== "total";
    rows.sort((a, b) => (recent ? (b.states_24h ?? 0) - (a.states_24h ?? 0) || (b.states_7d ?? 0) - (a.states_7d ?? 0) : 0) || b.states - a.states || a.entity_id.localeCompare(b.entity_id));
    return rows;
  }

  suggestedExclusions() { return (this.costs?.entities || []).filter(e => e.suggest_exclude && !e.excluded).map(e => e.entity_id); }

  recorderCard() {
    this.ensureCosts();
    const c = this.costs;
    const head = (extra = "") => `<div class="panelhead"><div><h2>${this.t("recorderTitle")}</h2><p>${this.t("recorderHint")}</p></div><div class="actions">${extra}</div></div>`;
    if (this.costsLoading) return `<div class="panel">${head()}${this.skeleton("recorderLoading")}</div>`;
    if (this.costsError) return `<div class="panel">${head(`<button class="btn" data-costs-load>${this.t("recorderReload")}</button>`)}<div class="error">${this.esc(this.costsError)}</div></div>`;
    if (!c) return `<div class="panel">${head(`<button class="btn primary" data-costs-load>${this.t("recorderLoad")}</button>`)}</div>`;
    if (c.busy) return `<div class="panel">${head(`<button class="btn" data-costs-load>${this.t("recorderReload")}</button>`)}<p class="factnote">${this.t("relBusy")}</p></div>`;
    if (!c.available) return `<div class="panel">${head()}<div class="emptymsg"><ha-icon icon="mdi:database-off-outline"></ha-icon>${this.t("recorderUnavailable")}</div></div>`;
    const took = c.computed_at && (c.stale || c.age_seconds >= 60) ? this.tookNote(c) : c.took_ms === null || c.took_ms === undefined ? "" : ` · ${this.t(c.cached ? "recorderCached" : "recorderTook", { ms: this.formatNumber(c.took_ms) })}`;
    const summary = this.t("recorderSummary", { states: this.formatNumber(c.total_states), size: this.formatBytes(c.size_bytes), days: c.keep_days ?? "—", stats: this.formatNumber(c.statistics_total) }) + took;
    const sortButtons = ["recent", "total"].map(key => `<button class="btn ${this.costSort === key ? "primary" : ""}" data-cost-sort="${key}" aria-pressed="${this.costSort === key}">${this.t(key === "recent" ? "recorderSortRecent" : "recorderSortTotal")}</button>`).join("");
    const ranking = this.costRanking(), topShare = Math.max(...ranking.map(e => e.share), 0.1); // the bars are scaled to the largest entry
    const costRows = ranking.map(e => {
      const obj = this.findObject(`entity:${e.entity_id}`);
      const suggested = e.suggest_exclude && !e.excluded;
      const tags = [
        suggested ? `<span class="pill warn">${this.t("recorderSuggest")}</span>` : "",
        `<span class="pill ${e.used ? "ok" : "mute"}">${e.used ? this.t("recorderUsed", { count: e.used }) : this.t("recorderUnused")}</span>`,
        e.excluded ? `<span class="pill ok">${this.t("recorderExcluded")}</span>` : "",
      ].join("");
      const why = suggested ? `<small class="exwhy">${this.esc(this.t("exWhy", { perDay: this.formatNumber(Math.round(e.per_day_avg ?? e.per_day ?? 0)) }))}</small>` : "";
      const inner = `<span class="tile ${suggested ? "warn" : "mute"}"><ha-icon icon="mdi:database-clock-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(e.name)}</strong>${this.rowId(e.entity_id, `${this.formatNumber(e.states)} · ${this.t("recorderWindows", { day: this.formatNumber(e.states_24h ?? 0), week: this.formatNumber(e.states_7d ?? 0), avg: this.formatNumber(e.per_day_avg ?? e.per_day) })} · ${this.t("recorderShare", { share: e.share })}`)}${why}<span class="bar" style="margin-top:4px"><i style="width:${Math.min(100, Math.round((e.share / topShare) * 100))}%"></i></span></span><span class="extags">${tags}</span>`;
      const open = obj ? `<button class="row rel" data-object="${this.esc(`entity:${e.entity_id}`)}">${inner}</button>` : `<div class="row rel">${inner}</div>`;
      return `<div class="rowwrap${e.excluded ? " exdone" : ""}${suggested ? " exsug" : ""}">${this.excludeBox(e.entity_id)}${open}</div>`;
    });
    const costPage = this.paginate("costs", costRows), rows = costPage.rows.join("") + costPage.footer;
    const statRows = (c.statistics || []).slice(0, 10).map(s => `<div class="row rel"><span class="tile mute"><ha-icon icon="mdi:chart-line"></ha-icon></span><span class="row-text"><strong>${this.esc(s.statistic_id)}</strong><small>${this.formatNumber(s.rows)}</small></span></div>`).join("");
    const snippet = this.excludeCard(this.suggestedExclusions());
    return `<div class="panel">${head(`${sortButtons}<button class="btn" data-costs-load data-refresh>${this.t("recorderReload")}</button>`)}<p class="factnote">${this.esc(summary)}</p>${snippet}${rows}${statRows ? `<div class="panelhead" style="border-top:1px solid var(--hk-border)"><div><h3>${this.t("recorderStats")}</h3></div></div>${statRows}` : ""}</div>`;
  }

  // One line per check; `level` decides the colour.
  preflightRows(state, checks) {
    const detail = {
      backup: () => {
        const b = state.backup || {};
        if (!b.available) return this.t("pf_backup_unavailable");
        if (!b.configured || b.newest === null) return this.t("pf_backup_none");
        return this.t(b.age_hours > 48 ? "pf_backup_old" : "pf_backup_ok", { hours: Math.round(b.age_hours) });
      },
    };
    return checks.map(c => {
      const items = { repairs: state.repairs, failed_entries: state.failed_entries, broken: state.broken }[c.check];
      const names = (items || []).slice(0, 5).map(i => i.title || i.name || i.issue_id || i.object_id).filter(Boolean).map(n => this.esc(n)).join(", ");
      const text = c.check === "backup" ? detail.backup() : c.count ? `${c.count}${names ? ` · ${names}` : ""}` : this.t("pf_count_none");
      const tone = { ok: "ok", warn: "warn", red: "red" }[c.level] || "mute";
      const icon = c.level === "ok" ? "mdi:check" : c.level === "red" ? "mdi:close-octagon-outline" : "mdi:alert-outline";
      return `<div class="row rel"><span class="tile ${tone}"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${this.t(`pf_${c.check}`)}</strong><small>${text}</small></span></div>`;
    }).join("");
  }

  preflightAfter(after) {
    const parts = [
      ["pfNewRepairs", after.new_repairs, r => `${r.domain} · ${r.issue_id}`],
      ["pfNewFailed", after.new_failed_entries, e => `${e.title} (${e.domain})`],
      ["pfNewBroken", after.new_broken, b => b.name],
    ].filter(([, items]) => items.length);
    const inv = after.inventory || {};
    const counts = [["newObjects", inv.new_objects], ["removedObjects", inv.removed_objects], ["statusChanges", inv.status_changes], ["newFindings", inv.new_findings], ["resolvedFindings", inv.resolved_findings]].filter(([, part]) => part?.total);
    const lists = parts.map(([label, items, text]) => `<div class="row rel"><span class="tile warn"><ha-icon icon="mdi:alert-outline"></ha-icon></span><span class="row-text"><strong>${this.t(label)} (${items.length})</strong><small>${items.slice(0, 8).map(i => this.esc(text(i))).join(" · ")}</small></span></div>`).join("");
    const summary = counts.map(([label, part]) => `<div class="row rel"><span class="tile mute"><ha-icon icon="mdi:compare-horizontal"></ha-icon></span><span class="row-text"><strong>${this.t(label)}</strong></span><span class="pill mute">${this.formatNumber(part.total)}</span></div>`).join("");
    const body = lists + summary || `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("preflightAfterNone")}</div>`;
    return `<div class="panelhead" style="border-top:1px solid var(--hk-border)"><div><h3>${this.t("preflightAfterTitle", { from: this.esc(after.from_version), to: this.esc(after.to_version) })}</h3></div></div>${body}`;
  }

  preflightCard() {
    const p = this.preflight;
    const buttons = `<button class="btn" data-pf-refresh ${this.preflightLoading ? "disabled" : ""}>${this.t("preflightRefresh")}</button><button class="btn primary" data-pf-save ${this.preflightLoading ? "disabled" : ""}>${this.t("preflightSave")}</button>`;
    const head = `<div class="panelhead"><div><h2>${this.t("preflightTitle")}</h2><p>${this.t("preflightHint")}</p></div><div class="actions">${buttons}</div></div>`;
    if (this.preflightError) return `<div class="panel">${head}<div class="error">${this.esc(this.preflightError)}</div></div>`;
    if (!p) return `<div class="panel">${head}${this.skeleton("preflightLoading")}</div>`;
    const updates = p.state.pending_updates || [];
    const updateRow = `<div class="row rel"><span class="tile ${updates.length ? "warn" : "ok"}"><ha-icon icon="mdi:package-up"></ha-icon></span><span class="row-text"><strong>${this.t("pf_updates")}</strong><small>${updates.length ? updates.slice(0, 6).map(u => `${this.esc(u.name)} ${this.esc(u.installed ?? "")} → ${this.esc(u.latest ?? "")}`).join(" · ") : this.t("pf_updates_none")}</small></span></div>`;
    const record = p.record
      ? `<p class="factnote">${this.t("preflightRecord", { date: this.formatDate(p.record.at), version: this.esc(p.record.ha_version), repairs: p.record.repairs, failed: p.record.failed_entries, broken: p.record.broken, objects: this.formatNumber(p.record.objects) })} <button class="btn" data-pf-clear>${this.t("preflightClear")}</button></p>`
      : `<p class="factnote">${this.t("pfNoRecord")}</p>`;
    return `<div class="panel">${head}${this.preflightRows(p.state, p.checks)}${updateRow}${record}${p.after ? this.preflightAfter(p.after) : ""}</div>`;
  }

  maintenanceView() {
    if (!this.preflight && !this.preflightLoading && !this._pfRequested) { this._pfRequested = true; setTimeout(() => this.loadPreflight(), 0); }
    this.ensureBackup();
    const checks = this.backup?.available ? this.backup.checks || [] : [];
    const problems = checks.filter(c => c.level === "problem").length, notes = checks.filter(c => c.level === "note").length;
    const pf = this.preflight, pfChecks = pf?.checks || [];
    const pfRed = pfChecks.filter(c => c.level === "red").length, pfWarn = pfChecks.filter(c => c.level === "warn").length;
    const updates = pf?.state?.pending_updates?.length || 0;
    const backupTone = !this.backup?.available ? "mute" : problems ? "red" : notes ? "warn" : "ok";
    const pfTone = !pf ? "mute" : pfRed ? "red" : pfWarn ? "warn" : "ok";
    const goalsMissed = (this.goals?.goals || []).filter(g => g.state === "missed").length;
    this.ensureGoals();
    const bp = this.blueprints, bpBad = bp ? (bp.missing || 0) + (bp.broken || 0) : 0;
    const tabs = [
      { id: "backup", icon: "mdi:backup-restore", label: this.t("backupTitle"), hint: "maintHintBackup", pill: !this.backup?.available ? "" : problems ? this.t("mtProblems", { n: problems }) : notes ? this.t("mtNotes", { n: notes }) : this.t("bhLevel_ok"), tone: backupTone },
      { id: "backups", icon: "mdi:delete-sweep-outline", label: this.t("bkcTab"), hint: "maintHintBkc", pill: this.bkc?.available && this.bkc.rows?.length ? this.formatNumber(this.bkc.rows.length) : "", tone: "mute" },
      { id: "preflight", icon: "mdi:rocket-launch-outline", label: this.t("preflightTitle"), hint: "maintHintPreflight", pill: !pf ? "" : pfRed || pfWarn ? this.t("mtOpen", { n: pfRed + pfWarn }) : this.t("bhLevel_ok"), tone: pfTone },
      { id: "blueprints", icon: "mdi:file-code-outline", label: this.t("bpTab"), hint: "maintHintBlueprints", pill: bpBad ? this.t("mtOpen", { n: bpBad }) : "", tone: "warn" },
      { id: "devices", icon: "mdi:devices", label: this.t("lifeRemovedTab"), hint: "maintHintDevices", pill: this.removed?.length ? this.formatNumber(this.removed.length) : "", tone: "mute" },
      { id: "window", icon: "mdi:calendar-clock-outline", label: this.t("winTab"), hint: "maintHintWindow", pill: "", tone: "mute" },
      { id: "goals", icon: "mdi:target", label: this.t("goalsTitle"), hint: "maintHintGoals", pill: goalsMissed ? this.t("tilesMissed", { count: goalsMissed }) : "", tone: "red" },
    ];
    this.ensureBackupCleanup();
    const open = this.viewTabOf("maintenance", tabs, "backup");
    const grid = this.navTiles("maintenance", tabs.map(tab => ({ ...tab, hint: this.t(tab.hint), tone: tab.pill ? tab.tone : "ok" })), open, this.t("maintenance"));
    return `<div class="stack">${grid}${open === "goals" ? this.goalsCard() : open === "preflight" ? this.preflightCard() : open === "devices" ? this.removedCard() : open === "blueprints" ? this.blueprintsCard() : open === "window" ? this.windowCard() : open === "backups" ? this.backupCleanupCard() : this.backupCard()}</div>`;
  }
}
