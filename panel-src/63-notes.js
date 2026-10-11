// The logbook: entries you write yourself in "Zigbee stick replaced", or accept as a suggestion after an action; mixed into the panel in 99-register.js.
// They are kept by Housekeeper only and count as an event for the correlation, always worded "at about the same time".
Object.assign(TEXT.de, {
  noteAdd: "Eintrag", noteMine: "Von mir", noteSrcHk: "Von Housekeeper vorgeschlagen", noteEdit: "Bearbeiten", noteDelete: "Löschen",
  confirmNote: "Der Logbuch-Eintrag „{title}“ wird gelöscht.",
  noteFormTitle: "Titel", noteTitlePh: "z. B. Zigbee-Stick getauscht", noteWhen: "Wann", noteTarget: "Betrifft (optional)", noteTargetPh: "Entität, Gerät, Integration, Bereich",
  noteText: "Notiz (optional)", noteTextPh: "Was genau hast du geändert?", noteSave: "Speichern", noteCancel: "Abbrechen",
  noteNeedTitle: "Gib dem Eintrag einen Titel.", noteBadTime: "Die Zeit ist ungültig oder liegt zu weit in der Zukunft.", noteFailed: "Der Eintrag konnte nicht gespeichert werden: {reason}",
  noteConcerns: "Betrifft: {name}", noteHint: "Nur für dich. Housekeeper ändert nichts in Home Assistant.", noteConcernsNow: "Betrifft", noteChange: "ändern",
  noteDetailTitle: "Logbuch", noteDetailEmpty: "Noch kein Eintrag.", noteDetailHint: "Halte fest, was du hieran geändert hast, damit es nachvollziehbar bleibt.", noteDetailNone: "Halte fest, was du hieran geändert hast, damit es später als möglicher Zusammenhang auftaucht.", noteAddHere: "Eintrag",
  noteDialogNew: "Neuer Eintrag", noteDialogEdit: "Eintrag bearbeiten", noteChips: "Schnell eintragen",
  noteChipStick: "Stick getauscht", noteChipFirmware: "Firmware aktualisiert", noteChipPaired: "Neu angelernt", noteChipMoved: "Umgezogen",
  noteSeeAll: "Im Logbuch ansehen", logbook: "Logbuch", tabScans: "Scan-Vergleich", logbookHint: "Alle Einträge, neueste zuerst", logbookEmpty: "Das Logbuch ist leer. Trage ein, was du außerhalb von Housekeeper änderst, zum Beispiel einen getauschten Stick.",
  logbookFiltered: "Kein Eintrag passt zu diesem Filter.", logbookAll: "Alle", logbookObject: "Objekt: {name}",
  logSuggestTitle: "Ins Logbuch eintragen?", logSuggestText: "Vorschlag: „{title}“", logSuggestYes: "Eintragen", logSuggestNo: "Nein danke", logSuggestDone: "Eingetragen",
  logTitleReplace: "Verweise ersetzt: {old} → {new}", logTitleRename: "Entität umbenannt: {old} → {new}", logTitleMeter: "Zähler gewechselt: {old} → {new}", logTitleMore: "{title} (+{n} weitere)",
  corr_note: "deinem Logbuch-Eintrag „{title}“",
});
Object.assign(TEXT.en, {
  noteAdd: "Entry", noteMine: "By me", noteSrcHk: "Suggested by Housekeeper", noteEdit: "Edit", noteDelete: "Delete",
  confirmNote: "The logbook entry “{title}” will be deleted.",
  noteFormTitle: "Title", noteTitlePh: "e.g. Zigbee stick replaced", noteWhen: "When", noteTarget: "Concerns (optional)", noteTargetPh: "Entity, device, integration, area",
  noteText: "Note (optional)", noteTextPh: "What exactly did you change?", noteSave: "Save", noteCancel: "Cancel",
  noteNeedTitle: "Give the entry a title.", noteBadTime: "The time is invalid or too far in the future.", noteFailed: "The entry could not be saved: {reason}",
  noteConcerns: "Concerns: {name}", noteHint: "Only for you. Housekeeper changes nothing in Home Assistant.", noteConcernsNow: "Concerns", noteChange: "change",
  noteDetailTitle: "Logbook", noteDetailEmpty: "No entry yet.", noteDetailHint: "Note what you changed here, so it stays traceable.", noteDetailNone: "Note what you changed here, so it shows up later as a possible connection.", noteAddHere: "Entry",
  noteDialogNew: "New entry", noteDialogEdit: "Edit entry", noteChips: "Quick entry",
  noteChipStick: "Stick replaced", noteChipFirmware: "Firmware updated", noteChipPaired: "Paired again", noteChipMoved: "Moved",
  noteSeeAll: "See in the logbook", logbook: "Logbook", tabScans: "Scan comparison", logbookHint: "All entries, newest first", logbookEmpty: "The logbook is empty. Note what you change outside Housekeeper, for example a replaced stick.",
  logbookFiltered: "No entry matches this filter.", logbookAll: "All", logbookObject: "Object: {name}",
  logSuggestTitle: "Add to the logbook?", logSuggestText: "Suggestion: “{title}”", logSuggestYes: "Add", logSuggestNo: "No thanks", logSuggestDone: "Added",
  logTitleReplace: "References replaced: {old} → {new}", logTitleRename: "Entity renamed: {old} → {new}", logTitleMeter: "Meter changed: {old} → {new}", logTitleMore: "{title} (+{n} more)",
  corr_note: "your logbook entry “{title}”",
});

const NOTE_PLAN_KINDS = ["replace_references", "rename_entity", "migrate_meter"];

const NOTE_TYPES = ["entity", "device", "config_entry", "area", "automation", "script"];

class NotesMixin {
  notesList() { return this.data?.notes || []; }

  // `<input type="datetime-local">` speaks local time without a zone.
  noteLocal(iso) {
    const d = new Date(iso), p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // Opens the dialog: an entry to edit, or a new one that may already concern an object.
  noteOpen(note = null, target = "") {
    const obj = target ? this.findObject(target) : null;
    this.noteDraft = note
      ? { id: note.id, title: note.title, at: this.noteLocal(note.at), target: note.target, targetText: this.findObject(note.target)?.name || note.target || "", note: note.note, source: note.source, ref: note.ref, error: "" }
      : { id: null, title: "", at: this.noteLocal(new Date().toISOString()), target, targetText: obj?.name || "", note: "", error: "" };
    this._noteFocus = true;
  }

  noteTargetName(target) {
    return target ? this.findObject(target)?.name || target.split(":").slice(1).join(":") : "";
  }

  // One entry of the logbook; the whole row opens it in the dialog.
  noteRow(n) {
    const name = this.noteTargetName(n.target);
    const sub = [this.esc(this.formatDate(n.at)), name ? this.esc(this.t("noteConcerns", { name })) : "", n.note ? this.esc(n.note) : ""].filter(Boolean).join(" · ");
    const pill = n.source === "housekeeper" ? `<span class="pill ok">${this.t("noteSrcHk")}</span>` : "";
    return `<button class="row rel" data-note-edit="${this.esc(n.id)}" title="${this.esc(this.t("noteEdit"))}"><span class="tile"><ha-icon icon="mdi:notebook-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(n.title)}</strong><small>${sub}</small></span>${pill}</button>`;
  }

  // The dialog over the page you are on; the buttons sit on the right, deleting asks in place.
  noteDialog() {
    const d = this.noteDraft;
    if (!d) return "";
    const chips = d.id ? "" : `<div class="notechips" role="group" aria-label="${this.esc(this.t("noteChips"))}">${["Stick", "Firmware", "Paired", "Moved"].map(k => `<button type="button" class="chip" data-note-chip="${this.esc(this.t(`noteChip${k}`))}">${this.t(`noteChip${k}`)}</button>`).join("")}</div>`;
    const foot = `<div class="dfoot">${d.id ? `<button type="button" class="btn quiet danger-t" data-note-del="${this.esc(d.id)}">${this.t("noteDelete")}</button>` : ""}<span class="dbtns"><button type="button" class="btn" data-note-cancel>${this.t("noteCancel")}</button><button type="submit" class="btn primary">${this.t("noteSave")}</button></span></div>`;
    return `<div class="hkmodal" data-note-modal><form class="hkdialog" role="dialog" aria-modal="true" aria-labelledby="hk-note-head" data-note-form>
      <div class="dhead"><h2 id="hk-note-head">${this.t(d.id ? "noteDialogEdit" : "noteDialogNew")}</h2></div>
      <div class="dbody polform">
        <div><label for="hk-note-title">${this.t("noteFormTitle")}</label><input id="hk-note-title" type="text" maxlength="80" data-note-title value="${this.esc(d.title)}" placeholder="${this.esc(this.t("noteTitlePh"))}" autocomplete="off">${chips}</div>
        <div class="notetwo"><div><label for="hk-note-at">${this.t("noteWhen")}</label><input id="hk-note-at" type="datetime-local" data-note-at value="${this.esc(d.at)}"></div>
        ${d.target && !d.changeTarget ? `<div class="notemeta"><span>${this.t("noteConcernsNow")} <strong>${this.esc(d.targetText || this.noteTargetName(d.target))}</strong></span><button type="button" class="linkbtn" data-note-retarget>${this.t("noteChange")}</button></div>` : `<div><label>${this.t("noteTarget")}</label>${this.pickerBox("note", this.t("noteTargetPh"))}</div>`}</div>
        <div><label for="hk-note-text">${this.t("noteText")}</label><textarea id="hk-note-text" rows="3" maxlength="500" data-note-text placeholder="${this.esc(this.t("noteTextPh"))}">${this.esc(d.note)}</textarea></div>
        <small class="notehint2">${this.t("noteHint")}</small>
        ${d.error ? `<div class="error" role="alert">${this.esc(d.error)}</div>` : ""}
      </div>${foot}</form></div>`;
  }

  // The logbook of one object, in its tab "History": every entry, newest first, and the button to add one.
  noteCard(item) {
    if (!NOTE_TYPES.includes(item.object_type)) return "";
    const key = this.objectKey(item), mine = this.notesList().filter(n => n.target === key);
    const add = `<button class="btn primary" data-note-add-for="${this.esc(key)}"><ha-icon icon="mdi:plus"></ha-icon>${this.t("noteAddHere")}</button>`;
    const pg = this.paginate(`notes-${key}`, mine.map(n => this.noteRow(n)));
    const body = mine.length ? pg.rows.join("") + pg.footer : `<div class="emptymsg"><ha-icon icon="mdi:notebook-outline"></ha-icon>${this.t("noteDetailEmpty")}</div>`;
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("noteDetailTitle")}${mine.length ? ` <span class="pill mute">${this.formatNumber(mine.length)}</span>` : ""}</h2><p>${this.t("noteDetailHint")}</p></div>${add}</div>${body}</section>`;
  }

  // The logbook under Changes: all entries in one place, filtered by who wrote them and by object.
  logbookView() {
    const all = this.notesList(), src = this.logbookSource || "", obj = this.logbookObject || "";
    const shown = all.filter(n => (!src || (n.source || "me") === src) && (!obj || n.target === obj));
    const chip = (id, label) => `<button class="chip ${src === id ? "on" : ""}" data-logbook-src="${id}" aria-pressed="${src === id}">${this.esc(label)}</button>`;
    const filters = `<div class="logfilters">${chip("", this.t("logbookAll"))}${chip("me", this.t("noteMine"))}${chip("housekeeper", this.t("noteSrcHk"))}${obj ? `<button class="chip on" data-logbook-clear>${this.esc(this.t("logbookObject", { name: this.noteTargetName(obj) }))} ✕</button>` : ""}</div>`;
    const pg = this.paginate("logbook", shown.map(n => this.noteRow(n)));
    const body = !all.length ? `<div class="emptymsg"><ha-icon icon="mdi:notebook-outline"></ha-icon>${this.t("logbookEmpty")}</div>` : shown.length ? pg.rows.join("") + pg.footer : `<div class="emptymsg">${this.t("logbookFiltered")}</div>`;
    return `<section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("logbook")}</h2><p>${this.t("logbookHint")}</p></div><div class="actions">${this.noteHeadButton()}</div></div>${all.length ? filters : ""}${body}</section>`;
  }

  noteHeadButton() { return `<button class="btn primary" data-note-add><ha-icon icon="mdi:plus"></ha-icon>${this.t("noteAdd")}</button>`; }

  // What a finished plan can offer for the logbook: a title and the object it concerns, or null.
  logSuggestion(plan) {
    if (plan?.status !== "verified") return null;
    const done = (plan.actions || []).filter(a => a.result?.state === "done" && NOTE_PLAN_KINDS.includes(a.kind) && a.target);
    if (!done.length) return null;
    const a = done[0], key = { replace_references: "logTitleReplace", rename_entity: "logTitleRename", migrate_meter: "logTitleMeter" }[a.kind];
    let title = this.t(key, { old: a.object_id, new: a.target });
    if (done.length > 1) title = this.t("logTitleMore", { title, n: done.length - 1 });
    return { title: title.slice(0, 80), target: `entity:${a.target}`, ref: plan.plan_id };
  }

  logSuggestCard(plan) {
    const s = this.logSuggestion(plan);
    if (!s || (this.logDismissed ||= new Set()).has(s.ref)) return "";
    if (this.notesList().some(n => n.ref === s.ref)) return `<p class="factnote"><ha-icon icon="mdi:check" class="u-ic14"></ha-icon> ${this.t("logSuggestDone")}</p>`;
    return `<div class="logsuggest"><span><strong>${this.t("logSuggestTitle")}</strong> ${this.esc(this.t("logSuggestText", { title: s.title }))}</span><span class="dbtns"><button class="btn" data-log-suggest-no="${this.esc(s.ref)}">${this.t("logSuggestNo")}</button><button class="btn primary" data-log-suggest="${this.esc(s.ref)}">${this.t("logSuggestYes")}</button></span></div>`;
  }

  async noteSuggestAccept(plan) {
    const s = this.logSuggestion(plan);
    if (!s) return;
    try {
      const res = await this._hass.callWS({ type: "ha_housekeeper/note_set", action: "save", title: s.title, at: new Date().toISOString(), target: s.target, note: "", source: "housekeeper", ref: s.ref });
      this.data = { ...this.data, notes: res.notes };
      this._corrRequested = false; this._rev++;
    } catch (err) { this.failed(err); }
    this.render();
  }

  async noteSave() {
    const d = this.noteDraft;
    if (!d) return;
    const title = d.title.trim();
    if (!title) { d.error = this.t("noteNeedTitle"); this.render(); return; }
    const when = new Date(d.at);
    if (Number.isNaN(when.getTime())) { d.error = this.t("noteBadTime"); this.render(); return; }
    try {
      const res = await this._hass.callWS({ type: "ha_housekeeper/note_set", action: "save", ...(d.id ? { note_id: d.id } : {}), title, at: when.toISOString(), target: d.target || "", note: d.note.trim() });
      this.data = { ...this.data, notes: res.notes };
      this._corrRequested = false;
      this.noteDraft = null; this._rev++;
    } catch (err) { d.error = this.t("noteFailed", { reason: err?.message || String(err) }); }
    this.render();
  }

  async noteDeleteConfirmed(id) {
    this.noteDraft = null;
    try {
      const res = await this._hass.callWS({ type: "ha_housekeeper/note_set", action: "delete", note_id: id });
      this.data = { ...this.data, notes: res.notes };
      this._corrRequested = false; this._rev++;
    } catch (err) { this.failed(err); }
    this.render();
  }

  bindNotes(root) {
    root.querySelectorAll("[data-note-add]").forEach(el => el.onclick = () => { this.noteOpen(null, this.logbookObject || ""); this.render(); });
    root.querySelectorAll("[data-note-add-for]").forEach(el => el.onclick = () => { this.noteOpen(null, el.dataset.noteAddFor); this.render(); });
    root.querySelectorAll("[data-note-edit]").forEach(el => el.onclick = () => { const n = this.notesList().find(x => x.id === el.dataset.noteEdit); if (n) { this.noteOpen(n); this.render(); } });
    root.querySelectorAll("[data-logbook-for]").forEach(el => el.onclick = () => {
      this.logbookObject = el.dataset.logbookFor; this.logbookSource = "";
      (this.viewTab ||= {}).changes = "logbook";
      this.view = "changes"; this.selected = null; this.trail = []; this.pages = {};
      this.render(); if (!this.compare) this.loadCompare();
    });
    root.querySelectorAll("[data-logbook-src]").forEach(el => el.onclick = () => { this.logbookSource = el.dataset.logbookSrc; this.pages = {}; this.render(); });
    root.querySelector("[data-logbook-clear]")?.addEventListener("click", () => { this.logbookObject = ""; this.pages = {}; this.render(); });
    root.querySelector("[data-note-retarget]")?.addEventListener("click", () => { this.noteDraft.changeTarget = true; this.render(); this.shadowRoot?.querySelector?.("[data-note-modal] .picker input, [data-note-modal] input[data-picker]")?.focus?.(); });
    root.querySelectorAll("[data-note-chip]").forEach(el => el.onclick = () => { this.noteDraft.title = el.dataset.noteChip; this.noteDraft.error = ""; this._noteFocus = true; this.render(); });
    root.querySelector("[data-note-del]")?.addEventListener("click", ev => { const id = ev.currentTarget.dataset.noteDel; this.confirmAsk(this.t("confirmNote", { title: this.noteDraft?.title || "" }), () => this.noteDeleteConfirmed(id)); });
    root.querySelector("[data-note-cancel]")?.addEventListener("click", () => { this.noteDraft = null; this.render(); });
    root.querySelector("[data-note-title]")?.addEventListener("input", ev => { this.noteDraft.title = ev.target.value; this.noteDraft.error = ""; });
    root.querySelector("[data-note-at]")?.addEventListener("input", ev => { this.noteDraft.at = ev.target.value; });
    root.querySelector("[data-note-text]")?.addEventListener("input", ev => { this.noteDraft.note = ev.target.value; });
    root.querySelector("[data-note-form]")?.addEventListener("submit", ev => { ev.preventDefault(); this.noteSave(); });
    const modal = root.querySelector("[data-note-modal]");
    if (modal) {
      modal.addEventListener("mousedown", ev => { if (ev.target === modal) { this.noteDraft = null; this.render(); } });
      modal.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); this.noteDraft = null; this.render(); } });
      if (this._noteFocus) { this._noteFocus = false; modal.querySelector("[data-note-title]")?.focus(); }
    }
    root.querySelectorAll("[data-log-suggest]").forEach(el => el.onclick = () => this.noteSuggestAccept(this.plan));
    root.querySelectorAll("[data-log-suggest-no]").forEach(el => el.onclick = () => { (this.logDismissed ||= new Set()).add(el.dataset.logSuggestNo); this.render(); });
  }
}
