// ExposureMixin: which entities assistants and bridges can reach; mixed into the panel in 99-register.js.
class ExposureMixin {
  async loadExposure() {
    this.exposureLoading = true; this.exposureError = ""; this.render();
    try { this.exposure = await this._hass.callWS({ type: "ha_housekeeper/exposure" }); this.exposureAt = new Date().toISOString(); }
    catch (err) { this.exposureError = err?.message || String(err); }
    this.exposureLoading = false; this.render();
  }

  // Loads on the first visit; a refresh button reloads. The query is cheap and only reads registries.
  ensureExposure() {
    if (this.exposureLoading || this._exposureRequested) return;
    this._exposureRequested = true;
    setTimeout(() => this.loadExposure(), 0);
  }

  expoAssistantName(id) {
    return this.t(`expoName_${id.replace(/\./g, "_")}`);
  }

  expoAssistantList(ids) {
    return (ids || []).map(id => this.expoAssistantName(id)).join(", ");
  }

  expoFindingText(f) {
    return this.t(`expoText_${f.kind}`, { n: this.formatNumber(f.count), alias: f.alias || "", assistant: f.assistant ? this.expoAssistantName(f.assistant) : "", domain: f.domain || "" });
  }

  // One finding as a fold: the head always shows, the entities and the advice only when open.
  expoFindingRows(f) {
    const tone = f.level === "warn" ? "warn" : "mute";
    const q = (this.lv.exposure?.q || "").trim().toLowerCase();
    const matching = (f.items || []).filter(item => !q || [item.name, item.entity_id, ...(item.assistants || [])].join(" ").toLowerCase().includes(q));
    const all = !!this.expoAll?.[f.kind];
    const shown = all || q ? matching : matching.slice(0, 10);
    const rows = shown.map(item => `<button class="row" data-object="entity:${this.esc(item.entity_id)}"><span class="tile mute"><ha-icon icon="mdi:chevron-right"></ha-icon></span><span class="row-text"><strong>${this.esc(item.name || item.entity_id)}</strong>${this.rowId(item.entity_id, item.assistants?.length ? this.expoAssistantList(item.assistants) : "")}</span></button>`).join("");
    const total = q ? matching.length : f.count;
    const more = total > shown.length ? `<p class="factnote"><button class="link" data-expo-all="${this.esc(f.kind)}">${this.t("expoShowAll", { n: this.formatNumber(total) })}</button></p>` : "";
    const body = `<p class="factnote foldadvice">${this.t(`expoAdvice_${f.kind}`)}</p>${rows}${more}`;
    const head = { tone, title: this.t(`expoKind_${f.kind}`), sub: this.expoFindingText(f), pill: this.t(f.level === "warn" ? "expoWarn" : "expoHint2") };
    return this.fold(`expo_${f.kind}`, head, body, false, q ? matching.length > 0 : undefined);
  }

  expoSection(titleKey, list) {
    return list.length ? `<h3 class="expohd">${this.t(titleKey)}</h3>${list.map(f => this.expoFindingRows(f)).join("")}` : "";
  }

  // Voice assistants and bridges as one list: id, name, state and how many entities each one reaches.
  expoSources(r) {
    const list = r.assistants.map(a => ({ id: a.id, label: this.expoAssistantName(a.id), status: a.status, count: a.exposed }));
    const kinds = {};
    for (const b of r.bridges) {
      const kind = (kinds[b.kind] ||= { id: b.kind, label: this.expoAssistantName(b.kind), status: "ok", count: 0, titles: [] });
      kind.count += b.exposed; kind.titles.push(b.title);
    }
    return [...list, ...Object.values(kinds)];
  }

  // The entities one assistant or bridge can reach, searchable; a click opens the entity.
  expoSourceTab(r, source) {
    const all = (r.exposed_entities || []).filter(e => e.assistants.includes(source.id));
    const found = this.searchList(`expo_${source.id}`, all, e => [e.name, e.entity_id].join(" "), 6, { dense: false });
    const pg = this.paginate(`expo_${source.id}`, found.rows);
    const rows = pg.rows.map(e => {
      const others = e.assistants.filter(id => id !== source.id);
      return `<button class="row" data-object="entity:${this.esc(e.entity_id)}"><span class="tile mute"><ha-icon icon="mdi:chevron-right"></ha-icon></span><span class="row-text"><strong>${this.esc(e.name)}</strong>${this.rowId(e.entity_id, others.length ? this.t("expoAlso", { list: this.expoAssistantList(others) }) : "")}</span></button>`;
    }).join("");
    const where = source.titles?.length ? ` (${this.esc(source.titles.join(", "))})` : "";
    const capped = r.exposed_total > (r.exposed_entities || []).length ? `<p class="factnote">${this.t("expoCapped", { n: this.formatNumber(r.exposed_entities.length) })}</p>` : "";
    const empty = all.length ? "" : `<div class="emptymsg">${this.t(source.status === "inactive" ? "expoInactiveText" : "expoNoneFor")}</div>`;
    return `<div class="panel"><div class="panelhead"><div><h2>${this.esc(source.label)}${where}</h2><p>${this.t("expoSourceHint", { n: this.formatNumber(source.count), name: this.esc(source.label) })}</p></div></div>${found.bar}${found.none}${empty}${rows}${pg.footer}${capped}</div>`;
  }

  exposureView() {
    this.ensureExposure();
    const r = this.exposure;
    const head = this.pageBar({ at: this.exposureAt, loading: this.exposureLoading, attr: "data-expo-refresh" });
    if (this.exposureError) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(this.exposureError)}</div></div></div>`;
    if (!r) return `<div class="stack">${head}<div class="panel">${this.skeleton("expoLoading")}</div></div>`;
    const sources = this.expoSources(r);
    const live = sources.filter(x => x.status === "ok");
    const warn = r.findings.filter(f => f.level === "warn").length;
    const tabs = [
      { id: "findings", icon: "mdi:shield-alert-outline", label: this.t("expoTabFindings"), hint: this.t("expoTileFindingsHint"), count: r.findings.length, tone: warn ? "warn" : "ok" },
      ...sources.map(x => x.status === "ok"
        ? { id: x.id, icon: "mdi:microphone-outline", label: x.label, hint: this.t("expoTileSourceHint", { n: this.formatNumber(x.count) }), count: x.count, tone: "ok" }
        : { id: x.id, icon: "mdi:microphone-off", label: x.label, hint: this.t(x.status === "inactive" ? "expoInactive" : "expoUnavailable"), disabled: true }),
    ];
    const open = this.viewTabOf("exposure", tabs.filter(x => !x.disabled), r.findings.length || !live.length ? "findings" : live[0].id);
    let body;
    if (open === "findings") {
      this.lvState("exposure", "", "asc");
      const q = this.lv.exposure.q.trim().toLowerCase();
      const itemCount = r.findings.reduce((n, f) => n + (f.items || []).length, 0);
      const bar = itemCount >= 6 || q ? this.listBar("exposure", { sorts: [], dense: false }) : "";
      const shown = q ? r.findings.filter(f => (f.items || []).some(item => [item.name, item.entity_id, ...(item.assistants || [])].join(" ").toLowerCase().includes(q))) : r.findings;
      const rows = shown.length ? this.expoSection("expoToCheck", shown.filter(f => f.level === "warn")) + this.expoSection("expoToNote", shown.filter(f => f.level !== "warn")) : q ? `<div class="emptymsg">${this.t("noMatches")}</div>` : `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("expoNone")}</div>`;
      body = `<div class="panel">${bar}${rows}${this.howCounted("expoFootnote")}</div>`;
    } else body = this.expoSourceTab(r, sources.find(x => x.id === open));
    return `<div class="stack">${head}${this.navTiles("exposure", tabs, open, this.t("exposure"), true)}${body}</div>`;
  }
}
