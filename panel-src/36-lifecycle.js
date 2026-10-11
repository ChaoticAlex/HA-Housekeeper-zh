// LifecycleMixin: the "Verlauf" tab of a device and the list of removed devices in Maintenance; mixed in by 99-register.js.
// The steps come from the device registry, the journal and the last reliability numbers; the note is the person's own text.
class LifecycleMixin {
  async loadLifecycle(deviceId) {
    try { (this.life ||= new Map()).set(deviceId, await this._hass.callWS({ type: "ha_housekeeper/lifecycle", device_id: deviceId })); }
    catch (_) { (this.life ||= new Map()).set(deviceId, { steps: [], note: null, error: true }); }
    if (this.selected?.object_id === deviceId) this.render();
  }

  ensureLifecycle(deviceId) {
    this.life ||= new Map();
    if (this.life.has(deviceId) || (this._lifeAsked ||= new Set()).has(deviceId)) return;
    this._lifeAsked.add(deviceId);
    setTimeout(() => this.loadLifecycle(deviceId), 0);
  }

  async saveLifeNote(deviceId, text) {
    try { await this._hass.callWS({ type: "ha_housekeeper/lifecycle_note", device_id: deviceId, text }); }
    catch (err) { this.lifeError = err?.message || String(err); }
    this._lifeAsked?.delete(deviceId); this.life?.delete(deviceId);
    this._removedRequested = false; this.removed = null;
    this.ensureLifecycle(deviceId); this.render();
  }

  lifeStepText(step) {
    return this.t(`life_${step.kind}`, { from: this.esc(step.from ?? ""), to: this.esc(step.to ?? "") });
  }

  lifeCard(item) {
    const life = this.life?.get(item.object_id);
    const head = `<div class="panelhead"><div><h2>${this.t("lifeTitle")}</h2><p>${this.t("lifeHint")}</p></div></div>`;
    if (!life) return `<section class="panel">${head}${this.skeleton("loading")}</section>`;
    const state = [this.statusLabel(item.status), life.unstable ? this.t(life.unstable === "flapping" ? "relFlapping" : "relUnstable") : ""].filter(Boolean).join(" · ");
    const rows = life.steps.map(s => `<div class="row rel"><span class="tile ${s.kind === "removed" ? "red" : s.kind === "quarantine" || s.kind === "disabled" ? "warn" : "mute"}"><ha-icon icon="${{ discovered: "mdi:magnify", quarantine: "mdi:timer-sand", disabled: "mdi:power-plug-off-outline", removed: "mdi:delete-outline", replaced: "mdi:swap-horizontal" }[s.kind] || "mdi:circle-small"}"></ha-icon></span><span class="row-text"><strong>${this.lifeStepText(s)}</strong><small>${this.esc(this.formatDate(s.at))}</small></span></div>`).join("");
    const now = `<div class="row rel"><span class="tile ${life.unstable ? "warn" : "ok"}"><ha-icon icon="mdi:flag-outline"></ha-icon></span><span class="row-text"><strong>${this.t("lifeNow")}</strong><small>${this.esc(state)}</small></span></div>`;
    const note = `<div class="pad"><label for="lifeNote">${this.t("lifeNote")}</label><textarea id="lifeNote" rows="2" maxlength="200" data-life-note="${this.esc(item.object_id)}" placeholder="${this.esc(this.t("lifeNotePlaceholder"))}">${this.esc(life.note?.text || "")}</textarea><div class="actions"><button class="btn" data-life-save="${this.esc(item.object_id)}">${this.t("lifeNoteSave")}</button></div>${this.lifeError ? `<div class="error">${this.esc(this.lifeError)}</div>` : ""}</div>`;
    return `<section class="panel">${head}${rows || `<p class="factnote">${this.t("lifeNone")}</p>`}${now}${note}</section>`;
  }

  // Devices that a plan removed or forgot; they no longer exist, so the journal is the only source.
  ensureRemoved() {
    if (this._removedRequested) return;
    this._removedRequested = true;
    setTimeout(async () => {
      try { this.removed = (await this._hass.callWS({ type: "ha_housekeeper/lifecycle" })).removed || []; } catch (_) { this.removed = []; }
      this.render();
    }, 0);
  }

  removedCard() {
    this.ensureRemoved();
    const head = `<div class="panelhead"><div><h2>${this.t("lifeRemovedTitle")}</h2><p>${this.t("lifeRemovedHint")}</p></div></div>`;
    if (!this.removed) return `<div class="panel">${head}${this.skeleton("loading")}</div>`;
    const removedRows = this.removed.map(d => `<div class="row rel"><span class="tile red"><ha-icon icon="mdi:delete-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(d.name || d.object_id)}</strong><small>${this.esc(this.t(d.kind === "forget_device" ? "lifeForgotten" : "life_removed"))} · ${this.esc(this.formatDate(d.at))}${d.note ? ` · ${this.esc(d.note)}` : ""}</small></span></div>`);
    const pg = this.paginate("removed", removedRows), rows = pg.rows.join("") + pg.footer;
    return `<div class="panel">${head}${rows || `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("lifeRemovedNone")}</div>`}</div>`;
  }
}
