// User-selected direct dependencies of important home functions.
class MonitorMixin {
  monitorFunctions() { return this.data?.monitor || []; }

  monitorReason(reason) { if (!reason) return ""; return this.t(`monitorReason_${reason}`) === `monitorReason_${reason}` ? reason : this.t(`monitorReason_${reason}`); }

  monitorState(item) {
    const key = item.incident_open && item.state === "unverified" ? "monitorUnresolved" : `monitor${item.state === "ok" ? "Ok" : item.state === "problem" ? "Problem" : "Unverified"}`;
    return this.t(key);
  }

  monitorView() {
    if (this.monitorForm) return this.monitorEditor();
    if (this.monitorSelected) return this.monitorDetail();
    const rank = { problem: 0, unverified: 1, ok: 2 };
    const items = this.monitorFunctions().filter(item => !this.monitorFilter || item.state === this.monitorFilter || (this.monitorFilter === "problem" && item.incident_open)).sort((a, b) => (rank[a.state] - rank[b.state]) || a.name.localeCompare(b.name, this.lang));
    const filters = [["", "monitorAll"], ["problem", "monitorProblem"], ["unverified", "monitorUnverified"], ["ok", "monitorOk"]].map(([key, label]) => `<button class="btn ${this.monitorFilter === key ? "primary" : "quiet"}" data-monitor-filter="${key}">${this.t(label)}</button>`).join("");
    const rows = items.map(item => {
      const tone = item.incident_open || item.state === "problem" ? "red" : item.state === "unverified" ? "warn" : "ok";
      const key = item.incident_open && item.state === "unverified" ? item.last_problem_key : item.reason_key;
      const reason = key ? this.findObject(key)?.name || key : "";
      const detail = item.incident_open && item.state === "unverified" ? `${this.t("monitorUnresolved")}: ${this.monitorReason(item.last_problem_reason)}` : this.monitorReason(item.reason);
      return `<button class="row" data-monitor-open="${this.esc(item.id)}"><span class="tile ${tone}"><ha-icon icon="mdi:home-heart"></ha-icon></span><span class="row-text"><strong>${this.esc(item.name)}</strong><small>${this.esc([reason, detail, this.t("monitorLastScan", { date: this.formatDate(item.scanned_at) })].filter(Boolean).join(" · "))}</small></span><span class="pill ${tone}">${this.monitorState(item)}</span></button>`;
    }).join("");
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("monitor")}</h2><p>${this.t("monitorSubtitle")}</p></div><button class="btn primary" data-monitor-add><ha-icon icon="mdi:plus"></ha-icon>${this.t("monitorAdd")}</button></div>${this.monitorFunctions().length ? `<div class="toolbar">${filters}</div>${rows || `<div class="emptymsg">${this.t("monitorEmptyFiltered")}</div>`}` : `<div class="emptymsg"><ha-icon icon="mdi:home-heart-outline"></ha-icon>${this.t("monitorEmpty")}<small>${this.t("monitorEmptyHint")}</small></div>`}</section>`;
  }

  monitorDetail() {
    const item = this.monitorFunctions().find(f => f.id === this.monitorSelected);
    if (!item) { this.monitorSelected = null; return this.monitorView(); }
    const tone = item.incident_open || item.state === "problem" ? "red" : item.state === "unverified" ? "warn" : "ok";
    const members = item.members.map(member => {
      const object = this.findObject(member.object_key);
      const title = object?.name || member.object_key;
      const status = member.state === "problem" ? "red" : member.state === "unverified" ? "warn" : "ok";
      return `<div class="row"><span class="tile ${status}"><ha-icon icon="${ICONS[member.object_key.split(":")[0]] || "mdi:help-circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(title)}</strong><small>${this.esc(member.object_key)} · ${this.t(member.required ? "monitorRequired" : "monitorAdditional")} · ${this.esc(this.monitorReason(member.reason))}</small></span>${object ? `<button class="btn" data-object="${this.esc(member.object_key)}">${this.t("details")}</button>` : ""}</div>`;
    }).join("");
    return `<button class="btn" data-monitor-back><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("monitorBack")}</button><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.esc(item.name)} <span class="pill ${tone}">${this.monitorState(item)}</span></h2><p>${this.esc(item.description || this.t("monitorSubtitle"))}</p></div><button class="btn" data-monitor-edit>${this.t("monitorEdit")}</button></div><div class="facts"><div class="fact"><span>${this.t("monitorLastScan", { date: this.formatDate(item.scanned_at) })}</span></div><div class="fact"><span>${item.last_verified_at ? this.t("monitorLastVerified", { date: this.formatDate(item.last_verified_at) }) : this.t("monitorNeverVerified")}</span></div></div>${item.state === "unverified" ? `<div class="row"><span class="tile warn"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span><span class="row-text"><strong>${this.t(item.incident_open ? "monitorUnresolved" : "monitorNoProof")}</strong>${item.incident_open && item.last_problem_reason ? `<small>${this.esc(this.monitorReason(item.last_problem_reason))}</small>` : ""}</span></div>` : ""}</section><section class="panel"><div class="panelhead"><h2>${this.t("monitorMembers")}</h2></div>${members}</section>`;
  }

  monitorEditor() {
    const form = this.monitorForm;
    const chosen = new Set(form.members.map(m => m.object_key));
    const candidates = (this.data?.objects || []).filter(o => ["entity", "device", "automation", "config_entry"].includes(o.object_type) && o.status !== "ignored" && !chosen.has(this.objectKey(o)) && (!this.monitorQuery || `${o.name} ${o.object_id}`.toLowerCase().includes(this.monitorQuery.toLowerCase()))).slice(0, 25);
    const selected = form.members.map((member, i) => {
      const object = this.findObject(member.object_key);
      return `<div class="row"><span class="row-text"><strong>${this.esc(object?.name || member.object_key)}</strong><small>${this.esc(member.object_key)}</small></span><label class="monitor-check"><input type="checkbox" data-monitor-required="${i}" ${member.required ? "checked" : ""}>${this.t("monitorRequired")}</label><button class="btn quiet" data-monitor-remove="${i}">${this.t("monitorRemove")}</button></div>`;
    }).join("");
    const picks = candidates.map(o => `<div class="row"><span class="row-text"><strong>${this.esc(o.name)}</strong><small>${this.esc(o.object_id)}</small></span><button class="btn" data-monitor-pick="${this.esc(this.objectKey(o))}">${this.t("monitorPick")}</button></div>`).join("");
    return `<button class="btn" data-monitor-cancel><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("monitorCancel")}</button><section class="panel u-mb14"><div class="panelhead"><h2>${this.t(form.id ? "monitorEdit" : "monitorAdd")}</h2></div><div class="monitor-fields"><label>${this.t("monitorName")}<input data-monitor-name maxlength="80" value="${this.esc(form.name)}"></label><label>${this.t("monitorDescription")}<textarea data-monitor-description maxlength="240">${this.esc(form.description)}</textarea></label></div><div class="row"><span class="row-text"><strong>${this.t("monitorNotify")}</strong><small>${this.t("monitorNotifyHint")}</small></span><input type="checkbox" data-monitor-notify ${form.notify ? "checked" : ""}></div></section><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorMembers")}</h2><p>${this.t("monitorRequiredCount", { n: form.members.filter(m => m.required).length, m: form.members.filter(m => !m.required).length })}</p></div></div>${selected || `<div class="emptymsg">${this.t("monitorChoose")}</div>`}</section><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorFindObject")}</h2><p>${this.t("monitorSearchHint")}</p></div></div><div class="monitor-fields"><input data-monitor-search aria-label="${this.t("monitorSearchHint")}" placeholder="${this.t("monitorSearch")}" value="${this.esc(this.monitorQuery)}"></div>${picks}</section><div class="toolbar savebar"><span role="alert">${this.esc(this.monitorError)}</span><span class="toolgap"></span>${form.id ? `<button class="btn danger" data-monitor-delete>${this.t("monitorDelete")}</button>` : ""}<button class="btn" data-monitor-cancel>${this.t("monitorCancel")}</button><button class="btn primary" data-monitor-save ${!form.name.trim() || !form.members.length ? "disabled" : ""}>${this.t("monitorSave")}</button></div>`;
  }

  bindMonitor(root) {
    root.querySelector("[data-monitor-add]")?.addEventListener("click", () => { this.monitorForm = { name: "", description: "", notify: true, members: [] }; this.monitorQuery = ""; this.monitorError = ""; this.render(); });
    root.querySelectorAll("[data-monitor-filter]").forEach(el => el.onclick = () => { this.monitorFilter = el.dataset.monitorFilter; this.render(); });
    root.querySelectorAll("[data-monitor-open]").forEach(el => el.onclick = () => { this.monitorSelected = el.dataset.monitorOpen; this.render(); });
    root.querySelector("[data-monitor-back]")?.addEventListener("click", () => { this.monitorSelected = null; this.render(); });
    root.querySelector("[data-monitor-edit]")?.addEventListener("click", () => { const item = this.monitorFunctions().find(f => f.id === this.monitorSelected); this.monitorForm = { id: item.id, name: item.name, description: item.description, notify: item.notify, members: item.members.map(m => ({ object_key: m.object_key, required: m.required })) }; this.monitorError = ""; this.render(); });
    root.querySelectorAll("[data-monitor-cancel]").forEach(el => el.onclick = () => { this.monitorForm = null; this.monitorError = ""; this.render(); });
    root.querySelector("[data-monitor-name]")?.addEventListener("input", ev => { this.monitorForm.name = ev.target.value; root.querySelector("[data-monitor-save]").disabled = !this.monitorForm.name.trim() || !this.monitorForm.members.length; });
    root.querySelector("[data-monitor-description]")?.addEventListener("input", ev => { this.monitorForm.description = ev.target.value; });
    root.querySelector("[data-monitor-notify]")?.addEventListener("change", ev => { this.monitorForm.notify = ev.target.checked; });
    root.querySelector("[data-monitor-search]")?.addEventListener("input", ev => { this.monitorQuery = ev.target.value; globalThis.clearTimeout?.(this._monitorTimer); this._monitorTimer = globalThis.setTimeout?.(() => { this.render(); this.shadowRoot.querySelector("[data-monitor-search]")?.focus(); }, SEARCH_DEBOUNCE_MS); });
    root.querySelectorAll("[data-monitor-pick]").forEach(el => el.onclick = () => { this.monitorForm.members.push({ object_key: el.dataset.monitorPick, required: true }); this.render(); });
    root.querySelectorAll("[data-monitor-remove]").forEach(el => el.onclick = () => { this.monitorForm.members.splice(Number(el.dataset.monitorRemove), 1); this.render(); });
    root.querySelectorAll("[data-monitor-required]").forEach(el => el.onchange = () => { this.monitorForm.members[Number(el.dataset.monitorRequired)].required = el.checked; this.render(); });
    root.querySelector("[data-monitor-save]")?.addEventListener("click", () => this.saveMonitor());
    root.querySelector("[data-monitor-delete]")?.addEventListener("click", () => this.confirmAsk(this.t("monitorConfirmDelete", { name: this.monitorForm.name }), () => this.deleteMonitor()));
  }

  async saveMonitor() {
    const form = this.monitorForm;
    try {
      const response = await this._hass.callWS({ type: "ha_housekeeper/monitor_save", ...(form.id ? { function_id: form.id } : {}), name: form.name, description: form.description, notify: form.notify, members: form.members });
      this.data.monitor = response.functions; this.monitorSelected = response.function_id; this.monitorForm = null; this.monitorError = ""; this.render();
    } catch (err) { this.monitorError = this.t("monitorSaveFailed", { reason: err.message || String(err) }); this.render(); }
  }

  async deleteMonitor() {
    try {
      const response = await this._hass.callWS({ type: "ha_housekeeper/monitor_delete", function_id: this.monitorForm.id });
      this.data.monitor = response.functions; this.monitorSelected = null; this.monitorForm = null; this.monitorError = ""; this.render();
    } catch (err) { this.monitorError = this.t("monitorDeleteFailed", { reason: err.message || String(err) }); this.render(); }
  }
}
