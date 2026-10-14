// LifecycleMixin: the "Verlauf" tab of a device and the list of removed devices in Maintenance; mixed in by 99-register.js.
// The steps come from the device registry, the journal and the last reliability numbers; the logbook entry of a removed device is shown in the list of removed devices.
class LifecycleMixin {
  async loadLifecycle(deviceId) {
    try { (this.life ||= new Map()).set(deviceId, await this._hass.callWS({ type: "ha_housekeeper/lifecycle", device_id: deviceId })); }
    catch (_) { (this.life ||= new Map()).set(deviceId, { steps: [], error: true }); }
    if (this.selected?.object_id === deviceId) this.render();
  }

  ensureLifecycle(deviceId) {
    this.life ||= new Map();
    if (this.life.has(deviceId) || (this._lifeAsked ||= new Set()).has(deviceId)) return;
    this._lifeAsked.add(deviceId);
    setTimeout(() => this.loadLifecycle(deviceId), 0);
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
    return `<section class="panel">${head}${rows || `<p class="factnote">${this.t("lifeNone")}</p>`}${now}</section>`;
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
    const head = `<p class="factnote pad">${this.t("lifeRemovedHint")}</p>`;  // the title is on the tile of the tab
    if (!this.removed) return `<div class="panel">${head}${this.skeleton("loading")}</div>`;
    // The logbook entry that was written when the device was removed (or one the person added to it).
    const found = this.searchList("removed", this.removed, d => [d.name, d.object_id].join(" "));
    const removedRows = found.rows.map(d => {
      const n = this.notesList().find(x => x.target === `device:${d.object_id}`);
      const text = n ? [n.title, this.formatDate(d.at), n.note].filter(Boolean).join(" · ") : `${this.t(d.kind === "forget_device" ? "lifeForgotten" : "life_removed")} · ${this.formatDate(d.at)}`;
      const body = `<span class="tile red"><ha-icon icon="mdi:delete-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(d.name || d.object_id)}</strong><small>${this.esc(text)}</small></span>`;
      return n ? `<button class="row rel" data-note-edit="${this.esc(n.id)}" title="${this.esc(this.t("noteEdit"))}">${body}</button>` : `<div class="row rel">${body}</div>`;
    });
    const pg = this.paginate("removed", removedRows), rows = pg.rows.join("") + pg.footer;
    return `<div class="panel">${head}${found.bar}${found.none}${rows || (this.removed.length ? "" : `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("lifeRemovedNone")}</div>`)}</div>`;
  }
}
