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
    const noteOf = d => this.notesList().find(x => x.target === `device:${d.object_id}`);
    const kindText = d => this.t(d.kind === "forget_device" ? "lifeForgotten" : "life_removed");
    const table = this.removed.length ? this.sysList("removed", this.removed, {
      sort: "when", dir: "desc", empty: "lifeRemovedNone", cls: "removed",
      sorts: [
        { key: "when", label: "lifeColWhen", dir: "desc", get: d => d.at },
        { key: "name", label: "lifeColDevice", dir: "asc", get: d => d.name || d.object_id },
      ],
      filters: [{ name: "kind", all: this.t("lifeAllKinds"), options: [["remove_device", this.t("life_removed")], ["forget_device", this.t("lifeForgotten")]] }],
      filterFns: { kind: (d, v) => (v === "forget_device") === (d.kind === "forget_device") },
      text: d => [d.name, d.object_id].join(" "), tie: d => d.object_id,
      rowAttrs: d => { const n = noteOf(d); return n ? `data-note-edit="${this.esc(n.id)}" tabindex="0" role="button" title="${this.esc(this.t("noteEdit"))}"` : 'class="static"'; },
      columns: [
        { key: "name", label: "lifeColDevice", dir: "asc", cell: d => `<div class="statcell"><span class="tile red"><ha-icon icon="mdi:delete-outline"></ha-icon></span><div>${this.nameCell(d.name || d.object_id, d.object_id)}</div></div>` },
        { key: "kind", label: "lifeColKind", sortable: false, cell: kindText },
        { key: "when", label: "lifeColWhen", dir: "desc", cell: d => this.esc(this.formatDate(d.at)) },
        { key: "note", label: "lifeColNote", sortable: false, cell: d => { const n = noteOf(d); return n ? `${this.esc(n.title)}${n.note ? `<small class="u-block">${this.esc(n.note)}</small>` : ""}` : "–"; } },
      ],
    }) : `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("lifeRemovedNone")}</div>`;
    return `<div class="panel">${head}${table}</div>`;
  }
}
