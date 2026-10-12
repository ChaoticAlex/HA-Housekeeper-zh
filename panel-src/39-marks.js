// Marks: what to expect of an entity or device (offline on purpose, seasonal, a spare, keep, replaced); mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  markTitle: "Vermerk", markHint: "Halte fest, warum das Objekt so ist, wie es ist, zum Beispiel absichtlich offline. Housekeeper meldet es dann nicht mehr als „nicht verfügbar“, eine kaputte Referenz bleibt sichtbar. Nur in Housekeeper, Home Assistant bleibt unverändert.",
  markNone: "Kein Vermerk.", markSet: "Vermerk setzen", markChange: "Ändern", markClear: "Vermerk entfernen", markKind: "Art des Vermerks", markReason: "Begründung (optional)", markReview: "Prüfen in", markNever: "Nie", markTarget: "Ersetzt durch (Objekt-ID)", markDue: "Prüfdatum erreicht: die Befunde sind wieder sichtbar.", markReviewOn: "prüfen {date}", markBy: "Vermerk: {kind}", markFailed: "Der Vermerk konnte nicht gespeichert werden: {reason}",
  mark_expected_offline: "Absichtlich offline", mark_seasonal: "Saisonal", mark_spare: "Reservegerät", mark_keep: "Nicht entfernen", mark_replaced: "Wird ersetzt",
  markHiddenHint: "Ausgeblendet durch einen Vermerk am Objekt.", reason_marked_keep: "Trägt den Vermerk „Nicht entfernen“.",
});
Object.assign(TEXT.en, {
  markTitle: "Mark", markHint: "Note why the object is the way it is, for example offline on purpose. Housekeeper then stops reporting it as “not available”; a broken reference stays visible. Only in Housekeeper, Home Assistant stays unchanged.",
  markNone: "No mark.", markSet: "Set a mark", markChange: "Change", markClear: "Remove mark", markKind: "Kind of mark", markReason: "Reason (optional)", markReview: "Review in", markNever: "Never", markTarget: "Replaced by (object ID)", markDue: "Review date reached: the findings are visible again.", markReviewOn: "review {date}", markBy: "Mark: {kind}", markFailed: "The mark could not be saved: {reason}",
  mark_expected_offline: "Offline on purpose", mark_seasonal: "Seasonal", mark_spare: "Spare device", mark_keep: "Do not remove", mark_replaced: "Being replaced",
  markHiddenHint: "Hidden by a mark on the object.", reason_marked_keep: "Carries the mark “Do not remove”.",
});

class MarksMixin {
  markLine(mark) {
    const until = mark.until ? ` · ${this.t("markReviewOn", { date: this.formatDate(mark.until) })}` : "";
    return `${this.t(`mark_${mark.kind}`)}${until}${mark.reason ? ` · ${mark.reason}` : ""}${mark.target ? ` → ${mark.target}` : ""}`;
  }

  // The form to set or change a mark (kind, reason, target for "replaced", review date).
  markFormHtml(f, key) {
    const type = key.split(":")[0];
    const allowed = ["config_entry", "app"].includes(type) ? ["expected_offline", "seasonal", "spare"] : ["expected_offline", "seasonal", "spare", "keep", "replaced"];
    const kinds = allowed.map(k => `<option value="${k}" ${f.kind === k ? "selected" : ""}>${this.t(`mark_${k}`)}</option>`).join("");
    const days = [0, 30, 90, 180, 365].map(n => `<option value="${n}" ${Number(f.days) === n ? "selected" : ""}>${n ? this.t("decideDays", { n }) : this.t("markNever")}</option>`).join("");
    const target = f.kind === "replaced" ? `<input data-mark-target maxlength="255" autocomplete="off" value="${this.esc(f.target)}" aria-label="${this.esc(this.t("markTarget"))}" placeholder="${this.esc(this.t("markTarget"))}">` : "";
    return `<form class="pad polform" data-mark-form="${this.esc(key)}"><select data-mark-kind aria-label="${this.esc(this.t("markKind"))}">${kinds}</select>
        <input data-mark-reason maxlength="200" autocomplete="off" value="${this.esc(f.reason)}" aria-label="${this.esc(this.t("markReason"))}" placeholder="${this.esc(this.t("markReason"))}">${target}
        <select data-mark-days aria-label="${this.esc(this.t("markReview"))}">${days}</select>
        <button type="submit" class="btn primary">${this.t("saveOptions")}</button><button type="button" class="btn quiet" data-mark-cancel>${this.t("cancelRun")}</button>
        ${f.error ? `<small class="error" role="alert">${this.esc(f.error)}</small>` : ""}</form>`;
  }

  markCard(item) {
    if (!MARK_TYPES.includes(item.object_type)) return "";
    const f = this.markForm, key = this.objectKey(item), mark = item.mark;
    const head = `<div class="panelhead"><div><h2>${this.t("markTitle")}</h2><p>${this.t("markHint")}</p></div></div>`;
    if (f && f.key === key) return `<section class="panel">${head}${this.markFormHtml(f, key)}</section>`;
    const body = mark
      ? `<div class="row"><span class="tile ${item.mark_due ? "warn" : "mute"}"><ha-icon icon="mdi:bookmark-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(this.t(`mark_${mark.kind}`))}</strong><small>${this.esc(this.markLine(mark))}${item.mark_due ? ` · ${this.t("markDue")}` : ""}</small></span><button class="btn" data-mark-open="${this.esc(key)}">${this.t("markChange")}</button><button class="btn quiet" data-mark-clear="${this.esc(key)}">${this.t("markClear")}</button></div>`
      : `<div class="pad"><p class="factnote">${this.t("markNone")}</p><button class="btn" data-mark-open="${this.esc(key)}"><ha-icon icon="mdi:bookmark-plus-outline"></ha-icon>${this.t("markSet")}</button></div>`;
    return `<section class="panel">${head}${body}</section>`;
  }

  // The same as rows of the tab "Actions": the mark with its buttons, or the form below its title while it is edited.
  markRows(item) {
    if (!MARK_TYPES.includes(item.object_type)) return [];
    const f = this.markForm, key = this.objectKey(item), mark = item.mark;
    if (f && f.key === key) return [this.actRow(this.t("markTitle"), this.t("markHint"), ""), `<div class="actblock">${this.markFormHtml(f, key)}</div>`];
    if (!mark) return [this.actRow(this.t("markTitle"), `${this.t("markNone")} ${this.t("markHint")}`, `<button class="btn" data-mark-open="${this.esc(key)}"><ha-icon icon="mdi:bookmark-plus-outline"></ha-icon>${this.t("markSet")}</button>`)];
    return [this.actRow(`${this.esc(this.t("markTitle"))}: ${this.esc(this.t(`mark_${mark.kind}`))}`, `${this.esc(this.markLine(mark))}${item.mark_due ? ` · ${this.t("markDue")}` : ""}`, `<button class="btn" data-mark-open="${this.esc(key)}">${this.t("markChange")}</button><button class="btn quiet" data-mark-clear="${this.esc(key)}">${this.t("markClear")}</button>`)];
  }

  openMark(key) {
    const item = this.findObject(key), mark = item?.mark;
    this.markForm = { key, kind: mark?.kind || "expected_offline", reason: mark?.reason || "", days: 0, target: mark?.target || "", error: "" };
    this.render();
    this.shadowRoot?.querySelector?.("[data-mark-kind]")?.focus?.();
  }

  // The backend refreshes its cached snapshot; the panel fetches that copy, so no new scan is needed.
  async refreshData() {
    const key = this.selected ? this.objectKey(this.selected) : null;
    this.data = await this._hass.callWS({ type: "ha_housekeeper/inventory" });
    this._rev++;
    if (key) this.selected = this.findObject(key) || null;
  }

  async commitMark() {
    const f = this.markForm;
    if (!f) return;
    const [object_type, ...rest] = f.key.split(":");
    const msg = { type: "ha_housekeeper/mark_set", object_type, object_id: rest.join(":"), kind: f.kind, reason: f.reason.trim() };
    if (Number(f.days)) msg.days = Number(f.days);
    if (f.kind === "replaced" && f.target.trim()) msg.target = f.target.trim();
    try {
      await this._hass.callWS(msg);
      this.markForm = null;
      await this.refreshData();
    } catch (err) { f.error = this.t("markFailed", { reason: err?.message || String(err) }); }
    this.render();
  }

  async clearMark(key) {
    const [object_type, ...rest] = key.split(":");
    try {
      await this._hass.callWS({ type: "ha_housekeeper/mark_clear", object_type, object_id: rest.join(":") });
      await this.refreshData();
    } catch (err) { this.failed(err); }
    this.render();
  }

  bindMarks(root) {
    root.querySelectorAll("[data-mark-open]").forEach(el => el.onclick = () => this.openMark(el.dataset.markOpen));
    root.querySelectorAll("[data-mark-clear]").forEach(el => el.onclick = () => this.clearMark(el.dataset.markClear));
    root.querySelectorAll("[data-mark-cancel]").forEach(el => el.onclick = () => { this.markForm = null; this.render(); });
    root.querySelectorAll("[data-mark-form]").forEach(form => {
      form.onsubmit = ev => { ev.preventDefault(); this.commitMark(); };
      form.querySelector("[data-mark-kind]").onchange = ev => { this.markForm.kind = ev.target.value; this.render(); };
      form.querySelector("[data-mark-reason]").oninput = ev => { this.markForm.reason = ev.target.value; };
      form.querySelector("[data-mark-days]").onchange = ev => { this.markForm.days = Number(ev.target.value); };
      const target = form.querySelector("[data-mark-target]");
      if (target) target.oninput = ev => { this.markForm.target = ev.target.value; };
      form.onkeydown = ev => { if (ev.key === "Escape") { ev.preventDefault(); this.markForm = null; this.render(); } };
    });
  }
}
