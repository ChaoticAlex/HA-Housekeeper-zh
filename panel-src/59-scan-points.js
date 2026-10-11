// Scan points you set yourself ("before the rebuild"): a scan kept under a name until you delete it, as a base for the comparison.
// They have nothing to do with the logbook. Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  pinSet: "Scan-Punkt setzen", pinDialogTitle: "Scan-Punkt setzen", pinDialogHint: "Housekeeper scannt jetzt und merkt sich diesen Zustand, bis du ihn löschst.",
  pinName: "Name (optional)", pinNamePh: "z. B. Vor dem Umbau", pinChipRebuild: "Vor dem Umbau", pinChipUpdate: "Vor dem Update", pinChipOk: "Alles läuft",
  pinNote: "Es ändert nichts in Home Assistant. Ohne Namen heißt der Punkt wie der Zeitpunkt.", pinGo: "Scannen und merken", pinCancel: "Abbrechen",
  pinMine: "Eigener Punkt", pinDelete: "Löschen", confirmPin: "Der Scan-Punkt „{name}“ wird gelöscht.",
  pinFailed: "Der Scan-Punkt konnte nicht gespeichert werden: {reason}", storedPin: "Eigener Scan-Punkt",
});
Object.assign(TEXT.en, {
  pinSet: "Set scan point", pinDialogTitle: "Set scan point", pinDialogHint: "Housekeeper scans now and keeps this state until you delete it.",
  pinName: "Name (optional)", pinNamePh: "e.g. Before the rebuild", pinChipRebuild: "Before the rebuild", pinChipUpdate: "Before the update", pinChipOk: "All is running",
  pinNote: "It changes nothing in Home Assistant. Without a name the point is called by its time.", pinGo: "Scan and keep", pinCancel: "Cancel",
  pinMine: "Own point", pinDelete: "Delete", confirmPin: "The scan point “{name}” will be deleted.",
  pinFailed: "The scan point could not be saved: {reason}", storedPin: "Own scan point",
});

class ScanPointsMixin {
  pinOpen() { this.pinDraft = { name: "" }; this._pinFocus = true; }

  pinDialog() {
    const d = this.pinDraft;
    if (!d) return "";
    const chips = ["Rebuild", "Update", "Ok"].map(k => `<button type="button" class="chip" data-pin-chip="${this.esc(this.t(`pinChip${k}`))}">${this.t(`pinChip${k}`)}</button>`).join("");
    return `<div class="hkmodal" data-pin-modal><form class="hkdialog" role="dialog" aria-modal="true" aria-labelledby="hk-pin-head" data-pin-form>
      <div class="dhead"><h2 id="hk-pin-head">${this.t("pinDialogTitle")}</h2><p class="factnote u-m0">${this.t("pinDialogHint")}</p></div>
      <div class="dbody"><div><label for="hk-pin-name">${this.t("pinName")}</label><input id="hk-pin-name" type="text" maxlength="60" data-pin-name value="${this.esc(d.name)}" placeholder="${this.esc(this.t("pinNamePh"))}" autocomplete="off"><div class="notechips">${chips}</div></div>
        <small class="factnote u-m0">${this.t("pinNote")}</small></div>
      <div class="dfoot"><span class="dbtns"><button type="button" class="btn" data-pin-cancel>${this.t("pinCancel")}</button><button type="submit" class="btn primary">${this.t("pinGo")}</button></span></div></form></div>`;
  }

  pinHeadButton() {
    return `<button class="btn primary" data-pin-add ${this.busy || this.cleanupRunning() ? "disabled" : ""}><ha-icon icon="mdi:pin-outline"></ha-icon>${this.t("pinSet")}</button>`;
  }

  // The name of a stored scan point, or its time when it has none.
  pinLabel(b) { return b.name || this.formatDate(b.at); }

  pinActions(b) {
    return `<span class="pill pin">${this.t("pinMine")}</span><button class="link" data-pin-del="${this.esc(b.id)}">${this.t("pinDelete")}</button>`;
  }

  async pinSave() {
    const name = this.pinDraft?.name || "";
    this.pinDraft = null; this.render();
    await this.load(true);
    if (!this.data || this.error) return;
    try {
      await this._hass.callWS({ type: "ha_housekeeper/scan_point", action: "save", name });
    } catch (err) { this.toast(this.t("pinFailed", { reason: err?.message || String(err) })); }
    this.compare = null; this.render(); this.loadCompare();
  }

  async pinDelete(id) {
    try {
      await this._hass.callWS({ type: "ha_housekeeper/scan_point", action: "delete", baseline: id });
      if (this.compareBaseline === id) this.compareBaseline = "previous";
    } catch (err) { this.failed(err); }
    this.loadCompare();
  }

  bindScanPoints(root) {
    root.querySelector("[data-pin-add]")?.addEventListener("click", () => { this.pinOpen(); this.render(); });
    root.querySelectorAll("[data-pin-chip]").forEach(el => el.onclick = () => { this.pinDraft.name = el.dataset.pinChip; this._pinFocus = true; this.render(); });
    root.querySelector("[data-pin-name]")?.addEventListener("input", ev => { this.pinDraft.name = ev.target.value; });
    root.querySelector("[data-pin-cancel]")?.addEventListener("click", () => { this.pinDraft = null; this.render(); });
    root.querySelector("[data-pin-form]")?.addEventListener("submit", ev => { ev.preventDefault(); this.pinSave(); });
    root.querySelectorAll("[data-pin-del]").forEach(el => el.onclick = ev => {
      ev.stopPropagation();
      const id = el.dataset.pinDel, b = (this.compare?.baselines || []).find(x => x.id === id);
      this.confirmAsk(this.t("confirmPin", { name: b ? this.pinLabel(b) : "" }), () => this.pinDelete(id));
    });
    root.querySelectorAll("div[data-baseline]").forEach(el => el.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); el.click(); } }));
    const modal = root.querySelector("[data-pin-modal]");
    if (modal) {
      modal.addEventListener("mousedown", ev => { if (ev.target === modal) { this.pinDraft = null; this.render(); } });
      modal.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); this.pinDraft = null; this.render(); } });
      if (this._pinFocus) { this._pinFocus = false; modal.querySelector("[data-pin-name]")?.focus(); }
    }
  }
}
