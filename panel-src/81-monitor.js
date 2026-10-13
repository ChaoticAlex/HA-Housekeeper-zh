// User-selected direct dependencies of important home functions.
class MonitorMixin {
  monitorFunctions() { return this.data?.monitor || []; }

  monitorReason(reason) { if (!reason) return ""; return this.t(`monitorReason_${reason}`) === `monitorReason_${reason}` ? reason : this.t(`monitorReason_${reason}`); }

  monitorState(item) {
    const key = item.incident_open && item.state === "unverified" ? "monitorUnresolved" : `monitor${item.state === "ok" ? "Ok" : item.state === "problem" ? "Problem" : "Unverified"}`;
    return this.t(key);
  }

  monitorObjectContext(item) {
    const device = item.device_id ? this.findObject(`device:${item.device_id}`) : null;
    const area = this.findObject(`area:${item.area_id || device?.area_id}`);
    const floor = area?.floor_id ? this.findObject(`floor:${area.floor_id}`) : null;
    const labels = (item.labels || []).map(id => this.findObject(`label:${id}`)?.name || id);
    return [area?.name, floor?.name, ...labels].filter(Boolean).join(" · ");
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
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("monitor")}</h2><p>${this.t("monitorSubtitle")}</p></div><button class="btn primary" data-monitor-add><ha-icon icon="mdi:plus"></ha-icon>${this.t("monitorAdd")}</button></div>${this.monitorFunctions().length ? `<div class="toolbar">${filters}</div>${rows || `<div class="emptymsg">${this.t("monitorEmptyFiltered")}</div>`}` : `<div class="emptymsg"><ha-icon icon="mdi:home-heart"></ha-icon>${this.t("monitorEmpty")}</div>`}</section>`;
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
    const query = this.monitorQuery.trim().toLowerCase();
    const groups = [["entity", "monitorTypeEntity"], ["device", "monitorTypeDevice"], ["automation", "monitorTypeAutomation"], ["scene", "monitorTypeScene"], ["config_entry", "monitorTypeIntegration"], ["other", "monitorTypeOther"]];
    const objects = this.data?.objects || [];
    const specialKeys = new Set(objects.filter(o => ["automation", "script", "scene"].includes(o.object_type)).map(o => o.object_id));
    const typeOf = o => ["script", "app"].includes(o.object_type) ? "other" : o.object_type;
    const available = objects.filter(o => groups.some(([kind]) => kind === typeOf(o)) && o.status !== "ignored" && !(o.object_type === "entity" && specialKeys.has(o.object_id)));
    const matches = query.length < 2 ? [] : available.filter(o => `${o.name} ${o.object_id} ${o.aliases?.join?.(" ") || ""} ${this.monitorObjectContext(o)}`.toLowerCase().includes(query));
    const grouped = groups.map(([kind]) => [kind, matches.filter(o => typeOf(o) === kind)]);
    const candidates = grouped.flatMap(([kind, items]) => !this.monitorType || this.monitorType === kind ? items.slice(0, this.monitorType ? 50 : 10) : []);
    const tabs = [["", "monitorTypeAll"], ...groups].map(([kind, label]) => `<button class="btn small ${this.monitorType === kind || !this.monitorType && !kind ? "primary" : "quiet"}" type="button" data-monitor-type="${kind}" aria-pressed="${this.monitorType === kind || !this.monitorType && !kind}">${this.t(label)}</button>`).join("");
    const selected = form.members.map((member, i) => {
      const object = this.findObject(member.object_key);
      const kind = member.object_key.split(":")[0];
      return `<div class="row monitor-member"><span class="tile mute"><ha-icon icon="${ICONS[kind] || "mdi:help-circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(object?.name || member.object_key)}</strong><small>${this.t(`monitorType_${kind}`)} · ${this.esc(member.object_key.split(":").slice(1).join(":"))}</small></span><label class="monitor-check"><input type="checkbox" data-monitor-required="${i}" ${member.required ? "checked" : ""}>${this.t("monitorRequired")}</label><button class="btn quiet" data-monitor-remove="${i}">${this.t("monitorRemove")}</button></div>`;
    }).join("");
    const picks = groups.map(([kind, label]) => {
      const items = candidates.filter(o => typeOf(o) === kind);
      if (!items.length) return "";
      return `<div class="monitor-group"><h3>${this.t(label)} <span>${grouped.find(([type]) => type === kind)[1].length}</span></h3>${items.map(o => {
        const key = this.objectKey(o), added = chosen.has(key);
        const context = this.monitorObjectContext(o);
        return `<div class="row monitor-choice"><span class="tile mute"><ha-icon icon="${ICONS[o.object_type] || "mdi:help-circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(o.name || o.object_id)}</strong><small>${this.t(`monitorType_${o.object_type}`)} · ${this.esc(o.object_id)}${context ? ` · ${this.esc(context)}` : ""}</small></span><button class="btn small ${added ? "quiet" : ""}" type="button" data-monitor-pick="${this.esc(key)}" ${added ? "disabled" : ""}>${this.t(added ? "monitorAdded" : "monitorPick")}</button></div>`;
      }).join("")}${grouped.find(([type]) => type === kind)[1].length > items.length ? `<p class="monitor-search-note">${this.t("monitorMoreResults")}</p>` : ""}</div>`;
    }).join("");
    const searchResult = query.length < 2 ? this.t("monitorSearchStart") : candidates.length ? picks : this.t("monitorSearchNone");
    return `<div class="monitor-editor"><section class="panel u-mb14"><div class="panelhead monitor-editorhead"><h2>${this.t(form.id ? "monitorEditTitle" : "monitorAdd")}</h2><button class="btn quiet" data-monitor-cancel>${this.t("monitorCancel")}</button></div><div class="monitor-fields"><label>${this.t("monitorName")}<input data-monitor-name maxlength="80" value="${this.esc(form.name)}"></label><label>${this.t("monitorDescription")}<textarea data-monitor-description maxlength="240" rows="2">${this.esc(form.description)}</textarea></label></div><label class="row monitor-notify"><span class="row-text"><strong>${this.t("monitorNotify")}</strong><small>${this.t("monitorNotifyHint")}</small></span><input class="policyswitch" type="checkbox" role="switch" data-monitor-notify ${form.notify ? "checked" : ""}></label></section><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorMembers")}</h2><p>${this.t("monitorRequiredCount", { n: form.members.filter(m => m.required).length, m: form.members.filter(m => !m.required).length })}</p></div></div>${selected || `<div class="emptymsg">${this.t("monitorChoose")}</div>`}</section><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorFindObject")}</h2><p>${this.t("monitorSearchHint")}</p></div></div><div class="monitor-fields monitor-search"><input type="search" data-monitor-search aria-label="${this.t("monitorSearch")}" placeholder="${this.t("monitorSearch")}" value="${this.esc(this.monitorQuery)}"></div><div class="monitor-tabs" role="group" aria-label="${this.t("monitorTypeFilter")}">${tabs}</div><div class="monitor-results">${candidates.length ? searchResult : `<p class="monitor-search-note">${searchResult}</p>`}</div></section><div class="toolbar savebar"><span role="alert">${this.esc(this.monitorError)}</span><span class="toolgap"></span>${form.id ? `<button class="btn danger" data-monitor-delete>${this.t("monitorDelete")}</button>` : ""}<button class="btn" data-monitor-cancel>${this.t("monitorCancel")}</button><button class="btn primary" data-monitor-save ${!form.name.trim() || !form.members.length ? "disabled" : ""}>${this.t("monitorSave")}</button></div></div>`;
  }

  bindMonitor(root) {
    root.querySelector("[data-monitor-add]")?.addEventListener("click", () => { this.monitorForm = { name: "", description: "", notify: true, members: [] }; this.monitorQuery = ""; this.monitorType = ""; this.monitorError = ""; this.render(); });
    root.querySelectorAll("[data-monitor-filter]").forEach(el => el.onclick = () => { this.monitorFilter = el.dataset.monitorFilter; this.render(); });
    root.querySelectorAll("[data-monitor-open]").forEach(el => el.onclick = () => { this.monitorSelected = el.dataset.monitorOpen; this.render(); });
    root.querySelector("[data-monitor-back]")?.addEventListener("click", () => { this.monitorSelected = null; this.render(); });
    root.querySelector("[data-monitor-edit]")?.addEventListener("click", () => { const item = this.monitorFunctions().find(f => f.id === this.monitorSelected); this.monitorForm = { id: item.id, name: item.name, description: item.description, notify: item.notify, members: item.members.map(m => ({ object_key: m.object_key, required: m.required })) }; this.monitorQuery = ""; this.monitorType = ""; this.monitorError = ""; this.render(); });
    root.querySelectorAll("[data-monitor-cancel]").forEach(el => el.onclick = () => { this.monitorForm = null; this.monitorError = ""; this.render(); });
    root.querySelector("[data-monitor-name]")?.addEventListener("input", ev => { this.monitorForm.name = ev.target.value; root.querySelector("[data-monitor-save]").disabled = !this.monitorForm.name.trim() || !this.monitorForm.members.length; });
    root.querySelector("[data-monitor-description]")?.addEventListener("input", ev => { this.monitorForm.description = ev.target.value; });
    root.querySelector("[data-monitor-notify]")?.addEventListener("change", ev => { this.monitorForm.notify = ev.target.checked; });
    root.querySelector("[data-monitor-search]")?.addEventListener("input", ev => { this.monitorQuery = ev.target.value; const at = ev.target.selectionStart; globalThis.clearTimeout?.(this._monitorTimer); this._monitorTimer = globalThis.setTimeout?.(() => { this.render(); const input = this.shadowRoot.querySelector("[data-monitor-search]"); input?.focus(); input?.setSelectionRange?.(at, at); }, SEARCH_DEBOUNCE_MS); });
    root.querySelectorAll("[data-monitor-type]").forEach(el => el.onclick = () => { this.monitorType = el.dataset.monitorType; this.render(); this.shadowRoot.querySelector(`[data-monitor-type="${this.monitorType}"]`)?.focus(); });
    root.querySelectorAll("[data-monitor-pick]").forEach(el => el.onclick = () => { if (this.monitorForm.members.some(m => m.object_key === el.dataset.monitorPick)) return; this.monitorForm.members.push({ object_key: el.dataset.monitorPick, required: true }); this.render(); });
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
