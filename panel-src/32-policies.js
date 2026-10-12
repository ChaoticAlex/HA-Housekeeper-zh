// PoliciesMixin: quality rules you switch on and the objects that break them; mixed into the panel in 99-register.js.
class PoliciesMixin {
  async loadPolicies() {
    this.policiesLoading = true; this.policiesError = ""; this.render();
    try { this.policies = await this._hass.callWS({ type: "ha_housekeeper/policies" }); this.policiesAt = new Date().toISOString(); }
    catch (err) { this.policiesError = err?.message || String(err); }
    this.policiesLoading = false; this.render();
  }

  // Loads on the first visit; the answer is computed from the last scan and needs no recorder.
  ensurePolicies() {
    if (this.policiesLoading || this._policiesRequested) return;
    this._policiesRequested = true;
    setTimeout(() => this.loadPolicies(), 0);
  }

  async changePolicy(call) {
    try { await this._hass.callWS(call); }
    catch (err) { this.policiesError = err?.message || String(err); }
    await this.loadPolicies();
  }

  addPolicyPrefix(domain, prefix) {
    domain = (domain || "").trim(); prefix = (prefix || "").trim();
    if (!domain || !prefix) return Promise.resolve();
    return this.changePolicy({ type: "ha_housekeeper/set_policy_prefix", domain, prefix });
  }

  removePolicyPrefix(domain) {
    return this.changePolicy({ type: "ha_housekeeper/set_policy_prefix", domain, prefix: "" });
  }

  polItemNote(item) {
    if (item.keep_days !== undefined) return `<small>${this.esc(this.t("polRetention", { days: item.keep_days, size: this.formatBytes(item.db_bytes) }))}</small>`;
    if (item.also?.length) return `<small>${this.esc(this.t(TEXT[this.lang]?.[`polAlso_${item.rule}`] ? `polAlso_${item.rule}` : "polAlso", { ids: item.also.join(", ") }))}</small>`;
    if (item.rate !== undefined) return `<small>${this.esc(this.t("polRate", { n: this.formatNumber(item.rate) }))}</small>`;
    if (item.expected) return `<small>${this.esc(this.t("polExpected", { prefix: item.expected }))}</small>`;
    return "";
  }

  // The prefix of each domain for the naming scheme: a row per prefix with a remove button, and a small form to add one.
  polPrefixEditor() {
    const entries = Object.entries(this.policies?.prefixes || {});
    const rows = entries.map(([domain, prefix]) => `<div class="row politem"><span class="tile mute"><ha-icon icon="mdi:format-letter-starts-with"></ha-icon></span><span class="row-text"><strong>${this.esc(domain)}</strong><small>${this.esc(this.t("polPrefixIs", { prefix }))}</small></span><button class="btn" data-policy-prefix-remove="${this.esc(domain)}">${this.t("polPrefixRemove")}</button></div>`).join("");
    const form = `<div class="row politem polform"><label class="sr-only" for="polDomain">${this.t("polPrefixDomain")}</label><input id="polDomain" type="text" placeholder="${this.esc(this.t("polPrefixDomain"))}" autocomplete="off" maxlength="40"><label class="sr-only" for="polPrefix">${this.t("polPrefixValue")}</label><input id="polPrefix" type="text" placeholder="${this.esc(this.t("polPrefixValue"))}" autocomplete="off" maxlength="30"><button class="btn" data-policy-prefix-add>${this.t("polPrefixAdd")}</button></div>`;
    return `${rows}${form}${entries.length ? "" : `<p class="factnote">${this.t("polPrefixNone")}</p>`}`;
  }

  // The daily limit of the state-changes rule and, while the load numbers are missing, why the rule shows nothing.
  polLimitEditor(rule) {
    const note = rule.pending ? `<p class="factnote">${this.t("polPending")}</p>` : "";
    return `<div class="row politem polform"><label for="polLimit">${this.t("polLimit")}</label><input id="polLimit" type="number" min="100" max="100000" step="100" value="${this.esc(String(this.policies?.limit ?? 5000))}"><button class="btn" data-policy-limit-save>${this.t("polLimitSave")}</button></div>${note}`;
  }

  setPolicyLimit(value) {
    const limit = Number.parseInt(value, 10);
    if (!Number.isFinite(limit)) return Promise.resolve();
    return this.changePolicy({ type: "ha_housekeeper/set_policy_limit", limit });
  }

  polItemRow(item, compact = false) {
    const pill = item.ignored ? `<span class="pill mute">${this.t(item.by === "label" ? "polByLabel" : "polHiddenLabel")}</span>` : "";
    const due = item.resurfaced ? `<span class="pill warn">${this.t("dueLabel")}</span>` : "";
    const button = item.by === "label" ? ""
      : item.ignored ? `<button class="btn" data-policy-ignore="${this.esc(item.key)}" data-policy-value="0">${this.t("polShow")}</button>`
      : `<button class="btn" data-decide-open="${this.esc(item.key)}">${this.t("polHide")}</button>`;
    const decision = item.ignored && item.by === "user" ? `<small>${this.esc(this.decisionLabel(item))}</small>` : "";
    const form = this.decide?.key === item.key ? this.decideForm(item) : "";
    const box = compact ? "" : this.polSelBox(item);
    const open = this.polIsOpen(item), main = this.polMainAction(item);
    const label = this.esc(this.t(open ? "polCloseRow" : "polOpenRow"));
    const chev = `<span class="tile mute"><button type="button" class="chevbtn" data-pol-open="${this.esc(item.key)}" aria-expanded="${open}" aria-label="${label}" title="${label}"><ha-icon icon="mdi:chevron-${open ? "down" : "right"}"></ha-icon></button></span>`;
    // A row with a fix offers it as its button (it folds the row open); the other rows keep their hide button; an opened row has it next to "open object".
    const act = open ? "" : main ? `<button class="btn" data-pol-open="${this.esc(item.key)}">${this.t(main)}</button>` : button;
    const detail = open ? this.polDetail(item, button) : "";
    return `${box ? `<div class="rowwrap">${box}` : ""}<div class="row politem${open ? " open" : ""}" data-pol-row="${this.esc(item.key)}">${chev}<span class="row-text">${item.object_type === "recorder" || compact ? `<strong>${this.esc(item.name)}</strong>` : `<button class="linklike" data-object="${this.esc(`${item.object_type}:${item.object_id}`)}"><strong>${this.esc(item.name)}</strong></button>`}${this.rowId(item.object_id, item.rule ? this.t(`polRule_${item.rule}`) : "")}${this.polItemNote(item)}${decision}${detail}</span>${due}${pill}${act}</div>${box ? "</div>" : ""}${form}`;
  }

  // The violations of one object, on its overview: the same rows as in the policies view, so a fix can be made here.
  // Nothing at all when the object breaks no rule (or the rules are not loaded yet); hidden violations stay out.
  polObjectCard(item) {
    this.ensurePolicies();
    const items = (this.policies?.rules || []).filter(rule => rule.enabled)
      .flatMap(rule => rule.items.map(i => ({ ...i, rule: rule.id })))
      .filter(i => !i.ignored && i.object_type === item.object_type && i.object_id === item.object_id);
    if (!items.length) return "";
    const title = this.t(items.length === 1 ? "polObjTitleOne" : "polObjTitle", { n: this.formatNumber(items.length) });
    return `<section class="panel"><div class="panelhead"><div><h2>${title}</h2><p>${this.t("polObjHint")}</p></div><div class="actions"><button class="btn" data-view="policies">${this.t("polObjAll")}</button></div></div>${items.map(i => this.polItemRow(i, true)).join("")}</section>`;
  }

  // One rule on the "Rules" tab: what it checks, how many violations, and its switch.
  polRuleBlock(rule) {
    const state = !rule.enabled ? this.t("polOff") : rule.count === 1 ? this.t("polCountOne") : rule.count ? this.t("polCount", { n: this.formatNumber(rule.count) }) : this.t("polNone");
    const tone = !rule.enabled ? "mute" : rule.count ? "warn" : "ok";
    const toggle = `<input class="policyswitch" type="checkbox" role="switch" aria-label="${this.esc(this.t(`polRule_${rule.id}`))}" data-policy-toggle="${rule.id}" ${rule.enabled ? "checked" : ""}>`;
    const head = `<div class="row"><span class="tile ${tone}"><ha-icon icon="mdi:clipboard-check-outline"></ha-icon></span><span class="row-text"><strong>${this.t(`polRule_${rule.id}`)}</strong><small>${this.t(`polDesc_${rule.id}`)}</small></span><span class="pill ${tone}">${this.esc(state)}</span>${toggle}</div>`;
    const wait = rule.pending && rule.id !== "state_rate" ? `<p class="factnote">${this.t(rule.id === "recorder_retention" ? "polPendingDb" : "polPendingLoad")}</p>` : "";
    const extra = (rule.enabled && rule.id === "naming_scheme" ? this.polPrefixEditor() : rule.enabled && rule.id === "state_rate" ? this.polLimitEditor(rule) : "") + wait;
    return head + extra;
  }

  // The violations of all switched-on rules in one list: filter by rule, search, open the entity.
  polViolations(r) {
    const on = r.rules.filter(rule => rule.enabled);
    if (!on.length) return `<div class="panel"><div class="emptymsg"><ha-icon icon="mdi:toggle-switch-off-outline"></ha-icon>${this.t("polNoneOn")}</div></div>`;
    const wanted = on.some(rule => rule.id === this.polRule) ? this.polRule : "";
    const chip = (id, label, count) => `<button class="chip ${wanted === id ? "active" : ""}" data-pol-rule="${this.esc(id)}" aria-pressed="${wanted === id}">${this.esc(label)} <em>${this.formatNumber(count)}</em></button>`;
    const chips = `<div class="chips">${chip("", this.t("polAllRules"), on.reduce((n, rule) => n + rule.count, 0))}${on.map(rule => chip(rule.id, this.t(`polRule_${rule.id}`), rule.count)).join("")}</div>`;
    const items = on.filter(rule => !wanted || rule.id === wanted).flatMap(rule => rule.items.map(item => ({ ...item, rule: rule.id })))
      .filter(item => this.policyShowHidden || !item.ignored);
    const found = this.searchList("policies", items, item => [item.name, item.object_id, ...(item.also || [])].join(" "));
    const pg = this.paginate("polviol", found.rows);
    this._polPage = pg.rows.filter(i => !i.ignored && ["entity", "device"].includes(i.object_type)).map(i => i.key);
    const rows = pg.rows.map(item => this.polItemRow(item)).join("");
    const hidden = on.reduce((n, rule) => n + (rule.ignored || 0), 0);
    const note = hidden && !this.policyShowHidden ? `<p class="factnote">${this.t("polHiddenN", { n: this.formatNumber(hidden) })}</p>` : "";
    const empty = !found.rows.length && !found.none ? `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t("polNoViolations")}</div>` : "";
    return `<div class="panel">${chips}${found.bar}${this.polSelBar()}${found.none}${empty}${rows}${pg.footer}${note}</div>`;
  }

  policiesView() {
    this.ensurePolicies();
    const r = this.policies;
    const anyHidden = r?.rules?.some(rule => rule.ignored);
    const left = anyHidden ? `<button class="chip ${this.policyShowHidden ? "active" : ""}" data-policy-hidden aria-pressed="${Boolean(this.policyShowHidden)}">${this.t(this.policyShowHidden ? "polHideHidden" : "polShowHidden")}</button>` : "";
    const head = this.pageBar({ left, at: this.policiesAt, loading: this.policiesLoading, attr: "data-policy-refresh" });
    if (this.policiesError) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(this.policiesError)}</div></div></div>`;
    if (!r) return `<div class="stack">${head}<div class="panel">${this.skeleton("polLoading")}</div></div>`;
    const on = r.rules.filter(rule => rule.enabled);
    const violations = on.reduce((n, rule) => n + rule.count, 0);
    const hidden = on.reduce((n, rule) => n + (rule.ignored || 0), 0);
    const tabs = [
      { id: "rules", icon: "mdi:clipboard-list-outline", label: this.t("polTabRules"), hint: this.t("polTileRulesHint", { on: this.formatNumber(on.length) }), count: r.rules.length, tone: on.length ? "ok" : "mute" },
      { id: "violations", icon: "mdi:clipboard-alert-outline", label: this.t("polTabViolations"), hint: this.t("polTileViolationsHint"), count: violations, tone: !on.length ? "mute" : violations ? "warn" : "ok", pill: hidden ? this.t("polTileHidden", { n: this.formatNumber(hidden) }) : "", pillTone: "mute" },
    ];
    const open = this.viewTabOf("policies", tabs, violations ? "violations" : "rules");
    const body = open === "rules"
      ? `<div class="panel">${r.rules.map(rule => this.polRuleBlock(rule)).join("")}${on.length ? "" : `<p class="factnote">${this.t("polNoneOn")}</p>`}${this.howCounted("polFootnote")}</div>`
      : this.polViolations(r);
    return `<div class="stack">${head}${this.navTiles("policies", tabs, open, this.t("policies"), true)}${body}</div>`;
  }
}
