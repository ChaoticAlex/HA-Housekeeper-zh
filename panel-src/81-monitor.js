// User-selected direct dependencies of important home functions.
const MONITOR_MEMBER_TYPES = ["entity", "device", "automation", "config_entry", "scene", "script", "app"];
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

  monitorRuleText(rule, object) {
    const value = this.formatNumber(rule.value);
    if (rule.kind === "freshness") return this.t("monitorRuleFreshnessText", { value });
    if (rule.kind === "unavailable_for") return this.t("monitorRuleUnavailableText", { value });
    return this.t("monitorRuleMinimumText", { value, unit: object?.unit || "" });
  }

  monitorSuggestions() {
    const chosen = new Set(this.monitorForm.members.map(m => m.object_key));
    const edges = this.data?.edges || [];
    const outgoing = new Map(), incoming = new Map();
    for (const edge of edges) {
      if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
      if (!incoming.has(edge.target)) incoming.set(edge.target, []);
      outgoing.get(edge.source).push(edge);
      incoming.get(edge.target).push(edge);
    }
    const found = new Map();
    const add = (key, score, reason, probable) => {
      const kind = key?.split(":")[0];
      if (!MONITOR_MEMBER_TYPES.includes(kind) || chosen.has(key)) return;
      const object = this.findObject(key);
      if (!object || object.status === "ignored" || found.get(key)?.score >= score) return;
      found.set(key, { key, object, score, reason, probable });
    };
    for (const key of chosen) {
      const object = this.findObject(key), name = object?.name || key;
      const targets = (outgoing.get(key) || []).filter(edge => ["TRIGGERS_ON", "USES_AS_CONDITION", "TARGETS", "REFERENCES", "INCLUDES", "CONNECTED"].includes(edge.relation));
      for (const edge of targets) {
        add(edge.target, 3, this.t("monitorSuggestionUsedBy", { name }), edge.confidence !== "certain");
        for (const provider of incoming.get(edge.target) || []) {
          if (!["PROVIDES", "OWNS"].includes(provider.relation)) continue;
          add(provider.source, 2, this.t("monitorSuggestionProvides", { name: this.findObject(edge.target)?.name || edge.target }), provider.confidence !== "certain");
          for (const app of outgoing.get(provider.source) || []) {
            if (app.relation === "CONNECTED") add(app.target, 1, this.t("monitorSuggestionConnected"), true);
          }
        }
      }
      for (const provider of incoming.get(key) || []) {
        if (["PROVIDES", "OWNS", "VIA_DEVICE"].includes(provider.relation)) add(provider.source, 2, this.t("monitorSuggestionProvides", { name }), provider.confidence !== "certain");
      }
    }
    return [...found.values()].sort((a, b) => b.score - a.score || String(a.object.name || a.key).localeCompare(String(b.object.name || b.key), this.lang)).slice(0, 8);
  }

  monitorPreviewHtml() {
    if (!this.monitorForm?.members.length) return "";
    const preview = this.monitorPreview;
    const state = preview?.state;
    const tone = state === "problem" ? "red" : state === "unverified" ? "warn" : "ok";
    const title = !preview ? this.t("monitorPreviewLoading") : preview.error ? this.t("monitorPreviewError", { reason: preview.error }) : this.monitorState(preview);
    const detail = preview?.reason_key ? this.findObject(preview.reason_key)?.name || preview.reason_key : "";
    const members = preview?.members?.map(member => `<div class="monitor-preview-row"><span>${this.esc(this.findObject(member.object_key)?.name || member.object_key)}</span><span class="pill ${member.state === "problem" ? "red" : member.state === "unverified" ? "warn" : "ok"}">${this.t(member.state === "problem" ? "monitorProblem" : member.state === "unverified" ? "monitorUnverified" : "monitorOk")}</span><small>${this.esc(this.monitorReason(member.reason))}</small></div>`).join("") || "";
    return `<section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorPreview")}</h2><p>${this.t("monitorPreviewHint")}</p></div>${state ? `<span class="pill ${tone}">${title}</span>` : ""}</div><div class="monitor-preview-body">${state ? `<strong>${this.esc([detail, this.monitorReason(preview.reason)].filter(Boolean).join(" · "))}</strong>${preview.scanned_at ? `<small>${this.t("monitorLastScan", { date: this.formatDate(preview.scanned_at) })}</small>` : ""}${members}` : `<p>${this.esc(title)}</p>`}</div></section>`;
  }

  queueMonitorPreview() {
    globalThis.clearTimeout?.(this._monitorPreviewTimer);
    const token = this._monitorPreviewToken = (this._monitorPreviewToken || 0) + 1;
    if (!this.monitorForm?.members.length) { this.monitorPreview = null; return; }
    this.monitorPreview = null;
    const refresh = () => { const host = this.shadowRoot?.querySelector?.("[data-monitor-preview]"); if (host) host.innerHTML = this.monitorPreviewHtml(); };
    refresh();
    this._monitorPreviewTimer = globalThis.setTimeout?.(async () => {
      try {
        const response = await this._hass.callWS({ type: "ha_housekeeper/monitor_preview", members: this.monitorForm.members });
        if (this._monitorPreviewToken === token && this.monitorForm) { this.monitorPreview = response.preview; refresh(); }
      } catch (err) {
        if (this._monitorPreviewToken === token && this.monitorForm) { this.monitorPreview = { error: err.message || String(err) }; refresh(); }
      }
    }, 250);
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
      const rules = (member.rules || []).map(rule => this.monitorRuleText(rule, object)).join("; ");
      return `<div class="row"><span class="tile ${status}"><ha-icon icon="${ICONS[member.object_key.split(":")[0]] || "mdi:help-circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(title)}</strong><small>${this.esc(member.object_key)} · ${this.t(member.required ? "monitorRequired" : "monitorAdditional")} · ${this.esc(this.monitorReason(member.reason))}${rules ? ` · ${this.esc(rules)}` : ""}</small></span>${object ? `<button class="btn" data-object="${this.esc(member.object_key)}">${this.t("details")}</button>` : ""}</div>`;
    }).join("");
    return `<div class="u-mb14"><button class="btn" data-monitor-back><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("monitorBack")}</button></div><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.esc(item.name)} <span class="pill ${tone}">${this.monitorState(item)}</span></h2><p>${this.esc(item.description || this.t("monitorSubtitle"))}</p></div><button class="btn" data-monitor-edit>${this.t("monitorEdit")}</button></div><div class="facts"><div class="fact"><span>${this.t("monitorLastScan", { date: this.formatDate(item.scanned_at) })}</span></div><div class="fact"><span>${item.last_verified_at ? this.t("monitorLastVerified", { date: this.formatDate(item.last_verified_at) }) : this.t("monitorNeverVerified")}</span></div></div>${item.state === "unverified" ? `<div class="row"><span class="tile warn"><ha-icon icon="mdi:help-circle-outline"></ha-icon></span><span class="row-text"><strong>${this.t(item.incident_open ? "monitorUnresolved" : "monitorNoProof")}</strong>${item.incident_open && item.last_problem_reason ? `<small>${this.esc(this.monitorReason(item.last_problem_reason))}</small>` : ""}</span></div>` : ""}</section><section class="panel"><div class="panelhead"><h2>${this.t("monitorMembers")}</h2></div>${members}</section>`;
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
      const rules = member.rules || [];
      const ruleFields = kind !== "entity" ? "" : `<details class="monitor-rules" ${rules.length ? "open" : ""}><summary>${this.t("monitorRules")} ${rules.length ? `(${rules.length})` : ""}</summary><p>${this.t("monitorRulesHint")}</p>${[["freshness", 24, 1, 720, "monitorRuleFreshness", "monitorRuleHours"], ["min_value", 20, -1000000000, 1000000000, "monitorRuleMinimum", object?.unit || ""], ["unavailable_for", 10, 1, 1440, "monitorRuleUnavailable", "monitorRuleMinutes"]].map(([ruleKind, fallback, min, max, label, unit]) => {
        const rule = rules.find(r => r.kind === ruleKind), enabled = Boolean(rule);
        return `<div class="monitor-rule"><label><input type="checkbox" data-monitor-rule-toggle="${i}:${ruleKind}" ${enabled ? "checked" : ""}>${this.t(label)}</label><input type="number" data-monitor-rule-value="${i}:${ruleKind}" aria-label="${this.t(label)}" value="${rule?.value ?? fallback}" min="${min}" max="${max}" step="${ruleKind === "min_value" ? "any" : "1"}" ${enabled ? "" : "disabled"}><span>${this.esc(this.t(unit))}</span></div>`;
      }).join("")}</details>`;
      return `<div class="monitor-member-wrap"><div class="row monitor-member"><span class="tile mute"><ha-icon icon="${ICONS[kind] || "mdi:help-circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(object?.name || member.object_key)}</strong><small>${this.t(`monitorType_${kind}`)} · ${this.esc(member.object_key.split(":").slice(1).join(":"))}${rules.length ? ` · ${this.esc(rules.map(rule => this.monitorRuleText(rule, object)).join("; "))}` : ""}</small></span><label class="monitor-check"><input type="checkbox" data-monitor-required="${i}" ${member.required ? "checked" : ""}>${this.t("monitorRequired")}</label><button class="btn quiet" data-monitor-remove="${i}">${this.t("monitorRemove")}</button></div>${ruleFields}</div>`;
    }).join("");
    const suggestions = form.members.length ? this.monitorSuggestions() : [];
    const suggested = suggestions.length ? `<section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorSuggestions")}</h2><p>${this.t("monitorSuggestionsHint")}</p></div></div>${suggestions.map(({ key, object, reason, probable }) => `<div class="row monitor-choice"><span class="tile mute"><ha-icon icon="${ICONS[object.object_type] || "mdi:help-circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.esc(object.name || object.object_id)}</strong><small>${this.t(`monitorType_${object.object_type}`)} · ${this.esc(reason)}${probable ? ` · ${this.t("monitorSuggestionProbable")}` : ""}</small></span><button class="btn small" data-monitor-pick="${this.esc(key)}">${this.t("monitorPick")}</button></div>`).join("")}</section>` : "";
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
    return `<div class="monitor-editor"><section class="panel u-mb14"><div class="panelhead monitor-editorhead"><h2>${this.t(form.id ? "monitorEditTitle" : "monitorAdd")}</h2><button class="btn quiet" data-monitor-cancel>${this.t("monitorCancel")}</button></div><div class="monitor-fields"><label>${this.t("monitorName")}<input data-monitor-name maxlength="80" value="${this.esc(form.name)}"></label><label>${this.t("monitorDescription")}<textarea data-monitor-description maxlength="240" rows="2">${this.esc(form.description)}</textarea></label></div><label class="row monitor-notify"><span class="row-text"><strong>${this.t("monitorNotify")}</strong><small>${this.t("monitorNotifyHint")}</small></span><input class="policyswitch" type="checkbox" role="switch" data-monitor-notify ${form.notify ? "checked" : ""}></label></section><section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorMembers")}</h2><p>${this.t("monitorRequiredCount", { n: form.members.filter(m => m.required).length, m: form.members.filter(m => !m.required).length })}</p></div></div>${selected || `<div class="emptymsg">${this.t("monitorChoose")}</div>`}</section><div data-monitor-preview aria-live="polite">${this.monitorPreviewHtml()}</div>${suggested}<section class="panel u-mb14"><div class="panelhead"><div><h2>${this.t("monitorFindObject")}</h2><p>${this.t("monitorSearchHint")}</p></div></div><div class="monitor-fields monitor-search"><input type="search" data-monitor-search aria-label="${this.t("monitorSearch")}" placeholder="${this.t("monitorSearch")}" value="${this.esc(this.monitorQuery)}"></div><div class="monitor-tabs" role="group" aria-label="${this.t("monitorTypeFilter")}">${tabs}</div><div class="monitor-results">${candidates.length ? searchResult : `<p class="monitor-search-note">${searchResult}</p>`}</div></section><div class="toolbar savebar"><span role="alert">${this.esc(this.monitorError)}</span><span class="toolgap"></span>${form.id ? `<button class="btn danger" data-monitor-delete>${this.t("monitorDelete")}</button>` : ""}<button class="btn" data-monitor-cancel>${this.t("monitorCancel")}</button><button class="btn primary" data-monitor-save ${!form.name.trim() || !form.members.length ? "disabled" : ""}>${this.t("monitorSave")}</button></div></div>`;
  }

  bindMonitor(root) {
    root.querySelector("[data-monitor-add]")?.addEventListener("click", () => { this.monitorForm = { name: "", description: "", notify: true, members: [] }; this.monitorQuery = ""; this.monitorType = ""; this.monitorPreview = null; this.monitorError = ""; this.render(); });
    root.querySelectorAll("[data-monitor-filter]").forEach(el => el.onclick = () => { this.monitorFilter = el.dataset.monitorFilter; this.render(); });
    root.querySelectorAll("[data-monitor-open]").forEach(el => el.onclick = () => { this.monitorSelected = el.dataset.monitorOpen; this.render(); });
    root.querySelector("[data-monitor-back]")?.addEventListener("click", () => { this.monitorSelected = null; this.render(); });
    root.querySelector("[data-monitor-edit]")?.addEventListener("click", () => { const item = this.monitorFunctions().find(f => f.id === this.monitorSelected); this.monitorForm = { id: item.id, name: item.name, description: item.description, notify: item.notify, members: item.members.map(m => ({ object_key: m.object_key, required: m.required, rules: m.rules || [] })) }; this.monitorQuery = ""; this.monitorType = ""; this.monitorPreview = null; this.monitorError = ""; this.render(); this.queueMonitorPreview(); });
    root.querySelectorAll("[data-monitor-cancel]").forEach(el => el.onclick = () => { globalThis.clearTimeout?.(this._monitorPreviewTimer); this._monitorPreviewToken = (this._monitorPreviewToken || 0) + 1; this.monitorForm = null; this.monitorError = ""; this.render(); });
    root.querySelector("[data-monitor-name]")?.addEventListener("input", ev => { this.monitorForm.name = ev.target.value; root.querySelector("[data-monitor-save]").disabled = !this.monitorForm.name.trim() || !this.monitorForm.members.length; });
    root.querySelector("[data-monitor-description]")?.addEventListener("input", ev => { this.monitorForm.description = ev.target.value; });
    root.querySelector("[data-monitor-notify]")?.addEventListener("change", ev => { this.monitorForm.notify = ev.target.checked; });
    root.querySelector("[data-monitor-search]")?.addEventListener("input", ev => { this.monitorQuery = ev.target.value; const at = ev.target.selectionStart; globalThis.clearTimeout?.(this._monitorTimer); this._monitorTimer = globalThis.setTimeout?.(() => { this.render(); const input = this.shadowRoot.querySelector("[data-monitor-search]"); input?.focus(); input?.setSelectionRange?.(at, at); }, SEARCH_DEBOUNCE_MS); });
    root.querySelectorAll("[data-monitor-type]").forEach(el => el.onclick = () => { this.monitorType = el.dataset.monitorType; this.render(); this.shadowRoot.querySelector(`[data-monitor-type="${this.monitorType}"]`)?.focus(); });
    root.querySelectorAll("[data-monitor-pick]").forEach(el => el.onclick = () => { if (this.monitorForm.members.some(m => m.object_key === el.dataset.monitorPick)) return; this.monitorForm.members.push({ object_key: el.dataset.monitorPick, required: true, rules: [] }); this.render(); this.queueMonitorPreview(); });
    root.querySelectorAll("[data-monitor-remove]").forEach(el => el.onclick = () => { this.monitorForm.members.splice(Number(el.dataset.monitorRemove), 1); this.render(); this.queueMonitorPreview(); });
    root.querySelectorAll("[data-monitor-required]").forEach(el => el.onchange = () => { this.monitorForm.members[Number(el.dataset.monitorRequired)].required = el.checked; this.render(); this.queueMonitorPreview(); });
    root.querySelectorAll("[data-monitor-rule-toggle]").forEach(el => el.onchange = () => {
      const [index, kind] = el.dataset.monitorRuleToggle.split(":");
      const member = this.monitorForm.members[Number(index)];
      member.rules ||= [];
      member.rules = member.rules.filter(rule => rule.kind !== kind);
      if (el.checked) member.rules.push({ kind, value: kind === "freshness" ? 24 : kind === "min_value" ? 20 : 10 });
      this.render(); this.queueMonitorPreview();
    });
    root.querySelectorAll("[data-monitor-rule-value]").forEach(el => el.onchange = () => {
      const [index, kind] = el.dataset.monitorRuleValue.split(":");
      const member = this.monitorForm.members[Number(index)];
      const rule = member.rules?.find(value => value.kind === kind);
      if (!rule) return;
      if (!el.checkValidity() || !el.value.trim()) { el.value = rule.value; return; }
      rule.value = Number(el.value);
      this.queueMonitorPreview();
    });
    root.querySelector("[data-monitor-save]")?.addEventListener("click", () => this.saveMonitor());
    root.querySelector("[data-monitor-delete]")?.addEventListener("click", () => this.confirmAsk(this.t("monitorConfirmDelete", { name: this.monitorForm.name }), () => this.deleteMonitor()));
  }

  async saveMonitor() {
    const form = this.monitorForm;
    globalThis.clearTimeout?.(this._monitorPreviewTimer);
    this._monitorPreviewToken = (this._monitorPreviewToken || 0) + 1;
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
