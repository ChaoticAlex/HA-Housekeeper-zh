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

  // The reminders table: one row each with its due day as a pill, the history folds open under the row.
  remDay(iso) {
    try { return new Intl.DateTimeFormat(this.lang, { dateStyle: "medium" }).format(new Date(`${iso}T12:00:00Z`)); }
    catch (_) { return iso; }
  }

  remToday() { return new Date().toISOString().slice(0, 10); }

  remAddDays(iso, n) { return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10); }

  remDaysLeft(iso) { return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${this.remToday()}T00:00:00Z`)) / 864e5); }

  remWhen(left) { return left < 0 ? this.t("remOverdue", { n: -left }) : left === 0 ? this.t("remToday") : this.t("remIn", { n: left }); }

  remBlank() { return { id: "", name: "", interval_days: 90, due: this.remAddDays(this.remToday(), 90), dueTouched: false, note: "" }; }

  reminderRow(r) {
    const tone = { due: "red", soon: "warn", ok: "ok" }[r.state];
    const open = (this.remOpen || []).includes(r.id);
    const id = this.esc(r.id);
    const hist = r.history || [];
    const label = this.esc(this.t(open ? "remHistoryClose" : "remHistoryOpen"));
    const main = `<tr class="static"><td><button type="button" class="chevbtn" data-rem-open="${id}" aria-expanded="${open}" aria-label="${label}" title="${label}"><ha-icon icon="mdi:chevron-${open ? "down" : "right"}"></ha-icon></button><strong>${this.esc(r.name)}</strong>${r.note ? `<small class="remnote">${this.esc(r.note)}</small>` : ""}</td><td data-label="${this.esc(this.t("remColEvery"))}">${this.esc(this.t("remEveryN", { n: r.interval_days }))}</td><td data-label="${this.esc(this.t("remColLast"))}">${r.last_done ? this.esc(this.remDay(r.last_done)) : `<span class="muted">–</span>`}</td><td data-label="${this.esc(this.t("remColDue"))}"><span class="pill ${tone}" title="${this.esc(this.remDay(r.due))}">${this.esc(this.remWhen(r.days_left))}</span></td><td class="remact"><button class="btn small" data-rem-done="${id}">${this.t("remDone")}</button><button class="btn small quiet" data-rem-edit="${id}">${this.t("remEdit")}</button><button class="btn small quiet" data-rem-del="${id}">${this.t("remDelete")}</button></td></tr>`;
    if (!open) return main;
    const list = hist.length ? `<ul>${hist.map(d => `<li>${this.esc(this.remDay(d))}<button type="button" class="linkbtn" data-rem-hdel="${id}|${this.esc(d)}">${this.t("remDelete")}</button></li>`).join("")}</ul>` : `<p class="muted">${this.t("remNoHistory")}</p>`;
    return `${main}<tr class="static remhist"><td colspan="5"><h3>${this.t("remHistory", { n: hist.length })}</h3>${list}</td></tr>`;
  }

  // The dialog for a new or an edited reminder: labels above fields of one height; "due" follows the interval until it is set by hand.
  remDialog() {
    const d = this.remDraft;
    if (!d) return "";
    const field = (key, label, body, extra = "") => `<label class="remfield ${extra}"><span>${this.t(label)}</span>${body}</label>`;
    const chips = [30, 90, 180, 365].map(n => `<button type="button" class="chip${Number(d.interval_days) === n ? " on" : ""}" data-rem-chip="${n}">${n}</button>`).join("");
    return `<div class="hkmodal" data-rem-modal><form class="hkdialog" role="dialog" aria-modal="true" aria-labelledby="hk-rem-head" data-rem-form>
      <div class="dhead"><h2 id="hk-rem-head">${this.t(d.id ? "remDialogEdit" : "remDialogNew")}</h2></div>
      <div class="dbody"><div class="remgrid">${field("name", "remFName", `<input data-rem-field="name" placeholder="${this.esc(this.t("remName"))}" value="${this.esc(d.name)}" maxlength="80">`, "wide")}${field("interval_days", "remFEvery", `<input data-rem-field="interval_days" type="number" min="1" max="3650" value="${this.esc(d.interval_days)}"><span class="remchips">${chips}</span>`)}${field("due", "remFDue", `<input data-rem-field="due" type="date" value="${this.esc(d.due)}"><span class="remhint" data-rem-hint>${this.esc(this.remWhen(this.remDaysLeft(d.due)))}</span>`)}${field("note", "remFNote", `<input data-rem-field="note" placeholder="${this.esc(this.t("remNote"))}" value="${this.esc(d.note)}" maxlength="200">`, "full")}</div>${this.remError ? `<div class="error" role="alert">${this.esc(this.remError)}</div>` : ""}</div>
      <div class="dfoot"><span></span><span class="dbtns"><button type="button" class="btn" data-rem-cancel>${this.t("remCancel")}</button><button type="submit" class="btn primary" data-rem-save>${this.t(d.id ? "remSave" : "remAdd")}</button></span></div></form></div>`;
  }

  // Own view under "Maintain": own reminders (filter, descaling, changing batteries) with a date when they are due.
  remindersView() { return `<div class="stack">${this.remindersCard()}</div>`; }

  remindersCard() {
    const items = this.data.reminders || [];
    const overdue = items.filter(r => r.state === "due").length;
    const head = `<div class="panelhead"><div><h2>${this.t("remTitle")}</h2><p>${items.length ? this.t("remSummary", { n: items.length, due: overdue }) : this.t("remHint")}</p></div><div class="actions"><button class="btn primary" data-rem-new>${this.t("remNew")}</button></div></div>`;
    const table = items.length ? `<div class="tablewrap lt rem"><table><thead><tr><th scope="col">${this.t("remColName")}</th><th scope="col">${this.t("remColEvery")}</th><th scope="col">${this.t("remColLast")}</th><th scope="col">${this.t("remColDue")}</th><th scope="col"><span class="sr">${this.t("remColActions")}</span></th></tr></thead><tbody>${items.map(r => this.reminderRow(r)).join("")}</tbody></table></div>` : `<div class="emptymsg"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon>${this.t("remEmpty")}</div>`;
    return `<div class="panel">${head}${table}</div>`;
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
    root.querySelector("[data-rem-new]")?.addEventListener("click", () => { this.remDraft = this.remBlank(); this.remError = ""; this._remFocus = true; this.render(); });
    root.querySelector("[data-rem-cancel]")?.addEventListener("click", () => { this.remDraft = null; this.remError = ""; this.render(); });
    const syncForm = () => {
      const d = this.remDraft;
      if (!d) return;
      const set = (key, value) => { const el = root.querySelector(`[data-rem-field="${key}"]`); if (el && el.value !== value) el.value = value; };
      if (!d.dueTouched) { d.due = this.remAddDays(this.remToday(), Number(d.interval_days) || 0); set("due", d.due); }
      const hint = root.querySelector("[data-rem-hint]");
      if (hint) hint.textContent = d.due ? this.remWhen(this.remDaysLeft(d.due)) : "";
      root.querySelectorAll("[data-rem-chip]").forEach(c => c.classList.toggle("on", Number(c.dataset.remChip) === Number(d.interval_days)));
    };
    root.querySelectorAll("[data-rem-field]").forEach(el => el.addEventListener("input", () => {
      const key = el.dataset.remField;
      this.remDraft[key] = el.value;
      if (key === "due") this.remDraft.dueTouched = true;
      syncForm();
    }));
    root.querySelectorAll("[data-rem-chip]").forEach(el => el.addEventListener("click", () => {
      this.remDraft.interval_days = Number(el.dataset.remChip);
      const input = root.querySelector('[data-rem-field="interval_days"]');
      if (input) input.value = this.remDraft.interval_days;
      syncForm();
    }));
    const remModal = root.querySelector("[data-rem-modal]");
    if (remModal) {
      remModal.addEventListener("mousedown", ev => { if (ev.target === remModal) { this.remDraft = null; this.remError = ""; this.render(); } });
      remModal.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); this.remDraft = null; this.remError = ""; this.render(); } });
      if (this._remFocus) { this._remFocus = false; remModal.querySelector('[data-rem-field="name"]')?.focus(); }
    }
    root.querySelector("[data-rem-form]")?.addEventListener("submit", ev => {
      ev.preventDefault();
      const d = this.remDraft;
      this.reminderCall({ action: "save", ...(d.id ? { reminder_id: d.id } : {}), name: d.name, interval_days: Number(d.interval_days), due: d.due, note: d.note });
    });
    root.querySelectorAll("[data-rem-open]").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.remOpen;
      const open = this.remOpen || [];
      this.remOpen = open.includes(id) ? open.filter(x => x !== id) : [...open, id];
      this.render();
    }));
    root.querySelectorAll("[data-rem-edit]").forEach(el => el.addEventListener("click", () => {
      const r = (this.data.reminders || []).find(x => x.id === el.dataset.remEdit);
      if (!r) return;
      this._remFocus = true;
      this.remDraft = { id: r.id, name: r.name, interval_days: r.interval_days, due: r.due, dueTouched: true, note: r.note || "" };
      this.remError = "";
      this.render();
    }));
    root.querySelectorAll("[data-rem-done]").forEach(el => el.addEventListener("click", () => this.reminderCall({ action: "done", reminder_id: el.dataset.remDone })));
    root.querySelectorAll("[data-rem-hdel]").forEach(el => el.addEventListener("click", () => {
      const [id, day] = el.dataset.remHdel.split("|"), r = (this.data.reminders || []).find(x => x.id === id);
      this.confirmAsk(this.t("confirmRemDay", { date: this.remDay(day), name: r?.name || "" }), () => this.reminderCall({ action: "history_delete", reminder_id: id, day }));
    }));
    root.querySelectorAll("[data-rem-del]").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.remDel, r = (this.data.reminders || []).find(x => x.id === id);
      this.confirmAsk(this.t("confirmRem", { name: r?.name || "" }), () => this.reminderCall({ action: "delete", reminder_id: id }));
    }));
  }
}
Object.assign(TEXT.de, {
  bvTitle: "Batterien mit Spannung", bvHint: "Sensoren, die Volt statt Prozent melden. Housekeeper schätzt den Typ aus der höchsten Spannung der letzten Wochen und nimmt dessen Grenze.", bvStable: "stabil",
  bvLine: "Jetzt {now} · erkannt als {kind} · Grenze {limit}", bvNote: "Der Typ ist eine Schätzung; liegt er falsch, ist auch die Grenze falsch. Ohne Angabe: {unknown} (zu wenige Tage oder eine Spannung, die zu keinem Typ passt).",
  bvType_cell15: "Einzelzelle 1,5 V (AA/AAA, Alkaline oder NiMH)", bvType_coin3: "3-V-Zelle (z. B. CR2032 oder 2 × AA)", bvType_lithium: "Lithium-Ionen-Zelle", bvType_cells3: "3 Zellen in Reihe (4,5 V)", bvType_cells4: "4 Zellen in Reihe (6 V)", bvType_block9: "9-V-Block", bvType_lead12: "12-V-Akku",
  btTitle: "Alle Batterien", btHint: "Stand, Verbrauch und die Prognose, wann eine Batterie die Grenze erreicht (bis 90 Tage).", btLoading: "Prognose wird berechnet …", btNoRecorder: "Ohne Recorder gibt es keine Prognose.",
  remTitle: "Wartungserinnerungen", remHint: "Filter, Entkalken, Batteriewechsel: du trägst Name, Abstand und Fälligkeit ein, Housekeeper sagt, wann es dran ist, und merkt sich, wann du es erledigt hast. Es ändert nichts in Home Assistant.", remEmpty: "Noch keine Erinnerung. Lege zum Beispiel den Wasserfilter oder den Rauchmelder-Test an.",
  remName: "z. B. Wasserfilter", remNote: "z. B. Batterietyp CR2032", remAdd: "Hinzufügen", remSave: "Speichern", remCancel: "Abbrechen", remDone: "Erledigt", remDelete: "Löschen", remEdit: "Ändern", remNew: "+ Erinnerung hinzufügen",
  remFName: "Name", remFEvery: "Abstand in Tagen", remFDue: "Fällig am", remFNote: "Notiz (optional)", remColName: "Name", remColEvery: "Abstand", remColLast: "Zuletzt erledigt", remColDue: "Fällig", remColActions: "Aktionen",
  remDialogNew: "Neue Erinnerung", remDialogEdit: "Erinnerung bearbeiten", remEveryN: "alle {n} Tage", remSummary: "{n} Erinnerungen, {due} überfällig.", remHistory: "Historie · {n}× erledigt", remNoHistory: "Noch nie erledigt.", remHistoryOpen: "Historie aufklappen", remHistoryClose: "Historie zuklappen", remToday: "heute", remOverdue: "{n} Tage überfällig", remIn: "in {n} Tagen", remInvalid: "Nicht gespeichert, bitte prüfen: {field}",
  reminders: "Erinnerungen", remindersSubtitle: "Eigene Wartungstermine: Filter, Entkalken, Batteriewechsel.", actReminders: "Wartung fällig", actRemindersHint: "Eine eigene Erinnerung ist erreicht",
  relSetup: "Einrichtungsfehler: {n} in {days} Tagen, zuletzt {last}", relSetupNow: "Gerade im Zustand {state}", relSetupNote: "Aus den Scans gezählt, so fein wie das Scan-Intervall.",
  event_reminder_due: "Wartungserinnerung fällig",
});
Object.assign(TEXT.en, {
  bvTitle: "Batteries in volts", bvHint: "Sensors that report volts instead of percent. Housekeeper guesses the type from the highest voltage of the last weeks and uses its limit.", bvStable: "stable",
  bvLine: "Now {now} · recognised as {kind} · limit {limit}", bvNote: "The type is a guess; if it is wrong, so is the limit. Without a result: {unknown} (too few days or a voltage that fits no type).",
  bvType_cell15: "single 1.5 V cell (AA/AAA, alkaline or NiMH)", bvType_coin3: "3 V cell (e.g. CR2032 or 2 × AA)", bvType_lithium: "lithium-ion cell", bvType_cells3: "3 cells in series (4.5 V)", bvType_cells4: "4 cells in series (6 V)", bvType_block9: "9 V block", bvType_lead12: "12 V battery",
  btTitle: "All batteries", btHint: "Level, drain and the forecast of when a battery reaches the limit (up to 90 days).", btLoading: "Calculating the forecast …", btNoRecorder: "There is no forecast without a recorder.",
  remTitle: "Maintenance reminders", remHint: "Filter, descaling, battery change: you enter a name, an interval and the due date, Housekeeper tells you when it is due and keeps when you did it. It changes nothing in Home Assistant.", remEmpty: "No reminder yet. Add the water filter or the smoke detector test, for example.",
  remName: "e.g. water filter", remNote: "e.g. battery type CR2032", remAdd: "Add", remSave: "Save", remCancel: "Cancel", remDone: "Done", remDelete: "Delete", remEdit: "Edit", remNew: "+ Add reminder",
  remFName: "Name", remFEvery: "Interval in days", remFDue: "Due on", remFNote: "Note (optional)", remColName: "Name", remColEvery: "Interval", remColLast: "Last done", remColDue: "Due", remColActions: "Actions",
  remDialogNew: "New reminder", remDialogEdit: "Edit reminder", remEveryN: "every {n} days", remSummary: "{n} reminders, {due} overdue.", remHistory: "History · done {n}×", remNoHistory: "Never done yet.", remHistoryOpen: "Show history", remHistoryClose: "Hide history", remToday: "today", remOverdue: "{n} days overdue", remIn: "in {n} days", remInvalid: "Not saved, please check: {field}",
  reminders: "Reminders", remindersSubtitle: "Your own maintenance dates: filter, descaling, changing batteries.", actReminders: "Maintenance due", actRemindersHint: "One of your own reminders is reached",
  relSetup: "Setup failures: {n} in {days} days, last {last}", relSetupNow: "Currently in state {state}", relSetupNote: "Counted from the scans, as fine as the scan interval.",
  event_reminder_due: "maintenance reminder due",
});
