// DbHealthMixin: the database card in Maintenance; mixed into the panel in 99-register.js.
class DbHealthMixin {
  async loadDbHealth(refresh = false) {
    this.dbLoading = true; this.dbError = ""; this.render();
    try { this.dbHealth = await this._hass.callWS({ type: "ha_housekeeper/db_health", refresh }); }
    catch (err) { this.dbError = err?.message || String(err); }
    this.dbLoading = false; this.render();
    this.followUp("db", "recorder", this.dbHealth, r => this.loadDbHealth(r), refresh);
  }

  // Loads on the first visit of Maintenance only: the query reads the recorder, so the overview never starts it.
  ensureDbHealth() {
    if (this.dbLoading || this._dbRequested) return;
    this._dbRequested = true;
    setTimeout(() => this.loadDbHealth(), 0);
  }

  dbSeriesList(series) {
    return series.map(s => this.esc(s.name || s.statistic_id)).join(", ");
  }

  dbFindingText(f) {
    const n = v => this.formatNumber(v), size = v => this.formatBytes(v);
    if (f.kind === "wal_large") return this.t("dbWal", { wal: size(f.wal_bytes), db: size(f.db_bytes) });
    if (f.kind === "growth") return this.t("dbGrowth", { recent: size(f.recent_bytes), base: size(f.base_bytes) });
    if (f.kind === "duplicates") return this.t("dbDuplicates", { n: n(f.groups), more: f.capped ? "+" : "", list: this.dbSeriesList(f.series) });
    if (f.kind === "missing_hours") {
      const list = (rows) => rows.map(s => `${this.esc(s.name || s.statistic_id)} (${this.t("dbMissingHours", { n: n(s.own ?? s.missing) })})`).join(", ");
      if (!f.gap_hours) return this.t("dbMissing", { n: n(f.series_total), list: list(f.series) });
      const own = f.series.filter(s => s.own >= 6);
      const shared = this.t("dbMissingShared", { n: n(f.series_total), hours: n(f.gap_hours), count: n(f.gaps_total) });
      return `${shared} ${f.own_series ? this.t("dbMissingOwn", { n: n(f.own_series), list: list(own.slice(0, 5)) }) : this.t("dbMissingOnlyShared")}`;
    }
    if (f.kind === "statistics_issues") return this.t("dbIssues", { n: n(f.series_total), list: f.series.map(s => `${this.esc(s.name || s.statistic_id)} (${s.types.map(type => this.t(`dbIssue_${type}`) === `dbIssue_${type}` ? type : this.t(`dbIssue_${type}`)).join(", ")})`).join(", ") });
    return this.t("dbRecorderGap", { n: n(f.gaps), longest: this.relDuration(f.longest_seconds), latest: this.formatDate(new Date(f.latest[0].start * 1000).toISOString()) });
  }

  // What lies behind a finding: the periods all series lack, and the series with their own and their shared hours.
  dbFindingExtra(f) {
    if (f.kind !== "missing_hours" || !(f.gaps?.length || f.series?.length)) return "";
    const gapRows = (f.gaps || []).map(g => `<div class="row rel"><span class="tile ${g.cause === "restart" ? "mute" : "warn"}"><ha-icon icon="${g.cause === "restart" ? "mdi:restart" : "mdi:database-clock-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(this.formatDate(new Date(g.start * 1000).toISOString()))} – ${this.esc(this.formatDate(new Date(g.end * 1000).toISOString()))}</strong><small>${this.t("dbMissingHours", { n: this.formatNumber(g.hours) })} · ${this.t(`dbGapCause_${g.cause}`)}</small></span></div>`);
    const gapPage = this.paginate("dbgaps", gapRows), gaps = gapPage.rows.join("") + gapPage.footer;
    const seriesRows = f.series.map(s => { const obj = this.findObject(`entity:${s.statistic_id}`); const name = this.esc(s.name || s.statistic_id); return `<tr${obj ? ` data-object="${this.esc(`entity:${s.statistic_id}`)}" tabindex="0" role="button"` : ' class="static"'}><td>${this.nameCell(s.name || s.statistic_id, s.statistic_id, "span")}</td><td data-label="${this.esc(this.t("dbColOwn"))}">${this.formatNumber(s.own)}</td><td data-label="${this.esc(this.t("dbColShared"))}">${this.formatNumber(s.shared)}</td><td data-label="${this.esc(this.t("dbColMissing"))}">${this.formatNumber(s.missing)}</td></tr>`; });
    const seriesPage = this.paginate("dbseries", seriesRows), rows = seriesPage.rows.join("");
    const more = f.series_total > f.series.length ? `<p class="factnote">${this.t("relUnstableMore", { shown: f.series.length, total: f.series_total })}</p>` : "";
    const table = rows ? `<div class="tablewrap lt"><table><thead><tr><th scope="col">${this.t("dbColSeries")}</th><th scope="col">${this.t("dbColOwn")}</th><th scope="col">${this.t("dbColShared")}</th><th scope="col">${this.t("dbColMissing")}</th></tr></thead><tbody>${rows}</tbody></table></div>${seriesPage.footer}${more}` : "";
    return `<details class="howto dbextra"><summary>${this.t("dbDetails", { gaps: this.formatNumber(f.gaps_total || 0), series: this.formatNumber(f.series_total) })}</summary>${f.gaps?.length ? `<div class="sectionlabel">${this.t("dbGapsTitle")}</div>${gaps}` : ""}<div class="sectionlabel">${this.t("dbSeriesTitle")}</div>${table}</details>`;
  }

  dbFindingRow(f) {
    const tone = f.level === "problem" ? "red" : "warn";
    return `<div class="row"><span class="tile ${tone}"><ha-icon icon="mdi:database-alert-outline"></ha-icon></span><span class="row-text"><strong>${this.t(`dbKind_${f.kind}`)}</strong><small>${this.dbFindingText(f)}</small><small>${this.t(`dbAdvice_${f.kind}`)}</small></span><span class="pill ${tone}">${this.t(f.level === "problem" ? "dbProblem" : "dbHint")}</span></div>${this.dbFindingExtra(f)}`;
  }

  dbCard() {
    const r = this.dbHealth;
    const took = this.tookNote(r);
    const head = this.pageBar({ left: took ? `<span>${this.esc(took.replace(/^ · /, ""))}</span>` : "", at: this.isoOf(r?.computed_at), loading: this.dbLoading, attr: "data-db-refresh" });
    if (this.dbError) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(this.dbError)}</div></div></div>`;
    if (!r) return `<div class="stack">${head}<div class="panel">${this.skeleton("dbLoading")}</div></div>`;
    if (!r.available) return `<div class="stack">${head}<div class="panel"><p class="factnote">${this.t("relNoRecorder")}</p></div></div>`;
    if (r.busy) return `<div class="stack">${head}<div class="panel">${this.skeleton("relBusy")}<p class="factnote">${this.t("relBusy")}</p></div></div>`;
    const th = r.thresholds || {};
    const facts = [];
    if (r.supported && r.db_bytes !== null && r.db_bytes !== undefined) facts.push(this.t("dbSize", { db: this.formatBytes(r.db_bytes), wal: this.formatBytes(r.wal_bytes || 0) }));
    else facts.push(this.t("dbNoSize", { dialect: this.esc(r.dialect || "?") }));
    if (r.growth?.known) facts.push(this.t("dbPerDay", { size: this.formatBytes(Math.max(0, r.growth.per_day)) }));
    else facts.push(this.t("dbGrowthUnknown"));
    if (r.keep_days) facts.push(this.t("dbKeep", { n: this.formatNumber(r.keep_days) }));
    if (r.auto_purge === false) facts.push(this.t("dbOvPurgeOff"));
    if (r.restart_gaps) facts.push(this.t("dbRestartGaps", { n: this.formatNumber(r.restart_gaps) }));
    const rows = r.findings.length ? r.findings.map(f => this.dbFindingRow(f)).join("") : `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("dbNone")}</div>`;
    return `<div class="stack">${head}<div class="panel">${rows}<p class="factnote">${facts.join(" · ")}</p>${this.howCounted("dbFootnote", { gap: th.state_gap_minutes ?? 10, gapDays: th.state_gap_window_days ?? 7, missing: th.gap_min_hours ?? 6, missingDays: th.gap_window_days ?? 30 })}</div></div>`;
  }
}
