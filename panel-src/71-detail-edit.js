// Renaming one entity and giving an entity or device an area, from its detail page. Both end in a plan
// like the bulk forms of the policy list. Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  deTitle: "Umbenennen und Bereich", deNewId: "Neue ID", deBadId: "Erlaubt sind a–z, 0–9 und _.", deRename: "Umbenennen vorbereiten", deAssign: "Bereich zuweisen", deRenameShort: "Vorbereiten", deAssignShort: "Zuweisen",
  deArea: "Bereich", deNoArea: "Kein Bereich", deAreaNow: "Heute: {area}", deRenameNote: "Verweise in Automationen, Skripten und Szenen schreibt Housekeeper mit um.",
});
Object.assign(TEXT.en, {
  deTitle: "Rename and area", deNewId: "New ID", deBadId: "Only a–z, 0–9 and _ are allowed.", deRename: "Prepare rename", deAssign: "Assign area", deRenameShort: "Prepare", deAssignShort: "Assign",
  deArea: "Area", deNoArea: "No area", deAreaNow: "Now: {area}", deRenameNote: "Housekeeper rewrites references in automations, scripts and scenes as well.",
});

const DETAIL_ID_RULE = /^[a-z0-9_]+$/;

class DetailEditMixin {
  // The card on the overview tab of an entity or a device; empty for every other kind of object.
  // The pieces of the edit forms: the state of the form, the areas and the controls of the rename and the area form.
  detailEditParts(item, short = false) {
    const e = this.detailEdit?.id === item.object_id ? this.detailEdit : (this.detailEdit = { id: item.object_id, value: item.object_id.split(".").slice(1).join("."), area: item.area_id || "", error: "" });
    const areas = (this.data.objects || []).filter(o => o.object_type === "area").sort((x, y) => String(x.name).localeCompare(String(y.name)));
    const now = this.areaName(item), suggest = !item.area_id;
    const renameControls = item.object_type === "entity" ? `<span class="deid"><span class="mono">${this.esc(item.object_id.split(".")[0])}.</span><input id="de-id" data-de-id value="${this.esc(e.value)}" autocomplete="off" spellcheck="false" aria-label="${this.esc(this.t("deNewId"))}"></span>
        <button type="submit" class="btn primary" data-de-rename-btn ${this.detailIdOk(item, e.value) && !this.planBusy ? "" : "disabled"}>${this.t(short ? "deRenameShort" : "deRename")}</button>` : "";
    const areaControls = areas.length ? `<select id="de-area" data-de-area-select aria-label="${this.esc(this.t("deArea"))}">${suggest ? `<option value="">${this.t("areaSuggest")}</option>` : ""}${areas.map(a => `<option value="${this.esc(a.object_id)}" ${e.area === a.object_id ? "selected" : ""}>${this.esc(a.name)}</option>`).join("")}</select>
        <button type="submit" class="btn primary" data-de-area-btn ${(suggest || e.area !== item.area_id) && !this.planBusy ? "" : "disabled"}>${this.t(short ? "deAssignShort" : "deAssign")}</button>` : "";
    return { e, now, suggest, renameControls, areaControls, hasAreas: areas.length > 0 };
  }

  detailEditCard(item) {
    if (!["entity", "device"].includes(item.object_type)) return "";
    const { e, now, suggest, renameControls, areaControls, hasAreas } = this.detailEditParts(item);
    const rename = renameControls ? `<form class="deform" data-de-rename><label for="de-id"><strong>${this.t("deNewId")}</strong></label>${renameControls}
        <small class="factnote">${this.t("deRenameNote")}</small></form>` : "";
    const assign = hasAreas ? `<form class="deform" data-de-area><label for="de-area"><strong>${this.t("deArea")}</strong><small class="denow${now ? "" : " none"}">${this.t("deAreaNow", { area: now || this.t("deNoArea") })}</small></label>${areaControls}
        ${suggest ? `<small class="factnote">${this.t("areaNote")}</small>` : ""}</form>` : `<small class="factnote">${this.t("areaNone")}</small>`;
    return `<section class="panel"><div class="panelhead"><h2>${this.t("deTitle")}</h2></div><div class="pad">${rename}${assign}${e.error ? `<small class="error" role="alert">${this.esc(this.t(e.error))}</small>` : ""}</div></section>`;
  }

  // The same forms as rows of the tab "Actions": the name and the explanation on the left, the controls on the right.
  detailEditRows(item) {
    if (!["entity", "device"].includes(item.object_type)) return [];
    const { e, now, suggest, renameControls, areaControls, hasAreas } = this.detailEditParts(item, true);
    const rows = [];
    if (renameControls) rows.push(this.actRow(this.t("deNewId"), this.t("deRenameNote"), `<form class="deform" data-de-rename>${renameControls}</form>`));
    const areaHint = [this.t("deAreaNow", { area: now || this.t("deNoArea") }), suggest && hasAreas ? this.t("areaNote") : ""].filter(Boolean).join(" · ");
    rows.push(hasAreas ? this.actRow(this.t("deArea"), areaHint, `<form class="deform" data-de-area>${areaControls}</form>`) : this.actRow(this.t("deArea"), this.t("areaNone"), ""));
    if (e.error) rows.push(`<div class="actblock"><small class="error" role="alert">${this.esc(this.t(e.error))}</small></div>`);
    return rows;
  }

  // The part after the dot must change and keep to what an ID may hold; whether it is free is the plan's business.
  detailIdOk(item, value) {
    return DETAIL_ID_RULE.test(value) && value !== item.object_id.split(".").slice(1).join(".");
  }

  async makeDetailPlan(action) {
    try {
      if (!await this.newPlan([action])) return;
    } catch (err) { this.failed(err); }
    this.render();
  }

  bindDetailEdit(root) {
    const item = this.selected, e = this.detailEdit;
    if (!item || !e || e.id !== item.object_id) return;
    const input = root.querySelector("[data-de-id]"), btn = root.querySelector("[data-de-rename-btn]");
    if (input) input.oninput = () => { e.value = input.value.trim().toLowerCase(); if (btn) btn.disabled = !this.detailIdOk(item, e.value); };
    root.querySelector("[data-de-rename]")?.addEventListener("submit", ev => {
      ev.preventDefault();
      if (!this.detailIdOk(item, e.value)) { e.error = "deBadId"; this.render(); return; }
      this.makeDetailPlan({ kind: "rename_entity", object_id: item.object_id, target: `${item.object_id.split(".")[0]}.${e.value}` });
    });
    const select = root.querySelector("[data-de-area-select]"), areaBtn = root.querySelector("[data-de-area-btn]");
    if (select) select.onchange = () => { e.area = select.value; if (areaBtn) areaBtn.disabled = !!item.area_id && e.area === item.area_id; };
    root.querySelector("[data-de-area]")?.addEventListener("submit", ev => {
      ev.preventDefault();
      this.makeDetailPlan({ kind: "set_area", object_id: item.object_id, ...(e.area ? { target: e.area } : {}) });
    });
  }
}
