// Pick entities in the recorder views and get the exclusion for configuration.yaml; Housekeeper never writes it.
// Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  exclHint: "Das ändert nichts in Home Assistant, es ist nur Text zum Einfügen. Ausgeschlossene Entitäten haben danach keinen Verlauf mehr.",
  exTrimCount: "{count} zum Kürzen", exLeft: "Ausgeschlossen, aber noch gespeichert: {count} Entitäten, mindestens {rows} Zeilen", exLeftPick: "Zum Kürzen wählen",
  exCount: "{count} ausgewählt", exNone: "Nichts ausgewählt", exNoneSug: "Nichts ausgewählt · {count} Vorschläge", exPickSuggested: "Alle Vorgeschlagenen wählen", exClear: "Leeren", exCopy: "YAML kopieren",
  exStepsTitle: "So geht es weiter", exStep1: "Einfügen in die configuration.yaml. Gibt es dort schon einen recorder:-Abschnitt, trage nur die Zeilen unter entities: in dessen exclude:-Liste ein, nicht noch einmal recorder:.",
  exStep2: "Prüfen unter Entwicklerwerkzeuge → YAML → Konfiguration prüfen.", exStep3: "Neu starten. Der Recorder liest den Ausschluss nur beim Start. Danach steht die Entität hier als „bereits ausgeschlossen“.",
  exSuggest: "Empfohlen: ausschließen", exWhy: "Nicht verwendet, keine Statistik, {perDay} Zeilen pro Tag", exRule: "Empfohlen ist, was nirgends verwendet wird, keine Statistik hat und mindestens {min} Zeilen pro Tag schreibt.", exHasStats: "Statistik vorhanden", exUsedBy: "{count} Verwendungen",
  trimTitle: "Alten Verlauf der Auswahl kürzen", trimHint: "Der Ausschluss wirkt nur für neue Daten. Hier löschst du die bereits gespeicherten Zustände der Auswahl, die älter sind als die gewählte Zeit. Statistiken bleiben. Daraus wird ein Plan unter Aufräumen: Vorschau mit Zeilenzahl, Bestätigung, Backup, Nachprüfung.",
  trimKeep: "Behalten", trimDays: "{days} Tage", trimPreview: "Plan für das Kürzen erstellen", trimBusy: "Plan wird erstellt …", trimFailed: "Der Plan konnte nicht erstellt werden: {detail}",
  trimSub: "älter als {days} Tage: {rows} Zeilen", reason_bad_keep_days: "Die Zeit zum Behalten ist ungültig.", reason_not_counted: "Die Zeilen ließen sich nicht zählen.", reason_nothing_to_trim: "Nichts zu löschen: Es gibt keine so alten Zustände.",
  check_history_trimmed: "Alter Verlauf ist gelöscht", abort_trim_unverified: "Gelöscht, aber die übrigen Zeilen ließen sich nicht zählen.", abort_trim_left: "Nach dem Löschen gab es noch ältere Zeilen.",
  confirmedSummaryTrim: "Der alte Verlauf von {count} Entitäten wird gelöscht. Vorher legt Housekeeper ein Home-Assistant-Backup an, einschließlich der Datenbank. Das lässt sich nur mit dem Backup zurücknehmen.",
});
Object.assign(TEXT.en, {
  exclHint: "This changes nothing in Home Assistant, it is only text to paste. Excluded entities have no history afterwards.",
  exTrimCount: "{count} to trim", exLeft: "Excluded but still stored: {count} entities, at least {rows} rows", exLeftPick: "Select to trim",
  exCount: "{count} selected", exNone: "Nothing selected", exNoneSug: "Nothing selected · {count} suggestions", exPickSuggested: "Select all suggested", exClear: "Clear", exCopy: "Copy YAML",
  exStepsTitle: "What to do next", exStep1: "Paste it into configuration.yaml. If there is a recorder: section already, add only the lines under entities: to its exclude: list, not recorder: again.",
  exStep2: "Check under Developer tools → YAML → Check configuration.", exStep3: "Restart. The recorder reads the exclusion only at start. Afterwards the entity shows here as “already excluded”.",
  exSuggest: "Recommended: exclude", exWhy: "Not used, no statistics, {perDay} rows per day", exRule: "Recommended means: used nowhere, no statistics and at least {min} rows per day.", exHasStats: "has statistics", exUsedBy: "{count} uses",
  trimTitle: "Trim the old history of the selection", trimHint: "The exclusion only works for new data. Here you delete the states already stored for the selection that are older than the chosen time. Statistics stay. This becomes a plan under Cleanup: preview with row count, confirmation, backup, check afterwards.",
  trimKeep: "Keep", trimDays: "{days} days", trimPreview: "Create a plan to trim", trimBusy: "Creating the plan …", trimFailed: "The plan could not be created: {detail}",
  trimSub: "older than {days} days: {rows} rows", reason_bad_keep_days: "The time to keep is not valid.", reason_not_counted: "The rows could not be counted.", reason_nothing_to_trim: "Nothing to delete: there are no states that old.",
  check_history_trimmed: "Old history is deleted", abort_trim_unverified: "Deleted, but the rows left could not be counted.", abort_trim_left: "Older rows were still there after deleting.",
  confirmedSummaryTrim: "The old history of {count} entities will be deleted. Housekeeper creates a Home Assistant backup first, including the database. It can only be taken back with that backup.",
});

const EXCLUDE_MIN_PER_DAY = 100; // rows per day from which an unused entity is worth excluding

class ExcludeMixin {
  // What speaks for or against excluding one entity, from the inventory. `excluded` is what the recorder reports.
  excludeInfo(entityId, perDay, excluded = false) {
    const tag = (cls, text) => `<span class="pill ${cls}">${text}</span>`;
    if (excluded) return { suggest: false, tags: tag("ok", this.t("recorderExcluded")) };
    const obj = this.findObject(`entity:${entityId}`);
    if (!obj) return { suggest: false, tags: "" };
    const uses = this.edgesTo(`entity:${entityId}`).filter(e => USAGE_RELATIONS.includes(e.relation)).length;
    const suggest = !uses && !obj.has_statistics && perDay >= EXCLUDE_MIN_PER_DAY;
    const tags = suggest ? tag("warn", this.t("exSuggest")) : [obj.has_statistics ? tag("mute", this.t("exHasStats")) : "", uses ? tag("mute", this.t("exUsedBy", { count: uses })) : ""].join("");
    return { suggest, tags, why: suggest ? this.t("exWhy", { perDay: this.formatNumber(Math.round(perDay)) }) : "" };
  }

  // What the recorder keeps out already, from the lists in view.
  excludedIds() {
    return new Set([...(this.costs?.entities || []), ...(this.storms?.entities || [])].filter(e => e.excluded).map(e => e.entity_id));
  }

  // An excluded entity stays pickable: it adds nothing to the block, but its old rows can be trimmed.
  excludeBox(entityId) {
    return `<input type="checkbox" class="selbox" data-exsel="${this.esc(entityId)}" ${this.excludeSel.has(entityId) ? "checked" : ""} aria-label="${this.esc(entityId)}">`;
  }

  // The picked entities that are not excluded yet, in the order of the block.
  excludeChosen() {
    const done = this.excludedIds();
    return [...this.excludeSel].filter(id => !done.has(id)).sort();
  }

  // Excluded entities of the cost list that still hold rows. The list shows only the largest, so this is a lower bound.
  excludeLeft() {
    const rows = (this.costs?.entities || []).filter(e => e.excluded && e.states > 0);
    return { ids: rows.map(e => e.entity_id), rows: rows.reduce((sum, e) => sum + e.states, 0) };
  }

  excludeSnippet() {
    return `recorder:\n  exclude:\n    entities:\n${this.excludeChosen().map(id => `      - ${id}`).join("\n")}\n`;
  }

  // One bar over the list: what is picked and what can be done with it. The block and the steps open once something is
  // to be excluded, the trim block once anything is picked. `suggested` are the entity ids of the list in view that the Suggest button ticks.
  excludeCard(suggested) {
    this._exSuggested = suggested;
    const n = this.excludeChosen().length, trim = this.excludeSel.size - n, sug = suggested.length, left = this.excludeLeft();
    const label = [n ? this.t("exCount", { count: n }) : "", trim ? this.t("exTrimCount", { count: trim }) : ""].filter(Boolean).join(" · ") || (sug ? this.t("exNoneSug", { count: sug }) : this.t("exNone"));
    const leftNote = left.ids.length && left.ids.some(id => !this.excludeSel.has(id))
      ? `<span class="date">${this.t("exLeft", { count: this.formatNumber(left.ids.length), rows: this.formatNumber(left.rows) })}</span><button class="btn quiet" data-ex-left>${this.t("exLeftPick")}</button>` : "";
    const any = n || trim;
    const bar = `<div class="toolbar exbar${any ? "" : " nosel"}"><span class="date" title="${this.esc(this.t("exclHint"))}">${label}</span>${sug ? `<button class="btn quiet" data-ex-suggested>${this.t("exPickSuggested")}</button>` : ""}${any ? `<button class="btn quiet" data-ex-clear>${this.t("exClear")}</button>` : ""}${n ? `<button class="btn primary" data-copy-snippet title="${this.esc(this.t("exclHint"))}">${this.snippetCopied ? this.t("recorderCopied") : this.t("exCopy")}</button>` : ""}${leftNote}</div>`;
    const steps = `<div class="exsteps"><strong>${this.t("exStepsTitle")}</strong><ol><li>${this.t("exStep1")}</li><li>${this.t("exStep2")}</li><li>${this.t("exStep3")}</li></ol></div>`;
    const rule = `<p class="factnote exrule">${this.t("exRule", { min: EXCLUDE_MIN_PER_DAY })}</p>`;
    return `${bar}${rule}${n ? `<pre class="code exblock">${this.esc(this.excludeSnippet())}</pre>${steps}` : ""}${any ? this.trimBlock() : ""}`;
  }

  // Deleting the states stored before: the exclusion alone leaves them. Made as an ordinary plan.
  trimBlock() {
    const days = this.trimDays || 14, n = Math.min(this.excludeSel.size, MAX_PLAN_ACTIONS);
    const options = [7, 14, 30, 90].map(d => `<option value="${d}" ${d === days ? "selected" : ""}>${this.t("trimDays", { days: d })}</option>`).join("");
    return `<div class="trimbox"><h3>${this.t("trimTitle")}</h3><p class="factnote">${this.t("trimHint")}</p><div class="actions"><label class="factnote" for="hk-trim-days">${this.t("trimKeep")}</label><select id="hk-trim-days" data-trim-days>${options}</select><button class="btn accent" data-trim-plan ${this.trimBusy ? "disabled" : ""}>${this.trimBusy ? this.t("trimBusy") : `${this.t("trimPreview")} (${n})`}</button></div>${this.trimError ? `<p class="factnote" role="alert">${this.esc(this.t("trimFailed", { detail: this.trimError }))}</p>` : ""}</div>`;
  }

  async trimPlan() {
    this.trimBusy = true; this.trimError = ""; this.render();
    try {
      const keep_days = this.trimDays || 14;
      const actions = [...this.excludeSel].slice(0, MAX_PLAN_ACTIONS).map(object_id => ({ kind: "trim_history", object_id, keep_days }));
      const plan = await this._hass.callWS({ type: "ha_housekeeper/plan_create", actions });
      this.openNewPlan(plan);
    } catch (err) { this.trimError = err?.message || String(err); }
    this.trimBusy = false;
    this.render();
  }

  bindExclude(root) {
    root.querySelector("[data-trim-days]")?.addEventListener("change", e => { this.trimDays = Number(e.target.value) || 14; this.render(); });
    root.querySelector("[data-trim-plan]")?.addEventListener("click", () => this.trimPlan());
    root.querySelectorAll("[data-exsel]").forEach(el => el.onchange = () => { el.checked ? this.excludeSel.add(el.dataset.exsel) : this.excludeSel.delete(el.dataset.exsel); this.render(); });
    root.querySelector("[data-ex-suggested]")?.addEventListener("click", () => { (this._exSuggested || []).forEach(id => this.excludeSel.add(id)); this.render(); });
    root.querySelector("[data-ex-left]")?.addEventListener("click", () => { this.excludeLeft().ids.forEach(id => this.excludeSel.add(id)); this.render(); });
    root.querySelector("[data-ex-clear]")?.addEventListener("click", () => { this.excludeSel.clear(); this.render(); });
    root.querySelector("[data-copy-snippet]")?.addEventListener("click", async () => {
      try { await globalThis.navigator?.clipboard?.writeText(this.excludeSnippet()); this.snippetCopied = true; } catch (_) { this.snippetCopied = false; }
      this.render();
      setTimeout(() => { this.snippetCopied = false; this.render(); }, 1500);
    });
  }
}
