// "Stops reporting": the limit of one sensor and the texts of the finding; mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  stale: "Meldet nicht mehr", staleIdle: "seit {hours} h keine neue Meldung (Limit {limit} h)",
  staleTitle: "Meldet nicht mehr", staleHint: "Ein Sensor, der seinen letzten Wert behält, aber länger als das Limit nichts Neues meldet, erscheint als Befund. Überwacht werden standardmäßig Sensoren mit Messwerten; alle anderen nur mit eigenem Limit (z. B. ein Türkontakt, der mindestens täglich meldet).",
  staleStateDefault: "Standardlimit: {hours} h", staleStateOwn: "Eigenes Limit: {hours} h", staleStateOff: "Nicht überwacht (ausgeschaltet)", staleStateNone: "Nicht überwacht: kein Messwert-Sensor. Mit eigenem Limit einschalten.",
  staleLast: "Letzte Aktivität: {date}", staleSet: "Limit setzen", staleOff: "Ausschalten", staleDefault: "Standard verwenden", staleHours: "Stunden", staleFailed: "Das Limit konnte nicht gespeichert werden: {reason}",
  optStaleTitle: "Sensoren ohne neue Werte", optStaleHint: "Nach so vielen Stunden ohne neue Meldung erscheint ein Sensor mit Messwerten als Befund. 0 schaltet die Erkennung aus. Pro Sensor änderbar.",
});
Object.assign(TEXT.en, {
  stale: "Stops reporting", staleIdle: "no new report for {hours} h (limit {limit} h)",
  staleTitle: "Stops reporting", staleHint: "A sensor that keeps its last value but reports nothing new for longer than the limit appears as a finding. Sensors with measurements are watched by default; everything else only with its own limit (for example a door contact that reports at least daily).",
  staleStateDefault: "Default limit: {hours} h", staleStateOwn: "Own limit: {hours} h", staleStateOff: "Not watched (switched off)", staleStateNone: "Not watched: not a measuring sensor. Switch on with an own limit.",
  staleLast: "Last activity: {date}", staleSet: "Set limit", staleOff: "Switch off", staleDefault: "Use default", staleHours: "Hours", staleFailed: "The limit could not be saved: {reason}",
  optStaleTitle: "Sensors without new values", optStaleHint: "After this many hours without a new report a sensor with measurements appears as a finding. 0 switches the detection off. Can be changed per sensor.",
});

class StaleMixin {
  staleLine(finding) {
    const ev = finding.evidence?.[0] || {};
    return this.t("staleIdle", { hours: this.formatNumber(ev.idle_hours ?? 0), limit: this.formatNumber(ev.limit_hours ?? 0) });
  }

  // The state line and the form of the stale threshold; null when it does not apply.
  staleParts(item) {
    if (item.object_type !== "entity" || item.status !== "active") return null;
    const own = item.stale_override, hours = item.stale_limit_hours;
    const state = own === 0 ? this.t("staleStateOff") : own != null ? this.t("staleStateOwn", { hours }) : hours ? this.t("staleStateDefault", { hours }) : this.t("staleStateNone");
    const last = item.stale_last_activity ? ` · ${this.t("staleLast", { date: this.formatDate(item.stale_last_activity) })}` : "";
    const id = this.esc(item.object_id);
    const controls = `<input type="number" min="1" max="8760" data-stale-hours value="${this.esc(own || hours || 48)}" aria-label="${this.esc(this.t("staleHours"))}">
      <button type="submit" class="btn primary">${this.t("staleSet")}</button>
      <button type="button" class="btn" data-stale-off="${id}">${this.t("staleOff")}</button>
      ${own != null ? `<button type="button" class="btn quiet" data-stale-default="${id}">${this.t("staleDefault")}</button>` : ""}`;
    return { state: `${this.esc(state)}${this.esc(last)}`, controls, id };
  }

  staleCard(item) {
    const p = this.staleParts(item);
    if (!p) return "";
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("staleTitle")}</h2><p>${this.t("staleHint")}</p></div></div>
      <form class="pad polform" data-stale-form="${p.id}"><span class="factnote">${p.state}</span>
      ${p.controls}</form></section>`;
  }

  staleRow(item) {
    const p = this.staleParts(item);
    if (!p) return "";
    return this.actRow(this.t("staleTitle"), `${this.t("staleHint")} ${p.state}`, `<form class="polform" data-stale-form="${p.id}">${p.controls}</form>`);
  }

  async setStaleLimit(entityId, hours) {
    try {
      await this._hass.callWS({ type: "ha_housekeeper/set_stale_limit", entity_id: entityId, hours });
      await this.refreshData();
    } catch (err) { this.toast(this.t("staleFailed", { reason: this.errText(err) }), true); }
    this.render();
  }

  bindStale(root) {
    root.querySelectorAll("[data-stale-form]").forEach(form => {
      form.onsubmit = ev => {
        ev.preventDefault();
        const hours = Math.round(Number(form.querySelector("[data-stale-hours]").value));
        if (hours >= 1 && hours <= 8760) this.setStaleLimit(form.dataset.staleForm, hours);
      };
    });
    root.querySelectorAll("[data-stale-off]").forEach(el => el.onclick = () => this.setStaleLimit(el.dataset.staleOff, 0));
    root.querySelectorAll("[data-stale-default]").forEach(el => el.onclick = () => this.setStaleLimit(el.dataset.staleDefault, null));
  }
}
