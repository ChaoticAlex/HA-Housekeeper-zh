// DetailActionsMixin: the card "What you can do" on the overview of an object. It collects what the other views
// already offer for this one object: decide its findings, and start a plan (replace, disable, label) that opens under
// Cleanup with a preview. Nothing here changes anything by itself.
class DetailActionsMixin {
  // The entity ids a missing reference points to; only entities can be replaced by another entity.
  missingEntities(key) {
    return [...new Set(this.data.findings.filter(f => !f.ignored && this.findingKey(f) === key && f.classification === "broken_reference" && f.rule_id.endsWith("_entity") && String(f.affected_object).includes(".")).map(f => f.affected_object))];
  }

  // The buttons this object offers; `finding` is the key of the open finding a button answers (the
  // first one becomes the next step). Such a button stands in that finding's row, not on its own.
  fixItems(item, key) {
    const open = this.data.findings.filter(f => !f.ignored && this.findingKey(f) === key);
    const out = this.missingEntities(key).map(id => ({ attr: `data-act-replace="${this.esc(id)}"`, icon: "mdi:swap-horizontal", label: `${this.t("actReplace")} ${this.esc(id)}`, hint: "actHintReplace", finding: open.find(f => f.affected_object === id && f.classification === "broken_reference")?.key || true }));
    const broken = open.some(f => f.classification === "broken_reference");
    const dup = item.object_type === "entity" ? open.find(f => f.rule_id === "entity.possible_duplicate" && f.affected_object) : null;
    const down = item.object_type === "entity" ? open.find(f => f.rule_id.startsWith("entity.") && ["orphaned", "unavailable"].includes(f.classification)) : null;
    // With a working twin, replacing it is the answer to the duplicate, filled in; offered once, there.
    if (dup) out.push({ attr: `data-act-replace="${this.esc(item.object_id)}"`, icon: "mdi:swap-horizontal", label: this.t("actReplaceTwin"), hint: "actHintReplaceTwin", finding: dup.key });
    if (down) {
      if (!dup) out.push({ attr: `data-act-replace="${this.esc(item.object_id)}"`, icon: "mdi:swap-horizontal", label: this.t("actReplaceThis"), hint: "actHintReplace", finding: down.key });
      // Disabling an entity its integration no longer provides changes nothing; it is removed straight away (within its first day the plan asks to confirm).
      if (item.reason === "not_provided") out.unshift({ attr: `data-act-remove="${this.esc(item.object_id)}"`, icon: "mdi:delete-outline", label: this.t("actRemove"), hint: "actHintRemove", finding: down.key });
      else if (item.status !== "disabled") out.push({ attr: `data-act-disable="${this.esc(item.object_id)}"`, icon: "mdi:cancel", label: this.t("actDisable"), hint: "actHintDisable", finding: down.key });
    }
    const blocked = item.object_type === "automation" ? open.find(f => f.rule_id === "automation.blocked") : null;
    if (blocked) out.push({ attr: `data-act-disable-auto="${this.esc(item.object_id)}"`, icon: "mdi:cancel", label: this.t("actDisableAuto"), hint: "actHintDisableAuto", finding: blocked.key });
    // A sensor with long-term statistics can have wrong values repaired or be swapped for a new meter.
    if (item.object_type === "entity" && item.has_statistics && item.object_id.startsWith("sensor.")) {
      out.push({ attr: `data-act-repair="${this.esc(item.object_id)}"`, icon: "mdi:chart-line", label: this.t("actRepairValues"), hint: "actHintRepair" });
      out.push({ attr: `data-act-meter="${this.esc(item.object_id)}"`, icon: "mdi:gauge", label: this.t("actMeter"), hint: "actHintMeter" });
    }
    if (item.object_type === "device") out.push({ attr: `data-act-exchange="${this.esc(item.object_id)}"`, icon: "mdi:devices", label: this.t("actExchange"), hint: "actHintExchange" });
    return { items: out, broken };
  }

  fixTile(it) { return `<button class="taskcard" ${it.attr}><ha-icon icon="${it.icon}"></ha-icon><strong>${it.label}</strong><small>${this.t(it.hint)}</small></button>`; }

  // On the overview of an entity: the one step that answers its open finding, with a way to the other actions.
  nextStepBand(item, key) {
    const first = this.fixItems(item, key).items.find(it => it.finding);
    if (!first) return "";
    return `<section class="panel"><div class="nextstep"><span><strong>${this.t("nextStep")}:</strong> ${first.label}<small>${this.t(first.hint)}</small></span><span class="dbtns"><button class="btn quiet" data-detail-tab="actions">${this.t("moreActions")}</button><button class="btn primary" ${first.attr}>${first.label}</button></span></div></section>`;
  }

  // Whether the tab "Actions" has anything to show for this object: findings to decide, buttons, a label or an edit form.
  hasActionsTab(item, key) {
    if (!ACTION_TYPES.includes(item.object_type) && item.object_type !== "app") return false;
    return Boolean(this.findingRows(key, item) || this.fixItems(item, key).items.length || this.labelForm(item) || this.detailEditCard(item) || this.entityTrimCard(item) || this.staleCard(item) || (MARK_TYPES.includes(item.object_type) && this.markRows(item).length));
  }

  // The tab "Actions" of an object: everything that changes something as rows in one card, grouped by purpose.
  actionsTab(item, key) {
    const findings = this.findingRows(key, item);
    const { items, broken } = this.fixItems(item, key);
    // What answers an open finding is recommended; the tools that are always there (exchange, repair, meter) are "more actions".
    const recommended = [], tools = [];
    if (findings) recommended.push(`<div class="actblock">${findings}</div>`);
    // A step that answers a finding stands in that finding's row (findingRows); only one without a row of its own is listed here.
    for (const it of items.filter(it => typeof it.finding !== "string")) (it.finding ? recommended : tools).push(this.actRow(it.label, this.t(it.hint), `<button class="btn${it.finding ? " primary" : ""}" ${it.attr}>${this.t("actOpen")}</button>`));
    if (broken) recommended.push(`<div class="actblock"><small class="factnote">${this.t("actEditInHa")}</small></div>`);
    const labelControls = broken ? null : this.labelParts(item, true);
    const name = [...this.detailEditRows(item), labelControls ? this.actRow(this.t("actLabelTitle"), this.t("actLabelHint"), labelControls) : ""];
    const notes = this.markRows(item);
    const record = [...this.entityTrimRows(item), this.staleRow(item)];
    const group = (title, rows, sub = "") => { const html = rows.filter(Boolean).join(""); return html ? `<div class="actsec">${this.t(title)}${sub ? `<small>${sub}</small>` : ""}</div>${html}` : ""; };
    const preview = this.t("actPreviewOnly");
    // A tab with nothing but the mark (a healthy integration or app) says what it is for.
    const onlyMark = notes.length && ![recommended, tools, name, record].some(rows => rows.filter(Boolean).length);
    const body = [group("actGroupRecommended", recommended, items.some(it => it.finding) ? preview : ""), group("actGroupNotes", notes), group("moreActions", tools, preview), group("actGroupName", name), group("actGroupRecord", record)].join("") + (onlyMark ? `<div class="pad"><p class="factnote">${this.t("actOnlyNotes")}</p></div>` : "");
    return body ? `<section class="panel actpanel">${body}</section>` : `<p class="factnote">${this.t("actNone")}</p>`;
  }

  // The label list and its button; null when the object cannot take a label or no label exists.
  labelParts(item, short = false) {
    if (!LABEL_TYPES.includes(item.object_type)) return null;
    const labels = (this.data.objects || []).filter(o => o.object_type === "label").sort((x, y) => String(x.name).localeCompare(String(y.name)));
    if (!labels.length) return null;
    const chosen = this.actLabel && labels.some(l => l.object_id === this.actLabel) ? this.actLabel : labels[0].object_id;
    return `<select data-act-label aria-label="${this.esc(this.t("labelChoose"))}">${labels.map(l => `<option value="${this.esc(l.object_id)}" ${chosen === l.object_id ? "selected" : ""}>${this.esc(l.name)}</option>`).join("")}</select>
      <button class="btn primary" data-act-label-plan="${this.esc(item.object_id)}" ${this.planBusy ? 'disabled aria-busy="true"' : ""}>${this.t(short ? "actLabelPreviewShort" : "actLabelPreview")}</button>`;
  }

  labelForm(item) {
    const controls = this.labelParts(item);
    if (!controls) return "";
    return `<div class="labelbox"><span class="tile"><ha-icon icon="mdi:label-outline"></ha-icon></span><div class="labeltext"><strong>${this.t("actLabelTitle")}</strong><small>${this.t("actLabelHint")}</small></div>${controls}</div>`;
  }

  actionsCard(item, key, withLabel = true) {
    const rows = this.findingRows(key, item);
    const { items, broken } = this.fixItems(item, key);
    const buttons = items.filter(it => typeof it.finding !== "string").map(it => this.fixTile(it)).join("");
    const label = withLabel && !broken ? this.labelForm(item) : "";
    if (!rows && !buttons && !label && !broken) return "";
    const fix = buttons || label || broken ? `<div class="pad actpad"><small class="factnote">${this.t("actPreviewOnly")}</small>${buttons ? `<div class="taskgrid compactgrid">${buttons}</div>` : ""}${label}${broken ? `<small class="factnote">${this.t("actEditInHa")}</small>` : ""}</div>` : "";
    return `<section class="panel"><div class="panelhead"><h2>${this.t("actionsTitle")}</h2></div>${rows}${fix}</section>`;
  }

  // One row of the tab "Actions": the name with its explanation, and the control.
  // Long explanations are cut at two lines; "More" opens the rest.
  actRow(title, hint, control) {
    const long = hint && String(hint).length > 150;
    return `<div class="actrow"><span class="acttext"><strong>${title}</strong>${hint ? `<small${long ? ' class="clamp"' : ""}>${hint}</small>` : ""}${long ? `<button type="button" class="linkbtn morebtn" data-act-more aria-expanded="false">${this.t("actMore")}</button>` : ""}</span>${control ? `<span class="actctl">${control}</span>` : ""}</div>`;
  }

  // The Cleanup view takes over from here: the assistant is filled in, the person looks at the preview and confirms.
  startCleanup(kind, fill) {
    this.noteJump?.("cleanup");
    this.cleanupKind = kind; this.cleanupSel = new Set(); this.plan = null; fill();
    if (this.lv.cleanup) this.lv.cleanup.f = {};
    this.view = viewForKind(kind); (this.viewTab ||= {}).cleanup = ["remove_entity", "remove_device", "forget_device"].includes(kind) ? "quarantine" : DEVICE_KINDS.includes(kind) ? "devices" : "entities"; if (kind === "remove_device" || kind === "forget_device") this.quarantineType = "device"; else if (kind === "remove_entity") this.quarantineType = "entity"; this.repairTask = this.view === "repair" ? kind : null; this.pages = {}; this.selected = null;
    this.render();
  }

  // A blocked automation is switched off by a plan like any entity: preview, confirmation, journal, undo.
  async planDisable(entityId) {
    try {
      if (!await this.newPlan([{ kind: "disable_entity", object_id: entityId }])) return;
      this.selected = null;
    } catch (err) { this.failed(err); }
    this.render();
  }

  async planRemove(entityId) {
    try {
      if (!await this.newPlan([{ kind: "remove_entity", object_id: entityId }])) return;
      this.selected = null;
    } catch (err) { this.failed(err); }
    this.render();
  }

  async planLabel(entityId, label) {
    try {
      if (!await this.newPlan([{ kind: "add_label", object_id: entityId, target: label }])) return;
      this.selected = null;
    } catch (err) { this.failed(err); }
    this.render();
  }

  // Opens the repair assistant on the readings of this sensor: at the range a scan found, else at the last seven days.
  repairValues(id) {
    this.startCleanup("repair_counter", () => { this.counterId = id; this.counterRangeReq = null; });
    const suggest = (this.counterScan?.items || []).find(i => i.statistic_id === id)?.findings?.[0]?.suggest;
    if (suggest) this.takeRange(id, suggest.from, suggest.to); else this.loadRangeSeries();
  }

  bindDetailActions(root) {
    root.querySelectorAll("[data-act-more]").forEach(el => el.onclick = () => {
      const open = el.previousElementSibling?.classList.toggle("open");
      el.setAttribute("aria-expanded", String(Boolean(open)));
      el.textContent = this.t(open ? "actLess" : "actMore");
    });
    root.querySelectorAll("[data-act-repair]").forEach(el => el.onclick = () => this.repairValues(el.dataset.actRepair));
    root.querySelectorAll("[data-act-meter]").forEach(el => el.onclick = () => this.startCleanup("migrate_meter", () => { this.meterOld = el.dataset.actMeter; this.meterNew = ""; }));
    root.querySelectorAll("[data-act-exchange]").forEach(el => el.onclick = () => this.startCleanup("exchange_device", () => { const ex = this.exchangeState(); ex.oldDev = el.dataset.actExchange; ex.newDev = ""; ex.result = null; ex.choices = {}; }));
    root.querySelectorAll("[data-act-replace]").forEach(el => el.onclick = () => this.startCleanup("replace_references", () => { this.replOld = el.dataset.actReplace; this.replNew = el.dataset.replNew || this.findObject(`entity:${el.dataset.actReplace}`)?.duplicate_of || ""; }));
    root.querySelectorAll("[data-act-disable]").forEach(el => el.onclick = () => this.startCleanup("disable_entity", () => this.cleanupSel.add(el.dataset.actDisable)));
    root.querySelectorAll("[data-act-remove]").forEach(el => el.onclick = () => this.planRemove(el.dataset.actRemove));
    root.querySelectorAll("[data-act-disable-auto]").forEach(el => el.onclick = () => this.planDisable(el.dataset.actDisableAuto));
    root.querySelector("[data-act-label]")?.addEventListener("change", e => { this.actLabel = e.target.value; });
    root.querySelector("[data-act-label-plan]")?.addEventListener("click", e => this.planLabel(e.currentTarget.dataset.actLabelPlan, root.querySelector("[data-act-label]")?.value || this.actLabel));
  }
}
Object.assign(TEXT.de, {
  actOpen: "Öffnen", tabActions: "Aktionen", nextStep: "Nächster Schritt", moreActions: "Weitere Aktionen", actGroupRecommended: "Empfohlen", actGroupName: "Benennen und einordnen", actGroupNotes: "Notizen", actOnlyNotes: "Hier legst du fest, was bei diesem Objekt normal ist, zum Beispiel „nachts offline“. Housekeeper meldet es dann nicht mehr als „nicht verfügbar“.", actMore: "Mehr", actLess: "Weniger", actLabelPreviewShort: "Vorschau", actGroupRecord: "Aufzeichnung und Überwachung", actNone: "Hier gibt es nichts zu tun.",
  actionsTitle: "Was möchtest du tun?", actReplace: "Ersetzen:", actReplaceThis: "Durch andere Entität ersetzen", actDisable: "Deaktivieren planen", actRemove: "Entfernen planen", actReplaceTwin: "Durch funktionierende Entität ersetzen", actHintReplaceTwin: "Überall durch die funktionierende Entität ersetzen; sie ist schon eingetragen.", actHintRemove: "Die Integration stellt sie nicht mehr bereit, darum ohne Quarantäne: mit Vorschau, Backup und Wiederherstellen.", actDisableAuto: "Automation deaktivieren (Plan)", actHintDisableAuto: "Keiner ihrer Auslöser kann feuern. Der Plan schaltet sie aus, mit Vorschau, Bestätigung und Rückgängig.",
  actLabelTitle: "Label ergänzen", actLabelHint: "Fügt ein vorhandenes Label hinzu, zum Beispiel zum Filtern. Du siehst zuerst eine Vorschau.", actLabelPreview: "Vorschau erstellen",
  actPreviewOnly: "Hier startest du nur eine Vorschau. Geändert wird erst, wenn du sie bestätigst.",
  actEditInHa: "Eine einzelne Referenz entfernt Housekeeper nicht selbst. Öffne die Automation in Home Assistant und bearbeite sie dort.",
});
Object.assign(TEXT.en, {
  actOpen: "Open", tabActions: "Actions", nextStep: "Next step", moreActions: "More actions", actGroupRecommended: "Recommended", actGroupName: "Name and classify", actGroupNotes: "Notes", actOnlyNotes: "Here you say what is normal for this object, for example “offline at night”. Housekeeper then stops reporting it as “not available”.", actMore: "More", actLess: "Less", actLabelPreviewShort: "Preview", actGroupRecord: "Recording and monitoring", actNone: "There is nothing to do here.",
  actionsTitle: "What would you like to do?", actReplace: "Replace:", actReplaceThis: "Replace by another entity", actDisable: "Plan to disable", actRemove: "Plan to remove", actReplaceTwin: "Replace by the working entity", actHintReplaceTwin: "Replace it everywhere by the working entity; it is already filled in.", actHintRemove: "Its integration no longer provides it, so no quarantine: with preview, backup and restore.", actDisableAuto: "Disable automation (plan)", actHintDisableAuto: "None of its triggers can fire. The plan switches it off, with preview, confirmation and undo.",
  actLabelTitle: "Add a label", actLabelHint: "Adds an existing label, for example for filtering. You see a preview first.", actLabelPreview: "Create preview",
  actPreviewOnly: "This only starts a preview. Nothing changes until you confirm it.",
  actEditInHa: "Housekeeper does not remove a single reference itself. Open the automation in Home Assistant and edit it there.",
});
