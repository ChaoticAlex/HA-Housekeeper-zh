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

  batteryTrendCard() {
    this.ensureBatteryTrend();
    const head = `<div class="panelhead"><div><h2>${this.t("btTitle")}</h2><p>${this.t("btHint")}</p></div><div class="actions"><button class="btn" data-bt-refresh ${this.batteryTrendLoading ? "disabled" : ""}>${this.t("backupRefresh")}</button></div></div>`;
    if (this.batteryTrendError) return `<div class="panel">${head}<div class="error">${this.esc(this.batteryTrendError)}</div></div>`;
    const b = this.batteryTrend;
    if (!b) return `<div class="panel">${head}${this.skeleton("btLoading")}</div>`;
    if (!b.available) return `<div class="panel">${head}<div class="emptymsg">${this.t("btNoRecorder")}</div></div>`;
    if (b.busy) return `<div class="panel">${head}<p class="factnote">${this.t("relBusy")}</p></div>`;
    const falling = b.rows.filter(r => r.days_left !== null);
    const row = r => {
      const tone = r.state === "low" ? "red" : r.days_left <= 30 ? "warn" : "ok";
      const text = r.state === "low" ? this.t("btLow") : this.t("btIn", { n: r.days_left });
      const item = this.findObject(`entity:${r.entity_id}`);
      const device = (item?.device_id ? this.findObject(`device:${item.device_id}`)?.name : "") || "";
      const title = device && !String(r.name).toLowerCase().includes(device.toLowerCase()) ? `${device} – ${r.name}` : r.name;
      const empty = r.state === "low" ? "" : this.formatDate(new Date(Date.now() + r.days_left * 86400000).toISOString()).split(",")[0];
      const area = item ? this.areaName(item) : "";
      const bits = [area, this.t("btNow", { n: this.formatNumber(r.level) }), empty ? this.t("btEmptyOn", { date: empty }) : ""].filter(Boolean).join(" · ");
      return `<div class="rowwrap"><button class="row rel" data-object="entity:${this.esc(r.entity_id)}"><span class="tile ${tone}"><ha-icon icon="mdi:battery-clock-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(title)}</strong><small>${this.esc(bits)}</small></span><span class="pill ${tone}">${this.esc(text)}</span></button>${this.batteryTypeControls(r.entity_id)}</div>`;
    };
    // Batteries that run low in the same fortnight sit in one fold, the nearest one open: change them together.
    const slots = [...b.groups].sort((x, y) => x.from_days - y.from_days);
    const body = falling.length ? slots.map((g, index) => {
      const rows = g.entity_ids.map(id => falling.find(r => r.entity_id === id)).filter(Boolean);
      if (!rows.length) return "";
      const tone = g.from_days <= 13 ? "red" : g.from_days <= 41 ? "warn" : "ok";
      return this.fold(`bt_${g.from_days}`, { tone, title: this.t("btWindow", { from: g.from_days, to: g.to_days }), sub: rows.length > 1 ? this.t("btTogether") : "", pill: this.formatNumber(rows.length) }, rows.map(row).join(""), index === 0);
    }).join("") : `<div class="emptymsg"><ha-icon icon="mdi:battery-check-outline"></ha-icon>${this.t("btNone")}</div>`;
    return `<div class="panel">${head}${this.batterySuggestions()}${this.batteryShopping()}${body}<p class="factnote">${this.t("btNote", { unknown: this.formatNumber(b.unknown) })}</p></div>`;
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
  btTitle: "Batterieprognose", btHint: "Wann eine Batterie voraussichtlich die Grenze erreicht, aus dem Verlauf der letzten fünf Wochen. Eine Schätzung, keine Zusage.", btLoading: "Prognose wird berechnet …", btNoRecorder: "Ohne Recorder gibt es keine Prognose.",
  btNone: "Keine Batterie fällt erkennbar auf die Grenze zu.", btIn: "in etwa {n} Tagen", btLow: "schon unter der Grenze", btLevel: "Jetzt {n} %, fällt um {slope} Prozentpunkte pro Tag", btMore: "{n} weitere nicht gezeigt.",
  btWindow: "In {from} bis {to} Tagen", btTogether: "Gemeinsam wechseln", btNow: "Jetzt {n} %", btEmptyOn: "Grenze etwa am {date}", btNote: "Nur Batteriesensoren mit Langzeitstatistik. Ohne Prognose: {unknown} (zu wenige Tage, stabil oder steigend). Nach einem Wechsel zählt nur der Verlauf danach.",
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
  btTitle: "Battery forecast", btHint: "When a battery will probably reach the limit, from the last five weeks. An estimate, not a promise.", btLoading: "Calculating the forecast …", btNoRecorder: "There is no forecast without a recorder.",
  btNone: "No battery is visibly heading for the limit.", btIn: "in about {n} days", btLow: "already below the limit", btLevel: "Now {n} %, falling {slope} points per day", btMore: "{n} more not shown.",
  btWindow: "In {from} to {to} days", btTogether: "Change them together", btNow: "Now {n} %", btEmptyOn: "limit around {date}", btNote: "Only battery sensors with long-term statistics. No forecast for {unknown} (too few days, stable or rising). After a change only the time since counts.",
  remTitle: "Maintenance reminders", remHint: "Filter, descaling, battery change: you enter a name, an interval and the last date, Housekeeper tells you when it is due again. It changes nothing in Home Assistant.", remNone: "No reminder yet.",
  remName: "Name (e.g. water filter)", remEvery: "every", remDays: "days", remLast: "last done", remNote: "Note (e.g. battery type CR2032)", remAdd: "Add", remDone: "Done", remDelete: "Delete",
  remLine: "Every {interval} days · last {last} · due {due}", remOverdue: "{n} days overdue", remIn: "in {n} days", remInvalid: "Not saved, please check: {field}",
  reminders: "Reminders", remindersSubtitle: "Your own maintenance dates: filter, descaling, changing batteries.", actReminders: "Maintenance due", actRemindersHint: "One of your own reminders is reached",
  relSetup: "Setup failures: {n} in {days} days, last {last}", relSetupNow: "Currently in state {state}", relSetupNote: "Counted from the scans, as fine as the scan interval.",
  event_reminder_due: "maintenance reminder due",
});
