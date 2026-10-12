// ListsMixin: methods of the panel element, mixed into the class in 99-register.js.
const VIEWS_KEY = "ha_housekeeper.views";
const VIEWS_LIMIT = 10;

class ListsMixin {
  th(key, label) {
    const on = this.sort === key;
    return `<th data-sort="${key}" aria-sort="${on ? (this.sortDir === "desc" ? "descending" : "ascending") : "none"}"><button type="button" class="thbtn" data-sortbtn="${key}">${this.t(label)}${on ? ` <span aria-hidden="true">${this.sortDir === "desc" ? "▼" : "▲"}</span>` : ""}</button></th>`;
  }

  // Shared list controls: per-list search, filters and sort kept in this.lv[id].
  // The sort and the filters of a list come back at the next visit (this browser only); the search text does not.
  lvState(id, sort, dir) {
    if (this.lv[id]) return this.lv[id];
    const kept = this.lvStored()[id];
    const ok = kept && typeof kept.sort === "string" && (kept.dir === "asc" || kept.dir === "desc");
    return (this.lv[id] = { q: "", sort: ok ? kept.sort : sort, dir: ok ? kept.dir : dir, f: ok && kept.f && typeof kept.f === "object" ? Object.fromEntries(Object.entries(kept.f).filter(([, v]) => typeof v === "string")) : {}, view: "" });
  }

  lvStored() {
    if (this._lvStored) return this._lvStored;
    let stored = {};
    try { stored = JSON.parse(globalThis.localStorage?.getItem("ha_housekeeper.lv") || "{}"); } catch (_) { stored = {}; }
    return (this._lvStored = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {});
  }

  persistLv(id) {
    const st = this.lv[id];
    if (!st) return;
    this.lvStored()[id] = { sort: st.sort, dir: st.dir, f: Object.fromEntries(Object.entries(st.f).filter(([, v]) => v)) };
    try { globalThis.localStorage?.setItem("ha_housekeeper.lv", JSON.stringify(this._lvStored)); } catch (_) { /* kept until the page closes */ }
  }

  areaName(item) {
    const device = item.device_id ? this.findObject(`device:${item.device_id}`) : null;
    return this.findObject(`area:${item.area_id || device?.area_id}`)?.name || "";
  }

  // Filter by search text and select filters, then sort. Empty values always sort last.
  refine(id, items, { text, filters = {}, sorts, tie }) {
    const st = this.lv[id], q = st.q.trim().toLowerCase();
    const get = sorts.find(x => x.key === st.sort)?.get || sorts[0].get;
    const sign = st.dir === "desc" ? -1 : 1;
    const empty = v => v === null || v === undefined || v === "";
    const { natural, ids } = this.collators();
    const rows = items.filter(it => (!q || text(it).toLowerCase().includes(q))
      && Object.entries(st.f).every(([name, value]) => !value || !filters[name] || filters[name](it, value)))
      .map(it => ({ it, key: get(it) })); // the sort key is read once per item, not per comparison
    rows.sort((a, b) => {
      const x = a.key, y = b.key;
      if (empty(x) !== empty(y)) return empty(x) ? 1 : -1;
      const order = typeof x === "number" && typeof y === "number" ? x - y : natural.compare(String(x ?? ""), String(y ?? ""));
      return order * sign || ids.compare(String(tie(a.it)), String(tie(b.it)));
    });
    return rows.map(row => row.it);
  }

  // A short message at the bottom of the page for small actions; it goes away by itself.
  toast(text, error = false) {
    const root = this.shadowRoot;
    if (!root?.querySelector || typeof document === "undefined") return;
    try {
      root.querySelector(".toast")?.remove();
      const el = document.createElement("div");
      el.className = error ? "toast bad" : "toast"; el.setAttribute("role", error ? "alert" : "status"); el.textContent = text;
      root.appendChild(el);
      setTimeout(() => el.remove(), error ? 8000 : 2600);
    } catch (_) { /* a missing message is no loss */ }
  }

  // A click that failed says so and leaves the page as it is; only a failed load replaces the page.
  failed(err) {
    this.noteError("action", err);
    this.toast(this.t("actionFailed", { detail: this.errText(err) }), true);
  }

  // The last ten errors of this session, for the diagnostics: where, when and the message only.
  noteError(where, err) {
    (this._recentErrors ||= []).push({ at: new Date().toISOString(), where, message: String(err?.message || err).slice(0, 300) });
    if (this._recentErrors.length > 10) this._recentErrors.shift();
  }

  // "No matches" with a way out: clears search text and filters of that list.
  noMatches(id) {
    return `${this.t("noMatches")} <button class="btn quiet" data-lreset="${this.esc(id)}">${this.t("resetFilters")}</button>`;
  }

  // Shows only what is ticked in a list (the box is the proof before something is deleted).
  selOnlyButton(id, count) {
    const on = Boolean(this.selOnly?.[id]);
    return `<button class="btn quiet" data-sel-only="${this.esc(id)}" aria-pressed="${on}" ${count || on ? "" : "disabled"}>${this.t(on ? "showAll" : "showSelectedOnly")}</button>`;
  }

  // A range of ticks with Shift-click: from the last ticked row to this one, within the shown page.
  pickRows(key, id, checked, set, page) {
    const last = this._lastPick?.[key], list = page || [];
    const a = list.indexOf(last), b = list.indexOf(id);
    const ids = this._shift && a >= 0 && b >= 0 && last !== id ? list.slice(Math.min(a, b), Math.max(a, b) + 1) : [id];
    ids.forEach(x => (checked ? set.add(x) : set.delete(x)));
    (this._lastPick ||= {})[key] = id;
  }

  // A search box over a list that keeps its own order. The box shows from `min` items on, or while a text is set.
  searchList(id, items, text, min = 6) {
    const st = this.lvState(id, "", "asc"), q = st.q.trim().toLowerCase();
    const rows = q ? items.filter(item => text(item).toLowerCase().includes(q)) : items;
    return { rows, bar: items.length >= min || st.q ? this.listBar(id, { sorts: [] }) : "", none: q && !rows.length ? `<div class="emptymsg">${this.t("noMatches")}</div>` : "" };
  }

  // The line above a list that tells which filters are on and clears them: labels = texts of the filters, resetAttr = attribute of the button.
  filterNote(labels, resetAttr) {
    if (!labels.length) return "";
    return `<div class="filteron" role="status"><ha-icon icon="mdi:filter-variant"></ha-icon><span>${this.t("filterOn")}: ${labels.map(l => `<b>${this.esc(l)}</b>`).join(" · ")}</span><button class="btn quiet" ${resetAttr}>${this.t("filterReset")}</button></div>`;
  }

  // After a tile set a filter: bring the list below into view when it is off screen (it never moves a list that already shows).
  showList() {
    requestAnimationFrame(() => this.shadowRoot?.querySelector(".filteron, .listbar")?.scrollIntoView?.({ block: "nearest" }));
  }

  listBar(id, { sorts, filters = [], columns = [] }) {
    const st = this.lv[id];
    for (const f of filters) if (st.f[f.name] && !f.options.some(([v]) => v === st.f[f.name])) delete st.f[f.name]; // a kept value this list no longer offers
    (this.lvDirs ||= {})[id] = Object.fromEntries(sorts.map(x => [x.key, x.dir]));
    const selects = filters.map(f => `<select data-lf="${id}|${f.name}" aria-label="${this.esc(f.all)}"><option value="">${this.esc(f.all)}</option>${f.options.map(([v, label]) => `<option value="${this.esc(v)}" ${st.f[f.name] === v ? "selected" : ""}>${this.esc(label)}</option>`).join("")}</select>`).join("");
    const sortOptions = sorts.map(x => `<option value="${x.key}" ${st.sort === x.key ? "selected" : ""}>${this.t(x.label)}</option>`).join("");
    const desc = st.dir === "desc";
    const on = filters.filter(f => st.f[f.name]).map(f => `${f.all}: ${(f.options.find(([v]) => v === st.f[f.name]) || [])[1] ?? st.f[f.name]}`);
    const note = this.filterNote(on, `data-lf-set="${id}||"`);
    return `${note}<div class="listbar"><input type="search" data-lq="${id}" value="${this.esc(st.q)}" placeholder="${this.t("searchList")}">${selects}${sorts.length ? `<span class="sortgroup"><select data-ls="${id}" aria-label="${this.t("sortBy")}">${sortOptions}</select><button class="dirbtn" data-ld="${id}" title="${this.t(desc ? "sortDescending" : "sortAscending")}" aria-label="${this.t(desc ? "sortDescending" : "sortAscending")}"><ha-icon icon="${desc ? "mdi:sort-descending" : "mdi:sort-ascending"}"></ha-icon></button></span>` : ""}${this.viewsControl(id)}${this.denseButton()}${this.listTools(id, columns)}</div>`;
  }

  // Column picker and CSV export of a list; both are optional. `columns` are the switchable columns: { key, label }.
  listTools(id, columns = []) {
    const open = this._colOpen === id;
    const picker = columns.length ? `<span class="colwrap"><button type="button" class="dirbtn ${open ? "on" : ""}" data-col-open="${id}" aria-expanded="${open}" title="${this.esc(this.t("colsLabel"))}" aria-label="${this.esc(this.t("colsLabel"))}"><ha-icon icon="mdi:table-column"></ha-icon></button>${open ? `<span class="colpop" role="group" aria-label="${this.esc(this.t("colsLabel"))}">${columns.map(c => `<label><input type="checkbox" data-col="${id}|${c.key}" ${this.colHidden(id, c.key) ? "" : "checked"}> ${this.t(c.label)}</label>`).join("")}</span>` : ""}</span>` : "";
    const download = this._exporters?.[id] ? `<button type="button" class="dirbtn" data-export-list="${id}" title="${this.esc(this.t("exportListTitle"))}" aria-label="${this.esc(this.t("exportListTitle"))}"><ha-icon icon="mdi:download"></ha-icon></button>` : "";
    return picker + download;
  }

  // Hidden columns per list, kept in this browser only.
  colState() {
    if (this._cols) return this._cols;
    let stored = {};
    try { stored = JSON.parse(globalThis.localStorage?.getItem("ha_housekeeper.cols") || "{}"); } catch (_) { stored = {}; }
    const clean = {};
    if (stored && typeof stored === "object") for (const [id, keys] of Object.entries(stored)) if (Array.isArray(keys)) clean[id] = keys.filter(k => typeof k === "string").slice(0, 20);
    return (this._cols = clean);
  }

  colHidden(id, key) { return (this.colState()[id] || []).includes(key); }

  toggleCol(id, key) {
    const state = this.colState(), list = state[id] || [];
    state[id] = list.includes(key) ? list.filter(k => k !== key) : [...list, key];
    try { globalThis.localStorage?.setItem("ha_housekeeper.cols", JSON.stringify(state)); } catch (_) { /* kept until the page closes */ }
    this.render();
  }

  // A list as CSV: every row of the current search and filters, all columns. Same formula guard as the findings export.
  downloadRows(name, header, rows) {
    const body = "\ufeff" + [header, ...rows].map(r => r.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `ha-housekeeper-${name}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // The view registers what its export holds before it draws the list bar: { name, header, rows() }.
  exportList(id) {
    const ex = this._exporters?.[id];
    const st = this.lv?.[id], filtered = Boolean(st && (st.q?.trim() || Object.values(st.f || {}).some(Boolean)));
    if (ex) this.downloadRows(filtered ? `${ex.name}-filtered` : ex.name, ex.header, ex.rows());
  }

  setExporter(id, name, header, rows) { (this._exporters ||= {})[id] = { name, header, rows }; }

  // Compact lists show the first line of every row; one switch for all lists, kept in this browser.
  denseButton() {
    if (this.dense === undefined) { try { this.dense = globalThis.localStorage?.getItem("ha_housekeeper.dense") === "1"; } catch (_) { this.dense = false; } }
    const label = this.t(this.dense ? "denseOff" : "denseOn");
    return `<button type="button" class="dirbtn" data-dense aria-pressed="${this.dense}" title="${label}" aria-label="${label}"><ha-icon icon="${this.dense ? "mdi:format-line-spacing" : "mdi:view-agenda-outline"}"></ha-icon></button>`;
  }

  // A sortable table for a list built with lvState/refine: header buttons set sort and direction, the phone shows cards.
  // columns: [{ key, label, cell(item) -> html, sortable, dir, narrow, allBox(rows) }]; narrow is a checkbox column with a fixed small width; allBox puts a box that ticks the page in its head; rowAttrs(item) adds attributes to the row.
  listTable(id, columns, rows, { rowAttrs = () => "", cls = "" } = {}) {
    const st = this.lv[id];
    columns = columns.filter((c, i) => !i || !this.colHidden(id, c.key));
    const head = columns.map(c => {
      const on = st.sort === c.key;
      const inner = c.allBox ? c.allBox(rows) : c.narrow ? `<ha-icon icon="mdi:checkbox-marked-outline" title="${this.esc(this.t(c.label))}"></ha-icon><span class="sr-only">${this.t(c.label)}</span>` : c.sortable === false ? this.t(c.label) : `<button type="button" class="thbtn" data-lsort="${id}|${c.key}|${c.dir || "asc"}">${this.t(c.label)}${on ? ` <span aria-hidden="true">${st.dir === "desc" ? "↓" : "↑"}</span>` : ""}</button>`;
      return `<th scope="col"${c.narrow ? ' class="selcol"' : ""} aria-sort="${on ? (st.dir === "desc" ? "descending" : "ascending") : "none"}">${c.headPrefix ? `<span class="headsel">${c.headPrefix()}${inner}</span>` : inner}</th>`;
    }).join("");
    const body = rows.map(item => {
      const attrs = rowAttrs(item);
      return `<tr ${attrs}>${columns.map((c, i) => `<td${c.narrow ? ' class="selcol"' : ""}${i ? ` data-label="${this.esc(this.t(c.label))}"` : ""}>${c.cell(item)}</td>`).join("")}</tr>`;
    }).join("");
    return `<div class="tablewrap lt ${cls}"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // Name over id for a table cell: both are cut at the column width and shown in full in the tooltip (see showTip).
  nameCell(name, id, tag = "div") {
    const sub = id || "";
    return `<${tag} class="namecell" data-tip="${this.esc(name)}" data-tip-sub="${this.esc(sub)}"><strong class="cut">${this.esc(name)}</strong>${sub ? `<span class="id cut">${this.esc(sub)}</span>` : ""}</${tag}>`;
  }

  // The id line of a list row: the id in mono under the name, extra facts in a line of their own below it.
  rowId(id, extra = "") {
    return `<span class="id">${this.esc(id)}</span>${extra ? `<small>${this.esc(extra)}</small>` : ""}`;
  }

  // The date of a table cell: how long ago, with the exact time as a tooltip; empty when unknown.
  ageCell(iso) {
    if (!iso) return `<span class="muted">–</span>`;
    return `<span title="${this.esc(this.formatDate(iso))}">${this.esc(this.relTime(iso))}</span>`;
  }

  // Saved list views: search text, filters and sort under a name, kept in this browser only.
  viewsStore() {
    if (this._views) return this._views;
    let stored = {};
    try { stored = JSON.parse(globalThis.localStorage?.getItem(VIEWS_KEY) || "{}"); } catch (_) { stored = {}; }
    const clean = {};
    if (stored && typeof stored === "object") {
      for (const [id, list] of Object.entries(stored)) {
        if (!Array.isArray(list)) continue;
        clean[id] = list.filter(v => v && typeof v.name === "string" && v.name && typeof v.q === "string" && v.f && typeof v.f === "object" && typeof v.sort === "string" && (v.dir === "asc" || v.dir === "desc"))
          .slice(0, VIEWS_LIMIT).map(v => ({ name: v.name.slice(0, 40), q: v.q, f: Object.fromEntries(Object.entries(v.f).filter(([, x]) => typeof x === "string")), sort: v.sort, dir: v.dir }));
      }
    }
    return (this._views = clean);
  }

  persistViews() {
    try { globalThis.localStorage?.setItem(VIEWS_KEY, JSON.stringify(this._views || {})); } catch (_) { /* a private window: the views last until the page closes */ }
  }

  viewsControl(id) {
    const st = this.lv[id], saved = this.viewsStore()[id] || [];
    const dirty = Boolean(st.q.trim()) || Object.values(st.f).some(Boolean);
    if (!saved.length && !dirty) return "";
    const select = saved.length ? `<select data-lview="${id}" aria-label="${this.esc(this.t("viewsLabel"))}"><option value="">${this.t("viewsNone")}</option>${saved.map(v => `<option value="${this.esc(v.name)}" ${st.view === v.name ? "selected" : ""}>${this.esc(v.name)}</option>`).join("")}</select>` : "";
    if (this.viewNaming === id) {
      return `<form class="viewgroup" data-lview-form="${id}"><input data-lview-name="${id}" maxlength="40" autocomplete="off" value="${this.esc(this.viewDraft)}" aria-label="${this.esc(this.t("viewName"))}" placeholder="${this.esc(this.t("viewName"))}"><button type="submit" class="btn">${this.t("viewSave")}</button><button type="button" class="btn quiet" data-lview-cancel="${id}">${this.t("cancelRun")}</button></form>`;
    }
    const save = dirty ? `<button type="button" class="btn quiet" data-lview-save="${id}"><ha-icon icon="mdi:star-outline"></ha-icon>${this.t("viewSave")}</button>` : "";
    const remove = st.view && saved.some(v => v.name === st.view) ? `<button type="button" class="btn quiet" data-lview-delete="${id}">${this.t("viewDelete")}</button>` : "";
    return `<span class="viewgroup">${select}${save}${remove}</span>`;
  }

  applyView(id, name) {
    const st = this.lv[id], view = (this.viewsStore()[id] || []).find(v => v.name === name);
    st.view = view ? view.name : "";
    if (view) { st.q = view.q; st.f = { ...view.f }; st.sort = view.sort; st.dir = view.dir; }
    this.pages = {}; this.render();
  }

  // Naming a view happens in a small inline form (name, save, cancel), not in a browser prompt.
  saveView(id) {
    this.viewNaming = id; this.viewDraft = this.lv[id].view || "";
    this.render();
    this.shadowRoot?.querySelector?.(`[data-lview-name="${id}"]`)?.focus?.();
  }

  cancelView(id) {
    this.viewNaming = null;
    this.render();
    this.shadowRoot?.querySelector?.(`[data-lview-save="${id}"]`)?.focus?.();
  }

  commitView(id, text) {
    const st = this.lv[id], name = String(text || "").trim().slice(0, 40);
    if (!name) return;
    const store = this.viewsStore(), list = (store[id] ||= []);
    const view = { name, q: st.q, f: Object.fromEntries(Object.entries(st.f).filter(([, v]) => v)), sort: st.sort, dir: st.dir };
    const at = list.findIndex(v => v.name === name);
    if (at >= 0) list[at] = view; else if (list.length < VIEWS_LIMIT) list.push(view); else list[list.length - 1] = view;
    st.view = name; this.viewNaming = null; this.persistViews(); this.render();
    this.shadowRoot?.querySelector?.(`[data-lview-save="${id}"]`)?.focus?.();
  }

  deleteView(id) {
    const st = this.lv[id], store = this.viewsStore();
    store[id] = (store[id] || []).filter(v => v.name !== st.view);
    st.view = ""; this.persistViews(); this.render();
  }

  // Long explanations of how a number is counted fold away, so the lists end earlier.
  howCounted(key, vars) {
    return `<details class="howto"><summary>${this.t("howCounted")}</summary><p class="factnote">${this.t(key, vars)}</p></details>`;
  }

  // Shared paging for long lists: returns the visible slice and the footer markup.
  paginate(id, items) {
    const count = Math.max(1, Math.ceil(items.length / this.pageSize));
    const page = Math.min(Math.max(1, this.pages[id] || 1), count);
    this.pages[id] = page;
    const from = (page - 1) * this.pageSize;
    const rows = items.slice(from, from + this.pageSize);
    if (items.length <= 20) return { rows, footer: "" };
    const sizes = [20, 50, 100].map(n => `<option value="${n}" ${n === this.pageSize ? "selected" : ""}>${n}</option>`).join("");
    const footer = `<div class="tablefoot"><span>${this.formatNumber(from + 1)}–${this.formatNumber(from + rows.length)} ${this.t("of")} ${this.formatNumber(items.length)} · ${this.t("perPage")} <select data-pagesize aria-label="${this.t("perPage")}">${sizes}</select></span>${count > 1 ? `<span class="pager"><button data-lpage="${id}|${page - 1}" ${page === 1 ? "disabled" : ""}>${this.t("previous")}</button> ${this.t("page")} ${page} ${this.t("of")} ${count} <button data-lpage="${id}|${page + 1}" ${page === count ? "disabled" : ""}>${this.t("next")}</button></span>` : ""}</div>`;
    return { rows, footer };
  }

  // A fold: the head always shows, the body only while open. `def` is the state until the person toggles it.
  // head: { tone, title, sub, pill }; the state lives in this.folds and survives a render.
  foldOpen(id, def) { return this.folds?.[id] ?? def; }

  fold(id, head, body, def, force) {
    const open = force ?? this.foldOpen(id, def);
    const pill = head.pill ? `<span class="pill ${head.tone || "mute"}">${this.esc(head.pill)}</span>` : "";
    const top = `<button class="row foldhead" data-fold="${this.esc(id)}" aria-expanded="${open}"><span class="tile ${head.tone || "mute"}"><ha-icon icon="mdi:${open ? "chevron-down" : "chevron-right"}"></ha-icon></span><span class="row-text"><strong>${head.title}</strong>${head.sub ? `<small>${this.esc(head.sub)}</small>` : ""}</span>${pill}</button>`;
    return `<div class="fold${open ? " open" : ""}">${top}${open ? `<div class="foldbody">${body}</div>` : ""}</div>`;
  }
}
