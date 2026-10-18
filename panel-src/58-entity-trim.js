// "Trim history" on the page of one entity: states, short-term and long-term statistics, older than X days or a stretch of
// states; mixed into the panel in 99-register.js. It makes the same plan action as the recorder's trim block (trim_history).
Object.assign(TEXT.de, {
  etTitle: "Verlauf kürzen", etHint: "Löscht gespeicherte Daten dieser Entität. Vorher siehst du, wie viele Zeilen wegfallen. Zurücknehmen geht nur mit dem Backup, das Housekeeper davor anlegt.",
  etCount: "Erst zählen, dann siehst du, wie viele Zeilen gespeichert sind und was du kürzen kannst.", etNone: "Nichts gespeichert",
  etStates: "Zustände", etStatesHint: "Jede Änderung der Entität, wie sie im Verlauf und im Logbuch steht. Das ist der größte Teil der Datenbank.",
  etShort: "Kurzzeitstatistik", etShortHint: "Werte im 5-Minuten-Takt. Home Assistant hebt sie nur etwa 10 Tage auf und räumt sie selbst auf.",
  etLong: "Langzeitstatistik", etLongHint: "Stundenwerte ohne Ablaufdatum. Energie-Dashboard, Diagramme und Summen lesen daraus.",
  etRows: "{count} Zeilen", etOldest: "ältester Eintrag {date}",
  etOlder: "Älter als", etRange: "Zeitraum", etKeep: "Behalten, was jünger ist als", etDays: "{days} Tage", etYear: "1 Jahr",
  etFrom: "von", etTo: "bis", etRangeHint: "Nur Zustände. Ein Loch mitten in einer Statistik würde Summen und Diagramme verfälschen, deshalb gibt es den Zeitraum nur dafür.",
  etGone: "Wird gelöscht", etGoneSub: "Gewählte Daten älter als {days} Tage", etStaySub: "die letzten {days} Tage", etStay: "Bleibt", etBefore: "davor", etAfter: "danach",
  etWarnEnergy: "Das verändert Auswertungen. Diese Entität steht im Energie-Dashboard. Fehlen die ältesten Stunden, beginnen Diagramme und Summen später. Die Summen danach bleiben richtig. Es gibt keinen Weg zurück außer dem Backup.",
  etWarnLong: "Das verändert Auswertungen. Fehlen die ältesten Stunden der Langzeitstatistik, beginnen Diagramme und Summen später. Die Summen danach bleiben richtig. Es gibt keinen Weg zurück außer dem Backup.",
  etFoot: "Vor dem Löschen legt Housekeeper ein Home-Assistant-Backup mit Datenbank an. Die Zahl der Zeilen steht erst in der Vorschau fest.", etPreview: "Vorschau erstellen", etBusy: "Plan wird erstellt …",
  etSubTables: "{tables}", etSubOlder: "älter als {days} Tage: {rows} Zeilen", etSubRange: "{from} bis {to}: {rows} Zeilen",
  reason_trim_statistics: "Die Langzeitstatistik wird gekürzt: Diagramme und Summen beginnen später.", reason_bad_tables: "Die Auswahl der Daten ist ungültig.", reason_range_states_only: "Ein Zeitraum gilt nur für Zustände, nicht für Statistiken.",
});
Object.assign(TEXT.en, {
  etTitle: "Trim history", etHint: "Deletes stored data of this entity. You see how many rows go before anything happens. Undoing needs the backup that Housekeeper makes first.",
  etCount: "Count first, then you see how many rows are stored and what you can trim.", etNone: "Nothing stored",
  etStates: "States", etStatesHint: "Every change of the entity, as shown in the history and the logbook. This is the biggest part of the database.",
  etShort: "Short-term statistics", etShortHint: "Values every 5 minutes. Home Assistant keeps them for about 10 days and cleans them up itself.",
  etLong: "Long-term statistics", etLongHint: "Hourly values without an expiry. The Energy dashboard, charts and sums read from them.",
  etRows: "{count} rows", etOldest: "oldest entry {date}",
  etOlder: "Older than", etRange: "Period", etKeep: "Keep what is younger than", etDays: "{days} days", etYear: "1 year",
  etFrom: "from", etTo: "to", etRangeHint: "States only. A hole in the middle of statistics would falsify sums and charts, so a period is offered for states only.",
  etGone: "Will be deleted", etGoneSub: "Chosen data older than {days} days", etStaySub: "the last {days} days", etStay: "Stays", etBefore: "before", etAfter: "after",
  etWarnEnergy: "This changes what is shown. This entity is in the Energy dashboard. Without the oldest hours, charts and sums begin later. The sums after that stay right. The only way back is the backup.",
  etWarnLong: "This changes what is shown. Without the oldest hours of the long-term statistics, charts and sums begin later. The sums after that stay right. The only way back is the backup.",
  etFoot: "Before deleting, Housekeeper makes a Home Assistant backup with the database. The number of rows is only known in the preview.", etPreview: "Create preview", etBusy: "Creating the plan …",
  etSubTables: "{tables}", etSubOlder: "older than {days} days: {rows} rows", etSubRange: "{from} to {to}: {rows} rows",
  reason_trim_statistics: "The long-term statistics are trimmed: charts and sums begin later.", reason_bad_tables: "The choice of data is not valid.", reason_range_states_only: "A period applies to states only, not to statistics.",
});

const ET_TABLES = [["states", "etStates", "etStatesHint", "states"], ["short_term", "etShort", "etShortHint", "short"], ["long_term", "etLong", "etLongHint", "long"]];
const ET_DAYS = [7, 14, 30, 90, 365];

class EntityTrimMixin {
  entityTrimState(id) {
    return this.etrim?.id === id ? this.etrim : (this.etrim = { id, tables: new Set(["states"]), mode: "older", days: 30, from: "", to: "", busy: false, error: "" });
  }

  // The window of a stretch in epoch seconds: the first day from 00:00, the last day to its end (exclusive end = next midnight).
  entityTrimRange(e) {
    if (!e.from || !e.to) return null;
    const from = new Date(`${e.from}T00:00:00`).getTime() / 1000, to = new Date(`${e.to}T00:00:00`).getTime() / 1000 + 86400;
    return from < to ? { from, to } : null;
  }

  entityTrimAction(item) {
    const e = this.entityTrimState(item.object_id), tables = ET_TABLES.map(t => t[0]).filter(t => e.tables.has(t));
    const action = { kind: "trim_history", object_id: item.object_id };
    if (e.mode === "range") action.range = this.entityTrimRange(e);
    else action.keep_days = e.days;
    if (tables.join() !== "states") action.tables = tables;
    return action;
  }

  // The form to trim the history of one entity, or null while the rows are not counted yet.
  entityTrimBody(item) {
    const id = item.object_id, data = this.entityRec?.[id]?.data;
    if (!data) return null;
    const e = this.entityTrimState(id), date = ts => this.esc(this.formatDate(new Date(ts * 1000).toISOString()).split(",")[0]);
    const kinds = ET_TABLES.map(([table, label, hint, key]) => {
      const part = data[key] || { rows: 0 }, none = !part.rows, on = e.tables.has(table) && !none;
      return `<label class="etkind${none ? " none" : ""}"><input type="checkbox" data-et-table="${table}" ${on ? "checked" : ""} ${none ? "disabled" : ""}><span><strong>${this.t(label)}</strong><small>${this.t(hint)}</small></span><span class="etnum">${none ? this.t("etNone") : `<b>${this.t("etRows", { count: this.formatNumber(part.rows) })}</b><small>${this.t("etOldest", { date: date(part.first) })}</small>`}</span></label>`;
    }).join("");
    const only = [...e.tables].every(t => t === "states");
    const mode = only ? `<span class="trimseg" role="radiogroup">${["older", "range"].map(m => `<button type="button" class="${e.mode === m ? "on" : ""}" data-et-mode="${m}" role="radio" aria-checked="${e.mode === m}">${this.t(m === "older" ? "etOlder" : "etRange")}</button>`).join("")}</span>` : "";
    let timeline;
    if (e.mode === "range" && only) {
      timeline = `<span class="etdates"><label>${this.t("etFrom")} <input type="date" data-et-from value="${this.esc(e.from)}"></label><label>${this.t("etTo")} <input type="date" data-et-to value="${this.esc(e.to)}"></label></span><p class="factnote">${this.t("etRangeHint")}</p>`;
    } else {
      const seg = ET_DAYS.map(d => `<button type="button" class="${e.days === d ? "on" : ""}" data-et-days="${d}" role="radio" aria-checked="${e.days === d}">${this.t(d === 365 ? "etYear" : "etDays", { days: d })}</button>`).join("");
      timeline = `<span class="trimsentence"><strong>${this.t("etKeep")}</strong><span class="trimseg" role="radiogroup">${seg}</span></span><div class="trimline"><div class="gone"><strong>${this.t("etGone")}</strong><small>${this.t("etGoneSub", { days: e.days })}</small></div><div class="stay"><strong>${this.t("etStay")}</strong><small>${this.t("etStaySub", { days: e.days })}</small></div></div>`;
    }
    const energy = this.usageTags(id).includes(this.t("energyDashboard"));
    const warn = e.tables.has("long_term") ? `<p class="etwarn">${this.t(energy ? "etWarnEnergy" : "etWarnLong")}</p>` : "";
    const ready = e.tables.size && (e.mode !== "range" || !only || this.entityTrimRange(e)) && !e.busy;
    return `<div class="etkinds">${kinds}</div><div class="etbody">${mode}${timeline}</div>${warn}${e.error ? `${this.notice("err", e.error)}` : ""}
      <div class="trimfoot"><p class="factnote">${this.t("etFoot")}</p><button class="btn primary" data-et-plan="${this.esc(id)}" ${ready ? "" : "disabled"}>${e.busy ? this.t("etBusy") : this.t("etPreview")}</button></div>`;
  }

  entityTrimCard(item) {
    if (item.object_type !== "entity" || !this.data.meta.recorder_available) return "";
    const body = this.entityTrimBody(item);
    if (body === null) return `<section class="panel"><div class="panelhead"><div><h2>${this.t("etTitle")}</h2><p>${this.t("etCount")}</p></div></div></section>`;
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("etTitle")}</h2><p>${this.t("etHint")}</p></div></div>${body}</section>`;
  }

  // The same as rows of the tab "Actions": the title with its explanation, and the form below it once the rows are counted.
  entityTrimRows(item) {
    if (item.object_type !== "entity" || !this.data.meta.recorder_available) return [];
    const body = this.entityTrimBody(item);
    const state = this.entityRec?.[item.object_id];
    const count = body === null ? `<button class="btn" data-erec="${this.esc(item.object_id)}" ${state?.loading ? "disabled" : ""}>${this.t(state?.loading ? "erecRunning" : "erecCount")}</button>${state?.message ? `<small class="factnote">${this.esc(state.message)}</small>` : ""}` : "";
    return [this.actRow(this.t("etTitle"), this.t(body === null ? "etCount" : "etHint"), count), body === null ? "" : `<div class="actblock">${body}</div>`];
  }

  // The line a trim row shows in a plan: what is trimmed and how much.
  trimPlanSub(a) {
    const rows = a.trim?.rows === undefined ? "?" : a.trim.rows;
    const names = { states: "etStates", short_term: "etShort", long_term: "etLong" };
    const what = a.tables?.length ? `${a.tables.map(t => this.t(names[t])).join(", ")} · ` : "";
    if (a.range) {
      const day = ts => this.formatDate(new Date(ts * 1000).toISOString()).split(",")[0];
      return what + this.t("etSubRange", { from: day(a.range.from), to: day(a.range.to - 86400), rows });
    }
    return what + this.t("etSubOlder", { days: a.keep_days, rows });
  }

  async entityTrimPlan(id) {
    const e = this.entityTrimState(id), item = this.findObject(`entity:${id}`);
    if (!item || e.busy) return;
    e.busy = true; e.error = ""; this.render();
    try {
      const plan = await this._hass.callWS({ type: "ha_housekeeper/plan_create", actions: [this.entityTrimAction(item)] });
      this.openNewPlan(plan);
    } catch (err) { e.error = this.errText(err); }
    e.busy = false;
    this.render();
  }

  bindEntityTrim(root) {
    const e = () => this.etrim;
    root.querySelectorAll("[data-et-table]").forEach(el => el.onchange = () => {
      const s = e(); el.checked ? s.tables.add(el.dataset.etTable) : s.tables.delete(el.dataset.etTable);
      if (![...s.tables].every(t => t === "states")) s.mode = "older";
      this.render();
    });
    root.querySelectorAll("[data-et-mode]").forEach(el => el.onclick = () => { e().mode = el.dataset.etMode; this.render(); });
    root.querySelectorAll("[data-et-days]").forEach(el => el.onclick = () => { e().days = Number(el.dataset.etDays) || 30; this.render(); });
    root.querySelector("[data-et-from]")?.addEventListener("change", ev => { this.etrim.from = ev.target.value; this.render(); });
    root.querySelector("[data-et-to]")?.addEventListener("change", ev => { this.etrim.to = ev.target.value; this.render(); });
    root.querySelector("[data-et-plan]")?.addEventListener("click", ev => this.entityTrimPlan(ev.currentTarget.dataset.etPlan));
  }
}
