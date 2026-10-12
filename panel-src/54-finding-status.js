// FindingStatusMixin: the status of a finding as the list shows it. Some are decided by the user (known,
// snoozed, hidden), some follow from what Housekeeper sees (new, in work, fixed). Nothing here stores anything:
// the decisions are the ones of the ignore list, the rest is derived from the scan and the journal of plans.
const NEW_FINDING_DAYS = 7, FIXED_DAYS = 30, ACTIVE_PLAN = ["dry_run", "backup", "running"];
const FINDING_STATES = ["new", "inwork", "known", "snoozed", "hidden"];

class FindingStatusMixin {
  // The objects of drafted or running plans, and those a finished plan changed lately; rebuilt when the journal changes.
  planSets() {
    if (this._planSets?.journal === this.journal) return this._planSets;
    const active = new Set(), done = new Map(), limit = Date.now() - FIXED_DAYS * 864e5;
    for (const plan of this.journal || []) {
      if (ACTIVE_PLAN.includes(plan.status)) (plan.objects || []).forEach(id => active.add(id));
      const at = plan.finished_at ? Date.parse(plan.finished_at) : 0;
      if (at >= limit) (plan.done_objects || []).forEach(id => { if (!done.has(id) || done.get(id) < at) done.set(id, at); });
    }
    this._planSets = { journal: this.journal, active, done };
    return this._planSets;
  }

  // What the user decided: known (kept on purpose), snoozed, hidden; "" for an open finding.
  decidedState(f) {
    if (!f.ignored) return "";
    if (f.ignored_by !== "user") return "hidden";
    const kind = f.ignore_info?.kind;
    return kind === "keep" ? "known" : kind === "snooze" ? "snoozed" : "hidden";
  }

  isNewFinding(f) { return !f.ignored && f.first_detected_at && Date.parse(f.first_detected_at) >= Date.now() - NEW_FINDING_DAYS * 864e5; }

  inWork(f) { return !f.ignored && this.planSets().active.has(f.object_id); }

  // Does a finding belong to the chosen status? "" is the default: everything not decided.
  statusMatch(f) {
    switch (this.findingStatus) {
      case "": return !f.ignored;
      case "all": return true;
      case "new": return this.isNewFinding(f);
      case "inwork": return this.inWork(f);
      default: return this.decidedState(f) === this.findingStatus;
    }
  }

  statusCount(state) {
    const list = this.data.findings;
    if (state === "") return list.filter(f => !f.ignored).length;
    return list.filter(f => (state === "new" ? this.isNewFinding(f) : state === "inwork" ? this.inWork(f) : this.decidedState(f) === state)).length;
  }

  // "New", "In work" next to a row's other facts.
  statusTags(f) {
    return [this.isNewFinding(f) ? this.t("stateNew") : "", this.inWork(f) ? this.t("stateInwork") : ""].filter(Boolean).map(x => ` · ${x}`).join("");
  }

  statusChips() {
    const chip = (state, label, count) => `<button class="chip ${(this.findingStatus || "") === state ? "active" : ""}" data-fstatus="${state || "open"}">${label} (${this.formatNumber(count)})</button>`;
    const decided = FINDING_STATES.filter(s => this.statusCount(s)), fixed = this.fixedLately().length;
    if (!decided.length && !fixed) return "";
    return [chip("", this.t("stateOpen"), this.findingTotal()), ...decided.map(s => chip(s, this.t(`state_${s}`), this.statusCount(s))), ...(fixed ? [chip("fixed", this.t("state_fixed"), fixed)] : [])].join("");
  }

  // Objects a plan changed lately that no longer have a finding: the closed cases.
  fixedLately() {
    const withFinding = new Set(this.data.findings.map(f => f.object_id));
    return [...this.planSets().done].filter(([id]) => !withFinding.has(id)).sort((a, b) => b[1] - a[1]);
  }

  // The closed cases of the last days as rows, for the status "fixed" of the list.
  fixedList() {
    const fixed = this.fixedLately();
    if (!fixed.length) return `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("fixedNone", { days: FIXED_DAYS })}</div>`;
    const rows = fixed.map(([id, at]) => `<div class="row"><span class="tile ok"><ha-icon icon="mdi:check"></ha-icon></span><span class="row-text"><strong>${this.esc(this.findObject(`entity:${id}`)?.name || id)}</strong><small>${this.esc(id)} · ${this.formatDate(new Date(at).toISOString())}</small></span></div>`);
    const pg = this.paginate("fixedlately", rows);
    return `<p class="factnote">${this.t("fixedTitle", { days: FIXED_DAYS })}</p>${pg.rows.join("")}${pg.footer}`;
  }

  // The form under the selection bar: known or snoozed for all selected findings at once.
  bulkForm() {
    const b = this.bulk;
    if (!b) return "";
    if (b.kind === "area") return this.areaForm();
    if (b.kind === "label") {
      const labels = (this.data.objects || []).filter(o => o.object_type === "label").sort((x, y) => String(x.name).localeCompare(String(y.name)));
      if (!labels.length) return `<div class="polform bulkform"><small>${this.t("labelNone")}</small><button type="button" class="btn quiet" data-bulk-cancel>${this.t("cancelRun")}</button></div>`;
      return `<form class="polform bulkform" data-bulk-form><strong>${this.t("state_label")}</strong>
        <select data-bulk-label aria-label="${this.esc(this.t("labelChoose"))}">${labels.map(l => `<option value="${this.esc(l.object_id)}" ${b.label === l.object_id ? "selected" : ""}>${this.esc(l.name)}</option>`).join("")}</select>
        <button type="submit" class="btn primary" ${this.planBusy ? "disabled" : ""}>${this.t("refactorPlan")}</button><button type="button" class="btn quiet" data-bulk-cancel>${this.t("cancelRun")}</button>
        ${b.error ? `<small class="error" role="alert">${this.esc(this.t(b.error))}</small>` : ""}</form>`;
    }
    const days = [7, 30, 90, 365].map(n => `<option value="${n}" ${Number(b.days) === n ? "selected" : ""}>${this.t("decideDays", { n })}</option>`).join("");
    return `<form class="polform bulkform" data-bulk-form><strong>${this.t(`state_${b.kind}`)}</strong>
      <input data-bulk-reason maxlength="200" autocomplete="off" value="${this.esc(b.reason)}" aria-label="${this.esc(this.t("decideReason"))}" placeholder="${this.esc(this.t(b.kind === "known" ? "decideReasonNeeded" : "decideReason"))}">
      ${b.kind === "snoozed" ? `<select data-bulk-days aria-label="${this.esc(this.t("decideHow"))}">${days}</select>` : ""}
      <button type="submit" class="btn primary">${this.t("saveOptions")}</button><button type="button" class="btn quiet" data-bulk-cancel>${this.t("cancelRun")}</button>
      ${b.error ? `<small class="error" role="alert">${this.esc(this.t(b.error))}</small>` : ""}</form>`;
  }

  // Adding a label is a plan like any other: it opens under Cleanup with a preview and an undo.
  async makeLabelPlan() {
    const b = this.bulk;
    const ids = [...new Set([...this.findSel].map(key => this.data.findings.find(f => f.key === key)).filter(Boolean)
      .filter(f => LABEL_TYPES.includes(this.findObject(this.findingKey(f))?.object_type)).map(f => f.object_id))];
    if (!ids.length) { b.error = "labelNoEntities"; this.render(); return; }
    const label = b.label || (this.data.objects || []).find(o => o.object_type === "label")?.object_id;
    try {
      if (!await this.newPlan(ids.map(object_id => ({ kind: "add_label", object_id, target: label })))) return;
      this.bulk = null; this.findSel.clear();
    } catch (err) { b.error = ""; this.failed(err); }
    this.render();
  }

  async commitBulk() {
    const b = this.bulk;
    if (!b) return;
    if (b.kind === "label") return this.makeLabelPlan();
    if (b.kind === "area") return this.makeAreaPlan();
    if (b.kind === "known" && !b.reason.trim()) { b.error = "decideNeedReason"; this.render(); return; }
    const keys = [...this.findSel].filter(key => this.data.findings.some(f => f.key === key && !f.ignored));
    try {
      for (const key of keys) {
        const msg = { type: "ha_housekeeper/ignore", finding_key: key, ignored: true, kind: b.kind === "known" ? "keep" : "snooze", reason: b.reason.trim() };
        if (b.kind === "snoozed") msg.days = Number(b.days);
        await this._hass.callWS(msg);
        const finding = this.data.findings.find(f => f.key === key);
        if (finding) {
          finding.ignored = true; finding.ignored_by = "user"; finding.resurfaced = false;
          finding.ignore_info = { kind: msg.kind, reason: msg.reason, until: msg.days ? new Date(Date.now() + msg.days * 864e5).toISOString() : null, at: new Date().toISOString() };
        }
      }
      this._rev++;
    } catch (err) { this.failed(err); }
    this.bulk = null; this.findSel.clear();
    this.render();
  }

  // "This is no duplicate": a known finding with the reason filled in.
  async markNotDuplicate(key) {
    try {
      await this._hass.callWS({ type: "ha_housekeeper/ignore", finding_key: key, ignored: true, kind: "keep", reason: this.t("notDuplicateReason") });
      const finding = this.data.findings.find(f => f.key === key);
      if (finding) { finding.ignored = true; finding.ignored_by = "user"; finding.resurfaced = false; finding.ignore_info = { kind: "keep", reason: this.t("notDuplicateReason"), until: null, at: new Date().toISOString() }; this._rev++; }
    } catch (err) { this.failed(err); }
    this.render();
  }

  bindFindingStatus(root) {
    root.querySelectorAll("[data-fstatus]").forEach(el => el.onclick = () => { const s = el.dataset.fstatus === "open" ? "" : el.dataset.fstatus; this.findingStatus = this.findingStatus === s ? "" : s; this.pages = {}; this.render(); });
    root.querySelectorAll("[data-fsel-state]").forEach(el => el.onclick = () => { this.bulk = { kind: el.dataset.fselState, reason: "", days: 30, error: "" }; this.render(); this.shadowRoot?.querySelector?.("[data-bulk-reason]")?.focus?.(); });
    root.querySelectorAll("[data-notdup]").forEach(el => el.onclick = () => this.markNotDuplicate(el.dataset.notdup));
    const form = root.querySelector("[data-bulk-form]");
    if (form) {
      form.onsubmit = ev => { ev.preventDefault(); this.commitBulk(); };
      const reason = form.querySelector("[data-bulk-reason]");
      if (reason) reason.oninput = ev => { this.bulk.reason = ev.target.value; };
      const label = form.querySelector("[data-bulk-label]");
      if (label) label.onchange = ev => { this.bulk.label = ev.target.value; };
      const area = form.querySelector("[data-bulk-area]");
      if (area) area.onchange = ev => { this.bulk.area = ev.target.value; };
      const days = form.querySelector("[data-bulk-days]");
      if (days) days.onchange = ev => { this.bulk.days = Number(ev.target.value); };
      form.querySelector("[data-bulk-cancel]").onclick = () => { this.bulk = null; this.render(); };
    }
  }
}
Object.assign(TEXT.de, {
  stateOpen: "Offen", state_fixed: "Zuletzt behoben", fixedNone: "In den letzten {days} Tagen wurde nichts behoben.", stateNew: "Neu", stateInwork: "In Arbeit", state_new: "Neu", state_inwork: "In Arbeit", state_known: "Bekannt", state_snoozed: "Zurückgestellt", state_hidden: "Ausgeblendet",
  fixedTitle: "Zuletzt behoben (letzte {days} Tage)", fselKnown: "Als bekannt markieren", fselSnooze: "Zurückstellen", fselLabel: "Label ergänzen", state_label: "Label ergänzen", labelChoose: "Label", labelNone: "Es gibt noch kein Label. Lege in Home Assistant eines an (Einstellungen → Bereiche, Labels & Zonen → Labels).", labelNoEntities: "Unter der Auswahl sind keine Entitäten, Automationen, Skripte oder Szenen.", confirmedSummaryLabel: "{count} Entitäten bekommen ein Label (nur in Home Assistant, Rückgängig entfernt es wieder).", reason_label_missing: "Das Label gibt es nicht mehr.", reason_already_labelled: "Hat dieses Label schon.", result_labeled: "Label ergänzt", undo_unlabelled: "Label wieder entfernt",
  notDuplicate: "Ist kein Duplikat", notDuplicateReason: "Kein Duplikat (bestätigt)", openTwin: "Funktionierende Entität öffnen", markKnown: "Als bekannt markieren",
});
Object.assign(TEXT.en, {
  stateOpen: "Open", state_fixed: "Fixed lately", fixedNone: "Nothing was fixed in the last {days} days.", stateNew: "New", stateInwork: "In work", state_new: "New", state_inwork: "In work", state_known: "Known", state_snoozed: "Snoozed", state_hidden: "Hidden",
  fixedTitle: "Fixed lately (last {days} days)", fselKnown: "Mark as known", fselSnooze: "Snooze", fselLabel: "Add label", state_label: "Add label", labelChoose: "Label", labelNone: "There is no label yet. Create one in Home Assistant (Settings → Areas, labels & zones → Labels).", labelNoEntities: "The selection holds no entities, automations, scripts or scenes.", confirmedSummaryLabel: "{count} entities get a label (in Home Assistant only, undo takes it off again).", reason_label_missing: "The label no longer exists.", reason_already_labelled: "Already has this label.", result_labeled: "Label added", undo_unlabelled: "label taken off again",
  notDuplicate: "Not a duplicate", notDuplicateReason: "Not a duplicate (confirmed)", openTwin: "Open the working entity", markKnown: "Mark as known",
});
