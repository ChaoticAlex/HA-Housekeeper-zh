// Battery type per sensor, the shopping list and detected replacements in the Batteries view.
// Mixed into the panel in 99-register.js. Only Housekeeper's own list changes.
Object.assign(TEXT.de, {
  btTypeSet: "Typ", btTypeNone: "Typ fehlt", btTypeSave: "Speichern", btTypeCustom: "Eigener Text …", btTypeLabel: "Batterietyp für {name}", btTypeHint: "Gespeichert nur in Housekeeper.",
  btCtTitle: "Eigene Batterietypen", btCtHint: "Eigene Typen stehen bei jedem Sensor in der Auswahl. Eingebaute und genutzte Typen lassen sich nicht löschen.", btCtNone: "Noch keine eigenen Typen. Ein Typ, den du bei einem Sensor eintippst, landet hier.",
  btCtUsed: "von {n} Sensoren genutzt", btCtUsed1: "von 1 Sensor genutzt", btCtUnused: "nicht genutzt", btCtAdd: "Hinzufügen", btCtNew: "Neuer Typ", btCtRename: "Umbenennen", btCtDelete: "Löschen", btCtInUse: "Wird genutzt: erst bei den Sensoren ändern", btCtSave: "Speichern",
  btReplTitle: "Wechsel erkannt", btReplHint: "Der Ladestand sprang um mindestens 15 Punkte nach oben. Das ist ein Hinweis, kein Beweis: Ein Sensor kann auch neu kalibrieren.",
  btReplLine: "{name}: vermutlich neue Batterie am {date}", btReplLevels: "Stand {from} % → {to} %", btReplEnter: "Eintragen", btReplDismiss: "Kein Wechsel",
  btReplNote: "„Eintragen“ macht einen Eintrag in „Änderungen“ und setzt „zuletzt erledigt“ in Erinnerungen, deren Name den Gerätenamen enthält. Es wird nichts angelegt.",
  btReplTitleEntry: "Batterie gewechselt: {name}", btReplDone: "Eingetragen.", btReplDoneRem: "Eingetragen, {count} Erinnerung aktualisiert.", btReplFailed: "Das hat nicht geklappt: {detail}",
});
Object.assign(TEXT.en, {
  btTypeSet: "Type", btTypeNone: "Type missing", btTypeSave: "Save", btTypeCustom: "Own text …", btTypeLabel: "Battery type for {name}", btTypeHint: "Stored only in Housekeeper.",
  btCtTitle: "Own battery types", btCtHint: "Own types appear in the choice of every sensor. Built-in and used types cannot be deleted.", btCtNone: "No own types yet. A type you enter for a sensor ends up here.",
  btCtUsed: "used by {n} sensors", btCtUsed1: "used by 1 sensor", btCtUnused: "not used", btCtAdd: "Add", btCtNew: "New type", btCtRename: "Rename", btCtDelete: "Delete", btCtInUse: "In use: change the sensors first", btCtSave: "Save",
  btReplTitle: "Replacement detected", btReplHint: "The level jumped up by at least 15 points. That is a hint, not proof: a sensor can also recalibrate.",
  btReplLine: "{name}: probably a new battery on {date}", btReplLevels: "Level {from} % → {to} %", btReplEnter: "Enter", btReplDismiss: "No replacement",
  btReplNote: "“Enter” adds an entry to “Changes” and sets “last done” on reminders whose name contains the device name. Nothing is created.",
  btReplTitleEntry: "Battery replaced: {name}", btReplDone: "Entered.", btReplDoneRem: "Entered, {count} reminder updated.", btReplFailed: "That did not work: {detail}",
});

const BATTERY_TYPES = ["2× AAA", "2× AA", "CR2016", "CR2032", "CR2450", "9 V"];

class BatteryTypeMixin {
  // The device name when the sensor has one, else the entity name: what reminders are matched by.
  batteryLabel(entityId) {
    const item = this.findObject(`entity:${entityId}`);
    return (item?.device_id ? this.findObject(`device:${item.device_id}`)?.name : "") || item?.name || entityId;
  }

  // The built-in types and the own ones, which are stored and so offered for every sensor.
  batteryTypeChoices() {
    return [...BATTERY_TYPES, ...(this.batteryTrend?.custom_types || [])];
  }

  batteryTypeControls(entityId) {
    const type = this.batteryTrend?.types?.[entityId];
    if (this.btEdit === entityId) {
      const choices = this.batteryTypeChoices();
      const known = !type || choices.includes(type);
      const options = choices.map(o => `<option value="${this.esc(o)}" ${o === type ? "selected" : ""}>${this.esc(o)}</option>`).join("");
      return `<span class="btedit"><label class="factnote" for="hk-bt-type">${this.t("btTypeLabel", { name: this.esc(this.batteryLabel(entityId)) })}</label><select id="hk-bt-type" data-bt-type-select><option value="">–</option>${options}<option value="__custom" ${known ? "" : "selected"}>${this.t("btTypeCustom")}</option></select><input type="text" maxlength="30" data-bt-type-custom value="${this.esc(known ? "" : type)}" ${known ? "hidden" : ""} aria-label="${this.t("btTypeCustom")}"><button class="btn accent" data-bt-type-save="${this.esc(entityId)}">${this.t("btTypeSave")}</button><button class="btn quiet" data-bt-type-cancel>${this.t("cancelRun")}</button></span>`;
    }
    return `<span class="btctl">${type ? `<span class="pill">${this.esc(type)}</span>` : `<span class="pill mute">${this.t("btTypeNone")}</span>`}<button class="btn quiet" data-bt-type="${this.esc(entityId)}">${this.t("btTypeSet")}</button></span>`;
  }

  batterySuggestions() {
    const found = this.batteryTrend?.replaced || [];
    if (!found.length) return "";
    const rows = found.map(r => {
      const name = this.batteryLabel(r.entity_id);
      const date = this.formatDate(`${r.day}T12:00:00Z`).split(",")[0];
      return `<div class="btrepl"><ha-icon icon="mdi:battery-sync-outline"></ha-icon><span class="row-text"><strong>${this.esc(this.t("btReplLine", { name, date }))}</strong><small>${this.t("btReplLevels", { from: r.from, to: r.to })}</small></span><button class="btn accent" data-bt-enter="${this.esc(r.entity_id)}" data-day="${this.esc(r.day)}">${this.t("btReplEnter")}</button><button class="btn" data-bt-dismiss="${this.esc(r.entity_id)}" data-day="${this.esc(r.day)}">${this.t("btReplDismiss")}</button></div>`;
    }).join("");
    return `<div class="btsuggest"><h3>${this.t("btReplTitle")}</h3><p class="factnote">${this.t("btReplHint")}</p>${rows}<p class="factnote">${this.t("btReplNote")}</p>${this.btMessage ? `<p class="factnote" role="status">${this.esc(this.btMessage)}</p>` : ""}</div>`;
  }

  async batterySetType(entityId, value) {
    try {
      const reply = await this._hass.callWS({ type: "ha_housekeeper/battery_type_set", entity_id: entityId, battery_type: value });
      this.batteryTrend = { ...this.batteryTrend, types: reply.types, custom_types: reply.custom_types };
      this.btEdit = "";
    } catch (err) { this.btMessage = this.t("btReplFailed", { detail: this.errText(err) }); }
    this.render();
  }

  // The own types: add, rename, delete. Built-in and used types have no delete button.
  batteryCustomTypes() {
    const b = this.batteryTrend;
    if (!b?.available || b.busy) return "";
    const list = b.custom_types || [];
    const uses = name => Object.values(b.types || {}).filter(t => t === name).length;
    const rows = list.map(name => {
      const n = uses(name);
      if (this.btCtEdit === name) return `<div class="btct"><input type="text" maxlength="30" data-bt-ct-input value="${this.esc(name)}" aria-label="${this.t("btCtRename")}"><button class="btn accent" data-bt-ct-save="${this.esc(name)}">${this.t("btCtSave")}</button><button class="btn quiet" data-bt-ct-cancel>${this.t("cancelRun")}</button></div>`;
      const used = n ? this.t(n === 1 ? "btCtUsed1" : "btCtUsed", { n: this.formatNumber(n) }) : this.t("btCtUnused");
      const del = this.deleteButton(`data-bt-ct-delete="${this.esc(name)}"`, this.t("btCtDelete"), n ? { why: this.t("btCtInUse") } : {});
      return `<div class="btct"><span class="pill">${this.esc(name)}</span><span class="factnote">${this.esc(used)}</span><button class="btn quiet" data-bt-ct-rename="${this.esc(name)}">${this.t("btCtRename")}</button>${del}</div>`;
    }).join("");
    const add = `<div class="btct"><input type="text" maxlength="30" data-bt-ct-new placeholder="${this.esc(this.t("btCtNew"))}" aria-label="${this.esc(this.t("btCtNew"))}"><button class="btn" data-bt-ct-add>${this.t("btCtAdd")}</button></div>`;
    const body = `<p class="factnote">${this.t("btCtHint")}</p>${rows || `<p class="factnote">${this.t("btCtNone")}</p>`}${add}${this.btCtMessage ? `<p class="factnote" role="status">${this.esc(this.btCtMessage)}</p>` : ""}`;
    return `<div class="panel">${this.fold("bt_custom", { title: this.t("btCtTitle"), pill: this.formatNumber(list.length) }, body, false, this.btCtEdit || this.btCtMessage ? true : undefined)}</div>`;
  }

  async batteryCustomEdit(action, name, newName = "") {
    this.btCtMessage = "";
    try {
      const reply = await this._hass.callWS({ type: "ha_housekeeper/battery_custom_type", action, name, new_name: newName });
      this.batteryTrend = { ...this.batteryTrend, types: reply.types, custom_types: reply.custom_types };
      this.btCtEdit = "";
    } catch (err) { this.btCtMessage = this.t("btReplFailed", { detail: this.errText(err) }); }
    this.render();
  }

  async batterySettle(entityId, day, action) {
    const name = this.batteryLabel(entityId);
    try {
      const reply = await this._hass.callWS({ type: "ha_housekeeper/battery_replaced", entity_id: entityId, day, action, name, title: this.t("btReplTitleEntry", { name }).slice(0, 80), note: "" });
      this.batteryTrend = { ...this.batteryTrend, replaced: (this.batteryTrend.replaced || []).filter(r => !(r.entity_id === entityId && r.day <= day)) };
      if (this.data) { this.data.notes = reply.notes; this.data.reminders = reply.reminders; }
      this.btMessage = action === "enter" ? (reply.reminders_updated ? this.t("btReplDoneRem", { count: reply.reminders_updated }) : this.t("btReplDone")) : "";
    } catch (err) { this.btMessage = this.t("btReplFailed", { detail: this.errText(err) }); }
    this.render();
  }

  bindBatteryType(root) {
    root.querySelectorAll("[data-bt-type]").forEach(el => el.addEventListener("click", () => { this.btEdit = el.dataset.btType; this.render(); }));
    root.querySelector("[data-bt-type-cancel]")?.addEventListener("click", () => { this.btEdit = ""; this.render(); });
    root.querySelector("[data-bt-type-select]")?.addEventListener("change", e => {
      const custom = root.querySelector("[data-bt-type-custom]");
      if (custom) { custom.hidden = e.target.value !== "__custom"; if (!custom.hidden) custom.focus(); }
    });
    root.querySelector("[data-bt-type-save]")?.addEventListener("click", e => {
      const select = root.querySelector("[data-bt-type-select]"), custom = root.querySelector("[data-bt-type-custom]");
      const value = select?.value === "__custom" ? (custom?.value || "") : (select?.value || "");
      this.batterySetType(e.currentTarget.dataset.btTypeSave, value);
    });
    root.querySelector("[data-bt-ct-add]")?.addEventListener("click", () => {
      const value = (root.querySelector("[data-bt-ct-new]")?.value || "").trim();
      if (value) this.batteryCustomEdit("add", value);
    });
    root.querySelectorAll("[data-bt-ct-rename]").forEach(el => el.addEventListener("click", () => { this.btCtEdit = el.dataset.btCtRename; this.render(); }));
    root.querySelector("[data-bt-ct-cancel]")?.addEventListener("click", () => { this.btCtEdit = ""; this.render(); });
    root.querySelector("[data-bt-ct-save]")?.addEventListener("click", e => this.batteryCustomEdit("rename", e.currentTarget.dataset.btCtSave, root.querySelector("[data-bt-ct-input]")?.value || ""));
    root.querySelectorAll("[data-bt-ct-delete]").forEach(el => el.addEventListener("click", () => this.batteryCustomEdit("delete", el.dataset.btCtDelete)));
    root.querySelectorAll("[data-bt-enter]").forEach(el => el.addEventListener("click", () => this.batterySettle(el.dataset.btEnter, el.dataset.day, "enter")));
    root.querySelectorAll("[data-bt-dismiss]").forEach(el => el.addEventListener("click", () => this.batterySettle(el.dataset.btDismiss, el.dataset.day, "dismiss")));
  }
}
