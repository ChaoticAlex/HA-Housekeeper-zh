// Coverage of triggers and branches, comparison of two runs, and the dry run of one automation; mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  covTitle: "Abdeckung von Triggern und Zweigen", covHint: "Zählt aus der Struktur der Läufe, welcher Trigger ausgelöst und welcher Zweig durchlaufen wurde. Variablen und Nutzdaten werden nicht gespeichert.",
  covOffNote: "Ist aus. Zum Zählen liest Housekeeper den Trace jedes Laufs kurz im Arbeitsspeicher (er enthält Variablen) und behält nur Zähler.", covOn: "Zählen einschalten", covOff: "Zählen ausschalten", covClear: "Zähler löschen",
  covRuns: "{runs} Läufe gezählt seit {date}", covNeverNote: "Nie erreicht gilt erst nach {runs} Läufen und {days} Tagen.", covNever: "nie erreicht", covCount: "{n}×", covMean: "Ø {time}", covNoRows: "Keine Trigger oder Zweige gefunden.",
  covKind_trigger: "Trigger", covKind_choose: "Zweig (choose)", covKind_default: "Standardzweig", covKind_then: "Dann-Zweig", covKind_else: "Sonst-Zweig",
  cmpTitle: "Zwei Läufe vergleichen", cmpHint: "Vergleicht die Struktur zweier Läufe aus dem Trace-Puffer von Home Assistant. Nichts wird gespeichert.", cmpNoRuns: "Home Assistant hat keine beendeten Läufe mehr.",
  cmpOlder: "Älterer Lauf", cmpNewer: "Neuerer Lauf", cmpRun: "Vergleichen", cmpSame: "Strukturell gleich: gleicher Trigger, gleiche Zweige, gleiches Ende.",
  cmp_trigger: "Anderer Trigger: {a} → {b}", cmp_branch: "Andere Zweige. Nur im ersten: {a}. Nur im zweiten: {b}.", cmp_execution: "Anderes Ergebnis: {a} → {b}", cmp_last_step: "Anderes Ende: {a} → {b}", cmp_duration: "Laufzeit {a} ms → {b} ms (Faktor {factor})",
  cmpUpdates: "Dazwischen gab es Updates: {list}", cmpCriterion: "Erfolgskriterium: älterer Lauf {a}, neuerer Lauf {b}", cmpReached: "erreicht", cmpMissed: "verfehlt", cmpUnknown: "unbekannt", cmpFailed: "Vergleich nicht möglich: {reason}",
});
Object.assign(TEXT.en, {
  covTitle: "Trigger and branch coverage", covHint: "Counts from the structure of the runs which trigger fired and which branch ran. Variables and payloads are not stored.",
  covOffNote: "It is off. To count, Housekeeper briefly reads each run's trace in memory (it holds variables) and keeps only counters.", covOn: "Switch counting on", covOff: "Switch counting off", covClear: "Clear counts",
  covRuns: "{runs} runs counted since {date}", covNeverNote: "Never reached is only said after {runs} runs and {days} days.", covNever: "never reached", covCount: "{n}×", covMean: "avg {time}", covNoRows: "No triggers or branches found.",
  covKind_trigger: "Trigger", covKind_choose: "Branch (choose)", covKind_default: "Default branch", covKind_then: "Then branch", covKind_else: "Else branch",
  cmpTitle: "Compare two runs", cmpHint: "Compares the structure of two runs from Home Assistant's trace buffer. Nothing is stored.", cmpNoRuns: "Home Assistant has no finished runs left.",
  cmpOlder: "Older run", cmpNewer: "Newer run", cmpRun: "Compare", cmpSame: "Structurally the same: same trigger, same branches, same end.",
  cmp_trigger: "Different trigger: {a} → {b}", cmp_branch: "Different branches. Only in the first: {a}. Only in the second: {b}.", cmp_execution: "Different result: {a} → {b}", cmp_last_step: "Different end: {a} → {b}", cmp_duration: "Run time {a} ms → {b} ms (factor {factor})",
  cmpUpdates: "Updates in between: {list}", cmpCriterion: "Success criterion: older run {a}, newer run {b}", cmpReached: "reached", cmpMissed: "missed", cmpUnknown: "unknown", cmpFailed: "Cannot compare: {reason}",
});

class TraceDiagMixin {
  async loadDiagExtras(entityId) {
    const d = this.diagState();
    try { d.coverage = { ...(d.coverage || {}), [entityId]: await this._hass.callWS({ type: "ha_housekeeper/coverage", entity_id: entityId }) }; } catch (_) { /* section stays empty */ }
    try { d.compare = { runs: (await this._hass.callWS({ type: "ha_housekeeper/trace_compare", entity_id: entityId })).runs, a: "", b: "", result: null, error: "" }; } catch (_) { d.compare = { runs: [], a: "", b: "", result: null, error: "" }; }
    this.render();
  }

  diagExtras(entityId) {
    return `${this.coverageCard(entityId)}${this.compareCard(entityId)}${this.dryRunCard?.(entityId) || ""}`;
  }

  async setCoverage(enabled, clear = false) {
    await this._hass.callWS({ type: "ha_housekeeper/coverage_set", enabled, clear });
    await this.loadDiagExtras(this.diagState().sel);
  }

  coverageCard(entityId) {
    const view = this.diagState().coverage?.[entityId];
    if (!view) return "";
    const toggle = view.enabled ? `<button class="btn" data-cov-set="off">${this.t("covOff")}</button><button class="btn quiet" data-cov-clear>${this.t("covClear")}</button>` : `<button class="btn" data-cov-set="on">${this.t("covOn")}</button>`;
    let body = `<div class="pad"><small>${this.t("covOffNote")}</small></div>`;
    if (view.enabled) {
      const rows = view.rows.map(row => {
        const never = view.never.includes(row.id);
        const time = row.mean_ms === null ? "" : ` · ${this.t("covMean", { time: this.runsDuration(row.mean_ms) })}`;
        return `<div class="row"><span class="row-text"><strong>${this.esc(this.t(`covKind_${row.kind}`))}${row.label ? `: ${this.esc(row.label)}` : ""}</strong><small>${this.esc(row.id)}${this.esc(time)}</small></span>${never ? `<span class="pill warn">${this.t("covNever")}</span>` : ""}<span class="pill ${row.count ? "ok" : "mute"}">${this.t("covCount", { n: this.formatNumber(row.count) })}</span></div>`;
      }).join("");
      const since = view.since ? `<div class="pad"><small>${this.t("covRuns", { runs: this.formatNumber(view.runs), date: this.formatDate(view.since) })}${view.ready ? "" : ` · ${this.t("covNeverNote", { runs: view.thresholds.min_runs, days: view.thresholds.min_days })}`}</small></div>` : "";
      body = `${since}${rows || `<div class="emptymsg">${this.t("covNoRows")}</div>`}`;
    }
    return `<div class="panelhead"><div><h2>${this.t("covTitle")}</h2><p>${this.t("covHint")}</p></div><div class="actions">${toggle}</div></div>${body}`;
  }

  async runCompare() {
    const c = this.diagState().compare;
    c.error = ""; c.result = null;
    try { c.result = await this._hass.callWS({ type: "ha_housekeeper/trace_compare", entity_id: this.diagState().sel, run_a: c.a, run_b: c.b }); }
    catch (err) { c.error = this.t("cmpFailed", { reason: this.errText(err) }); }
    this.render();
  }

  compareLines(result) {
    const list = v => (Array.isArray(v) ? (v.join(", ") || "—") : (v ?? "—"));
    const lines = result.differences.map(d => this.t(`cmp_${d.kind}`, { a: list(d.a ?? d.only_a), b: list(d.b ?? d.only_b), factor: d.factor }));
    if (!lines.length) lines.push(this.t("cmpSame"));
    if (result.updates_between.length) lines.push(this.t("cmpUpdates", { list: result.updates_between.map(u => `${u.domain || u.kind} ${u.to || ""}`.trim()).join(", ") }));
    const word = v => (v === true ? this.t("cmpReached") : v === false ? this.t("cmpMissed") : this.t("cmpUnknown"));
    if (result.criterion.older !== null || result.criterion.newer !== null) lines.push(this.t("cmpCriterion", { a: word(result.criterion.older), b: word(result.criterion.newer) }));
    return lines.map(l => `<div class="pad"><small>${this.esc(l)}</small></div>`).join("");
  }

  compareCard() {
    const c = this.diagState().compare;
    if (!c) return "";
    const option = (run, selected) => `<option value="${this.esc(run.run_id)}" ${run.run_id === selected ? "selected" : ""}>${this.esc(this.formatDate(run.start))} · ${this.esc(run.execution || "")}${run.trigger ? ` · ${this.esc(run.trigger)}` : ""}</option>`;
    const picker = (attr, label, selected) => `<div class="setrow"><div><label>${label}</label></div><select ${attr} class="w460"><option value=""></option>${c.runs.map(r => option(r, selected)).join("")}</select></div>`;
    const body = c.runs.length ? `${picker("data-cmp-a", this.t("cmpOlder"), c.a)}${picker("data-cmp-b", this.t("cmpNewer"), c.b)}<div class="setrow planfoot"><small class="u-m0"></small><button class="btn" data-cmp-run ${c.a && c.b && c.a !== c.b ? "" : "disabled"}>${this.t("cmpRun")}</button></div>` : `<div class="emptymsg">${this.t("cmpNoRuns")}</div>`;
    return `<div class="panelhead"><div><h2>${this.t("cmpTitle")}</h2><p>${this.t("cmpHint")}</p></div></div>${body}${c.error ? `${this.notice("err", c.error)}` : ""}${c.result ? this.compareLines(c.result) : ""}`;
  }

  bindTraceDiag(root) {
    root.querySelectorAll("[data-cov-set]").forEach(el => el.onclick = () => this.setCoverage(el.dataset.covSet === "on"));
    root.querySelector("[data-cov-clear]")?.addEventListener("click", () => this.setCoverage(true, true));
    root.querySelector("[data-cmp-a]")?.addEventListener("change", e => { this.diagState().compare.a = e.target.value; this.render(); });
    root.querySelector("[data-cmp-b]")?.addEventListener("change", e => { this.diagState().compare.b = e.target.value; this.render(); });
    root.querySelector("[data-cmp-run]")?.addEventListener("click", () => this.runCompare());
    this.bindDryRun?.(root);
  }
}
