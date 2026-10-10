// StormsMixin: the recorder load view; mixed into the panel in 99-register.js.
class StormsMixin {
  async loadStorms(refresh = false) {
    this.stormsLoading = true; this.stormsError = ""; this.render();
    try { this.storms = await this._hass.callWS({ type: "ha_housekeeper/storms", window_days: this.stormsWindow, refresh }); }
    catch (err) { this.stormsError = err?.message || String(err); }
    this.stormsLoading = false; this.render();
    this.followUp("storms", "recorder", this.storms, r => this.loadStorms(r), refresh);
  }

  // The first visit and every change of the window load once; the backend keeps the result for ten minutes.
  ensureStorms() {
    if (this.stormsLoading || this._stormsRequested === this.stormsWindow) return;
    this._stormsRequested = this.stormsWindow;
    setTimeout(() => this.loadStorms(), 0);
  }

  // "2 automations, 1 script": what hangs on the loud entity, by type.
  stormFollowers(followers) {
    const parts = Object.entries(followers || {}).map(([type, n]) => `${this.formatNumber(n)} ${this.t(type === "config_entry" ? "config_entry" : type)}`);
    return parts.length ? this.t("stormFollowers", { list: parts.join(", ") }) : "";
  }

  stormFindingText(f) {
    const n = v => this.formatNumber(v);
    if (f.kind === "storm") return this.t("stormStorm", { perDay: n(f.per_day), peak: n(f.peak_hour) });
    if (f.kind === "attribute_flood") return this.t("stormFlood", { perDay: n(f.per_day), kb: this.formatNumber(Math.round(f.attr_bytes / 102.4) / 10) });
    if (f.kind === "no_new_state") return this.t("stormNoNew", { share: f.share, perDay: n(f.per_day) });
    if (f.kind === "integration_share") return this.t("stormShare", { share: this.formatNumber(f.load_share), perDay: n(f.per_day) });
    return this.t("stormEvent", { count: n(f.count), type: f.event_type });
  }

  // One card per entity with all its findings; an integration and an event type stand alone. The findings come sorted by kind and rate.
  stormGroups(r) {
    const map = new Map(), groups = [];
    for (const f of r?.findings || []) {
      const type = f.kind === "integration_share" ? "integrations" : f.kind === "event_burst" ? "events" : "entities";
      const key = `${type}:${f.entity_id || f.title || f.event_type}`;
      let group = map.get(key);
      if (!group) { group = { key, type, items: [] }; map.set(key, group); groups.push(group); }
      group.items.push(f);
    }
    return groups;
  }

  stormGroupCard(group) {
    const first = group.items[0], tone = f => (f.kind === "storm" ? "red" : f.kind === "integration_share" || f.kind === "event_burst" ? "blue" : "warn");
    const title = group.type === "events" ? first.event_type : group.type === "integrations" ? first.title : first.name || first.entity_id;
    const id = group.type === "entities" && first.entity_id !== title ? this.rowId(first.entity_id) : "";
    const badges = group.items.map(f => `<span class="pill ${tone(f)}">${this.t(`stormKind_${f.kind}`)}</span>`).join("");
    const lines = group.items.map(f => group.items.length === 1 ? `<li class="solo"><span>${this.esc(this.stormFindingText(f))}</span></li>` : `<li><span>${this.t(`stormKind_${f.kind}`)}</span><span>${this.esc(this.stormFindingText(f))}</span></li>`).join(""); // one reason: the badge already names it
    const chain = group.items.map(f => this.stormFollowers(f.followers)).find(Boolean);
    const used = chain ? `<li><span>${this.t("stormDependsLabel")}</span><span>${this.esc(chain)} ${this.t("stormDependsNote")}</span></li>` : "";
    const done = group.type === "entities" && (this.excludeSel.has(first.entity_id) || this.excludedIds().has(first.entity_id));
    const entry = group.type === "integrations" && first.entry_id ? `<div class="stormactions">${this.stormEntryButton(first.entry_id)}${this.findObject(`config_entry:${first.entry_id}`) ? `<button class="btn quiet" data-object="config_entry:${this.esc(first.entry_id)}">${this.t("stormDetails")}</button>` : ""}</div>` : "";
    const actions = entry || (group.type === "entities" ? `<div class="stormactions"><button class="btn" data-object="entity:${this.esc(first.entity_id)}">${this.t("stormDetails")}</button><button class="btn quiet" data-storm-mark="${this.esc(first.entity_id)}" ${done ? "disabled" : ""}>${this.t("stormMarkExclude")}</button></div>` : "");
    return `<div class="stormgroup"><div class="stormtop"><div><strong>${this.esc(title)}</strong>${id}</div><span class="stormbadges">${badges}</span></div><ul class="stormfinds">${lines}${used}</ul>${actions}</div>`;
  }

  // Shows the loudest entities of one integration entry: the list already carries each entity's entry_id.
  stormEntryButton(entryId) {
    return `<button class="btn" data-storm-entry="${this.esc(entryId)}">${this.t("stormShowEntities")}</button>`;
  }

  stormLegend(r) {
    const th = r.thresholds || {}, n = v => this.formatNumber(v);
    const row = (kind, text) => `<div><span class="pill ${kind === "storm" ? "red" : kind === "integration_share" || kind === "event_burst" ? "blue" : "warn"}">${this.t(`stormKind_${kind}`)}</span><span>${this.esc(text)}</span></div>`;
    return `<details class="howto"><summary>${this.t("stormLegendTitle")}</summary><div class="stormlegend">${[
      row("storm", this.t("stormLegStorm", { peak: n(th.storm_peak_rows ?? 3600), day: n(th.storm_rows_per_day ?? 50000) })),
      row("attribute_flood", this.t("stormLegFlood", { kb: n(Math.round((th.flood_attr_bytes ?? 4096) / 1024)), min: n(th.flood_min_rows_per_day ?? 1000) })),
      row("no_new_state", this.t("stormLegNoNew", { share: n(Math.round((th.no_new_state_share ?? 0.8) * 100)), min: n(th.no_new_state_min_rows_per_day ?? 1000) })),
      row("integration_share", this.t("stormLegShare", { share: n(th.share_percent ?? 25), min: n(th.share_min_rows_per_day ?? 10000) })),
      row("event_burst", this.t("stormLegBurst", { count: n(th.event_burst ?? 100000) })),
    ].join("")}</div></details>`;
  }

  stormEntityRow(item) {
    const parts = [this.t("stormRows", { rows: this.formatNumber(item.rows), perDay: this.formatNumber(item.per_day) })];
    if (item.no_new_state >= 0.1) parts.push(this.t("stormNoNewShort", { share: Math.round(item.no_new_state * 100) }));
    if (item.attr_bytes !== null && item.attr_bytes !== undefined) parts.push(this.t("stormAttr", { kb: this.formatNumber(Math.round(item.attr_bytes / 102.4) / 10) }));
    if (item.peak_hour) parts.push(this.t("stormPeak", { n: this.formatNumber(item.peak_hour) }));
    const info = this.excludeInfo(item.entity_id, item.per_day, item.excluded);
    return `<div class="rowwrap${item.excluded ? " exdone" : ""}${info.suggest ? " exsug" : ""}">${this.excludeBox(item.entity_id)}<button class="row" data-object="entity:${this.esc(item.entity_id)}"><span class="tile ${info.suggest ? "warn" : "mute"}"><ha-icon icon="mdi:database-clock-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(item.name || item.entity_id)}</strong>${this.rowId(item.entity_id, parts.join(" · "))}${info.why ? `<small class="exwhy">${this.esc(info.why)}</small>` : ""}</span><span class="extags">${info.tags}<span class="pill mute">${this.formatNumber(item.per_day)} ${this.t("stormPerDay")}</span></span></button></div>`;
  }

  // A bar needs a text next to it: the percentage stands in the row, the bar is decoration.
  stormShareRow(item) {
    const share = Math.max(0, Math.min(100, item.load_share));
    return `<div class="row"><span class="tile mute"><ha-icon icon="mdi:lan"></ha-icon></span><span class="row-text"><strong>${this.esc(item.title)}</strong><small>${this.esc(item.domain || "")} · ${this.t("stormShareLine", { entities: this.formatNumber(item.entities), rows: this.formatNumber(item.per_day), rowShare: this.formatNumber(item.row_share) })}</small><span class="sharebar" aria-hidden="true"><i style="width:${share}%"></i></span>${item.entry_id ? `<span class="stormactions">${this.stormEntryButton(item.entry_id)}</span>` : ""}</span><span class="pill mute">${this.formatNumber(item.load_share)} %</span></div>`;
  }

  // Operation > Recorder: what writes the most, what fills the database, and how healthy it is.
  // The two recorder queries run one after the other: the second starts when the first is done.
  recorderView() {
    const stormsDone = this.storms || this.stormsError;
    if (stormsDone) this.ensureDbHealth();
    const st = this.storms?.available && !this.storms.busy ? this.storms : null;
    const db = this.dbHealth?.available && !this.dbHealth.busy ? this.dbHealth : null;
    const meta = this.data?.meta?.database;
    const stormFindings = st ? this.stormGroups(st).length : 0;
    const dbFindings = db ? db.findings.length : 0;
    const dbTone = !db ? "mute" : db.findings.some(f => f.level === "problem") ? "red" : dbFindings ? "warn" : "ok";
    const stormTone = !st ? "mute" : st.findings.some(f => f.kind === "storm" || f.kind === "integration_share") ? "red" : stormFindings ? "warn" : "ok";
    const bytes = db?.db_bytes ?? meta?.db_bytes;
    const perDay = db?.growth?.known ? db.growth.per_day : meta?.per_day;
    const keep = db?.keep_days ?? meta?.keep_days, purge = db?.auto_purge ?? meta?.auto_purge;
    const loud = st?.entities?.[0], topCost = this.costs?.entities?.[0];
    const tabs = [
      { id: "load", icon: "mdi:chart-timeline-variant", label: this.t("stormTitle"), hint: st ? this.t("recTileLoadRows", { n: this.formatNumber(st.per_day), window: this.t(this.stormsWindow === 1 ? "relWindow1" : "relWindow7") }) : this.t("recTileLoadHint"), count: st ? stormFindings : null, tone: stormTone },
      { id: "costs", icon: "mdi:database-search-outline", label: this.t("recorderTitle"), hint: topCost ? this.t("recTileCostsTop", { name: topCost.name || topCost.entity_id, share: topCost.share }) : this.t("recTileCostsHint"), tone: "mute" },
      { id: "db", icon: "mdi:database-outline", label: this.t("dbTitle"), hint: bytes !== null && bytes !== undefined ? [this.formatBytes(bytes), perDay !== null && perDay !== undefined ? this.t("dbOvPerDay", { size: this.formatBytes(Math.max(0, perDay)) }) : ""].filter(Boolean).join(" · ") : this.t("recTileDbHint"), count: db ? dbFindings : null, tone: dbTone, pill: purge === false ? this.t("recSumPurgeOff") : "", pillTone: "warn" },
    ];
    const open = this.viewTabOf("recorder", tabs, "load");
    const body = open === "costs" ? this.recorderCard() : open === "db" ? this.dbCard() : this.stormsView();
    return `<div class="stack">${this.navTiles("recorder", tabs, open, this.t("recorder"))}${body}</div>`;
  }

  stormsView() {
    this.ensureStorms();
    const r = this.storms;
    const windows = [[1, "relWindow1"], [7, "relWindow7"]].map(([days, key]) => `<button class="chip ${this.stormsWindow === days ? "active" : ""}" data-storm-window="${days}" aria-pressed="${this.stormsWindow === days}">${this.t(key)}</button>`).join("");
    const took = this.tookNote(r);
    const head = `<div class="panelhead"><div><h2>${this.t("stormTitle")}</h2><p>${this.t("stormHint")}${took}</p></div><div class="actions" style="display:flex;gap:8px;flex-wrap:wrap">${windows}<button class="btn" data-storm-refresh ${this.stormsLoading ? "disabled" : ""}>${this.t("relRefresh")}</button></div></div>`;
    if (this.stormsError) return `<div class="panel">${head}<div class="error">${this.esc(this.stormsError)}</div></div>`;
    if (!r) return `<div class="panel">${head}${this.skeleton("stormLoading")}</div>`;
    if (!r.available) return `<div class="panel">${head}<p class="factnote">${this.t("relNoRecorder")}</p></div>`;
    if (r.busy) return `<div class="panel">${head}${this.skeleton("relBusy")}<p class="factnote">${this.t("relBusy")}</p></div>`;
    const loading = this.stormsLoading ? `<p class="factnote">${this.t("stormLoading")}</p>` : "";
    const groups = this.stormGroups(r), kinds = [["all", "stormFilterAll"], ["entities", "stormGroupEntities"], ["integrations", "stormGroupIntegrations"], ["events", "stormGroupEvents"]].filter(([id]) => id === "all" || groups.some(g => g.type === id));
    const kind = kinds.some(([id]) => id === this.stormFind) ? this.stormFind : "all";
    const filter = `<div class="stormfilter">${kinds.map(([id, key]) => `<button class="chip ${kind === id ? "active" : ""}" data-storm-find="${id}" aria-pressed="${kind === id}">${this.t(key)} ${id === "all" ? groups.length : groups.filter(g => g.type === id).length}</button>`).join("")}</div>`;
    const shownGroups = kind === "all" ? groups : groups.filter(g => g.type === kind);
    const foundFindings = this.searchList("stormfind", shownGroups, g => g.items.flatMap(f => [f.name, f.entity_id, f.title, f.event_type]).join(" "));
    const findingPage = this.paginate("stormfind", foundFindings.rows);
    const attention = groups.length ? `<p class="factnote">${this.t("stormGroupHint")}</p>${this.stormLegend(r)}${filter}${foundFindings.bar}${foundFindings.none}${findingPage.rows.map(g => this.stormGroupCard(g)).join("")}${findingPage.footer}<p class="factnote">${this.t("stormWhatToDo")}</p>` : `<div class="emptymsg">${this.t("stormNone")}</div>`;
    const summary = `<p class="factnote">${this.t("stormSummary", { rows: this.formatNumber(r.total_rows), perDay: this.formatNumber(r.per_day), entities: this.formatNumber(r.entity_count), events: this.formatNumber(r.event_total) })}</p>`;
    const entry = this.stormEntry && r.integrations.find(g => g.entry_id === this.stormEntry);
    const ofEntry = entry ? r.entities.filter(item => item.entry_id === entry.entry_id) : r.entities;
    const shownEntities = this.exOnlySug ? ofEntry.filter(item => this.excludeInfo(item.entity_id, item.per_day, item.excluded).suggest) : ofEntry;
    const entryBar = entry ? `<div class="toolbar exbar"><span class="date">${this.t("stormOnlyEntry", { title: this.esc(entry.title), shown: this.formatNumber(ofEntry.length), total: this.formatNumber(entry.entities) })}</span><button class="btn quiet" data-storm-entry-clear>${this.t("stormEntryClear")}</button></div>` : "";
    const foundEntities = this.searchList("stormentities", shownEntities, item => [item.name, item.entity_id].join(" "));
    const entityPage = this.paginate("stormentities", foundEntities.rows);
    const table = r.entities.length ? `<div class="panel"><div class="panelhead"><div><h2>${this.t("stormLoudest")}</h2><p>${this.t("stormLoudestHint")}</p></div></div>${this.excludeCard(r.entities.filter(item => this.excludeInfo(item.entity_id, item.per_day, item.excluded).suggest).map(item => item.entity_id))}${entryBar}${foundEntities.bar}${foundEntities.none}${entityPage.rows.map(item => this.stormEntityRow(item)).join("")}${entityPage.footer}</div>` : "";
    const foundShares = this.searchList("stormshares", r.integrations, item => [item.title, item.domain].join(" "));
    const shares = r.integrations.length ? `<div class="panel"><div class="panelhead"><div><h2>${this.t("stormShares")}</h2><p>${this.t("stormSharesHint")}</p></div></div>${foundShares.bar}${foundShares.none}${foundShares.rows.map(item => this.stormShareRow(item)).join("")}</div>` : "";
    const topEvent = Math.max(...r.events.map(e => e.count), 1), eventTotal = r.event_total || r.events.reduce((sum, e) => sum + e.count, 0) || 1, eventDays = r.window_days || 1;
    // state_changed is the normal bulk of the events, so it is never "far ahead".
    const eventRow = e => {
      const pct = (e.count / eventTotal) * 100, ahead = r.events.length > 1 && pct > 50 && e.type !== "state_changed", key = `evt_${e.type}`, what = this.t(key);
      const share = pct < 1 ? this.t("evLessThanOne") : `${Math.round(pct)} %`;
      return `<div class="row evrow"><span class="tile ${ahead ? "warn" : "mute"}"><ha-icon icon="mdi:flash-outline"></ha-icon></span><span class="row-text"><strong class="mono">${this.esc(e.type)}</strong>${ahead ? ` <span class="pill warn">${this.t("evAhead")}</span>` : ""}${what !== key ? `<small class="exwhy">${this.esc(what)}</small>` : ""}<span class="bar" style="margin-top:6px"><i style="width:${Math.max(1, Math.round((e.count / topEvent) * 100))}%"></i></span></span><span class="evnum"><strong>${this.formatNumber(e.count)}</strong><small>${this.t("evShare", { share, perDay: this.formatNumber(Math.round(e.count / eventDays)) })}</small></span></div>`;
    };
    const events = r.events.length ? `<div class="panel"><div class="panelhead"><div><h2>${this.t("stormEvents")}</h2><p>${this.t("stormEventsHint")}</p></div></div>${r.events.map(eventRow).join("")}<details class="howto"><summary>${this.t("evWhenTitle")}</summary><p class="factnote">${this.t("evWhen")}</p></details><p class="factnote">${this.t("evFoot")}</p>${this.howCounted("stormFootnote")}</div>` : "";
    const left = this.excludedText(r.excluded);
    // The sections are tabs, so the lower ones are not hidden far down the page.
    const warn = r.findings.some(f => f.kind === "storm" || f.kind === "integration_share");
    const tabs = [
      { id: "findings", label: this.t("stormTabFindings"), count: groups.length, tone: warn ? "red" : groups.length ? "warn" : "ok" },
      r.entities.length ? { id: "entities", label: this.t("stormTabEntities"), count: r.entities.length } : null,
      r.integrations.length ? { id: "shares", label: this.t("stormTabIntegrations"), count: r.integrations.length } : null,
      r.events.length ? { id: "events", label: this.t("stormTabEvents"), count: r.events.length } : null,
    ].filter(Boolean);
    const open = this.viewTabOf("recload", tabs, r.findings.length ? "findings" : "entities");
    const body = open === "entities" ? table : open === "shares" ? shares : open === "events" ? events : `<div class="panel"><div class="panelhead"><div><h2>${this.t("stormTabFindings")}</h2></div></div>${attention}</div>`;
    return `<div class="stack"><div class="panel">${head}${loading}${summary}${left ? `<p class="factnote">${left}</p>` : ""}</div>${this.viewTabBar("recload", tabs, open)}${body}</div>`;
  }
}
