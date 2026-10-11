// BatteryCareMixin: the battery forecast and the maintenance reminders in the Batteries view.
class BatteryCareMixin {
  async loadBatteryTrend(refresh = false) {
    this.batteryTrendLoading = true; this.render();
    try { this.batteryTrend = await this._hass.callWS({ type: "ha_housekeeper/battery_trend", refresh }); this.batteryTrendError = ""; }
    catch (err) { this.batteryTrendError = err?.message || String(err); }
    this.batteryTrendLoading = false; this.render();
  }

  ensureBatteryTrend() {
    if (this.batteryTrendLoading || this._btRequested) return;
    this._btRequested = true;
    setTimeout(() => this.loadBatteryTrend(), 0);
  }

  // Batteries that report volts, as rows of the same list: the type is guessed from the full voltage, the limit comes from the type.
  batteryVoltRows() {
    return (this.batteryTrend?.voltage?.rows || []).map(v => {
      const item = this.findObject(`entity:${v.entity_id}`);
      return item ? { item, level: v.level, low: v.state === "low", volt: v } : null;
    }).filter(Boolean);
  }

  voltNum(n) { return `${Number(n).toLocaleString(this.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} V`; }

  voltNote() {
    const v = this.batteryTrend?.voltage;
    return v && (v.rows.length || v.unknown) ? `<p class="factnote">${this.t("bvNote", { unknown: this.formatNumber(v.unknown) })}</p>` : "";
  }

  reminderRow(r) {
    const tone = { due: "red", soon: "warn", ok: "ok" }[r.state];
    const when = r.state === "due" ? this.t("remOverdue", { n: Math.abs(r.days_left) }) : this.t("remIn", { n: r.days_left });
    return `<div class="row remrow"><span class="tile ${tone}"><ha-icon icon="mdi:wrench-clock"></ha-icon></span><span class="row-text"><strong>${this.esc(r.name)}</strong><small>${this.esc(this.t("remLine", { interval: r.interval_days, last: r.last_done, due: r.due }))}${r.note ? ` · ${this.esc(r.note)}` : ""}</small></span><span class="pill ${tone}">${this.esc(when)}</span><button class="btn" data-rem-done="${this.esc(r.id)}">${this.t("remDone")}</button><button class="btn quiet" data-rem-del="${this.esc(r.id)}" aria-label="${this.esc(this.t("remDelete"))}">${this.t("remDelete")}</button></div>`;
  }

  // Own view under "Maintain": own reminders (filter, descaling, changing batteries) with a date when they are due.
  remindersView() { return `<div class="stack">${this.remindersCard()}</div>`; }

  remindersCard() {
    const items = this.data.reminders || [];
    const draft = this.remDraft || { name: "", interval_days: 90, last_done: new Date().toISOString().slice(0, 10), note: "" };
    const form = `<div class="setrow remform"><input data-rem-field="name" placeholder="${this.esc(this.t("remName"))}" aria-label="${this.esc(this.t("remName"))}" value="${this.esc(draft.name)}" maxlength="80"><label class="recchoice"><span>${this.t("remEvery")}</span><input data-rem-field="interval_days" type="number" min="1" max="3650" value="${this.esc(draft.interval_days)}" style="width:5em"> ${this.t("remDays")}</label><label class="recchoice"><span>${this.t("remLast")}</span><input data-rem-field="last_done" type="date" value="${this.esc(draft.last_done)}"></label><input data-rem-field="note" placeholder="${this.esc(this.t("remNote"))}" aria-label="${this.esc(this.t("remNote"))}" value="${this.esc(draft.note)}" maxlength="200"><button class="btn primary" data-rem-add>${this.t("remAdd")}</button></div>${this.remError ? `<div class="error">${this.esc(this.remError)}</div>` : ""}`;
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("remTitle")}</h2><p>${this.t("remHint")}</p></div></div>${items.length ? items.map(r => this.reminderRow(r)).join("") : `<p class="factnote">${this.t("remNone")}</p>`}${form}</div>`;
  }

  async reminderCall(msg) {
    this.remError = "";
    try { const reply = await this._hass.callWS({ type: "ha_housekeeper/reminder_set", ...msg }); this.data.reminders = reply.reminders; if (msg.action === "save") this.remDraft = null; }
    catch (err) { this.remError = this.t("remInvalid", { field: String(err?.message || err).replace(/^Not accepted: /, "") }); }
    this.render();
  }

  bindBatteryCare(root) {
    this.bindBatteryType(root);
    this.bindBatteryKind(root);
    root.querySelector("[data-bt-refresh]")?.addEventListener("click", () => this.loadBatteryTrend(true));
    root.querySelectorAll("[data-rem-field]").forEach(el => el.addEventListener("input", () => { this.remDraft = { ...(this.remDraft || { name: "", interval_days: 90, last_done: new Date().toISOString().slice(0, 10), note: "" }), [el.dataset.remField]: el.value }; }));
    root.querySelector("[data-rem-add]")?.addEventListener("click", () => {
      const d = this.remDraft || { name: "", interval_days: 90, last_done: new Date().toISOString().slice(0, 10), note: "" };
      this.reminderCall({ action: "save", name: d.name, interval_days: Number(d.interval_days), last_done: d.last_done, note: d.note });
    });
    root.querySelectorAll("[data-rem-done]").forEach(el => el.addEventListener("click", () => this.reminderCall({ action: "done", reminder_id: el.dataset.remDone })));
    root.querySelectorAll("[data-rem-del]").forEach(el => el.addEventListener("click", () => this.reminderCall({ action: "delete", reminder_id: el.dataset.remDel })));
  }
}
Object.assign(TEXT.de, {
  bvTitle: "Batterien mit Spannung", bvHint: "Sensoren, die Volt statt Prozent melden. Housekeeper schätzt den Typ aus der höchsten Spannung der letzten Wochen und nimmt dessen Grenze.", bvStable: "stabil",
  bvLine: "Jetzt {now} · erkannt als {kind} · Grenze {limit}", bvNote: "Der Typ ist eine Schätzung; liegt er falsch, ist auch die Grenze falsch. Ohne Angabe: {unknown} (zu wenige Tage oder eine Spannung, die zu keinem Typ passt).",
  bvType_cell15: "Einzelzelle 1,5 V (AA/AAA, Alkaline oder NiMH)", bvType_coin3: "3-V-Zelle (z. B. CR2032 oder 2 × AA)", bvType_lithium: "Lithium-Ionen-Zelle", bvType_cells3: "3 Zellen in Reihe (4,5 V)", bvType_cells4: "4 Zellen in Reihe (6 V)", bvType_block9: "9-V-Block", bvType_lead12: "12-V-Akku",
  btTitle: "Alle Batterien", btHint: "Stand, Verbrauch und die Prognose, wann eine Batterie die Grenze erreicht (bis 90 Tage).", btLoading: "Prognose wird berechnet …", btNoRecorder: "Ohne Recorder gibt es keine Prognose.",
  remTitle: "Wartungserinnerungen", remHint: "Filter, Entkalken, Batteriewechsel: du trägst Name, Abstand und letztes Datum ein, Housekeeper sagt, wann es wieder fällig ist. Es ändert nichts in Home Assistant.", remNone: "Noch keine Erinnerung.",
  remName: "Name (z. B. Wasserfilter)", remEvery: "alle", remDays: "Tage", remLast: "zuletzt am", remNote: "Notiz (z. B. Batterietyp CR2032)", remAdd: "Hinzufügen", remDone: "Erledigt", remDelete: "Löschen",
  remLine: "Alle {interval} Tage · zuletzt {last} · fällig {due}", remOverdue: "{n} Tage überfällig", remIn: "in {n} Tagen", remInvalid: "Nicht gespeichert, bitte prüfen: {field}",
  reminders: "Erinnerungen", remindersSubtitle: "Eigene Wartungstermine: Filter, Entkalken, Batteriewechsel.", actReminders: "Wartung fällig", actRemindersHint: "Eine eigene Erinnerung ist erreicht",
  relSetup: "Einrichtungsfehler: {n} in {days} Tagen, zuletzt {last}", relSetupNow: "Gerade im Zustand {state}", relSetupNote: "Aus den Scans gezählt, so fein wie das Scan-Intervall.",
  event_reminder_due: "Wartungserinnerung fällig",
});
Object.assign(TEXT.en, {
  bvTitle: "Batteries in volts", bvHint: "Sensors that report volts instead of percent. Housekeeper guesses the type from the highest voltage of the last weeks and uses its limit.", bvStable: "stable",
  bvLine: "Now {now} · recognised as {kind} · limit {limit}", bvNote: "The type is a guess; if it is wrong, so is the limit. Without a result: {unknown} (too few days or a voltage that fits no type).",
  bvType_cell15: "single 1.5 V cell (AA/AAA, alkaline or NiMH)", bvType_coin3: "3 V cell (e.g. CR2032 or 2 × AA)", bvType_lithium: "lithium-ion cell", bvType_cells3: "3 cells in series (4.5 V)", bvType_cells4: "4 cells in series (6 V)", bvType_block9: "9 V block", bvType_lead12: "12 V battery",
  btTitle: "All batteries", btHint: "Level, drain and the forecast of when a battery reaches the limit (up to 90 days).", btLoading: "Calculating the forecast …", btNoRecorder: "There is no forecast without a recorder.",
  remTitle: "Maintenance reminders", remHint: "Filter, descaling, battery change: you enter a name, an interval and the last date, Housekeeper tells you when it is due again. It changes nothing in Home Assistant.", remNone: "No reminder yet.",
  remName: "Name (e.g. water filter)", remEvery: "every", remDays: "days", remLast: "last done", remNote: "Note (e.g. battery type CR2032)", remAdd: "Add", remDone: "Done", remDelete: "Delete",
  remLine: "Every {interval} days · last {last} · due {due}", remOverdue: "{n} days overdue", remIn: "in {n} days", remInvalid: "Not saved, please check: {field}",
  reminders: "Reminders", remindersSubtitle: "Your own maintenance dates: filter, descaling, changing batteries.", actReminders: "Maintenance due", actRemindersHint: "One of your own reminders is reached",
  relSetup: "Setup failures: {n} in {days} days, last {last}", relSetupNow: "Currently in state {state}", relSetupNote: "Counted from the scans, as fine as the scan interval.",
  event_reminder_due: "maintenance reminder due",
});
