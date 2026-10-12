// CounterMixin: find sensor glitches in counters (a wrong reading that comes back) and repair the recorder rows.
class CounterMixin {
  async loadCounterScan(refresh = false) {
    this.counterLoading = true; this.counterError = ""; this.render();
    try {
      const id = (this.counterId || "").trim();
      this.counterScan = await this._hass.callWS({ type: "ha_housekeeper/counter_scan", refresh, ...(id ? { statistic_id: id } : {}) });
    } catch (err) { this.counterError = err?.message || String(err); }
    this.counterLoading = false; this.render();
  }

  // The reading before and after the repair around one glitch: original dashed, repaired solid.
  counterChart(series, unit = "") {
    if (!series || series.length < 3 || series.every(p => p[1] === p[2])) return ""; // nothing differs, so nothing to draw
    const w = 360, h = 90, pad = 4;
    const xs = series.map(p => p[0]), ys = series.flatMap(p => [p[1], p[2]]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sx = x => pad + ((x - x0) / Math.max(1, x1 - x0)) * (w - 2 * pad);
    const sy = y => h - pad - ((y - y0) / Math.max(1e-9, y1 - y0)) * (h - 2 * pad);
    const line = i => series.map(p => `${sx(p[0]).toFixed(1)},${sy(p[i]).toFixed(1)}`).join(" ");
    const v = y => `${this.formatNumber(Math.round(y * 100) / 100)}${unit ? ` ${unit}` : ""}`;
    const svg = `<svg class="rangechart" role="img" aria-label="${this.esc(this.t("counterChartLabel"))}" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;margin:6px 0">${[1, 2, 3].map(k => `<line class="grid" x1="${pad}" x2="${w - pad}" y1="${(k * h) / 4}" y2="${(k * h) / 4}"/>`).join("")}<polyline fill="none" stroke="var(--hk-red)" stroke-width="1.5" stroke-dasharray="4 3" points="${line(1)}"/><polyline fill="none" stroke="var(--hk-green)" stroke-width="2" points="${line(2)}"/></svg>`;
    const legend = `<small class="u-dim u-block"><span style="color:var(--hk-red)">- - -</span> ${this.t("counterOriginal")} · <span style="color:var(--hk-green)">───</span> ${this.t("counterRepaired")}</small>`;
    // The axes are text around the drawing: highest and lowest value on the left, first and last time below.
    return `<div class="chartaxes"><span class="chartY"><span>${this.esc(v(y1))}</span><span>${this.esc(v(y0))}</span></span>${svg}<span class="chartX"><span>${this.esc(this.formatDate(x0 * 1000))}</span><span>${this.esc(this.formatDate(x1 * 1000))}</span></span></div>${legend}`;
  }

  counterRange(f) {
    return `${this.formatDate(f.bad_first * 1000)} – ${this.formatDate(f.bad_last * 1000)}`;
  }

  // What a counter repair will change, per glitch and per table.
  counterDetail(action) {
    if (action.kind === "repair_range") return this.rangeDetail(action);
    const c = action.counter || {}, unit = c.unit || "";
    const n = v => this.formatNumber(Math.round(v * 1000) / 1000);
    const lines = (c.findings || []).map(f => `${this.t("counterFinding", { range: this.counterRange(f), low: n(f.low), high: n(f.high), before: n(f.good_before), after: n(f.good_after), unit })}`);
    const counts = c.counts || {};
    const rows = this.t("counterRows", { states: this.formatNumber(counts.states || 0), short: this.formatNumber(counts.short_term || 0), long: this.formatNumber(counts.long_term || 0), tail: this.formatNumber((counts.tail_long_term || 0) + (counts.tail_short_term || 0)) });
    const skipped = Object.entries(c.skipped || {}).map(([table, list]) => this.t("counterSkipped", { table: this.t(`counterTable_${table}`), count: list.length })).join(" ");
    const undone = action.result?.state === "undone" ? `<small class="u-block">${this.t("counterUndone")}</small>` : "";
    const charts = (c.findings || []).slice(0, 3).map(f => this.counterChart(f.series, unit)).join("");
    return `<span class="u-pt6 u-block"><strong class="u-block">${this.t("rangeChecked")}</strong>${lines.map(l => `<small class="u-block">${this.esc(l)}</small>`).join("")}<small class="u-block">${this.esc(rows)}</small>${skipped ? `<small class="u-amber u-block">${this.esc(skipped)}</small>` : ""}${charts}${undone}</span>`;
  }

  // One table of a range cleanup: the first rows with the old and the new value.
  rangeTable(name, rows, cols, count, extra = "") {
    const n = v => v == null ? "–" : this.esc(this.formatNumber(Math.round(Number(v) * 1000) / 1000));
    const cell = v => Array.isArray(v) ? v.map(n).join(" / ") : n(v);
    const head = (cols || []).map(c => this.t(`rangeCol_${c}`)).join(" / ");
    const body = rows.map(r => `<tr><td>${r[0] ? this.esc(this.formatDate(r[0] * 1000)) : "–"}</td><td>${cell(r[1])}</td><td>→</td><td>${cell(r[2])}</td></tr>`).join("");
    const more = count > rows.length ? `<small class="u-block">${this.esc(this.t("rangeMoreRows", { count: this.formatNumber(count - rows.length) }))}</small>` : "";
    return `<details><summary>${this.esc(this.t(`counterTable_${name}`))} · ${this.formatNumber(count)}${head ? ` · ${this.esc(head)}` : ""}</summary>${count ? `<table style="width:100%;font-size:12px;border-collapse:collapse;margin:4px 0"><tbody>${body}</tbody></table>${more}` : `<small class="u-block">${this.t("rangeNothingHere")}</small>`}${extra}</details>`;
  }

  // What a range cleanup will do: where the data is, what is replaced by what, per table.
  rangeDetail(action) {
    const c = action.counter || {}, unit = c.unit ? ` ${c.unit}` : "";
    const n = v => v == null ? "–" : `${this.formatNumber(Math.round(v * 1000) / 1000)}${unit}`;
    const range = c.range || action.range || {}, counts = c.counts || {}, avail = c.available || {}, d = c.detail || {};
    const line = text => `<small class="u-block">${this.esc(text)}</small>`;
    const warn = text => `<small class="u-amber u-block">${this.esc(text)}</small>`;
    const idle = (action.reasons || []).length > 0 && action.reasons.every(r => NOTHING_REASONS.includes(r));
    const out = [line(this.t("rangeWhat", { kind: this.t(`rangeKind_${c.kind || "counter"}`), range: `${this.formatDate(range.from * 1000)} – ${this.formatDate(range.to * 1000)}`, mode: this.t(`rangeMode_${action.mode || "hold"}`) + (range.fixed != null ? ` (${n(range.fixed)})` : "") }))];
    if (c.bracket) out.push(line(this.t("rangeBracket", { before: n(c.bracket[1]), after: n(c.bracket[3]) })));
    if (idle) return `<span class="u-pt6 u-block"><strong class="u-block">${this.t("rangeChecked")}</strong>${out.join("")}</span>`; // no tables, no chart: there is nothing to show
    out.push(line(this.t("rangeChanges", { states: this.formatNumber(counts.states || 0), short: this.formatNumber(counts.short_term || 0), long: this.formatNumber(counts.long_term || 0) })));
    for (const t of ["states", "short_term", "long_term"]) if (c.available && !avail[t]) out.push(warn(this.t("rangeGone", { table: this.t(`counterTable_${t}`) })));
    if (counts.estimated_long_term) out.push(warn(this.t("rangeEstimated", { count: this.formatNumber(counts.estimated_long_term) })));
    if (counts.tail_short_term || counts.tail_long_term) out.push(line(this.t("rangeTail", { short: this.formatNumber(counts.tail_short_term || 0), long: this.formatNumber(counts.tail_long_term || 0) })));
    const skipped = Object.entries(c.skipped || {}).map(([table, list]) => this.t("counterSkipped", { table: this.t(`counterTable_${table}`), count: list.length })).join(" ");
    if (skipped) out.push(warn(skipped));
    const tables = [
      this.rangeTable("states", d.states || [], [], counts.states || 0),
      this.rangeTable("short_term", d.short_term?.rows || [], d.short_term?.cols, counts.short_term || 0),
      this.rangeTable("long_term", d.long_term?.rows || [], d.long_term?.cols, counts.long_term || 0),
    ].join("");
    const undone = action.result?.state === "undone" ? line(this.t("counterUndone")) : "";
    const avails = line(this.t("rangeAvail", { states: this.formatNumber(avail.states || 0), short: this.formatNumber(avail.short_term || 0), long: this.formatNumber(avail.long_term || 0) }));
    // What happens and what to watch out for stays in view; the rows themselves are for whoever wants to check.
    return `<span class="u-pt6 u-block"><strong class="u-block">${this.t("rangeChecked")}</strong>${out.join("")}${this.counterChart(c.series, c.unit || "")}${undone}<details class="rowdetails"><summary>${this.t("rangeTech")}</summary>${avails}${line(this.t("rangeColHint"))}${tables}</details></span>`;
  }

  saveRange(root) {
    const read = (sel, old) => root.querySelector(sel)?.value ?? old ?? "";
    this.rangeFrom = read("[data-range-from]", this.rangeFrom); this.rangeTo = read("[data-range-to]", this.rangeTo); this.rangeFixed = read("[data-range-fixed]", this.rangeFixed);
    this.rangeMode = read("[data-range-mode]", this.rangeMode) || "hold";
  }

  // Picks the range from the two date fields; the plan is only created when the input makes sense.
  pickRange(root) {
    this.saveRange(root);
    const from = new Date(this.rangeFrom).getTime() / 1000, to = new Date(this.rangeTo).getTime() / 1000;
    const mode = this.rangeMode, fixed = Number(String(this.rangeFixed).replace(",", "."));
    this.counterSel = (this.counterId || "").trim();
    if (!this.counterSel || !(from < to) || (mode === "fixed" && !Number.isFinite(fixed))) { this.cleanupError = this.t("rangeNeedInput"); this.render(); return; }
    this.counterRangeReq = { mode, range: { from, to, ...(mode === "fixed" ? { fixed } : {}) } };
    this.createPlan();
  }

  localStamp(sec) {
    const d = new Date(sec * 1000), p = v => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // Loads the readings the range is picked on; the window is the last N days or an explicit one.
  async loadRangeSeries(win) {
    const id = (this.counterId || "").trim();
    if (!id) { this.cleanupError = this.t("rangeNeedInput"); this.render(); return; }
    const now = Date.now() / 1000;
    this.rangeWin = win || { from: now - (this.rangeDays || 7) * 86400, to: now };
    this.rangeSeries = null; this.rangeSeriesError = ""; this.rangeSeriesLoading = true; this.render();
    try {
      const found = await this._hass.callWS({ type: "ha_housekeeper/range_series", statistic_id: id, from: this.rangeWin.from, to: this.rangeWin.to });
      if (found.error) this.rangeSeriesError = this.t(`reason_${found.error}`); else this.rangeSeries = { ...found, id };
    } catch (err) { this.rangeSeriesError = err?.message || String(err); }
    this.rangeSeriesLoading = false; this.render();
  }

  // The readings with the picked range shaded and two sliders to move its ends.
  rangeChart() {
    const sr = this.rangeSeries, win = this.rangeWin;
    if (this.rangeSeriesLoading) return this.skeleton("counterScanning");
    if (this.rangeSeriesError) return `<div class="error">${this.esc(this.rangeSeriesError)}</div>`;
    if (!sr || !win || !sr.points.length) return sr ? `<p class="factnote">${this.t("rangeNoData")}</p>` : "";
    const w = 640, h = 150, pad = 4, span = Math.max(1, win.to - win.from);
    const ys = sr.points.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sx = t => pad + ((t - win.from) / span) * (w - 2 * pad), sy = y => h - pad - ((y - y0) / Math.max(1e-9, y1 - y0)) * (h - 2 * pad);
    const pt = p => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`;
    const line = sr.points.map(pt).join(" ");
    const f = new Date(this.rangeFrom).getTime() / 1000, t = new Date(this.rangeTo).getTime() / 1000;
    const has = f < t;
    const area = `M${sx(win.from).toFixed(1)},${h - pad} L${sr.points.map(pt).join(" L")} L${sx(win.to).toFixed(1)},${h - pad} Z`;
    const grid = [1, 2, 3].map(k => `<line class="grid" x1="${pad}" x2="${w - pad}" y1="${(k * h) / 4}" y2="${(k * h) / 4}"/>`).join("");
    const bad = has ? sr.points.filter(p => p[0] >= f && p[0] <= t).map(pt).join(" ") : "";
    const slider = (name, value) => `<input type="range" min="0" max="1000" step="1" value="${Math.round(Math.min(1, Math.max(0, (value - win.from) / span)) * 1000)}" data-range-slide="${name}" aria-label="${this.esc(this.t(name === "from" ? "rangeFrom" : "rangeTo"))}" style="width:100%;max-width:${w}px;display:block">`;
    return `<svg class="rangechart" role="img" aria-label="${this.esc(this.t("rangeChartLabel"))}" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;margin:6px 0">${grid}<rect data-range-band x="${has ? sx(Math.max(win.from, f)).toFixed(1) : 0}" width="${has ? Math.max(1, sx(Math.min(win.to, t)) - sx(Math.max(win.from, f))).toFixed(1) : 0}" y="0" height="${h}" rx="4" fill="var(--hk-amber)" opacity=".2"/><path d="${area}" fill="var(--hk-blue)" opacity=".08"/><polyline fill="none" stroke="var(--hk-blue)" stroke-width="2" stroke-linejoin="round" points="${line}"/>${bad.includes(" ") ? `<polyline fill="none" stroke="var(--hk-red)" stroke-width="2.4" points="${bad}"/>` : ""}</svg>
      <small class="u-dim u-block">${this.esc(this.formatDate(win.from * 1000))} – ${this.esc(this.formatDate(win.to * 1000))} · ${this.esc(this.t(`rangeTable_${sr.table}`))} · ${this.esc(this.formatNumber(Math.round(y0 * 100) / 100))} … ${this.esc(this.formatNumber(Math.round(y1 * 100) / 100))} ${this.esc(sr.unit || "")}</small>
      ${slider("from", has ? f : win.from)}${slider("to", has ? t : win.to)}`;
  }

  // Moves one end of the range with its slider; the fields and the shaded band follow without a redraw.
  slideRange(root, slider) {
    const win = this.rangeWin; if (!win) return;
    const at = el => win.from + (Number(el?.value ?? 0) / 1000) * (win.to - win.from);
    let from = at(root.querySelector('[data-range-slide="from"]')), to = at(root.querySelector('[data-range-slide="to"]'));
    if (from > to) { if (slider.dataset.rangeSlide === "from") from = to; else to = from; }
    this.rangeFrom = this.localStamp(from); this.rangeTo = this.localStamp(to);
    const setValue = (sel, v) => { const el = root.querySelector(sel); if (el) el.value = v; };
    setValue("[data-range-from]", this.rangeFrom); setValue("[data-range-to]", this.rangeTo);
    const band = root.querySelector("[data-range-band]"), span = Math.max(1, win.to - win.from), w = 640, pad = 4;
    if (band) { band.setAttribute("x", (pad + ((from - win.from) / span) * (w - 2 * pad)).toFixed(1)); band.setAttribute("width", Math.max(1, ((to - from) / span) * (w - 2 * pad)).toFixed(1)); }
  }

  // A suggestion from the scan: the range is filled in and the readings around it are shown.
  takeRange(id, from, to) {
    this.counterId = id; this.counterRangeReq = null;
    this.rangeFrom = this.localStamp(from); this.rangeTo = this.localStamp(to); this.rangeMode = "hold";
    const pad = Math.max(2 * (to - from), 86400), now = Date.now() / 1000;
    this.loadRangeSeries({ from: from - pad, to: Math.min(now, to + pad) });
  }

  rangeForm() {
    const mode = this.rangeMode || "hold";
    const stamp = value => this.esc(value || "");
    return `<div class="panelhead" style="margin-top:12px"><div><h2>${this.t("rangeTitle")}</h2><p>${this.t("rangeHint")}</p></div></div>
      <div class="setrow"><div><label>${this.t("rangeWindow")}</label><small>${this.t("rangeWindowHint")}</small></div><span style="display:flex;gap:8px;flex-wrap:wrap"><select data-range-days>${[1, 7, 30, 90, 365].map(d => `<option value="${d}" ${(this.rangeDays || 7) === d ? "selected" : ""}>${this.t("rangeDays", { days: d })}</option>`).join("")}</select><button class="btn" data-range-load ${this.rangeSeriesLoading ? 'disabled aria-busy="true"' : ""}>${this.t("rangeLoad")}</button></span></div>
      ${this.rangeChart()}
      <div class="setrow"><div><label>${this.t("rangeFrom")}</label></div><input type="datetime-local" data-range-from value="${stamp(this.rangeFrom)}" style="max-width:260px"></div>
      <div class="setrow"><div><label>${this.t("rangeTo")}</label></div><input type="datetime-local" data-range-to value="${stamp(this.rangeTo)}" style="max-width:260px"></div>
      <div class="setrow"><div><label>${this.t("counterMode")}</label></div><select data-range-mode style="max-width:460px">${["hold", "interpolate", "fixed"].map(m => `<option value="${m}" ${mode === m ? "selected" : ""}>${this.t(`rangeMode_${m}`)}</option>`).join("")}</select></div>
      ${mode === "fixed" ? `<div class="setrow"><div><label>${this.t("rangeFixed")}</label></div><input type="text" inputmode="decimal" data-range-fixed value="${stamp(this.rangeFixed)}" style="max-width:160px"></div>` : ""}
      <div class="setrow planfoot"><small class="u-m0">${this.t("rangeNote")}</small><button class="btn primary" data-range-pick ${this.cleanupBusy ? 'disabled aria-busy="true"' : ""}>${this.cleanupBusy ? this.t("planCreating") : this.t("rangePreview")}</button></div>`;
  }

  counterCard() {
    const s = this.counterScan, mode = this.counterMode || "hold";
    const head = `<div class="panelhead"><div><h2>${this.t("counterTitle")}</h2><p>${this.t("counterHint")}</p></div><div class="actions">${this.kindSelect()}</div></div>`;
    const controls = `<div class="setrow"><div><label>${this.t("counterEntity")}</label><small>${this.t("counterEntityHint")}</small></div>${this.pickerBox("counter", "sensor.water_meter", "data-counter-id")}</div>
      <div class="setrow"><div><label>${this.t("counterMode")}</label></div><select data-counter-mode style="max-width:460px">${["hold", "interpolate"].map(m => `<option value="${m}" ${mode === m ? "selected" : ""}>${this.t(`counterMode_${m}`)}</option>`).join("")}</select></div>
      <div class="setrow planfoot"><small class="u-m0">${this.t("counterScanNote")}</small><button class="btn primary" data-counter-scan ${this.counterLoading ? 'disabled aria-busy="true"' : ""}>${this.counterLoading ? this.t("counterScanning") : this.t("counterScan")}</button></div>`;
    let body = "";
    if (this.counterError) body = `<div class="error">${this.esc(this.counterError)}</div>`;
    else if (s && !s.available) body = `<div class="emptymsg">${this.t("counterNoRecorder")}</div>`;
    else if (s?.busy) body = `<p class="factnote">${this.t("relBusy")}</p>`;
    else if (s) {
      const itemRows = s.items.map(item => {
        const measure = item.kind === "measurement", n3 = v => this.formatNumber(Math.round(v * 1000) / 1000);
        const lines = item.findings.map(f => {
          const extreme = Math.abs(f.high - f.good_before) > Math.abs(f.low - f.good_before) ? f.high : f.low;
          return `<small class="u-block">${this.esc(measure ? this.t("spikeFound", { range: this.counterRange(f), extreme: n3(extreme), good: n3(f.good_before), unit: item.unit || "" }) : this.t("counterFound", { range: this.counterRange(f), low: n3(f.low), good: n3(f.good_before), unit: item.unit || "" }))}</small>`;
        }).join("");
        const action = measure ? `<button class="btn primary" data-range-take="${this.esc(item.statistic_id)}" data-take-from="${item.findings[0].suggest.from}" data-take-to="${item.findings[0].suggest.to}">${this.t("rangeTake")}</button>`
          : `<button class="btn primary" data-counter-pick="${this.esc(item.statistic_id)}" ${this.cleanupBusy ? 'disabled aria-busy="true"' : ""}>${this.cleanupBusy ? this.t("planCreating") : this.t("counterFix")}</button>`;
        return `<div class="row"><span class="tile warn"><ha-icon icon="mdi:chart-line-variant"></ha-icon></span><span class="row-text"><strong>${this.esc(item.name)}</strong>${this.rowId(item.statistic_id)}${lines}</span>${action}</div>`;
      });
      const pg = this.paginate("counterfound", itemRows), items = pg.rows.join("") + pg.footer;
      body = `${items || `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon><strong>${this.t("counterNone")}</strong>${this.t("counterNoneSub", { count: this.formatNumber(s.checked) })}</div>`}<p class="factnote">${this.t("counterChecked", { count: this.formatNumber(s.checked) })}</p>`;
    }
    if (!s && !this.counterError && !this.counterLoading) body = `<div class="emptymsg info"><ha-icon icon="mdi:magnify-scan"></ha-icon><strong>${this.t("counterNotChecked")}</strong>${this.t("counterNotCheckedSub")}</div>`;
    else if (this.counterLoading) body = this.skeleton("counterScanning");
    return `<div class="panel">${head}${controls}${body}${this.rangeForm()}</div>`;
  }

  bindCounter(root) {
    root.querySelector("[data-counter-id]")?.addEventListener("change", e => { this.counterId = e.target.value.trim(); });
    root.querySelector("[data-counter-mode]")?.addEventListener("change", e => { this.counterMode = e.target.value; });
    root.querySelectorAll("[data-counter-scan]").forEach(el => el.addEventListener("click", () => this.loadCounterScan(true)));
    root.querySelectorAll("[data-counter-pick]").forEach(el => el.addEventListener("click", () => { this.counterSel = el.dataset.counterPick; this.counterRangeReq = null; this.createPlan(); }));
    root.querySelector("[data-range-mode]")?.addEventListener("change", () => { this.saveRange(root); this.render(); });
    root.querySelector("[data-range-pick]")?.addEventListener("click", () => this.pickRange(root));
    root.querySelector("[data-range-days]")?.addEventListener("change", e => { this.rangeDays = Number(e.target.value); });
    root.querySelector("[data-range-load]")?.addEventListener("click", () => { this.saveRange(root); this.counterId = (root.querySelector("[data-counter-id]")?.value || this.counterId || "").trim(); this.loadRangeSeries(); });
    root.querySelectorAll("[data-range-from],[data-range-to]").forEach(el => el.addEventListener("change", () => { this.saveRange(root); this.render(); }));
    root.querySelectorAll("[data-range-slide]").forEach(el => el.addEventListener("input", () => this.slideRange(root, el)));
    root.querySelectorAll("[data-range-take]").forEach(el => el.addEventListener("click", () => this.takeRange(el.dataset.rangeTake, Number(el.dataset.takeFrom), Number(el.dataset.takeTo))));
  }
}
Object.assign(TEXT.de, {
  kindCounter: "Sensorfehler bereinigen (falsche Werte in Verlauf und Statistik, Zähler und Messwerte, mit Backup)",
  counterTitle: "Sensorfehler bereinigen", counterHint: "Ein Zähler darf nie sinken. Hat ein Sensor kurz einen falschen Wert geliefert (zum Beispiel ein Wasserzähler), zählt Home Assistant den Rücksprung als neuen Verbrauch. Housekeeper findet solche Ausreißer (bei Messwerten wie einer Temperatur auch Ausschläge weit außerhalb des Üblichen, etwa 85 °C) und ersetzt die falschen Werte im Verlauf, in den 5-Minuten-Werten und in den Stundenwerten; die verfälschte Summe wird neu berechnet. Ein Wert, der dauerhaft niedrig bleibt (Reset, Zählertausch), wird nie angefasst. Vor jedem Lauf entsteht ein Home-Assistant-Backup; die alten Werte bleiben im Journal und lassen sich zurückspielen, solange niemand die Zeilen danach geändert hat.",
  counterEntity: "Nur diesen Sensor prüfen", counterEntityHint: "Leer lassen, um alle Zähler und Messwerte mit Statistik zu prüfen (letztes Jahr).", counterMode: "Womit werden falsche Werte ersetzt?",
  counterMode_hold: "Letzter guter Wert (empfohlen)", counterMode_interpolate: "Gerade Linie zum nächsten guten Wert",
  counterScan: "Sensoren prüfen", counterScanning: "Wird geprüft …", counterScanNote: "Liest nur. Bei vielen Zählern kann das einen Moment dauern.", counterNoRecorder: "Ohne Recorder gibt es nichts zu prüfen.",
  counterNone: "Keine Ausreißer gefunden.", counterChecked: "{count} Sensoren geprüft.", counterPreview: "Vorschau erstellen", counterFix: "Diesen Fund bereinigen", rangePreview: "Zeitraum bereinigen",
  counterFound: "{range}: niedrigster Wert {low} {unit} statt etwa {good} {unit}", counterFinding: "Fehlerhafte Werte {range}: zwischen {low} und {high} {unit}. Gute Werte davor {before} und danach {after} {unit}.",
  counterRows: "Geändert werden {states} Verlaufswerte, {short} 5-Minuten-Werte und {long} Stundenwerte; die Summe wird in {tail} späteren Statistikzeilen berichtigt.",
  counterSkipped: "{table}: {count} Fund(e) nicht reparierbar (keine guten Werte davor oder danach).", counterTable_states: "Verlaufswerte", counterTable_short_term: "5-Minuten-Werte", counterTable_long_term: "Stundenwerte",
  counterOriginal: "Original", counterRepaired: "repariert", counterChartLabel: "Verlauf vor und nach der Reparatur", counterUndone: "Die alten Werte sind wieder eingesetzt.",
  reason_counter_write: "Schreibt in die Recorder-Datenbank (Verlauf und Statistik). Ein Backup entsteht zuerst; die alten Werte lassen sich aus dem Journal zurückspielen.", reason_counter_partial: "Eine der Tabellen kann nicht repariert werden (zu wenig Werte davor oder danach); die anderen schon.",
  reason_no_counter_statistics: "Für diese ID gibt es keine Summenstatistik des Recorders.", reason_nothing_found: "Es gibt nichts zu ändern.", reason_too_many_rows: "Zu viele Zeilen für einen Lauf (mehr als 5000); den Zeitraum erst von Hand eingrenzen.",
  reason_schema_unknown: "Das Datenbankschema dieser Home-Assistant-Version ist Housekeeper nicht bekannt; nichts wird geschrieben.", reason_counter_changed: "Die Daten haben sich seit der Vorschau geändert.",
  confirmWordRepair: "REPARIEREN", confirmedSummaryRepair: "{count} Datenreparatur: Housekeeper legt zuerst ein Home-Assistant-Backup an und startet nur, wenn es erfolgreich ist. Danach überschreibt es falsche Werte im Verlauf und in der Statistik. Die alten Werte bleiben im Journal.",
  result_repaired: "Repariert", check_counter_clean: "Keine Ausreißer mehr", simRepaired: "{count} Sensoren bereinigt",
  abort_counter_changed: "Die Daten wurden nach der Vorschau geändert.", abort_recorder_busy: "Der Recorder ist gerade belegt; später noch einmal versuchen.", abort_verify_failed: "Nach dem Schreiben war der Zähler nicht sauber; es wurde nichts übernommen.",
  undo_recorder_busy: "nicht rückgängig: der Recorder ist gerade belegt, später erneut versuchen",
  abort_schema_unknown: "Das Datenbankschema ist nicht bekannt; nichts wurde geschrieben.", abort_too_many_rows: "Zu viele Zeilen für einen Lauf.", abort_nothing_found: "Es gibt nichts mehr zu reparieren.", abort_no_counter_statistics: "Die Statistik existiert nicht mehr.",
});
Object.assign(TEXT.en, {
  kindCounter: "Repair sensor errors (wrong values in history and statistics, counters and measurements, with backup)",
  counterTitle: "Repair sensor errors", counterHint: "A counter must never fall. If a sensor briefly reported a wrong value (a water meter, for example), Home Assistant counts the jump back as new consumption. Housekeeper finds such outliers (for measurements such as a temperature also spikes far outside the usual range, say 85 °C) and replaces the wrong values in the history, in the 5-minute rows and in the hourly rows; the spoiled sum is recalculated. A value that stays low for good (a reset, a replaced meter) is never touched. A Home Assistant backup is created before every run; the old values stay in the journal and can be put back as long as nobody changed the rows afterwards.",
  counterEntity: "Check this sensor only", counterEntityHint: "Leave empty to check every counter and measurement with statistics (last year).", counterMode: "What replaces the wrong values?",
  counterMode_hold: "Last good value (recommended)", counterMode_interpolate: "Straight line to the next good value",
  counterScan: "Check sensors", counterScanning: "Checking …", counterScanNote: "Only reads. With many counters this can take a moment.", counterNoRecorder: "There is nothing to check without a recorder.",
  counterNone: "No outliers found.", counterChecked: "{count} sensors checked.", counterPreview: "Create preview", counterFix: "Clean up this finding", rangePreview: "Clean up this range",
  counterFound: "{range}: lowest value {low} {unit} instead of about {good} {unit}", counterFinding: "Faulty values {range}: between {low} and {high} {unit}. Good values before {before} and after {after} {unit}.",
  counterRows: "{states} history values, {short} 5-minute rows and {long} hourly rows change; the sum is corrected in {tail} later statistics rows.",
  counterSkipped: "{table}: {count} finding(s) cannot be repaired (no good values before or after).", counterTable_states: "History values", counterTable_short_term: "5-minute rows", counterTable_long_term: "Hourly rows",
  counterOriginal: "original", counterRepaired: "repaired", counterChartLabel: "Readings before and after the repair", counterUndone: "The old values are back.",
  reason_counter_write: "Writes into the recorder database (history and statistics). A backup is created first; the old values can be put back from the journal.", reason_counter_partial: "One of the tables cannot be repaired (too few values before or after); the others can.",
  reason_no_counter_statistics: "The recorder has no sum statistics for this ID.", reason_nothing_found: "There is nothing to change.", reason_too_many_rows: "Too many rows for one run (more than 5000); narrow the period down by hand first.",
  reason_schema_unknown: "Housekeeper does not know the database schema of this Home Assistant version; nothing is written.", reason_counter_changed: "The data changed since the preview.",
  confirmWordRepair: "REPAIR", confirmedSummaryRepair: "{count} data repair: Housekeeper first creates a Home Assistant backup and only continues if it succeeds. It then overwrites wrong values in the history and in the statistics. The old values stay in the journal.",
  result_repaired: "Repaired", check_counter_clean: "No outliers left", simRepaired: "{count} sensors cleaned",
  abort_counter_changed: "The data changed after the preview.", abort_recorder_busy: "The recorder is busy; try again later.", abort_verify_failed: "The counter was not clean after writing; nothing was kept.",
  undo_recorder_busy: "not undone: the recorder is busy, try again later",
  abort_schema_unknown: "The database schema is not known; nothing was written.", abort_too_many_rows: "Too many rows for one run.", abort_nothing_found: "There is nothing left to repair.", abort_no_counter_statistics: "The statistics no longer exist.",
});
Object.assign(TEXT.de, {
  rangeTitle: "Gezielt bereinigen (Zeitraum selbst wählen)", rangeHint: "Für einen Fehler, den du selbst gesehen hast, bei einem Zähler oder einem Messwert (Temperatur, Leistung, …). Die Vorschau zeigt, welche Daten es für den Zeitraum noch gibt und was in jeder Tabelle geändert wird. Verlauf (roh) wird nach der Einstellung des Recorders gelöscht, 5-Minuten-Werte nach etwa 10 Tagen; Stundenwerte bleiben unbegrenzt.",
  rangeFrom: "Von", rangeTo: "Bis", rangeFixed: "Fester Wert", rangeNote: "Es braucht einen guten Wert vor und nach dem Zeitraum. Zähler dürfen dabei nicht sinken.", rangeNeedInput: "Sensor, Von und Bis angeben (Von vor Bis); bei festem Wert auch die Zahl.",
  rangeMode_hold: "Letzter guter Wert (empfohlen)", rangeMode_interpolate: "Gerade Linie zum nächsten guten Wert", rangeMode_fixed: "Fester Wert",
  rangeKind_counter: "Zähler", rangeKind_measurement: "Messwert",
  rangeWhat: "{kind}, Zeitraum {range}, ersetzt durch: {mode}.", rangeBracket: "Gute Werte davor {before} und danach {after}.",
  rangeAvail: "Für den Zeitraum gibt es {states} Verlaufswerte, {short} 5-Minuten-Werte und {long} Stundenwerte.", rangeGone: "{table}: für diesen Zeitraum nicht mehr vorhanden (Aufbewahrung abgelaufen); dort wird nichts angefasst.",
  rangeEstimated: "{count} Stundenwerte lassen sich ohne 5-Minuten-Werte nicht neu berechnen; sie bekommen den Ersatzwert als Schätzung.", rangeTail: "Die Summe wird in {short} späteren 5-Minuten-Zeilen und {long} späteren Stundenzeilen berichtigt.",
  rangeChecked: "Was Housekeeper geprüft hat", rangeChanges: "Geändert werden {states} Verlaufswerte, {short} 5-Minuten-Werte und {long} Stundenwerte.", rangeTech: "Technische Details",
  rangeColHint: "Stand ist der Wert des Zählers oder Messwerts, Summe die aufsummierte Zahl eines Zählers. Mittel, Min und Max gelten für die Stunde bzw. die 5 Minuten.",
  rangeMoreRows: "… und {count} weitere Zeilen", rangeNothingHere: "In dieser Tabelle ändert sich nichts.",
  rangeCol_state: "Stand", rangeCol_sum: "Summe", rangeCol_mean: "Mittel", rangeCol_min: "Min", rangeCol_max: "Max",
  reason_no_range_statistics: "Für diese ID gibt es keine Zähler- oder Mittelwert-Statistik des Recorders.", reason_bad_range: "Der Zeitraum ist ungültig (Von nach Bis, in der Zukunft, länger als 31 Tage oder fester Wert fehlt).",
  reason_no_bracket: "Vor oder nach dem Zeitraum gibt es keinen guten Wert; der Zeitraum muss größer werden oder ein fester Wert gewählt sein.", reason_bracket_not_good: "Der Zähler ist nach dem Zeitraum niedriger als davor; das ist kein Sensorfehler, sondern ein Reset oder Zählertausch.",
  reason_fixed_outside: "Der feste Wert liegt außerhalb der guten Werte davor und danach; ein Zähler darf nicht sinken.",
  abort_no_range_statistics: "Die Statistik existiert nicht mehr.", abort_bad_range: "Der Zeitraum ist nicht mehr gültig.", abort_no_bracket: "Es gibt keinen guten Wert mehr davor oder danach.", abort_bracket_not_good: "Der Zähler ist nach dem Zeitraum niedriger als davor.", abort_fixed_outside: "Der feste Wert liegt außerhalb der guten Werte.",
});
Object.assign(TEXT.en, {
  rangeTitle: "Clean up a range yourself", rangeHint: "For an error you spotted yourself, in a counter or a measurement (temperature, power, …). The preview shows which data still exists for the period and what changes in each table. Raw history is deleted according to the recorder setting, 5-minute rows after about 10 days; hourly rows stay forever.",
  rangeFrom: "From", rangeTo: "To", rangeFixed: "Fixed value", rangeNote: "A good value before and after the period is needed. Counters must not fall.", rangeNeedInput: "Give the sensor, From and To (From before To); with a fixed value also the number.",
  rangeMode_hold: "Last good value (recommended)", rangeMode_interpolate: "Straight line to the next good value", rangeMode_fixed: "Fixed value",
  rangeKind_counter: "Counter", rangeKind_measurement: "Measurement",
  rangeWhat: "{kind}, period {range}, replaced by: {mode}.", rangeBracket: "Good values before {before} and after {after}.",
  rangeAvail: "For the period there are {states} history values, {short} 5-minute rows and {long} hourly rows.", rangeGone: "{table}: no longer there for this period (retention expired); nothing is touched there.",
  rangeEstimated: "{count} hourly rows cannot be recalculated without 5-minute rows; they get the replacement value as an estimate.", rangeTail: "The sum is corrected in {short} later 5-minute rows and {long} later hourly rows.",
  rangeChecked: "What Housekeeper checked", rangeChanges: "{states} history values, {short} 5-minute rows and {long} hourly rows change.", rangeTech: "Technical details",
  rangeColHint: "Reading is the value of the counter or measurement, sum the accumulated number of a counter. Mean, min and max apply to the hour or the 5 minutes.",
  rangeMoreRows: "… and {count} more rows", rangeNothingHere: "Nothing changes in this table.",
  rangeCol_state: "Reading", rangeCol_sum: "Sum", rangeCol_mean: "Mean", rangeCol_min: "Min", rangeCol_max: "Max",
  reason_no_range_statistics: "The recorder has no counter or mean statistics for this ID.", reason_bad_range: "The period is invalid (From after To, in the future, longer than 31 days or the fixed value is missing).",
  reason_no_bracket: "There is no good value before or after the period; widen it or choose a fixed value.", reason_bracket_not_good: "The counter is lower after the period than before; that is a reset or a replaced meter, not a sensor error.",
  reason_fixed_outside: "The fixed value lies outside the good values before and after; a counter must not fall.",
  abort_no_range_statistics: "The statistics no longer exist.", abort_bad_range: "The period is no longer valid.", abort_no_bracket: "There is no good value before or after any more.", abort_bracket_not_good: "The counter is lower after the period than before.", abort_fixed_outside: "The fixed value lies outside the good values.",
});
Object.assign(TEXT.de, {
  spikeFound: "{range}: Werte bis {extreme} {unit} statt etwa {good} {unit}", rangeTake: "Als Bereich übernehmen",
  rangeWindow: "Verlauf ansehen", rangeWindowHint: "Zeigt die Werte, in denen du den Zeitraum mit den Reglern wählst.", rangeDays: "Letzte {days} Tage", rangeLoad: "Verlauf anzeigen",
  rangeChartLabel: "Verlauf des Sensors mit dem gewählten Zeitraum", rangeNoData: "In diesem Fenster gibt es keine Werte.", rangeTable_short_term: "5-Minuten-Werte", rangeTable_long_term: "Stundenwerte",
});
Object.assign(TEXT.en, {
  spikeFound: "{range}: values up to {extreme} {unit} instead of about {good} {unit}", rangeTake: "Use as range",
  rangeWindow: "Show readings", rangeWindowHint: "Shows the values on which you pick the period with the sliders.", rangeDays: "Last {days} days", rangeLoad: "Show readings",
  rangeChartLabel: "Readings of the sensor with the picked period", rangeNoData: "There are no values in this window.", rangeTable_short_term: "5-minute rows", rangeTable_long_term: "Hourly rows",
});
