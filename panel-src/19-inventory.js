// InventoryMixin: methods of the panel element, mixed into the class in 99-register.js.
class InventoryMixin {
  filtered() {
    if (!this.data) return [];
    const q = this.query.trim().toLowerCase();
    return this.memo("inventory", [q, this.typeFilter, this.statusFilter, this.originFilter, this.helperIdle, this.sort, this.sortDir, this.lang], () => {
      const { natural, ids } = this.collators(), desc = this.sortDir === "desc";
      const pick = item => this.sort === "status" ? item.status : this.sort === "type" ? item.object_type : this.sort === "since" ? item.status_since : this.sort === "version" ? item.integration_version : this.sort === "entities" ? String(item.entity_count ?? "") : this.sort === "usedByCol" ? String(this.usedByCount(item) ?? "") : this.sort === "changedCol" ? (item.last_changed || "") : (item.name || item.object_id);
      const rows = this.data.objects.filter(item => (!q || this.haystack(item).includes(q)) && (!this.typeFilter || (this.typeFilter === "helper" ? this.isHelper(item) : item.object_type === this.typeFilter))
        && (!this.statusFilter || item.status === this.statusFilter)
        && (!(this.typeFilter === "helper" && this.helperIdle) || this.isIdleHelper(item, Number(this.helperIdle)))
        && (!this.originFilter || (item.object_type === "config_entry" && !!item.custom === (this.originFilter === "custom")))).map(item => ({ item, key: pick(item) }));
      rows.sort((a, b) => {
        if (!a.key !== !b.key) return a.key ? -1 : 1; // missing values stay last in both directions
        const order = natural.compare(String(a.key ?? ""), String(b.key ?? ""));
        return (desc ? -order : order) || ids.compare(String(a.item.object_id), String(b.item.object_id));
      });
      return rows.map(row => row.item);
    });
  }

  // A helper is a config entry of a helper domain or an entity of a helper platform.
  isHelper(item) {
    return item.object_type === "config_entry" ? HELPER_DOMAINS.has(item.domain) : item.object_type === "entity" && (HELPER_PLATFORMS.has(item.platform) || HELPER_DOMAINS.has(item.platform));
  }

  // How many objects use this one (incoming edges of the usage kinds); a config entry adds up its entities.
  usedByIndex() {
    return this.memo("usedBy", [], () => {
      const own = new Map(), perEntry = new Map(), newest = new Map();
      for (const o of this.data.objects) {
        if (o.object_type !== "entity") continue;
        const n = this.edgesTo(this.objectKey(o)).filter(e => USAGE_RELATIONS.includes(e.relation)).length;
        own.set(o.object_id, n);
        if (o.config_entry_id) {
          perEntry.set(o.config_entry_id, (perEntry.get(o.config_entry_id) || 0) + n);
          if (o.last_changed && o.last_changed > (newest.get(o.config_entry_id) || "")) newest.set(o.config_entry_id, o.last_changed);
        }
      }
      return { own, perEntry, newest };
    });
  }

  usedByCount(item) {
    const counts = this.usedByIndex();
    if (item.object_type === "config_entry") return counts.perEntry.get(item.object_id) ?? 0;
    return item.object_type === "entity" ? counts.own.get(item.object_id) ?? 0 : null;
  }

  // A hint, not a finding: nobody uses this helper in what the scan reads and it has not changed for `days` days.
  // Dashboards outside the scan, apps and YAML can still use it, so nothing here suggests deleting it.
  isIdleHelper(item, days) {
    if (!this.isHelper(item) || this.usedByCount(item) !== 0) return false;
    const changed = item.object_type === "config_entry" ? this.usedByIndex().newest.get(item.object_id) : item.last_changed;
    const time = changed ? Date.parse(changed) : NaN;
    return Number.isFinite(time) && Date.now() - time >= days * 86400000;
  }

  // The text a search looks in, built once per object.
  haystack(item) {
    const cache = this._haystacks ||= new WeakMap();
    let text = cache.get(item);
    if (text === undefined) { text = [item.name, item.object_id, item.platform, item.domain, item.unique_id].join(" ").toLowerCase(); cache.set(item, text); }
    return text;
  }

  inventory() {
    if (this.xp?.open) return this.xpView();
    const rows = this.filtered();
    const pg = this.paginate("inventory", rows);
    const visibleRows = pg.rows;
    const { types, statuses } = this.memo("facets", [], () => ({
      types: [...new Set(this.data.objects.map(x => x.object_type))].sort(),
      statuses: [...new Set(this.data.objects.map(x => x.status))].sort(),
    }));
    const all = this.data.objects;
    const tiles = this.invTypesCard(all);
    const hid = key => this.colHidden("inventory", key);
    // Version and entity count only mean something for integrations, so they appear once the list is narrowed to them.
    const integ = this.typeFilter === "config_entry" || !!this.originFilter;
    const helperMode = this.typeFilter === "helper";
    const integCols = [...(integ ? ["version", "entities"] : []), ...(helperMode ? ["usedByCol", "changedCol"] : [])];
    const idleSelect = helperMode ? `<select id="helperIdle" aria-label="${this.t("helperIdleLabel")}"><option value="">${this.t("helperIdleAny")}</option>${["30", "90", "180"].map(d => `<option value="${d}" ${this.helperIdle === d ? "selected" : ""}>${this.t("helperIdleOpt", { days: d })}</option>`).join("")}</select>` : "";
    const idleHint = helperMode && this.helperIdle ? `<div class="hintbox"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon><div><p>${this.esc(this.t("helperIdleHint"))}</p></div></div>` : "";
    const colValue = (item, k) => k === "version" ? (item.object_type === "config_entry" ? item.integration_version || "" : "") : k === "entities" ? (item.object_type === "config_entry" ? item.entity_count ?? 0 : "") : k === "usedByCol" ? this.usedByCount(item) ?? "" : item.last_changed || "";
    this.setExporter("inventory", "inventory", [this.t("name"), "ID", this.t("type"), this.t("status"), this.t("reason"), this.t("since"), ...(integ ? [this.t("origin")] : []), ...integCols.map(k => this.t(k))], () => rows.map(i => [i.name, i.object_id, this.t(i.object_type), this.statusLabel(i.status), i.reason ? this.t(i.reason) : i.missing_reference_count ? `${i.missing_reference_count} ${this.t("missingReferences")}` : "", i.status_since || "", ...(integ ? [i.object_type === "config_entry" ? this.t(i.custom ? "originKindCustom" : "originKindCore") : ""] : []), ...integCols.map(k => colValue(i, k))]));
    const tools = `<div class="listtools">${this.listTools("inventory", ["type", "status", "reason", "since", ...integCols].map(k => ({ key: k, label: k })))}<button type="button" class="btn" data-xp-open><ha-icon icon="mdi:export-variant"></ha-icon>${this.t("xpButton")}</button></div>`;
    return `<div class="stack">${tiles}${this.filterNote(this.invFilterLabels(), 'data-inv-filter="|"')}<div class="panel"><div class="filters invfilters"><input id="query" type="search" value="${this.esc(this.query)}" placeholder="${this.t("search")}"><select id="typeFilter" aria-label="${this.t("type")}"><option value="">${this.t("all")}</option><option value="helper" ${this.typeFilter === "helper" ? "selected" : ""}>${this.t("helperKind")}</option>${types.map(x => `<option value="${x}" ${this.typeFilter === x ? "selected" : ""}>${this.t(x)}</option>`).join("")}</select><select id="statusFilter" aria-label="${this.t("status")}"><option value="">${this.t("allStatus")}</option>${statuses.map(x => `<option value="${x}" ${this.statusFilter === x ? "selected" : ""}>${this.statusLabel(x)}</option>`).join("")}</select><select id="originFilter" aria-label="${this.t("origin")}"><option value="">${this.t("allOrigins")}</option>${["core", "custom"].map(x => `<option value="${x}" ${this.originFilter === x ? "selected" : ""}>${this.t(x === "core" ? "originKindCore" : "originKindCustom")}</option>`).join("")}</select>${idleSelect}
        <div class="mobsort"><select id="sortKey" aria-label="${this.t("sortBy")}">${[["name", "sortName"], ["type", "sortType"], ["status", "sortStatus"], ["since", "sortSince"], ...(integ ? [["version", "version"], ["entities", "entities"]] : []), ...(helperMode ? [["usedByCol", "usedByCol"], ["changedCol", "changedCol"]] : [])].map(([key, label]) => `<option value="${key}" ${this.sort === key ? "selected" : ""}>${this.t(label)}</option>`).join("")}</select><button class="btn" id="sortDir" aria-label="${this.t("sortBy")}">${this.sortDir === "desc" ? "▼" : "▲"}</button></div>${tools}</div>${idleHint}
      <div class="tablewrap inv"><table><thead><tr>${this.th("name", "name")}${hid("type") ? "" : this.th("type", "type")}${hid("status") ? "" : this.th("status", "status")}${hid("reason") ? "" : `<th>${this.t("reason")}</th>`}${hid("since") ? "" : this.th("since", "since")}${integCols.map(k => hid(k) ? "" : this.th(k, k)).join("")}</tr></thead><tbody>${visibleRows.map(item => `<tr data-object="${this.esc(this.objectKey(item))}" tabindex="0" role="button" aria-label="${this.esc(item.name)}"><td><span class="object">${this.tile(item.object_type, this.tone(item.status) === "ok" ? "" : this.tone(item.status))}${this.nameCell(item.name, item.object_id, "span")}</span></td>${hid("type") ? "" : `<td data-label="${this.esc(this.t("type"))}">${this.t(item.object_type)}</td>`}${hid("status") ? "" : `<td data-label="${this.esc(this.t("status"))}">${this.pill(item.status)}</td>`}${hid("reason") ? "" : `<td data-label="${this.esc(this.t("reason"))}">${this.esc(item.reason ? this.t(item.reason) : item.missing_reference_count ? `${item.missing_reference_count} ${this.t("missingReferences")}` : "—")}</td>`}${hid("since") ? "" : `<td data-label="${this.esc(this.t("since"))}">${this.formatDate(item.status_since)}</td>`}${integCols.map(k => hid(k) ? "" : `<td data-label="${this.esc(this.t(k))}">${this.esc(k === "usedByCol" ? (this.usedByCount(item) == null ? "—" : this.formatNumber(this.usedByCount(item))) : k === "changedCol" ? (item.last_changed ? this.formatDate(item.last_changed) : "—") : item.object_type !== "config_entry" ? "—" : k === "version" ? (item.integration_version || "—") : this.formatNumber(item.entity_count ?? 0))}</td>`).join("")}</tr>`).join("")}</tbody></table>${rows.length ? "" : `<div class="emptymsg">${this.t("noResults")}</div>`}</div>
      ${pg.footer || `<div class="tablefoot"><span>${this.formatNumber(rows.length)} ${this.t("of_total")} ${this.formatNumber(this.data.objects.length)} ${this.t("shown")}</span></div>`}</div>`;
  }

  // The labels of the filters the tile block sets (type and state), for the "Filter on" line.
  invFilterLabels() {
    return [this.typeFilter ? (this.typeFilter === "helper" ? this.t("helperKind") : this.t(this.typeFilter)) : "", this.statusFilter ? this.statusLabel(this.statusFilter) : ""].filter(Boolean);
  }

  // The types as a ring with a table beside it: the largest few, the rest behind a button. A row filters the list below (a
  // second click lifts it); the columns for unavailable and orphaned objects filter by type and state together.
  invTypesCard(all) {
    const SHOWN = 5;
    const by = new Map();
    for (const x of all) {
      const r = by.get(x.object_type) || { type: x.object_type, n: 0, un: 0, or: 0 };
      r.n += 1; if (x.status === "unavailable") r.un += 1; else if (x.status === "orphaned") r.or += 1;
      by.set(x.object_type, r);
    }
    const sorted = [...by.values()].sort((a, b) => b.n - a.n || a.type.localeCompare(b.type));
    let rows = this.invAllTypes ? sorted : sorted.slice(0, SHOWN);
    const picked = sorted.find(r => r.type === this.typeFilter);
    if (picked && !rows.includes(picked)) rows = [...rows, picked]; // a chosen type is never hidden
    const rest = sorted.filter(r => !rows.includes(r));
    const total = all.length || 1, sum = key => sorted.reduce((a, r) => a + r[key], 0);
    const colors = ["var(--hk-blue)", "var(--hk-green)", "var(--hk-amber)", "var(--hk-violet)", "color-mix(in srgb,var(--hk-blue) 50%,var(--hk-green))", "color-mix(in srgb,var(--hk-violet) 55%,var(--hk-red))", "color-mix(in srgb,var(--hk-amber) 55%,var(--hk-red))", "color-mix(in srgb,var(--hk-green) 55%,var(--hk-amber))", "color-mix(in srgb,var(--hk-blue) 55%,var(--hk-violet))", "color-mix(in srgb,var(--hk-blue) 40%,var(--hk-gray))", "color-mix(in srgb,var(--hk-green) 40%,var(--hk-gray))"];
    const color = i => colors[i % colors.length];
    const pct = n => `${this.formatNumber(Math.round((n / total) * 1000) / 10)} %`;
    // Ring: one segment per shown type and one grey one for the rest.
    const R = 70, C = 2 * Math.PI * R;
    let acc = 0;
    const seg = (n, stroke, attrs, on) => { const len = Math.max((n / total) * C, 1.5), at = acc; acc += (n / total) * C; return `<circle cx="100" cy="100" r="${R}" fill="none" style="stroke:${stroke}" stroke-width="${on ? 30 : 22}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-at}" transform="rotate(-90 100 100)" ${attrs}/>`; };
    const picks = r => this.typeFilter === r.type && !this.statusFilter;
    const ring = rows.map((r, i) => seg(r.n, color(i), `class="invseg${this.typeFilter && !picks(r) ? " dim" : ""}" data-inv-filter="${this.esc(r.type)}|" tabindex="0" role="button" aria-label="${this.esc(this.t(r.type))}: ${this.formatNumber(r.n)}"`, picks(r))).join("")
      + (rest.length ? seg(rest.reduce((a, r) => a + r.n, 0), "var(--hk-gray)", `class="invseg${this.typeFilter ? " dim" : ""}"`, false) : "");
    const mid = picked && !this.statusFilter ? [this.formatNumber(picked.n), this.t(picked.type)] : [this.formatNumber(all.length), this.t("objects")];
    const donut = `<svg class="invring" viewBox="0 0 200 200" role="img" aria-label="${this.esc(this.t("byType"))}">${ring}<text x="100" y="100" text-anchor="middle" class="invmid">${this.esc(mid[0])}</text><text x="100" y="120" text-anchor="middle" class="invsub">${this.esc(mid[1])}</text></svg>`;
    const num = (n, attr, label) => n ? `<button class="linkbtn" ${attr} aria-label="${this.esc(label)}">${this.formatNumber(n)}</button>` : `<span class="muted">–</span>`;
    const line = (r, i) => `<tr${picks(r) ? ' class="sel"' : ""}><td><button class="linkbtn invtype" data-inv-filter="${this.esc(r.type)}|" aria-pressed="${picks(r)}"><span class="sw" style="background:${color(i)}"></span>${this.esc(this.t(r.type))}</button></td><td>${this.formatNumber(r.n)}</td><td>${pct(r.n)}</td><td>${num(r.un, `data-inv-filter="${this.esc(r.type)}|unavailable"`, `${this.t(r.type)}: ${this.statusLabel("unavailable")}`)}</td><td>${num(r.or, `data-inv-filter="${this.esc(r.type)}|orphaned"`, `${this.t(r.type)}: ${this.statusLabel("orphaned")}`)}</td></tr>`;
    const others = rest.length ? `<tr class="dim"><td><span class="sw" style="background:var(--hk-gray)"></span>${this.esc(this.t("invOthers", { n: rest.length }))}</td><td>${this.formatNumber(rest.reduce((a, r) => a + r.n, 0))}</td><td>${pct(rest.reduce((a, r) => a + r.n, 0))}</td><td>${rest.reduce((a, r) => a + r.un, 0) || "–"}</td><td>${rest.reduce((a, r) => a + r.or, 0) || "–"}</td></tr>` : "";
    const allRow = `<tr class="invall"><td><button class="linkbtn invtype" data-inv-filter="|" aria-pressed="${!this.typeFilter && !this.statusFilter}">${this.esc(this.t("all"))}</button></td><td>${this.formatNumber(all.length)}</td><td>100 %</td><td>${num(sum("un"), `data-inv-filter="|unavailable"`, this.statusLabel("unavailable"))}</td><td>${num(sum("or"), `data-inv-filter="|orphaned"`, this.statusLabel("orphaned"))}</td></tr>`;
    const more = sorted.length > SHOWN ? `<button type="button" class="btn quiet" data-inv-more>${this.esc(this.invAllTypes ? this.t("invFewer", { n: SHOWN }) : this.t("invMore", { n: sorted.length }))}</button>` : "";
    const table = `<table class="invtypes"><thead><tr><th>${this.t("type")}</th><th>${this.t("invColCount")}</th><th>${this.t("invColShare")}</th><th>${this.statusLabel("unavailable")}</th><th>${this.statusLabel("orphaned")}</th></tr></thead><tbody>${rows.map(line).join("")}${others}${allRow}</tbody></table>${more}`;
    const filtered = this.typeFilter || this.statusFilter;
    const shown = this.filtered().length;
    return `<div class="panel">${this.fold("inv_types", { title: this.esc(this.t("byType")), pill: filtered ? this.t("invOfAll", { n: this.formatNumber(shown), total: this.formatNumber(all.length) }) : "" }, `<div class="invbody">${donut}<div class="tablewrap">${table}</div></div>`, true)}</div>`;
  }

  nodeButton(key, label, tone = "") {
    const obj = this.findObject(key);
    const [type, ...rest] = key.split(":");
    const id = rest.join(":");
    return `<button class="node" data-graph="${this.esc(key)}">${this.tile(type, tone)}<span><small>${this.t(type)}</small><strong>${this.esc(obj?.name || id)}</strong><span class="meta">${this.esc(label || (obj ? obj.object_id : this.t("missing")))}</span></span>${obj ? this.pill(obj.status) : `<span class="pill red">${this.t("missing")}</span>`}</button>`;
  }

  graph() {
    const search = `<div class="panel" style="margin-bottom:14px;overflow:visible"><div class="search">${this.pickerBox("graph", this.t("searchObject"), 'id="graphQuery"')}</div></div>`;
    if (!this.graphSelected) {
      return `${search}<div class="panel"><div class="emptymsg"><ha-icon icon="mdi:graph-outline"></ha-icon>${this.t("graphHint")}</div></div>`;
    }
    const item = this.graphSelected, key = this.objectKey(item);
    const head = `<div class="panel pathcard">${this.tile(item.object_type, this.tone(item.status) === "ok" ? "" : this.tone(item.status))}<div><h2>${this.esc(item.name)} ${this.pill(item.status)}</h2><span class="id">${this.esc(item.object_id)}</span></div><button class="btn" data-object="${this.esc(key)}">${this.t("details")}</button></div>`;
    if (this.useGraph()) return `${search}${head}${this.graphBar(item, key)}${this.graphPanel(item, key)}`;
    const USAGE = USAGE_RELATIONS;
    const incoming = this.edgesTo(key), outgoing = this.edgesFrom(key);
    const originEdges = incoming.filter(e => !USAGE.includes(e.relation));
    const usageEntries = [
      ...incoming.filter(e => USAGE.includes(e.relation)).map(e => ({ key: e.source, edge: e, label: `${this.t("usedBy")} · ${this.t(e.relation)}` })),
      ...outgoing.map(e => ({ key: e.target, edge: e, label: this.t(e.relation) })),
    ];
    const edgeNote = edge => `${this.t(edge.confidence)}${edge.location && edge.location !== "runtime_extraction" ? ` · ${edge.location}` : ""}`;
    const origin = originEdges.map(e => `${this.nodeButton(e.source, edgeNote(e))}<div class="link-label"><ha-icon icon="mdi:arrow-down" class="u-ic14"></ha-icon>${this.t(e.relation)}</div>`).join("");
    const usage = usageEntries.length
      ? `<div class="branch">${usageEntries.map(u => `<div><div class="link-label" style="margin:0;border:0;padding:0 0 4px">${u.label}</div>${this.nodeButton(u.key, edgeNote(u.edge))}</div>`).join("")}</div>`
      : `<p style="padding:6px 16px;color:var(--hk-muted);font-size:calc(12px*var(--hk-fs,1))">${this.t("noRelations")}</p>`;
    return `${search}${head}${this.graphBar(item, key)}
      <div class="panel"><div class="panelhead"><h2>${this.t("origin")} → ${this.t("usage")}</h2><span class="date">${this.t("origin")} ${originEdges.length} · ${this.t("usage")} ${usageEntries.length}</span></div>
      <div class="path">${origin}<div class="node current">${this.tile(item.object_type, this.tone(item.status) === "ok" ? "" : this.tone(item.status))}<span><small>${this.t(item.object_type)}</small><strong>${this.esc(item.name)}</strong><span class="meta">${this.esc(item.object_id)}</span></span>${this.pill(item.status)}</div>${usage}</div></div>`;
  }
}
