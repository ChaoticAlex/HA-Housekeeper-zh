// Automation diagnostics: quality dimensions, success criteria, coverage, trace comparison and the dry run (see quality.py, criteria.py, coverage.py, trace_compare.py, dry_run.py); mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  qualityTab: "Qualität", runsTabRuns: "Läufe",
  qualityHint: "Sieben getrennte Blickwinkel je Automation, bewusst ohne Gesamtnote. „Unbekannt“ heißt: dazu gibt es noch nichts zu beurteilen.",
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
  qualityTab: "Quality", runsTabRuns: "Runs",
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

  qualityRow(item) {
    const dots = DIM_ORDER.map(id => `<td aria-label="${this.esc(this.t(`dim_${id}`))}: ${this.esc(this.t(`ql_${item.dimensions[id].level}`))}">${this.dimDot(item.dimensions[id])}</td>`).join("");
    return `<tr><td>${this.nameCell(item.name, item.entity_id)}<span class="qlight" aria-hidden="true">${DIM_ORDER.map(id => `<i class="${QL_TONE[item.dimensions[id].level]}" title="${this.esc(this.t(`dim_${id}`))}"></i>`).join("")}</span></td>${dots}<td><button class="btn" data-diag-open="${this.esc(item.entity_id)}">${this.t("diagOpen")}</button></td></tr>`;
  }

  qualityView() {
    this.ensureQuality();
    const d = this.diagState(), q = d.quality;
    const head = this.pageBar({ at: this.loadedAt("quality"), loading: d.loading, attr: "data-quality-refresh" });
    if (d.error) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(d.error)}</div></div></div>`;
    if (!q) return `<div class="stack">${head}<div class="panel">${this.skeleton("qualityLoading")}</div></div>`;
    const issue = i => i.worst === "red" || i.worst === "warn" || i.worst === "info";
    const items = d.issuesOnly ? q.items.filter(issue) : q.items;  // the backend sends them worst first
    const sorted = d.byName ? [...items].sort((a, b) => a.name.localeCompare(b.name)) : items;
    const bar = `<div class="listbar"><label><input type="checkbox" data-quality-issues ${d.issuesOnly ? "checked" : ""}> ${this.t("qualityOnlyIssues")}</label><label><input type="checkbox" data-quality-byname ${d.byName ? "checked" : ""}> ${this.t("qualityName")}</label></div>`;
    const header = `<tr><th>${this.t("utName")}</th>${DIM_ORDER.map(id => `<th>${this.t(`dim_${id}`)}</th>`).join("")}<th></th></tr>`;
    const empty = d.issuesOnly && q.items.length ? this.t("qualityNoIssues") : this.t("qualityNoneNext");
    const table = sorted.length ? `<div class="tablewrap lt qualitytable"><table><thead>${header}</thead><tbody>${sorted.map(i => this.qualityRow(i)).join("")}</tbody></table></div>` : `<div class="emptymsg">${empty}</div>`;
    return `<div class="stack">${head}<div class="panel">${q.items.length ? bar : ""}${table}</div>${d.sel ? this.diagDetail(d.sel) : ""}</div>`;
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
    root.querySelector("[data-quality-issues]")?.addEventListener("change", ev => { d().issuesOnly = ev.target.checked; this.render(); });
    root.querySelector("[data-quality-byname]")?.addEventListener("change", ev => { d().byName = ev.target.checked; this.render(); });
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
