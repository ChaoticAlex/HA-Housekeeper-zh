// ChangesMixin: methods of the panel element, mixed into the class in 99-register.js.
const HISTORY_PREVIEW = 5;

class ChangesMixin {
  async loadCompare() {
    const request = this._compareRequest = (this._compareRequest || 0) + 1;
    this.compareLoading = true; this.render();
    try {
      const compare = await this._hass.callWS({ type: "ha_housekeeper/compare", baseline: this.compareBaseline });
      if (request !== this._compareRequest) return;
      this.compare = compare;
    } catch (err) {
      if (request !== this._compareRequest) return;
      this.compare = null; this.failed(err);
    }
    if (request === this._compareRequest) { this.compareLoading = false; this.render(); }
  }

  // One row per stored scan (newest first) with its totals; a click picks it as the comparison base.
  historyTimeline(c, baselines) {
    const rows = baselines.length >= 2 || baselines.some(b => b.pinned) ? [{ id: "", at: this.data?.meta?.scanned_at, ...c.current, now: true }, ...[...baselines].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))] : [];
    const max = Math.max(1, ...rows.map(r => r.findings || 0));
    const scans = rows.map((r, i) => {
      const older = rows[i + 1], delta = older ? (r.findings || 0) - (older.findings || 0) : 0;
      const pill = delta ? `<span class="pill ${delta > 0 ? "red" : "ok"}">${delta > 0 ? "+" : ""}${delta}</span>` : "";
      const selected = !r.now && r.id === this.compareBaseline;
      const label = r.now ? this.t("currentScan") : r.pinned ? this.pinLabel(r) : r.id === "previous" ? this.t("previousScan") : this.t("storedScan");
      const when = r.pinned ? this.formatDate(r.at) : label;
      const plain = !r.now && !r.pinned && r.id !== "previous";
      const title = plain ? this.esc(this.scanDay(r.at)) : r.now || !r.pinned ? `${label} · ${this.esc(this.formatDate(r.at))}` : `${this.esc(label)}`;
      const inner = `<span class="tile ${selected ? "" : "mute"}"><ha-icon icon="${r.now ? "mdi:clock-check-outline" : r.pinned ? "mdi:pin-outline" : "mdi:history"}"></ha-icon></span><span class="row-text"><strong>${title}</strong><small>${r.pinned ? `${this.t("storedPin")} · ${this.esc(when)} · ` : plain ? `${this.esc(label)} · ` : ""}${this.t("historyCounts", { objects: this.formatNumber(r.objects || 0), findings: this.formatNumber(r.findings || 0) })}</small><span class="bar" style="margin-top:4px"><i style="width:${Math.round(((r.findings || 0) / max) * 100)}%"></i></span></span>${r.pinned ? this.pinActions(r) : pill}`;
      if (r.now) return { selected, html: `<div class="row rel">${inner}</div>` };
      if (r.pinned) return { selected, html: `<div class="row rel ${selected ? "sel" : ""}" role="button" tabindex="0" data-baseline="${this.esc(r.id)}">${inner}</div>` };
      return { selected, html: `<button class="row rel ${selected ? "sel" : ""}" data-baseline="${this.esc(r.id)}">${inner}</button>` };
    });
    // Closed, the list shows the newest few (and the chosen one) so the result of the comparison is not pushed off the screen.
    const collapsed = scans.length > HISTORY_PREVIEW + 1 && !this.historyAll;
    const list = collapsed ? scans.filter((e, i) => i < HISTORY_PREVIEW || e.selected) : scans;
    const pg = collapsed ? { rows: list.map(e => e.html), footer: "" } : this.paginate("history", list.map(e => e.html));
    const toggle = scans.length > HISTORY_PREVIEW + 1 ? `<div class="tablefoot"><button class="link" data-history-all>${collapsed ? this.t("historyAll", { n: this.formatNumber(scans.length) }) : this.t("historyLess")}</button></div>` : "";
    const hint = baselines.length <= 1 ? `<p class="factnote" style="margin:10px 16px">${this.t("historyBuilding", { days: c.retention_days ?? 30 })}</p>` : "";
    return `<section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("historyTitle")}</h2><p>${this.t("historyHint", { days: c.retention_days ?? 30 })}</p></div><div class="actions">${this.baselineSelect(baselines)}${this.pinDraft ? "" : this.pinHeadButton()}</div></div>${this.pinEditor()}${hint}${pg.rows.join("")}${pg.footer}${toggle}</section>`;
  }

  // The weekday, day, month and time of a stored scan, in the language of the panel.
  scanDay(at) {
    try { return new Intl.DateTimeFormat(this.lang, { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(at)); }
    catch (_) { return at; }
  }

  // The label and the choice of the comparison base: the same as a click on a row, for the keyboard and screen readers.
  baselineSelect(baselines) {
    const options = baselines.map(b => `<option value="${this.esc(b.id)}" ${b.id === this.compareBaseline ? "selected" : ""}>${b.id === "previous" ? `${this.t("previousScan")} · ` : b.pinned ? `${this.esc(this.t("storedPin"))}: ${this.esc(b.name || "")} · ` : ""}${this.esc(this.formatDate(b.at))}</option>`).join("");
    return options ? `<label for="baseline" style="color:var(--hk-muted);font-size:calc(12px*var(--hk-fs,1))">${this.t("compareWith")}</label><select id="baseline">${options}</select>` : "";
  }

  // The report of the changes as Markdown, for the baseline closest to a week back (loaded first when another is set).
  async weeklyReport() {
    const week = Date.now() - 7 * 864e5;
    const list = (this.compare?.baselines || []).filter(b => b.at);
    const best = list.length ? list.reduce((a, b) => (Math.abs(Date.parse(b.at) - week) < Math.abs(Date.parse(a.at) - week) ? b : a)) : null;
    if (best && best.id !== this.compareBaseline) { this.compareBaseline = best.id; await this.loadCompare(); }
    const c = this.compare;
    if (!c?.available) return;
    const name = o => `${o.name || o.object_id} (${o.object_id})`;
    const list20 = (title, part, line) => (part.total ? [`## ${title} (${part.total})`, ...part.items.slice(0, 20).map(line), part.total > 20 ? `- … ${this.t("moreItems", { count: part.total - 20 })}` : "", ""] : []);
    const h = this.health();
    const lines = [
      `# ${this.t("weeklyTitle")}`, "",
      `${this.t("comparedWith")} ${this.formatDate(c.baseline_at)} → ${this.formatDate(this.data.meta.scanned_at)}`, "",
      `- ${this.t("health")}: ${h.percent} %`,
      ...[["statusChanges", c.status_changes], ["newFindings", c.new_findings], ["resolvedFindings", c.resolved_findings], ["endedFindings", c.ended_findings || { total: 0 }], ["newObjects", c.new_objects], ["removedObjects", c.removed_objects]].map(([label, part]) => `- ${this.t(label)}: ${part.total}`), "",
      ...list20(this.t("newFindings"), c.new_findings, f => `- ${this.findingTitle(f)}: ${name({ name: this.findObject(this.findingKey(f))?.name, object_id: f.object_id })}`),
      ...list20(this.t("resolvedFindings"), c.resolved_findings, f => `- ${this.findingTitle(f)}: ${f.object_id}`),
      ...list20(this.t("newObjects"), c.new_objects, o => `- ${this.t(o.object_type)}: ${name(o)}`),
      ...list20(this.t("removedObjects"), c.removed_objects, o => `- ${this.t(o.object_type)}: ${name(o)}`),
      ...list20(this.t("statusChanges"), c.status_changes, o => `- ${name(o)}: ${this.t(o.from)} → ${this.t(o.to)}`),
    ];
    const loud = this.storms?.available && !this.storms.busy ? (this.storms.entities || []).slice(0, 5) : [];
    if (loud.length) lines.push(`## ${this.t("weeklyRecorder")}`, ...loud.map(e => `- ${e.entity_id}: ${this.t("polRate", { n: this.formatNumber(e.per_day) })}`), "");
    this.downloadText("report.md", lines.filter(l => l !== undefined).join("\n"), "text/markdown");
  }

  changeRank(status) { return { active: 0, disabled: 1, empty: 1, unknown: 2, problem: 3, orphaned: 3, unavailable: 3 }[status] ?? 1; }

  // Two tabs: the comparison of the scans and the logbook with the entries you and Housekeeper wrote.
  changesView() {
    const tabs = [{ id: "compare", label: this.t("tabScans") }, { id: "logbook", label: this.t("logbook"), count: this.notesList().length }];
    const open = this.viewTabOf("changes", tabs, "compare");
    return `${this.viewTabBar("changes", tabs, open)}${open === "logbook" ? this.logbookView() : this.changesCompare()}`;
  }

  changesCompare() {
    const c = this.compare?.available ? this.compare : (this.pinDraft && this.pinPreviousCompare) || this.compare;
    if (!c) return `${this.skeleton("loading")}`;
    this.ensureCorrelations();
    const baselines = c.baselines || [];
    const options = this.baselineSelect(baselines);
    const hint = baselines.length <= 1 ? `<p class="factnote" style="margin:10px 0 0">${this.t("historyBuilding", { days: c.retention_days ?? 30 })}</p>` : "";
    const picker = options ? `<div class="panel u-mb14"><div class="filters" style="grid-template-columns:auto minmax(220px,360px)">${options}</div>${hint}</div>` : "";
    if (!c.available) {
      const meta = this.data?.meta || {};
      const why = meta.preliminary ? this.t("noBaselinePreliminary") : this.t("noBaselineOneScan", { hours: meta.scan_interval_hours || 24 });
      return `${picker}<div class="panel"><div class="emptymsg"><ha-icon icon="mdi:history"></ha-icon>${why}<button class="btn primary" data-scan-point ${this.busy || this.cleanupRunning() ? 'disabled aria-busy="true"' : ""}>${this.t("scanPoint")}</button></div></div>`;
    }
    const sections = [
      ["statusChanges", "mdi:swap-horizontal", c.status_changes], ["newFindings", "mdi:alert-outline", c.new_findings],
      ["resolvedFindings", "mdi:check-circle-outline", c.resolved_findings], ["endedFindings", "mdi:help-circle-outline", c.ended_findings || { total: 0, items: [] }],
      ["newObjects", "mdi:plus-circle-outline", c.new_objects],
      ["removedObjects", "mdi:minus-circle-outline", c.removed_objects],
    ];
    const total = sections.reduce((n, [, , part]) => n + part.total, 0);
    const cards = this.sumTiles(sections.map(([label, , part]) => ({ label: this.t(label), value: this.formatNumber(part.total), tone: !part.total ? "mute" : label === "resolvedFindings" ? "ok" : label === "newFindings" ? "warn" : "mute", ...(part.total ? { attr: ["data-changes-cat", label], active: this.changesCat === label } : {}) })));
    const more = part => part.total > part.items.length ? `<p class="factnote">${this.t("moreItems", { count: part.total - part.items.length })}</p>` : "";
    const st = this.lvState("changes", "", "asc"), query = st.q.trim().toLowerCase();
    const typeOf = it => it.object_type || String(it.rule_id || "").split(".")[0];
    const matches = it => (!query || [it.name, it.object_id, it.rule_id, it.affected_object, typeOf(it)].join(" ").toLowerCase().includes(query)) && (!st.f.type || typeOf(it) === st.f.type);
    const allTypes = [...new Set(sections.flatMap(([, , part]) => part.items.map(typeOf)).filter(Boolean))].sort();
    const bar = total ? this.listBar("changes", { sorts: [], filters: [{ name: "type", all: this.t("allTypes"), options: allTypes.map(x => [x, this.t(x)]) }] }) : "";
    const paged = (id, items, render) => {
      const shown = items.filter(matches);
      if (items.length && !shown.length) return `<div class="emptymsg">${this.t("changesFiltered", { n: items.length })}</div>`;
      const pg = this.paginate(`changes-${id}`, shown);
      return pg.rows.map(render).join("") + pg.footer;
    };
    const objectRow = (o, note, pillHtml) => {
      const key = `${o.object_type}:${o.object_id}`, obj = this.findObject(key);
      const inner = `${this.tile(o.object_type, obj ? (this.tone(obj.status) === "ok" ? "" : this.tone(obj.status)) : "mute")}<span class="row-text"><strong>${this.esc(o.name || obj?.name || o.object_id)}</strong><small>${this.esc(note)}</small></span>${pillHtml}`;
      return obj ? `<button class="row rel" data-object="${this.esc(key)}">${inner}</button>` : `<div class="row rel">${inner}</div>`;
    };
    const changes = [...c.status_changes.items].sort((a, b) => (this.changeRank(b.to) - this.changeRank(b.from)) - (this.changeRank(a.to) - this.changeRank(a.from)));
    const body = {
      statusChanges: paged("statusChanges", changes, ch => objectRow(ch, `${this.t(ch.from)} → ${this.t(ch.to)} · ${this.t(ch.object_type)}`, `<span class="pill ${this.changeRank(ch.to) > this.changeRank(ch.from) ? "red" : this.changeRank(ch.to) < this.changeRank(ch.from) ? "ok" : "mute"}">${this.t(this.changeRank(ch.to) > this.changeRank(ch.from) ? "worsened" : this.changeRank(ch.to) < this.changeRank(ch.from) ? "improved" : "changed")}</span>`)),
      newFindings: paged("newFindings", c.new_findings.items, f => this.findingRow(f)),
      resolvedFindings: paged("resolvedFindings", c.resolved_findings.items, f => {
        const type = f.rule_id.split(".")[0];
        return objectRow({ object_type: type, object_id: f.object_id }, `${f.affected_object ? `${f.affected_object} · ` : ""}${this.findingTitle(f)}`, `<span class="pill ok">${this.t("improved")}</span>`);
      }),
      // Gone, but not repaired: the object left with its findings, or the reason cannot be told.
      endedFindings: paged("endedFindings", (c.ended_findings || { items: [] }).items, f => objectRow({ object_type: f.rule_id.split(".")[0], object_id: f.object_id }, `${f.affected_object ? `${f.affected_object} · ` : ""}${this.findingTitle(f)}`, `<span class="pill mute">${f.reason === "unchecked" ? this.esc(this.endedSourceLabel(f)) : this.t({ object_removed: "endedObjectRemoved", rules_changed: "endedRules" }[f.reason] || "endedUnknown")}</span>`)),
      newObjects: paged("newObjects", c.new_objects.items, o => objectRow(o, `${this.t(o.object_type)} · ${o.object_id}`, this.pill(o.status))),
      removedObjects: paged("removedObjects", c.removed_objects.items, o => objectRow(o, `${this.t(o.object_type)} · ${this.t("gone")}`, "")),
    };
    // One section is open at a time: the one a tile picked, else the first with entries; the heading of each carries its number.
    const filled = sections.filter(([, , part]) => part.total), first = filled[0]?.[0];
    const panels = filled.map(([label, , part]) => `<div class="panel u-mb14">${this.fold(`chg_${label}`, { tone: label === "newFindings" ? "warn" : label === "resolvedFindings" ? "ok" : "mute", title: this.t(label), pill: this.formatNumber(part.total) }, `${body[label]}${more(part)}`, label === first, this.changesCat ? this.changesCat === label : undefined)}</div>`).join("");
    return `${this.historyTimeline(c, baselines)}<p class="sub" style="margin:0 0 14px">${this.t("comparedWith")} <b>${this.formatDate(c.baseline_at)}</b> <button class="btn quiet" data-weekly title="${this.esc(this.t("weeklyHint"))}">${this.t("weeklyBtn")}</button></p>${c.unread_objects?.total ? `<p class="factnote" style="margin:0 0 14px">${this.t("covUnread", { n: this.formatNumber(c.unread_objects.total) })}</p>` : ""}${cards}${this.corrGroupsCard()}${total ? `<div class="panel u-mb14">${bar}</div>${panels}` : `<div class="panel"><div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("noChanges")}</div></div>`}`;
  }
}
