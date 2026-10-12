// ReliabilityMixin: the reliability view; mixed into the panel in 99-register.js.
class ReliabilityMixin {
  // Slow recorder views: an old reply is shown at once and renewed once; when another calculation holds the
  // query lock, the panel asks again by itself a few times instead of asking the user to click.
  followUp(name, view, result, reload, refresh) {
    if (!result) return;
    if (!refresh && result.stale) { reload(true); return; }
    this._busyTries = this._busyTries || {};
    if (!result.busy) { this._busyTries[name] = 0; return; }
    this._busyTries[name] = (this._busyTries[name] || 0) + 1;
    if (this._busyTries[name] <= BUSY_RETRIES) setTimeout(() => { if (this.view === view) reload(refresh); }, BUSY_WAIT_MS);
  }

  // " · calculated in 2.8 s", or the age of an old reply.
  tookNote(r) {
    if (!r || !r.available) return "";
    if (r.computed_at && (r.stale || r.age_seconds >= 60)) return ` · ${this.t("relAgeNote", { when: this.relTime(new Date(r.computed_at * 1000).toISOString()) })}`;
    if (r.took_ms === null || r.took_ms === undefined) return "";
    return ` · ${this.t(r.cached ? "relCached" : "relTook", { s: this.formatNumber(Math.round(r.took_ms / 100) / 10) })}`;
  }

  async loadReliability(refresh = false) {
    this.relLoading = true; this.relError = ""; this.render();
    try { this.reliability = await this._hass.callWS({ type: "ha_housekeeper/reliability", window_days: this.relWindow, refresh, ...(this.relCompare ? { compare: true } : {}) }); }
    catch (err) { this.relError = err?.message || String(err); }
    this.relLoading = false; this.render();
    this.followUp("reliability", "reliability", this.reliability, r => this.loadReliability(r), refresh);
  }

  // The first visit and every change of the window load once; the backend keeps the result for a few minutes.
  ensureReliability() {
    if (this.relLoading || this._relRequested === this.relWindow) return;
    this._relRequested = this.relWindow;
    setTimeout(() => this.loadReliability(), 0);
  }

  relDuration(seconds) {
    if (seconds >= 86400) return this.t("relDays", { n: Math.round(seconds / 86400) });
    if (seconds >= 7200) return this.t("relHours", { n: Math.round(seconds / 3600) });
    return this.t("relMinutes", { n: Math.max(1, Math.round(seconds / 60)) });
  }

  relSorts() {
    return [
      { key: "avail", label: "relSortAvail", dir: "asc", get: e => e.availability },
      { key: "title", label: "sortName", dir: "asc", get: e => e.title },
      { key: "outages", label: "relSortOutages", dir: "desc", get: e => e.shared_outages },
    ];
  }

  relRowBody(item) {
    const percent = item.availability;
    const tone = percent === null ? "mute" : percent >= 99.5 ? "ok" : percent >= 95 ? "warn" : "red";
    const lines = [`${this.esc(item.domain || "")} · ${this.t("relEntities", { n: item.entities })}${item.permanent ? ` · ${this.t("relPermanent", { n: item.permanent })}` : ""}`];
    if (item.shared_outages) {
      const layer = item.layer === "cloud" ? this.t("relLayerCloud") : this.t("relLayerLocal");
      lines.push(`${this.t(item.shared_outages === 1 ? "relSharedOne" : "relShared", { n: item.shared_outages, longest: this.relDuration(item.longest_outage) })} · ${layer}`);
    }
    const flags = [];
    if (item.reauth) flags.push(`<span class="pill red">${this.t("relReauth")}</span>`);
    if (item.state && item.state !== "loaded") flags.push(`<span class="pill warn">${this.esc(item.state)}</span>`);
    if (item.setup) lines.push(`${item.setup.count ? this.t("relSetup", { n: item.setup.count, days: item.setup.days, last: this.formatDate(item.setup.last) }) : ""}${item.setup.state ? `${item.setup.count ? " · " : ""}${this.t("relSetupNow", { state: item.setup.state })}` : ""}`);
    lines.push(item.last_disruption
      ? this.t(item.last_disruption.shared ? "relLastShared" : "relLastSingle", { date: this.formatDate(new Date(item.last_disruption.end * 1000).toISOString()), duration: this.relDuration(item.last_disruption.seconds) })
      : this.t("relNoDisruption"));
    if (item.delta !== null && item.delta !== undefined) lines.push(this.t("relDelta", { delta: `${item.delta > 0 ? "+" : item.delta < 0 ? "−" : "±"}${this.formatNumber(Math.abs(item.delta))}`, before: this.formatNumber(item.previous_availability) }));
    else if (this.reliability?.comparison?.available) lines.push(this.t("relDeltaNone"));
    return `<span class="tile ${tone}"><ha-icon icon="mdi:lan-connect"></ha-icon></span><span class="row-text"><strong>${this.esc(item.title)}</strong>${lines.map(line => `<small>${line}</small>`).join("")}${flags.length ? `<span class="relflags">${flags.join(" ")}</span>` : ""}</span><span class="pill ${tone}">${percent === null ? "—" : `${this.formatNumber(percent)} %`}</span>`;
  }

  relRow(item) {
    const key = `config_entry:${item.entry_id}`;
    const open = this.findObject(key) ? ` data-object="${this.esc(key)}"` : "";
    return `<${open ? "button" : "div"} class="row${open ? " rel" : ""}"${open}>${this.relRowBody(item)}</${open ? "button" : "div"}>`;
  }

  // The row of one config entry in the loaded numbers, for its detail page.
  reliabilityRow(item) {
    if (item.object_type !== "config_entry") return null;
    return (this.reliability?.entries || []).find(row => row.entry_id === item.object_id) || null;
  }

  reliabilityDetailCard(row) {
    const r = this.reliability;
    const items = row.affected || [];
    const list = items.map(m => {
      const tone = m.availability >= 99.5 ? "ok" : m.availability >= 95 ? "warn" : "red";
      return `<button class="row rel" data-object="entity:${this.esc(m.entity_id)}">${this.tile("entity", tone)}<span class="row-text"><strong>${this.esc(m.name)}</strong>${this.rowId(m.entity_id)}</span><span class="pill ${tone}">${this.formatNumber(m.availability)} %</span></button>`;
    }).join("");
    const more = row.affected_total > items.length ? `<p class="factnote">${this.t("relAffectedMore", { shown: items.length, total: row.affected_total })}</p>` : "";
    const summary = `<div class="row">${this.relRowBody(row)}</div>`;
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("relTab")}</h2><p>${this.t(r.window_days === 1 ? "relWindow1" : "relWindow7")}${r.stale || r.age_seconds ? ` · ${this.t("relAgeNote", { when: this.relTime(new Date(r.computed_at * 1000).toISOString()) })}` : ""}</p></div></div>${summary}<div class="sectionlabel">${this.t("relAffected", { n: this.formatNumber(row.affected_total || 0) })}</div>${list || `<p class="factnote">${this.t("relNoAffected")}</p>`}${more}</section>`;
  }

  reliabilityView() {
    this.ensureReliability();
    const r = this.reliability;
    const windows = [[1, "relWindow1"], [7, "relWindow7"]].map(([days, key]) => `<button class="chip ${this.relWindow === days ? "active" : ""}" data-rel-window="${days}" aria-pressed="${this.relWindow === days}">${this.t(key)}</button>`).join("") + `<button class="chip ${this.relCompare ? "active" : ""}" data-rel-compare aria-pressed="${this.relCompare}">${this.t("relCompare")}</button>`;
    const aged = Boolean(r?.computed_at && (r.stale || r.age_seconds >= 60)), took = aged ? "" : this.tookNote(r).replace(/^ · /, "");
    const head = this.pageBar({ left: `${windows}${took ? `<span>${this.esc(took)}</span>` : ""}`, at: r?.computed_at ? new Date(r.computed_at * 1000).toISOString() : null, loading: this.relLoading, attr: "data-rel-refresh" });
    const alone = inner => `<div class="stack">${head}<div class="panel">${inner}</div></div>`;
    if (this.relError) return alone(`<div class="error">${this.esc(this.relError)}</div>`);
    if (!r) return alone(this.skeleton("relLoading"));
    if (!r.available) return alone(`<p class="factnote">${this.t("relNoRecorder")}</p>`);
    if (r.busy) return alone(`${this.skeleton("relBusy")}<p class="factnote">${this.t("relBusy")}</p>`);
    if (!r.entries.length) return alone(`<div class="emptymsg">${this.t("relEmpty")}</div>`);
    const loading = this.relLoading ? `<p class="factnote">${this.t("relLoading")}</p>` : "";
    const th = r.thresholds || {};
    const cov = r.coverage;
    const coverage = cov && cov.observed_share !== null && cov.observed_share !== undefined ? this.coverageNote(this.t("relCoverage", { days: r.window_days, withData: this.formatNumber(cov.with_data), known: this.formatNumber(cov.known), share: cov.observed_share })) : "";
    this.lvState("relentries", "avail", "asc");
    const entries = this.refine("relentries", r.entries, { text: e => [e.title, e.domain].join(" "), sorts: this.relSorts(), tie: e => e.title, filters: {
      state: (e, v) => v === "outages" ? e.shared_outages > 0 : v === "reauth" ? e.reauth : e.state && e.state !== "loaded",
    } });
    const bar = r.entries.length > 5 || this.lv.relentries.q ? this.listBar("relentries", { sorts: this.relSorts(), filters: [
      { name: "state", all: this.t("relAllStates"), options: [["outages", this.t("relOnlyOutages")], ["reauth", this.t("relOnlyReauth")], ["notloaded", this.t("relOnlyNotLoaded")]] },
    ] }) : "";
    const pg = this.paginate("relentries", entries);
    const list = entries.length ? pg.rows.map(item => this.relRow(item)).join("") : `<div class="emptymsg">${this.t("noMatches")}</div>`;
    const u = r.unstable || { total: 0, entities: {} };
    const flapping = Object.values(u.entities || {}).filter(e => e.level === "flapping").length;
    const outages = r.entries.filter(e => e.shared_outages > 0).length;
    const attention = r.entries.filter(e => e.reauth || (e.state && e.state !== "loaded")).length;
    const counted = r.entries.reduce((n, e) => n + (e.availability === null || e.availability === undefined ? 0 : e.entities), 0);
    const overall = counted ? r.entries.reduce((n, e) => n + (e.availability === null || e.availability === undefined ? 0 : e.availability * e.entities), 0) / counted : null;
    const availText = overall === null ? "–" : `${this.formatNumber(Math.round(overall * 10) / 10)} %`;
    const odd = r.entries.filter(e => e.shared_outages > 0 || e.reauth || (e.state && e.state !== "loaded")).length;
    const tabs = [
      { id: "integrations", icon: "mdi:puzzle-outline", label: this.t("relTabIntegrations"), hint: this.t("relTileIntHint", { avail: availText, window: this.t(r.window_days === 1 ? "relWindow1" : "relWindow7") }), count: r.entries.length, tone: outages || attention ? "warn" : "ok", pill: odd ? this.t("relTilePill", { n: this.formatNumber(odd) }) : "", pillTone: attention ? "red" : "warn" },
      { id: "unstable", icon: "mdi:pulse", label: this.t("relTabUnstable"), hint: this.t("relTileUnstableHint"), count: u.total || 0, tone: flapping ? "red" : u.total ? "warn" : "ok", pill: flapping ? this.t("relSumFlapping", { n: this.formatNumber(flapping) }) : "" },
    ];
    const open = this.viewTabOf("reliability", tabs, u.total && !outages ? "unstable" : "integrations");
    const body = open === "unstable" ? this.unstableCard(r) : `<div class="panel">${coverage}${bar}${loading}${list}${pg.footer}${this.howCounted("relFootnote", { days: r.window_days, share: th.shared_share_percent ?? 80, entities: th.shared_min_entities ?? 3, minutes: Math.round((th.shared_min_seconds ?? 300) / 60) })}</div>`;
    return `<div class="stack">${head}${this.navTiles("reliability", tabs, open, this.t("reliability"), true)}${body}</div>`;
  }

  // The numbers behind "unstable" or "flapping" as lines of text; also used on the entity's detail page.
  unstableLines(item, days) {
    const lines = [this.t("relEpisodes", { n: item.episodes, days, rate: this.formatNumber(item.per_day), total: this.relDuration(item.total_seconds), mean: this.relDuration(item.mean_seconds) })];
    if (item.pattern_hour !== null && item.pattern_hour !== undefined) lines.push(this.t("relPattern", { from: String(item.pattern_hour).padStart(2, "0"), to: String((item.pattern_hour + 2) % 24).padStart(2, "0") }));
    if (item.used) lines.push(this.t("relFollowers", { n: item.used }));
    return lines;
  }

  unstableRow(item, days) {
    const tone = item.level === "flapping" ? "red" : "warn";
    const lines = [`${this.esc(item.entity_id)}${item.entry_title ? ` · ${this.esc(item.entry_title)}` : ""}`, ...this.unstableLines(item, days)];
    return `<button class="row" data-object="entity:${this.esc(item.entity_id)}"><span class="tile ${tone}"><ha-icon icon="mdi:swap-vertical"></ha-icon></span><span class="row-text"><strong>${this.esc(item.name)}</strong>${lines.map(line => `<small>${line}</small>`).join("")}</span><span class="pill ${tone}">${this.t(item.level === "flapping" ? "relFlapping" : "relUnstable")}</span></button>`;
  }

  // The stability of an entity for its detail page, from numbers that already exist: it never starts the recorder query.
  ensureStability() {
    if (this._stabRequested === this.relWindow || this.reliability?.available) return;
    this._stabRequested = this.relWindow;
    setTimeout(async () => {
      try { this.stability = await this._hass.callWS({ type: "ha_housekeeper/reliability", window_days: this.relWindow, cached_only: true }); } catch (_) { return; }
      if (this.selected?.object_type === "entity") this.render();
    }, 0);
  }

  // null: unknown; { missing }: never calculated; { info: null }: calculated, stable; { info }: unstable or flapping.
  stabilityOf(item) {
    const r = this.reliability?.available && !this.reliability.busy ? this.reliability : this.stability;
    if (!r || !r.available) return null;
    if (r.missing) return { missing: true };
    const map = r.unstable?.entities;
    if (!map) return null; // a reply kept by an older version
    return { r, info: map[item.object_id] || null };
  }

  unstableCard(r) {
    const u = r.unstable, th = r.thresholds || {};
    if (!u) return "";
    const head = `${r.coverage ? this.coverageNote(this.t("relUnstableCoverage", { days: r.window_days, withData: this.formatNumber(r.coverage.with_data) }) + ` ${this.excludedText(u.excluded)}`.trimEnd()) : ""}`;
    if (!u.items.length) return `<div class="panel">${head}<div class="emptymsg">${this.t("relUnstableNone")}</div></div>`;
    const more = u.total > u.items.length ? `<p class="factnote">${this.t("relUnstableMore", { shown: u.items.length, total: u.total })}</p>` : "";
    const rank = new Map(u.items.map((item, i) => [item, i]));
    const sorts = [
      { key: "rank", label: "relSortRank", dir: "asc", get: item => rank.get(item) },
      { key: "name", label: "sortName", dir: "asc", get: item => item.name },
      { key: "episodes", label: "relSortEpisodes", dir: "desc", get: item => item.episodes },
      { key: "rate", label: "relSortRate", dir: "desc", get: item => item.per_day },
      { key: "duration", label: "relSortDuration", dir: "desc", get: item => item.total_seconds },
    ];
    this.lvState("relunstable", "rank", "asc");
    const rows = this.refine("relunstable", u.items, { text: item => [item.name, item.entity_id, item.entry_title].join(" "), sorts, tie: item => item.entity_id, filters: { level: (item, v) => item.level === v } });
    const bar = u.items.length > 5 || this.lv.relunstable.q ? this.listBar("relunstable", { sorts, filters: [
      { name: "level", all: this.t("relAllStates"), options: [["flapping", this.t("relOnlyFlapping")], ["unstable", this.t("relOnlyUnstable")]] },
    ] }) : "";
    const pg = this.paginate("relunstable", rows);
    const list = rows.length ? pg.rows.map(item => this.unstableRow(item, r.window_days)).join("") : `<div class="emptymsg">${this.t("noMatches")}</div>`;
    return `<div class="panel">${head}${bar}${list}${pg.footer}${more}${this.howCounted("relUnstableFootnote", { episodes: th.unstable_min_episodes ?? 3, rate: this.formatNumber(th.unstable_per_day ?? 0.5), flap: this.formatNumber(th.flapping_per_day ?? 1.5) })}</div>`;
  }
}
