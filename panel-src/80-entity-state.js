// Switching several entities at once from the inventory: disable, enable, hide, show. A plan like any other (preview, undo).
Object.assign(TEXT.de, {
  stateSel: "{count} ausgewählt", stateAllFiltered: "Alle {count} Entitäten der Liste", stateClear: "Auswahl aufheben",
  stateDisable: "Deaktivieren", stateEnable: "Aktivieren", stateHide: "Ausblenden", stateUnhide: "Einblenden",
  stateTooMany: "Ein Plan fasst höchstens {max} Entitäten. Wähle weniger aus.", stateNoItems: "Wähle Entitäten aus.",
  stateTarget_disable: "deaktivieren", stateTarget_enable: "aktivieren", stateTarget_hide: "ausblenden", stateTarget_unhide: "einblenden",
  reason_already_in_state: "Steht schon so.", reason_not_user_disabled: "Nicht von dir deaktiviert (Integration oder Gerät). Das bleibt so.", reason_bad_state: "Unbekannte Aktion.",
  check_entity_state: "Zustand ist gesetzt", result_entity_state: "Umgestellt", actKind_set_entity_state: "Entität umgestellt",
  confirmedSummaryState: "{count} Entitäten werden deaktiviert, aktiviert, aus- oder eingeblendet. Das lässt sich vollständig rückgängig machen.",
});
Object.assign(TEXT.en, {
  stateSel: "{count} selected", stateAllFiltered: "All {count} entities in the list", stateClear: "Clear selection",
  stateDisable: "Disable", stateEnable: "Enable", stateHide: "Hide", stateUnhide: "Show",
  stateTooMany: "A plan holds {max} entities at most. Select fewer.", stateNoItems: "Select entities.",
  stateTarget_disable: "disable", stateTarget_enable: "enable", stateTarget_hide: "hide", stateTarget_unhide: "show",
  reason_already_in_state: "Is like this already.", reason_not_user_disabled: "Not disabled by you (integration or device). It stays as it is.", reason_bad_state: "Unknown action.",
  check_entity_state: "State is set", result_entity_state: "Switched", actKind_set_entity_state: "Entity switched",
  confirmedSummaryState: "{count} entities are disabled, enabled, hidden or shown. This can be fully undone.",
});

class EntityStateMixin {
  // The bar over the inventory table: how many entities are ticked and what can be done with them.
  invSelBar(rows) {
    const sel = this.invSel ||= new Set(), n = sel.size;
    const entities = rows.filter(r => r.object_type === "entity");
    if (!n && !entities.length) return "";
    const tooMany = n > MAX_PLAN_ACTIONS, busy = this.planBusy ? 'disabled aria-busy="true"' : "";
    const btn = (target, icon) => `<button class="btn" data-inv-state="${target}" ${n && !tooMany ? busy : "disabled"}><ha-icon icon="${icon}"></ha-icon>${this.t(`state${target[0].toUpperCase()}${target.slice(1)}`)}</button>`;
    return `<div class="toolbar${n ? "" : " nosel"}"><button class="btn quiet" data-inv-sel-all ${entities.length ? "" : "disabled"}>${this.t("stateAllFiltered", { count: this.formatNumber(entities.length) })}</button><button class="btn quiet" data-inv-sel-clear ${n ? "" : "disabled"}>${this.t("stateClear")}</button><span class="selcount" role="status">${this.t("stateSel", { count: n })}</span><span class="toolgap"></span><div class="fbtns">${btn("disable", "mdi:cancel")}${btn("enable", "mdi:check-circle-outline")}${btn("hide", "mdi:eye-off-outline")}${btn("unhide", "mdi:eye-outline")}</div></div>${tooMany ? `<small class="error errpad" role="alert">${this.esc(this.t("stateTooMany", { max: MAX_PLAN_ACTIONS }))}</small>` : ""}`;
  }

  invSelBox(item) {
    if (item.object_type !== "entity") return "";
    return `<input type="checkbox" class="selbox" data-inv-sel="${this.esc(item.object_id)}" ${this.invSel?.has(item.object_id) ? "checked" : ""} aria-label="${this.esc(item.name)}">`;
  }

  // Select only the entities on the current page; other inventory object types have no bulk action.
  invHeadBox() {
    const ids = this._invPage || [];
    if (!ids.length) return "";
    const n = ids.filter(id => this.invSel?.has(id)).length;
    return `<input type="checkbox" class="selbox" data-inv-sel-page ${n === ids.length ? "checked" : ""} ${n && n < ids.length ? "data-partial" : ""} aria-label="${this.esc(this.t("selectPage"))}">`;
  }

  bindInvSel(root) {
    root.querySelectorAll("[data-inv-sel]").forEach(el => {
      el.onclick = ev => ev.stopPropagation();
      el.onchange = () => { (this.invSel ||= new Set())[el.checked ? "add" : "delete"](el.dataset.invSel); this.render(); };
    });
    const pageBox = root.querySelector("[data-inv-sel-page]");
    if (pageBox) {
      pageBox.indeterminate = pageBox.hasAttribute("data-partial");
      pageBox.onchange = () => {
        const sel = this.invSel ||= new Set();
        for (const id of this._invPage) sel[pageBox.checked ? "add" : "delete"](id);
        this.render();
      };
    }
    root.querySelector("[data-inv-sel-all]")?.addEventListener("click", () => {
      this.invSel = new Set([...(this.invSel || []), ...this.filtered().filter(r => r.object_type === "entity").map(r => r.object_id)]); this.render();
    });
    root.querySelector("[data-inv-sel-clear]")?.addEventListener("click", () => { this.invSel = new Set(); this.render(); });
    root.querySelectorAll("[data-inv-state]").forEach(el => el.addEventListener("click", () => this.makeStatePlan(el.dataset.invState)));
  }

  async makeStatePlan(target) {
    const ids = [...(this.invSel || [])];
    if (!ids.length || ids.length > MAX_PLAN_ACTIONS) return;
    try {
      if (!await this.newPlan(ids.map(object_id => ({ kind: "set_entity_state", object_id, target })))) return;
      this.invSel = new Set();
    } catch (err) { this.failed(err); }
    this.render();
  }
}
