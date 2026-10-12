// Automation diagnostics: quality dimensions, success criteria, coverage, trace comparison and the dry run (see quality.py, criteria.py, coverage.py, trace_compare.py, dry_run.py); mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  qualityTab: "Übersicht", runsTabRuns: "Läufe",
  scTab: "Skripte", scTabHint: "Alle Skripte und wer sie nutzt", scSumNoCaller: "Ohne Aufrufer", scColCallers: "Aufgerufen von", scNoCaller: "niemand", scAuto1: "1 Automation", scAutoN: "{n} Automationen", scScript1: "1 Skript", scScriptN: "{n} Skripte", scFilterCallers: "Alle Aufrufer", scWithCallers: "Mit Aufrufer", scWithoutCallers: "Ohne Aufrufer", scNone: "Keine Skripte gefunden.", scCallersHint: "Zählt Automationen und Skripte, die dieses Skript aufrufen.",
  ovColDiag: "Diagnose", ovSumAll: "Alle", ovSumActive: "Aktiv", ovSumOff: "Deaktiviert", ovSumProblem: "Mit Problem", ovSumErrors: "Mit Fehlern", ovSumNever: "Nie gelaufen",
  ovFilterState: "Alle Status", ovStateOn: "Aktiv", ovStateOff: "Deaktiviert", ovFilterLevel: "Alle Stufen", ovLevelProblem: "Problem oder Prüfen", ovLevelAny: "Auch Hinweise", ovFilterRuns: "Alle Läufe", ovRunsErrors: "Mit Fehlern", ovRunsNever: "Nie gelaufen", ovColWorst: "Qualität", ovNoRuns: "In den gezählten Läufen nie ausgelöst.",
  qualityHint: "Alle Automationen mit Status, Läufen und sieben getrennten Blickwinkeln, bewusst ohne Gesamtnote. „Unbekannt“ heißt: dazu gibt es noch nichts zu beurteilen.",
  qualityLoading: "Die Qualität wird zusammengestellt …", qualityNone: "Keine Automationen gefunden.", qualityRefresh: "Neu berechnen",
  dim_integrity: "Integrität", dim_reliability: "Zuverlässigkeit", dim_effectiveness: "Wirksamkeit", dim_maintainability: "Wartbarkeit", dim_restart_safety: "Restart-Festigkeit", dim_efficiency: "Effizienz", dim_conflicts: "Konflikte",
  ql_ok: "In Ordnung", ql_info: "Hinweis", ql_warn: "Prüfen", ql_red: "Problem", ql_unknown: "Unbekannt",
  dr_broken: "{count} defekte Referenzen", dr_stale_targets: "{count} Ziele sind deaktiviert oder nicht verfügbar", dr_runs: "{count} Läufe ohne Auffälligkeit", dr_no_runs: "Noch keine Läufe beobachtet",
  dr_no_criteria: "Kein Erfolgskriterium definiert", dr_not_yet_checked: "Noch nicht ausgelöst, seit es ein Kriterium gibt", dr_missed: "{missed} verfehlt, {ok} erreicht (7 Tage)", dr_reached: "{ok} erreicht (7 Tage)",
  dr_no_description: "Keine Beschreibung", dr_large: "Groß: viele Trigger oder Aktionen", dr_deep: "Tief verschachtelt", dr_no_config: "Konfiguration nicht lesbar", dr_no_effect: "Läufe enden meist an Bedingungen", dr_conflict: "{count} mögliche Konflikte",
  dr_failing: "Viele Fehler", dr_never_ok: "Nie erfolgreich", dr_overlap: "Läufe überschneiden sich", dr_burst: "Ungewöhnlich oft", dr_long_run: "Ungewöhnlich lange Läufe", dr_after_update: "Mehr Fehler seit einem Update", dr_long_wait: "Lange Wartezeit", dr_wait_no_timeout: "Warten ohne Timeout",
  diagOpen: "Details", diagClose: "Schließen", diagFor: "Diagnose: {name}",
  critTitle: "Erfolgskriterien", critHint: "Du legst fest, was die Automation erreichen soll. Nach jeder Auslösung wird einmal nach der Frist geprüft. Gespeichert werden nur Zähler.",
  critType: "Art", critTypeState: "Zielzustand", critTypeCall: "Dienst aufgerufen", critService: "Dienst", critCallLine: "ruft {service} auf",
  critCallHint: "Erreicht, wenn genau dieser Lauf der Automation den Dienst aufruft (Benachrichtigung oder Skript). Aufrufe aus anderen Quellen zählen nie.",
  critNone: "Kein Kriterium definiert.", critEdit: "Bearbeiten", critAdd: "Kriterium hinzufügen", critAddTarget: "Ziel hinzufügen", critRemove: "Entfernen", critSave: "Speichern", critCancel: "Abbrechen",
  critEntity: "Entität", critState: "Sollzustand", critWithin: "Frist (Sekunden)", critHold: "Mindestdauer (Sekunden)", critStats: "{ok} erreicht, {missed} verfehlt in 7 Tagen", critSaved: "Gespeichert.", critFailed: "Nicht gespeichert: {reason}",
  actCriteria: "Ziele von Automationen verfehlt", actCriteriaHint: "Mindestens eine Automation verfehlt ihr Erfolgskriterium immer wieder.",
});
Object.assign(TEXT.en, {
  qualityTab: "Overview", runsTabRuns: "Runs",
  scTab: "Scripts", scTabHint: "All scripts and who uses them", scSumNoCaller: "No caller", scColCallers: "Called by", scNoCaller: "nobody", scAuto1: "1 automation", scAutoN: "{n} automations", scScript1: "1 script", scScriptN: "{n} scripts", scFilterCallers: "All callers", scWithCallers: "With a caller", scWithoutCallers: "Without a caller", scNone: "No scripts found.", scCallersHint: "Counts the automations and scripts that call this script.",
  ovColDiag: "Diagnosis", ovSumAll: "All", ovSumActive: "Active", ovSumOff: "Disabled", ovSumProblem: "With a problem", ovSumErrors: "With errors", ovSumNever: "Never ran",
  ovFilterState: "All states", ovStateOn: "Active", ovStateOff: "Disabled", ovFilterLevel: "All levels", ovLevelProblem: "Problem or check", ovLevelAny: "Including notes", ovFilterRuns: "All runs", ovRunsErrors: "With errors", ovRunsNever: "Never ran", ovColWorst: "Quality", ovNoRuns: "Never triggered in the counted runs.",
  qualityHint: "Seven separate views of each automation, deliberately without an overall grade. “Unknown” means there is nothing to judge by yet.",
  qualityLoading: "Putting the quality together …", qualityNone: "No automations found.", qualityRefresh: "Recalculate",
  dim_integrity: "Integrity", dim_reliability: "Reliability", dim_effectiveness: "Effectiveness", dim_maintainability: "Maintainability", dim_restart_safety: "Restart safety", dim_efficiency: "Efficiency", dim_conflicts: "Conflicts",
  ql_ok: "Fine", ql_info: "Note", ql_warn: "Check", ql_red: "Problem", ql_unknown: "Unknown",
  dr_broken: "{count} broken references", dr_stale_targets: "{count} targets are disabled or unavailable", dr_runs: "{count} runs without anything unusual", dr_no_runs: "No runs observed yet",
  dr_no_criteria: "No success criterion defined", dr_not_yet_checked: "Not triggered since there is a criterion", dr_missed: "{missed} missed, {ok} reached (7 days)", dr_reached: "{ok} reached (7 days)",
  dr_no_description: "No description", dr_large: "Large: many triggers or actions", dr_deep: "Deeply nested", dr_no_config: "Configuration not readable", dr_no_effect: "Runs mostly end at conditions", dr_conflict: "{count} possible conflicts",
  dr_failing: "Many errors", dr_never_ok: "Never succeeds", dr_overlap: "Runs overlap", dr_burst: "Unusually often", dr_long_run: "Unusually long runs", dr_after_update: "More errors since an update", dr_long_wait: "Long wait", dr_wait_no_timeout: "Waiting without a timeout",
  diagOpen: "Details", diagClose: "Close", diagFor: "Diagnosis: {name}",
  critTitle: "Success criteria", critHint: "You define what the automation should achieve. After every trigger, one check is made after the time limit. Only counters are kept.",
  critType: "Kind", critTypeState: "Target state", critTypeCall: "Service called", critService: "Service", critCallLine: "calls {service}",
  critCallHint: "Reached when exactly this run of the automation calls the service (a notification or a script). Calls from other sources never count.",
  critNone: "No criterion defined.", critEdit: "Edit", critAdd: "Add criterion", critAddTarget: "Add target", critRemove: "Remove", critSave: "Save", critCancel: "Cancel",
  critEntity: "Entity", critState: "Expected state", critWithin: "Time limit (seconds)", critHold: "Hold for (seconds)", critStats: "{ok} reached, {missed} missed in 7 days", critSaved: "Saved.", critFailed: "Not saved: {reason}",
  actCriteria: "Automation goals missed", actCriteriaHint: "At least one automation misses its success criterion again and again.",
});

const SCRIPT_DIM_ORDER = ["integrity", "reliability", "maintainability", "efficiency"];
const DIM_ORDER = ["integrity", "reliability", "effectiveness", "maintainability", "restart_safety", "efficiency", "conflicts"];
const QL_TONE = { ok: "ok", info: "mute", warn: "warn", red: "red", unknown: "mute" };
const QL_MARK = { ok: "✓", info: "i", warn: "!", red: "✗", unknown: "?" };

class DiagnosticsMixin {
  diagState() {
    return (this.diag ||= { quality: null, loading: false, error: "", sel: "", criteria: {}, draft: null, message: "", detail: {} });
  }

  async loadQuality() {
    const d = this.diagState();
    d.loading = true; d.error = ""; this.render();
    try { d.quality = await this._hass.callWS({ type: "ha_housekeeper/automation_quality" }); this.markLoaded("quality"); }
    catch (err) { d.error = err?.message || String(err); }
    d.loading = false; this.render();
  }

  ensureQuality() {
    if (this.diagState().loading || this._qualityRequested) return;
    this._qualityRequested = true;
    setTimeout(() => this.loadQuality(), 0);
  }

  dimReason(reason) {
    const key = `dr_${reason.key}`;
    return TEXT[this.lang][key] ? this.t(key, reason) : reason.key;
  }

  dimDot(dim) {
    return `<span class="pill ${QL_TONE[dim.level]}" title="${this.esc(dim.reasons.map(r => this.dimReason(r)).join(" · "))}">${QL_MARK[dim.level]}</span>`;
  }

  // One row per automation: the quality rows joined with the counted runs (runs are null until they are loaded).
  overviewRows(items = this.diagState().quality?.items || []) {
    const byId = new Map((this.runs?.items || []).map(r => [r.entity_id, r]));
    return items.map(i => {
      const r = byId.get(i.entity_id);
      return { ...i, runs: this.runs ? r?.runs ?? 0 : null, errors: this.runs ? r?.errors ?? 0 : null };
    });
  }

  overviewList(rows) {
    const rank = { red: 0, warn: 1, info: 2, ok: 3, unknown: 4 };
    const off = o => o.status === "disabled", problem = o => o.worst === "red" || o.worst === "warn";
    const dimCol = id => ({ key: id, label: `dim_${id}`, dir: "asc", cell: o => `<span aria-label="${this.esc(this.t(`dim_${id}`))}: ${this.esc(this.t(`ql_${o.dimensions[id].level}`))}">${this.dimDot(o.dimensions[id])}</span>` });
    const num = v => (v === null ? "–" : this.esc(this.formatNumber(v)));
    const columns = [
      { key: "name", label: "utName", cell: o => `${this.nameCell(o.name, o.entity_id)}<span class="qlight" aria-hidden="true">${DIM_ORDER.map(id => `<i class="${QL_TONE[o.dimensions[id].level]}" title="${this.esc(this.t(`dim_${id}`))}"></i>`).join("")}</span>` },
      { key: "state", label: "sysColState", dir: "asc", cell: o => this.pill(o.status) },
      { key: "runs", label: "runsColRuns", dir: "desc", cell: o => num(o.runs) },
      { key: "errors", label: "runsColErrors", dir: "desc", cell: o => num(o.errors) },
      ...DIM_ORDER.map(dimCol),
      { key: "diag", label: "ovColDiag", sortable: false, cell: o => `<button class="btn" data-diag-open="${this.esc(o.entity_id)}">${this.t("actOpen")}</button>` },
    ];
    return this.sysList("overview", rows, {
      sort: "worst", dir: "asc",
      sorts: [
        { key: "worst", label: "ovColWorst", dir: "asc", get: o => rank[o.worst] },
        { key: "name", label: "utName", dir: "asc", get: o => o.name },
        { key: "state", label: "sysColState", dir: "asc", get: o => o.status },
        { key: "runs", label: "runsColRuns", dir: "desc", get: o => o.runs },
        { key: "errors", label: "runsColErrors", dir: "desc", get: o => o.errors },
        ...DIM_ORDER.map(id => ({ key: id, label: `dim_${id}`, dir: "asc", get: o => rank[o.dimensions[id].level] })),
      ],
      filters: [
        { name: "state", all: this.t("ovFilterState"), options: [["on", this.t("ovStateOn")], ["off", this.t("ovStateOff")]] },
        { name: "level", all: this.t("ovFilterLevel"), options: [["problem", this.t("ovLevelProblem")], ["any", this.t("ovLevelAny")]] },
        { name: "runs", all: this.t("ovFilterRuns"), options: [["errors", this.t("ovRunsErrors")], ["never", this.t("ovRunsNever")]] },
      ],
      filterFns: {
        state: (o, v) => off(o) === (v === "off"),
        level: (o, v) => (v === "problem" ? problem(o) : o.worst !== "ok" && o.worst !== "unknown"),
        runs: (o, v) => (v === "errors" ? o.errors > 0 : o.runs === 0),
      },
      text: o => `${o.name} ${o.entity_id}`, tie: o => o.entity_id, empty: "qualityNoneNext", columns,
      rowAttrs: o => `data-object="${this.esc(`automation:${o.entity_id}`)}" tabindex="0" role="button" aria-label="${this.esc(o.name)}"`,
      exportName: "automations", header: [this.t("utName"), "ID", this.t("sysColState"), this.t("runsColRuns"), this.t("runsColErrors"), ...DIM_ORDER.map(id => this.t(`dim_${id}`))],
      rows: o => [o.name, o.entity_id, o.status || "", o.runs ?? "", o.errors ?? "", ...DIM_ORDER.map(id => this.t(`ql_${o.dimensions[id].level}`))],
    });
  }

  // Loading and error frame shared by the automation overview and the script list; build(quality, head) returns the page.
  qualityFrame(build) {
    this.ensureQuality();
    this.ensureRuns();
    const d = this.diagState(), q = d.quality;
    const head = this.pageBar({ at: this.loadedAt("quality"), loading: d.loading, attr: "data-quality-refresh" });
    if (d.error) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(d.error)}</div></div></div>`;
    if (!q) return `<div class="stack">${head}<div class="panel">${this.skeleton("qualityLoading")}</div></div>`;
    return build(q, head);
  }

  qualityView() {
    return this.qualityFrame((q, head) => {
      const d = this.diagState(), rows = this.overviewRows();
      const n = x => this.formatNumber(x), count = f => n(rows.filter(f).length);
      const tiles = this.sumTiles([
        { label: this.t("ovSumAll"), value: n(rows.length), tone: "mute", lf: ["overview", "", ""] },
        { label: this.t("ovSumActive"), value: count(o => o.status !== "disabled"), tone: "ok", lf: ["overview", "state", "on"] },
        { label: this.t("ovSumOff"), value: count(o => o.status === "disabled"), tone: "mute", lf: ["overview", "state", "off"] },
        { label: this.t("ovSumProblem"), value: count(o => o.worst === "red" || o.worst === "warn"), tone: rows.some(o => o.worst === "red") ? "red" : rows.some(o => o.worst === "warn") ? "warn" : "ok", lf: ["overview", "level", "problem"] },
        ...(this.runs ? [
          { label: this.t("ovSumErrors"), value: count(o => o.errors > 0), tone: rows.some(o => o.errors > 0) ? "warn" : "ok", lf: ["overview", "runs", "errors"] },
          { label: this.t("ovSumNever"), value: count(o => o.runs === 0), tone: "mute", hint: this.t("ovNoRuns"), lf: ["overview", "runs", "never"] },
        ] : []),
      ]);
      return `<div class="stack">${head}${tiles}<div class="panel">${this.overviewList(rows)}</div>${d.sel ? this.diagDetail(d.sel) : ""}</div>`;
    });
  }

  // The scripts: the same joined rows as the overview, with the four dimensions that apply and who calls each script.
  scriptCallers(o) {
    const { automation: a, script: s } = o.callers;
    const parts = [a ? (a === 1 ? this.t("scAuto1") : this.t("scAutoN", { n: this.formatNumber(a) })) : "", s ? (s === 1 ? this.t("scScript1") : this.t("scScriptN", { n: this.formatNumber(s) })) : ""].filter(Boolean);
    return parts.length ? this.esc(parts.join(" · ")) : `<span class="pill warn">${this.t("scNoCaller")}</span>`;
  }

  scriptsList(rows) {
    const rank = { red: 0, warn: 1, info: 2, ok: 3, unknown: 4 };
    const total = o => o.callers.automation + o.callers.script, problem = o => o.worst === "red" || o.worst === "warn";
    const num = v => (v === null ? "–" : this.esc(this.formatNumber(v)));
    const dimCol = id => ({ key: id, label: `dim_${id}`, dir: "asc", cell: o => `<span aria-label="${this.esc(this.t(`dim_${id}`))}: ${this.esc(this.t(`ql_${o.dimensions[id].level}`))}">${this.dimDot(o.dimensions[id])}</span>` });
    const columns = [
      { key: "name", label: "utName", cell: o => `${this.nameCell(o.name, o.entity_id)}<span class="qlight" aria-hidden="true">${SCRIPT_DIM_ORDER.map(id => `<i class="${QL_TONE[o.dimensions[id].level]}" title="${this.esc(this.t(`dim_${id}`))}"></i>`).join("")}</span>` },
      { key: "runs", label: "runsColRuns", dir: "desc", cell: o => num(o.runs) },
      { key: "errors", label: "runsColErrors", dir: "desc", cell: o => num(o.errors) },
      ...SCRIPT_DIM_ORDER.map(dimCol),
      { key: "callers", label: "scColCallers", dir: "asc", cell: o => this.scriptCallers(o) },
    ];
    return this.sysList("scripts", rows, {
      sort: "worst", dir: "asc",
      sorts: [
        { key: "worst", label: "ovColWorst", dir: "asc", get: o => rank[o.worst] },
        { key: "name", label: "utName", dir: "asc", get: o => o.name },
        { key: "runs", label: "runsColRuns", dir: "desc", get: o => o.runs },
        { key: "errors", label: "runsColErrors", dir: "desc", get: o => o.errors },
        ...SCRIPT_DIM_ORDER.map(id => ({ key: id, label: `dim_${id}`, dir: "asc", get: o => rank[o.dimensions[id].level] })),
        { key: "callers", label: "scColCallers", dir: "asc", get: total },
      ],
      filters: [
        { name: "level", all: this.t("ovFilterLevel"), options: [["problem", this.t("ovLevelProblem")], ["any", this.t("ovLevelAny")]] },
        { name: "callers", all: this.t("scFilterCallers"), options: [["used", this.t("scWithCallers")], ["none", this.t("scWithoutCallers")]] },
        { name: "runs", all: this.t("ovFilterRuns"), options: [["errors", this.t("ovRunsErrors")], ["never", this.t("ovRunsNever")]] },
      ],
      filterFns: {
        level: (o, v) => (v === "problem" ? problem(o) : o.worst !== "ok" && o.worst !== "unknown"),
        callers: (o, v) => (total(o) === 0) === (v === "none"),
        runs: (o, v) => (v === "errors" ? o.errors > 0 : o.runs === 0),
      },
      text: o => `${o.name} ${o.entity_id}`, tie: o => o.entity_id, empty: "scNone", columns,
      rowAttrs: o => `data-object="${this.esc(`script:${o.entity_id}`)}" tabindex="0" role="button" aria-label="${this.esc(o.name)}"`,
      exportName: "scripts", header: [this.t("utName"), "ID", this.t("runsColRuns"), this.t("runsColErrors"), ...SCRIPT_DIM_ORDER.map(id => this.t(`dim_${id}`)), this.t("scColCallers")],
      rows: o => [o.name, o.entity_id, o.runs ?? "", o.errors ?? "", ...SCRIPT_DIM_ORDER.map(id => this.t(`ql_${o.dimensions[id].level}`)), total(o)],
    });
  }

  scriptsView() {
    return this.qualityFrame((q, head) => {
      const rows = this.overviewRows(q.scripts || []);
      const n = x => this.formatNumber(x), count = f => n(rows.filter(f).length);
      const tiles = this.sumTiles([
        { label: this.t("ovSumAll"), value: n(rows.length), tone: "mute", lf: ["scripts", "", ""] },
        { label: this.t("scSumNoCaller"), value: count(o => o.callers.automation + o.callers.script === 0), tone: rows.some(o => o.callers.automation + o.callers.script === 0) ? "warn" : "ok", hint: this.t("scCallersHint"), lf: ["scripts", "callers", "none"] },
        { label: this.t("ovSumProblem"), value: count(o => o.worst === "red" || o.worst === "warn"), tone: rows.some(o => o.worst === "red") ? "red" : rows.some(o => o.worst === "warn") ? "warn" : "ok", lf: ["scripts", "level", "problem"] },
        ...(this.runs ? [
          { label: this.t("ovSumErrors"), value: count(o => o.errors > 0), tone: rows.some(o => o.errors > 0) ? "warn" : "ok", lf: ["scripts", "runs", "errors"] },
          { label: this.t("ovSumNever"), value: count(o => o.runs === 0), tone: "mute", hint: this.t("ovNoRuns"), lf: ["scripts", "runs", "never"] },
        ] : []),
      ]);
      return `<div class="stack">${head}${tiles}<div class="panel">${this.scriptsList(rows)}</div></div>`;
    });
  }

  // Everything about one automation in one place: why each dimension is as it is, the criteria, and later the coverage, the comparison and the dry run.
  diagDetail(entityId) {
    const d = this.diagState(), item = d.quality?.items.find(i => i.entity_id === entityId);
    if (!item) return "";
    const dims = DIM_ORDER.map(id => {
      const dim = item.dimensions[id];
      return `<div class="row"><span class="tile ${QL_TONE[dim.level]}">${QL_MARK[dim.level]}</span><span class="row-text"><strong>${this.t(`dim_${id}`)}</strong><small>${this.esc(dim.reasons.length ? dim.reasons.map(r => this.dimReason(r)).join(" · ") : this.t(`ql_${dim.level}`))}</small></span><span class="pill ${QL_TONE[dim.level]}">${this.t(`ql_${dim.level}`)}</span></div>`;
    }).join("");
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("diagFor", { name: this.esc(item.name) })}</h2><p>${this.esc(entityId)}</p></div><button class="btn" data-diag-close>${this.t("diagClose")}</button></div>${this.fold("diag_dims", { title: this.t("diagSecDims") }, dims, true)}${this.fold("diag_crit", { title: this.t("diagSecCriteria") }, this.criteriaCard(entityId), true)}${this.fold("diag_improve", { title: this.t("refactorTitle") }, this.refactorCard(entityId), false)}${this.fold("diag_more", { title: this.t("diagSecMore") }, this.diagExtras(entityId), false)}</section>`;
  }

  async openDiag(entityId) {
    const d = this.diagState();
    d.sel = entityId; d.draft = null; d.message = "";
    this.render();
    try { d.criteria[entityId] = await this._hass.callWS({ type: "ha_housekeeper/criteria", entity_id: entityId }); } catch (_) { /* shown as empty */ }
    this.render();
    await this.loadRefactor?.(entityId);
    await this.loadDiagExtras?.(entityId);
  }

  criteriaCard(entityId) {
    const d = this.diagState(), view = d.criteria[entityId];
    const message = d.message ? `<small role="status">${this.esc(d.message)}</small>` : "";
    let body;
    if (d.draft) body = this.criteriaForm(view);
    else if (!view?.criteria.length) body = `<div class="pad"><small>${this.t("critNone")}</small></div>`;
    else body = view.criteria.map(c => `<div class="pad"><small>${c.targets.map(t => `${this.esc(t.entity_id)} = ${this.esc(t.state)}`).join(" · ")} · ${c.within} s${c.hold ? ` + ${c.hold} s` : ""}</small></div>`).join("") + `<div class="pad"><small>${this.t("critStats", view.stats)}</small></div>` + this.critHistory(view);
    const edit = d.draft ? "" : `<button class="btn" data-crit-edit="${this.esc(entityId)}">${this.t("critEdit")}</button>`;
    return `<div class="panelhead"><div><h2>${this.t("critTitle")}</h2><p>${this.t("critHint")}</p></div><div class="actions">${edit}</div></div>${body}${message}`;
  }

  criteriaForm() {
    const draft = this.diagState().draft;
    const typeSelect = (c, i) => `<label>${this.t("critType")} <select data-crit-type="${i}"><option value="state" ${c.type === "call" ? "" : "selected"}>${this.t("critTypeState")}</option><option value="call" ${c.type === "call" ? "selected" : ""}>${this.t("critTypeCall")}</option></select></label>`;
    const callBody = (c, i) => `<div class="setrow"><input type="text" data-crit-service="${i}" value="${this.esc(c.service || "")}" placeholder="notify.mobile_app_phone" aria-label="${this.esc(this.t("critService"))}" style="max-width:300px"></div><small>${this.t("critCallHint")}</small>`;
    const stateBody = (c, i) => `${c.targets.map((t, j) => `<div class="setrow"><input type="text" data-crit-entity="${i}:${j}" value="${this.esc(t.entity_id)}" placeholder="light.hall" aria-label="${this.esc(this.t("critEntity"))}" style="max-width:260px"><input type="text" data-crit-state="${i}:${j}" value="${this.esc(t.state)}" placeholder="on" aria-label="${this.esc(this.t("critState"))}" style="max-width:140px">${c.targets.length > 1 ? `<button class="btn quiet" data-crit-del-target="${i}:${j}">${this.t("critRemove")}</button>` : ""}</div>`).join("")}
      <button class="btn quiet" data-crit-add-target="${i}">${this.t("critAddTarget")}</button>
      <label>${this.t("critHold")} <input type="number" min="0" max="300" data-crit-hold="${i}" value="${this.esc(String(c.hold))}"></label>`;
    const crit = draft.map((c, i) => `<div class="pad polform" data-crit="${i}">${typeSelect(c, i)}${c.type === "call" ? callBody(c, i) : stateBody(c, i)}
      <label>${this.t("critWithin")} <input type="number" min="1" max="300" data-crit-within="${i}" value="${this.esc(String(c.within))}"></label>
      <button class="btn quiet" data-crit-del="${i}">${this.t("critRemove")}</button></div>`).join("");
    return `${crit}<div class="pad" style="display:flex;gap:8px"><button class="btn" data-crit-add>${this.t("critAdd")}</button><button class="btn primary" data-crit-save>${this.t("critSave")}</button><button class="btn quiet" data-crit-cancel>${this.t("critCancel")}</button></div>`;
  }

  editCriteria(entityId) {
    const view = this.diagState().criteria[entityId];
    this.diagState().draft = JSON.parse(JSON.stringify(view?.criteria || []));
    this.diagState().message = "";
    this.render();
  }

  async saveCriteria() {
    const d = this.diagState();
    const criteria = d.draft.map(c => c.type === "call" ? { ...(c.id ? { id: c.id } : {}), type: "call", service: (c.service || "").trim(), within: Number.parseInt(c.within, 10) } : ({ ...(c.id ? { id: c.id } : {}), targets: c.targets.map(t => ({ entity_id: t.entity_id.trim(), state: t.state.trim() })), within: Number.parseInt(c.within, 10), hold: Number.parseInt(c.hold || 0, 10) }));
    try {
      d.criteria[d.sel] = await this._hass.callWS({ type: "ha_housekeeper/criteria_set", entity_id: d.sel, criteria });
      d.draft = null; d.message = this.t("critSaved");
    } catch (err) { d.message = this.t("critFailed", { reason: err?.message || String(err) }); }
    this.render();
  }

  bindDiagnostics(root) {
    const d = () => this.diagState();
    root.querySelector("[data-quality-refresh]")?.addEventListener("click", () => this.loadQuality());
    root.querySelectorAll("[data-diag-open]").forEach(el => el.onclick = () => this.openDiag(el.dataset.diagOpen));
    root.querySelector("[data-diag-close]")?.addEventListener("click", () => { d().sel = ""; d().draft = null; this.render(); });
    root.querySelector("[data-crit-edit]")?.addEventListener("click", ev => this.editCriteria(ev.currentTarget.dataset.critEdit));
    root.querySelector("[data-crit-cancel]")?.addEventListener("click", () => { d().draft = null; this.render(); });
    root.querySelector("[data-crit-save]")?.addEventListener("click", () => this.saveCriteria());
    root.querySelector("[data-crit-add]")?.addEventListener("click", () => { d().draft.push({ targets: [{ entity_id: "", state: "" }], within: 10, hold: 0 }); this.render(); });
    const at = value => value.split(":").map(Number);
    root.querySelectorAll("[data-crit-del]").forEach(el => el.onclick = () => { d().draft.splice(Number(el.dataset.critDel), 1); this.render(); });
    root.querySelectorAll("[data-crit-add-target]").forEach(el => el.onclick = () => { d().draft[Number(el.dataset.critAddTarget)].targets.push({ entity_id: "", state: "" }); this.render(); });
    root.querySelectorAll("[data-crit-del-target]").forEach(el => el.onclick = () => { const [i, j] = at(el.dataset.critDelTarget); d().draft[i].targets.splice(j, 1); this.render(); });
    root.querySelectorAll("[data-crit-entity]").forEach(el => el.oninput = () => { const [i, j] = at(el.dataset.critEntity); d().draft[i].targets[j].entity_id = el.value; });
    root.querySelectorAll("[data-crit-state]").forEach(el => el.oninput = () => { const [i, j] = at(el.dataset.critState); d().draft[i].targets[j].state = el.value; });
    root.querySelectorAll("[data-crit-type]").forEach(el => el.onchange = () => { const c = d().draft[Number(el.dataset.critType)]; c.type = el.value; if (c.type === "state" && !c.targets?.length) c.targets = [{ entity_id: "", state: "" }]; this.render(); });
    root.querySelectorAll("[data-crit-service]").forEach(el => el.oninput = () => { d().draft[Number(el.dataset.critService)].service = el.value; });
    root.querySelectorAll("[data-crit-within]").forEach(el => el.oninput = () => { d().draft[Number(el.dataset.critWithin)].within = el.value; });
    root.querySelectorAll("[data-crit-hold]").forEach(el => el.oninput = () => { d().draft[Number(el.dataset.critHold)].hold = el.value; });
  }
}
