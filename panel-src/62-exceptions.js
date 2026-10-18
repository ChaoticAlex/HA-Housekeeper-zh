// Exception rules: objects in an area or with a label are left out of the findings; mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  excTitle: "Ausnahmeregeln", excHint: "Housekeeper meldet Objekte nicht, auf die eine Regel passt: nach Bereich, Label, Integration, Typ (Domain), Gerät oder Entität. Die Regeln gelten nur in Housekeeper; Home Assistant bleibt unverändert. Das Label housekeeper_ignore wirkt zusätzlich fest.",
  excNone: "Noch keine Regeln.", excFormNew: "Neue Regel", excFormEdit: "Regel ändern", excAdd: "Regel hinzufügen", excEdit: "Ändern", excDelete: "Löschen", excLoading: "Regeln werden geladen …",
  excKind: "Art", excKind_area: "Bereich", excKind_label: "Label", excKind_integration: "Integration", excKind_domain: "Domain (Typ)", excTargets: "Auswahl", excNoTargets: "In Home Assistant gibt es dafür noch nichts zur Auswahl.",
  excAction: "Aktion", excAction_hide: "Ausblenden", excAction_delay: "Erst melden nach", excDays: "Tage nicht verfügbar", excNote: "Notiz (optional)",
  excInherit: "Trifft Geräte und Entitäten. Eine Entität ohne eigenen Bereich erbt den Bereich ihres Geräts, ein Label am Gerät gilt auch für seine Entitäten. „Integration“ und „Domain“ treffen alle Entitäten dieser Integration oder dieses Typs (etwa media_player); eine breite Domain wie sensor deckt auch echte Störungen zu, die Vorschau zeigt die Treffer vorher.",
  excDelayHint: "Hält nur „nicht verfügbar“, „unbekannt“ und „veraltet“ zurück. Alle anderen Befunde dieser Objekte (leere Batterie, defekter Verweis) erscheinen weiter normal; wer alles unterdrücken will, wählt „Ausblenden“. Nach Ablauf der Frist erscheint der Befund mit der Stufe seiner Ausfalldauer. Gemessen ab dem Ausfallbeginn, soweit bekannt; nach einem Neustart kann die Meldung später kommen, nie früher.",
  excWinner: "Passen mehrere Regeln, schlägt „Ausblenden“ die Fristen; bei mehreren Fristen gilt die längste.",
  excRuleArea: "Bereich {names}", excRuleLabel: "Label {names}", excRuleIntegration: "Integration {names}", excRuleDomain: "Domain {names}", excRuleDelayLine: "Erst melden nach {n} Tagen", excRuleHideLine: "Ausblenden",
  excEffectHide: "{objects} Objekte, {n} Befunde ausgeblendet", excEffectDelay: "{hold} Befunde zurückgehalten, {due} fällig", excEffectNone: "Trifft gerade nichts",
  excPreview: "Vorschau", excPreviewHide: "{objects} Objekte, {n} Befunde würden ausgeblendet", excPreviewDelay: "{hold} Befunde würden zurückgehalten, {due} wären sofort fällig (schon länger ausgefallen)",
  excImportant: "Dabei sind Befunde mit hoher Wirkung: {names}. Prüfe, ob sie wirklich ausgenommen sein sollen.",
  excSave: "Regel speichern", excCancel: "Abbrechen", excNeedTarget: "Wähle mindestens einen Eintrag.", excFailed: "Nicht gespeichert: {reason}",
  excOn: "Regel aktiv", excDue: "Frist abgelaufen",
  hidByRule: "Durch eine Regel", ignoredByRule: "Ausgeblendet durch eine Ausnahmeregel: {rule}", heldByRule: "Zurückgehalten durch eine Ausnahmeregel: {rule}, wird ab {date} gemeldet", dueByRule: "Frist abgelaufen · Ausnahmeregel: {rule}",
  hidRuleLink: "Regel",
  excKind_device: "Gerät", excKind_entity: "Entität", excRuleDevice: "Gerät {names}", excRuleEntity: "Entität {names}", excSearch: "Suchen …", excMore: "Weitere über die Suche",
  excScope: "Gilt", excScope_always: "Immer", excScope_vacation: "Nur im Urlaubsmodus", excScopeChip_vacation: "nur im Urlaub", excScopeChip_always: "immer",
  excScopeHint: "Im Urlaubsmodus werden diese Objekte nicht gemeldet. Ein Gerät, das im Urlaub kaputtgeht, bleibt dann ebenfalls still; nach dem Urlaub zählt die Ausfalldauer neu.",
  excOverlap: "Diese Objekte trifft schon: {rules}. Im Urlaub gilt das Ausblenden, danach wieder die Frist der anderen Regel, gezählt ab dem Ende des Urlaubs.",
  vacTitle: "Urlaubsmodus", vacHint: "Solange die gewählte Entität „an“ ist, gelten die Regeln „nur im Urlaubsmodus“. Ist sie nicht verfügbar oder unbekannt, gilt der Modus als aus. Schalten kannst du sie in Home Assistant, zum Beispiel per Kalender oder Automation.",
  vacEntity: "Entität für den Urlaubsmodus", vacEntityHint: "Jede Entität, die „an“ sein kann: Helfer, Schalter, Binärsensor, Zeitplan, Kalender. Leer lassen schaltet den Urlaubsmodus aus.",
  vacGrace: "Nachfrist nach dem Urlaub", vacGraceUnit: "Stunden", vacGraceHint: "Standard 24 Stunden. Wie lange Befunde nach dem Ende zurückgehalten werden, wenn für das Objekt keine eigene Frist gilt.",
  vacSave: "Speichern", vacStateOn: "Aktuell: an", vacStateOff: "Aktuell: aus", vacStateMissing: "Aktuell: nicht verfügbar", vacEnded: "Zuletzt beendet am {date}.", vacFailed: "Nicht gespeichert: {reason}",
  vacBarOn: "Urlaubsmodus aktiv", vacBarHeld: "{n} Befunde zurückgehalten", vacBarHeld1: "1 Befund zurückgehalten",
  vacBarAfter: "Urlaub beendet", vacBarAfterLine: "Frist bis {date} · {n} Befunde noch zurückgehalten", vacBarAfterLine1: "Frist bis {date} · 1 Befund noch zurückgehalten",
  vacBarMissing: "Urlaubsmodus-Entität nicht verfügbar", vacBarMissingLine: "{entity} meldet keinen Zustand. Der Modus gilt als aus.", vacBarShow: "Zurückgehaltene anzeigen", vacBarRules: "Regeln", vacBarSettings: "Einstellung",
  vacRuleAfter: "Urlaub beendet, zurückgehalten bis {date}", vacRuleActive: "Urlaubsmodus aktiv",
});
Object.assign(TEXT.en, {
  excTitle: "Exception rules", excHint: "Housekeeper does not report objects that a rule matches: by area, label, integration, type (domain), device or entity. The rules apply only in Housekeeper; Home Assistant stays unchanged. The label housekeeper_ignore keeps working on top.",
  excNone: "No rules yet.", excFormNew: "New rule", excFormEdit: "Change rule", excAdd: "Add rule", excEdit: "Change", excDelete: "Delete", excLoading: "Loading rules …",
  excKind: "Kind", excKind_area: "Area", excKind_label: "Label", excKind_integration: "Integration", excKind_domain: "Domain (type)", excTargets: "Selection", excNoTargets: "Home Assistant has nothing to choose from yet.",
  excAction: "Action", excAction_hide: "Hide", excAction_delay: "Report only after", excDays: "days not available", excNote: "Note (optional)",
  excInherit: "Covers devices and entities. An entity without an area of its own takes the area of its device, and a label on the device counts for its entities. “Integration” and “Domain” cover all entities of that integration or type (such as media_player); a broad domain like sensor also covers real faults, the preview shows the matches first.",
  excDelayHint: "Holds back only “not available”, “unknown” and “stale”. All other findings of these objects (empty battery, broken reference) still show as usual; to suppress everything choose “Hide”. When the time has passed the finding shows with the level of its outage. Counted from the start of the outage as far as known; after a restart the report can come later, never earlier.",
  excWinner: "Where several rules match, “Hide” beats the delays; of several delays the longest counts.",
  excRuleArea: "Area {names}", excRuleLabel: "Label {names}", excRuleIntegration: "Integration {names}", excRuleDomain: "Domain {names}", excRuleDelayLine: "Report only after {n} days", excRuleHideLine: "Hide",
  excEffectHide: "{objects} objects, {n} findings hidden", excEffectDelay: "{hold} findings held back, {due} due", excEffectNone: "Matches nothing right now",
  excPreview: "Preview", excPreviewHide: "{objects} objects, {n} findings would be hidden", excPreviewDelay: "{hold} findings would be held back, {due} would be due at once (down for longer already)",
  excImportant: "Findings with a high impact are among them: {names}. Check that they should really be left out.",
  excSave: "Save rule", excCancel: "Cancel", excNeedTarget: "Choose at least one entry.", excFailed: "Not saved: {reason}",
  excOn: "Rule active", excDue: "Time has passed",
  hidByRule: "By a rule", ignoredByRule: "Hidden by an exception rule: {rule}", heldByRule: "Held back by an exception rule: {rule}, reported from {date}", dueByRule: "Time has passed · exception rule: {rule}",
  hidRuleLink: "Rule",
  excKind_device: "Device", excKind_entity: "Entity", excRuleDevice: "Device {names}", excRuleEntity: "Entity {names}", excSearch: "Search …", excMore: "More through the search",
  excScope: "Applies", excScope_always: "Always", excScope_vacation: "Only in vacation mode", excScopeChip_vacation: "vacation only", excScopeChip_always: "always",
  excScopeHint: "In vacation mode these objects are not reported. A device that breaks during the vacation stays quiet too; after the vacation the outage counts anew.",
  excOverlap: "These objects are already hit by: {rules}. In the vacation hiding applies, afterwards the delay of the other rule, counted from the end of the vacation.",
  vacTitle: "Vacation mode", vacHint: "While the chosen entity is “on” the rules “only in vacation mode” apply. If it is unavailable or unknown the mode counts as off. You can switch it in Home Assistant, for example by calendar or automation.",
  vacEntity: "Entity for vacation mode", vacEntityHint: "Any entity that can be “on”: helper, switch, binary sensor, schedule, calendar. Leave empty to turn vacation mode off.",
  vacGrace: "Grace period after the vacation", vacGraceUnit: "hours", vacGraceHint: "Default 24 hours. How long findings are held back after the end when the object has no delay of its own.",
  vacSave: "Save", vacStateOn: "Now: on", vacStateOff: "Now: off", vacStateMissing: "Now: unavailable", vacEnded: "Last ended on {date}.", vacFailed: "Not saved: {reason}",
  vacBarOn: "Vacation mode on", vacBarHeld: "{n} findings held back", vacBarHeld1: "1 finding held back",
  vacBarAfter: "Vacation over", vacBarAfterLine: "Delay until {date} · {n} findings still held back", vacBarAfterLine1: "Delay until {date} · 1 finding still held back",
  vacBarMissing: "Vacation mode entity unavailable", vacBarMissingLine: "{entity} reports no state. The mode counts as off.", vacBarShow: "Show held back", vacBarRules: "Rules", vacBarSettings: "Settings",
  vacRuleAfter: "Vacation over, held back until {date}", vacRuleActive: "Vacation mode on",
});

class ExceptionsMixin {
  // "Area Lager" or "Label ignore_status, other": what a rule names, in the words of Home Assistant.
  excRuleName(rule) {
    const list = this.data?.objects || [], lookup = ["area", "label", "device", "entity"].includes(rule.kind);
    const names = rule.targets.map(id => (lookup ? list.find(x => x.object_type === rule.kind && x.object_id === id)?.name : "") || id).join(", ");
    return this.t({ area: "excRuleArea", label: "excRuleLabel", integration: "excRuleIntegration", domain: "excRuleDomain", device: "excRuleDevice", entity: "excRuleEntity" }[rule.kind], { names });
  }

  // What a rule did to a finding: hidden, held back until a date, or its time has passed; "" for a finding no rule touched.
  findingRuleLine(f) {
    const info = f.ignore_rule;
    if (!info) return "";
    if (info.phase === "after" && !f.rule_due) return this.t("vacRuleAfter", { date: this.formatDate(info.until) });
    if (info.phase === "vacation" && f.ignored_by === "rule") return this.t("vacRuleActive");
    const rule = this.excRuleName(info);
    if (f.rule_due) return this.t("dueByRule", { rule });
    return f.ignored_by === "rule" ? this.t(info.action === "delay" ? "heldByRule" : "ignoredByRule", { rule, date: info.until ? this.formatDate(info.until) : "" }) : "";
  }

  excRuleLine(rule) {
    return rule.action === "delay" ? this.t("excRuleDelayLine", { n: rule.days }) : this.t("excRuleHideLine");
  }

  async loadExceptions() {
    if (this._excLoading) return;
    this._excLoading = true;
    try { this.exc = await this._hass.callWS({ type: "ha_housekeeper/exceptions" }); } catch (err) { this.failed(err); this.exc = this.exc || { rules: [], areas: [], labels: [] }; }
    this._excLoading = false;
    this.render();
  }

  excEffect(rule) {
    const e = rule.effect || {};
    if (rule.action === "delay") return e.hold || e.due ? this.t("excEffectDelay", { hold: e.hold, due: e.due }) : this.t("excEffectNone");
    return e.hide ? this.t("excEffectHide", { objects: e.objects, n: e.hide }) : this.t("excEffectNone");
  }

  excCard() {
    const head = `<div class="panelhead"><div><h2>${this.t("excTitle")}</h2><p>${this.t("excHint")}</p></div></div>`;
    if (!this.exc) { this.loadExceptions(); return `<section class="panel">${head}<div class="pad"><p class="factnote">${this.t("excLoading")}</p></div></section>`; }
    const rows = this.exc.rules.map(rule => `<div class="row"><span class="tile ${rule.enabled ? (rule.effect?.due ? "warn" : "ok") : "mute"}"><ha-icon icon="${{ area: "mdi:floor-plan", label: "mdi:label-outline", integration: "mdi:puzzle-outline", domain: "mdi:shape-outline", device: "mdi:devices", entity: "mdi:shape-outline" }[rule.kind]}"></ha-icon></span>
        <span class="row-text"><strong>${this.esc(this.excRuleName(rule))}</strong><small>${this.esc(this.excRuleLine(rule))} · <b>${this.t(`excScopeChip_${rule.scope || "always"}`)}</b> · ${this.esc(this.excEffect(rule))}${rule.note ? ` · ${this.esc(rule.note)}` : ""}</small></span>
        <label class="inline"><input type="checkbox" data-exc-toggle="${this.esc(rule.id)}" ${rule.enabled ? "checked" : ""} aria-label="${this.esc(this.t("excOn"))}"></label>
        <button class="btn quiet" data-exc-edit="${this.esc(rule.id)}">${this.t("excEdit")}</button><button class="btn quiet" data-exc-delete="${this.esc(rule.id)}">${this.t("excDelete")}</button></div>`).join("");
    const vac = this.vacationHtml();
    const form = this.excForm ? this.excFormHtml(this.excForm) : `<div class="pad"><button class="btn" data-exc-edit=""><ha-icon icon="mdi:plus"></ha-icon>${this.t("excAdd")}</button></div>`;
    return `<section class="panel">${vac}</section><section class="panel">${head}${rows || `<div class="pad"><p class="factnote">${this.t("excNone")}</p></div>`}${form}</section>`;
  }

  vacationHtml() {
    const v = this.exc.vacation || {}, form = this.vacForm || (this.vacForm = { entity: v.entity || "", grace: v.grace_hours ?? 24, error: "" });
    const ids = Object.keys(this._hass?.states || {}).filter(id => /^(input_boolean|binary_sensor|switch|schedule|calendar)\./.test(id)).sort();
    const state = v.state === "on" ? "vacStateOn" : v.state && v.state !== "unavailable" && v.state !== "unknown" ? "vacStateOff" : "vacStateMissing";
    return `<div class="panelhead"><div><h2>${this.t("vacTitle")}</h2><p>${this.t("vacHint")}</p></div></div>
      <form class="pad markform" data-vac-form><div class="mrow"><label class="mfield grow"><span>${this.t("vacEntity")}</span><input list="hk-vac-ids" data-vac-entity autocomplete="off" value="${this.esc(form.entity)}"><datalist id="hk-vac-ids">${ids.map(id => `<option value="${this.esc(id)}">`).join("")}</datalist></label>
        <label class="mfield"><span>${this.t("vacGrace")}</span><span><input type="number" min="0" max="${v.grace_max || 720}" data-vac-grace value="${this.esc(form.grace)}" style="width:5em"> ${this.t("vacGraceUnit")}</span></label></div>
        <small class="factnote">${this.t("vacEntityHint")} ${this.t("vacGraceHint")}</small>
        ${v.entity ? `<small class="factnote" role="status">${this.t(state)}${v.ended_at ? ` · ${this.t("vacEnded", { date: this.formatDate(v.ended_at) })}` : ""}</small>` : ""}
        ${form.error ? `<small class="error" role="alert">${this.esc(form.error)}</small>` : ""}
        <div class="mbtns"><button type="submit" class="btn primary">${this.t("vacSave")}</button></div></form>`;
  }

  async saveVacation() {
    const form = this.vacForm;
    try {
      await this._hass.callWS({ type: "ha_housekeeper/vacation_set", entity: form.entity.trim() || null, grace_hours: Math.max(0, Number(form.grace) || 0) });
      this.vacForm = null;
      this.exc = await this._hass.callWS({ type: "ha_housekeeper/exceptions" });
      await this.refreshData();
    } catch (err) { form.error = this.t("vacFailed", { reason: this.errText(err) }); }
    this.render();
  }

  // The bar under the top bar: on every page while the vacation mode holds something back.
  vacationBar() {
    const v = this.data?.meta?.vacation;
    if (!v) return "";
    const date = value => this.formatDate(value), n = v.held;
    const go = `<a href="#" data-vac-go="hidden">${this.t("vacBarShow")}</a><a href="#" data-vac-go="rules">${this.t("vacBarRules")}</a>`;
    if (v.missing) return `<div class="vacbar warn" role="status"><b>${this.t("vacBarMissing")}</b><span>${this.esc(this.t("vacBarMissingLine", { entity: v.entity }))}</span><span class="sp"></span><a href="#" data-vac-go="rules">${this.t("vacBarSettings")}</a></div>`;
    if (v.active) return `<div class="vacbar" role="status"><b>${this.t("vacBarOn")}</b><span>${n === 1 ? this.t("vacBarHeld1") : this.t("vacBarHeld", { n })} · ${this.esc(v.entity)}</span><span class="sp"></span>${go}</div>`;
    if (v.after_until && n) return `<div class="vacbar after" role="status"><b>${this.t("vacBarAfter")}</b><span>${n === 1 ? this.t("vacBarAfterLine1", { date: date(v.after_until) }) : this.t("vacBarAfterLine", { date: date(v.after_until), n })}</span><span class="sp"></span>${go}</div>`;
    return "";
  }

  excFormHtml(f) {
    const all = { area: this.exc.areas, label: this.exc.labels, integration: this.exc.integrations, domain: this.exc.domains, device: this.exc.devices, entity: this.exc.entities }[f.kind] || [];
    const needle = (f.search || "").trim().toLowerCase();
    const picked = all.filter(x => f.targets.includes(x.id));
    const shown = needle ? all.filter(x => `${x.name} ${x.id}`.toLowerCase().includes(needle)) : all;
    const list = [...picked, ...shown.filter(x => !f.targets.includes(x.id))].slice(0, Math.max(100, picked.length));
    const more = shown.length + picked.length > list.length ? `<small class="factnote">${this.t("excMore")}</small>` : "";
    const search = all.length > 12 ? `<input data-exc-search placeholder="${this.esc(this.t("excSearch"))}" autocomplete="off" value="${this.esc(f.search || "")}">` : "";
    const boxes = list.map(x => `<label class="excopt${f.targets.includes(x.id) ? " on" : ""}"><input type="checkbox" data-exc-target="${this.esc(x.id)}" ${f.targets.includes(x.id) ? "checked" : ""}><span>${this.esc(x.name)}</span></label>`).join("") || `<small class="factnote">${this.t("excNoTargets")}</small>`;
    const kinds = ["area", "label", "integration", "domain", "device", "entity"].map(k => `<option value="${k}" ${f.kind === k ? "selected" : ""}>${this.t(`excKind_${k}`)}</option>`).join("");
    const pv = f.preview;
    const preview = pv ? `<div class="factnote" role="status"><strong>${this.t("excPreview")}:</strong> ${f.action === "delay" ? this.t("excPreviewDelay", { hold: pv.hold, due: pv.due }) : this.t("excPreviewHide", { objects: pv.objects, n: pv.hide })}
        ${pv.important?.length ? `<br><span class="error">${this.t("excImportant", { names: this.esc(pv.important.map(x => x.name).join(", ")) })}</span>` : ""}</div>` : "";
    return `<form class="pad markform" data-exc-form>
      <strong>${this.t(f.id ? "excFormEdit" : "excFormNew")}</strong>
      <div class="mrow"><label class="mfield"><span>${this.t("excKind")}</span><select data-exc-kind>${kinds}</select></label>
        <label class="mfield grow"><span>${this.t("excNote")}</span><input data-exc-note maxlength="200" autocomplete="off" value="${this.esc(f.note)}"></label></div>
      <div class="mfield"><span>${this.t("excTargets")}</span>${search}<div class="exclist">${boxes}</div>${more}</div>
      <small class="factnote">${this.t("excInherit")}</small>
      <div class="mrow"><label class="mfield"><span>${this.t("excScope")}</span><select data-exc-scope><option value="always" ${f.scope === "always" ? "selected" : ""}>${this.t("excScope_always")}</option><option value="vacation" ${f.scope === "vacation" ? "selected" : ""}>${this.t("excScope_vacation")}</option></select></label></div>
      ${f.scope === "vacation" ? `<small class="factnote">${this.t("excScopeHint")}</small>` : ""}
      <div class="mrow"><label class="mfield"><span>${this.t("excAction")}</span><select data-exc-action><option value="hide" ${f.action === "hide" ? "selected" : ""}>${this.t("excAction_hide")}</option><option value="delay" ${f.action === "delay" ? "selected" : ""}>${this.t("excAction_delay")}</option></select></label>
        ${f.action === "delay" ? `<label class="mfield"><span>${this.t("excDays")}</span><input type="number" min="1" max="${this.exc.days_max || 365}" data-exc-days value="${this.esc(f.days)}"></label>` : ""}</div>
      ${f.action === "delay" ? `<small class="factnote">${this.t("excDelayHint")}</small>` : ""}<small class="factnote">${this.t("excWinner")}</small>
      ${preview}${pv?.overlap?.length ? `<small class="factnote">${this.esc(this.t("excOverlap", { rules: pv.overlap.map(id => { const r = this.exc.rules.find(x => x.id === id); return r ? this.excRuleName(r) : id; }).join(", ") }))}</small>` : ""}${f.error ? `<small class="error" role="alert">${this.esc(f.error)}</small>` : ""}
      <div class="mbtns"><button type="button" class="btn quiet" data-exc-cancel>${this.t("excCancel")}</button><button type="submit" class="btn primary">${this.t("excSave")}</button></div></form>`;
  }

  excDraft(f) {
    return { ...(f.id ? { id: f.id } : {}), kind: f.kind, targets: f.targets, action: f.action, scope: f.scope || "always", ...(f.action === "delay" ? { days: Math.max(1, Number(f.days) || 7) } : {}), enabled: f.enabled !== false, note: f.note.trim() };
  }

  openException(id) {
    const rule = this.exc.rules.find(r => r.id === id);
    this.excForm = rule ? { id, kind: rule.kind, targets: [...rule.targets], action: rule.action, scope: rule.scope || "always", search: "", days: rule.days || 7, enabled: rule.enabled, note: rule.note || "", error: "", preview: null }
      : { id: "", kind: "area", targets: [], action: "hide", scope: "always", search: "", days: 7, enabled: true, note: "", error: "", preview: null };
    this.render();
    this.excPreview();
  }

  async excPreview() {
    const f = this.excForm;
    if (!f || !f.targets.length) { if (f) { f.preview = null; this.render(); } return; }
    const seq = (this._excSeq = (this._excSeq || 0) + 1);
    try {
      const preview = await this._hass.callWS({ type: "ha_housekeeper/exceptions_preview", rule: this.excDraft(f) });
      if (seq !== this._excSeq || this.excForm !== f) return;
      f.preview = preview;
    } catch (_) { f.preview = null; }
    this.render();
  }

  async saveExceptions(rules, form) {
    try {
      await this._hass.callWS({ type: "ha_housekeeper/exceptions_set", rules });
      this.excForm = null;
      this.exc = await this._hass.callWS({ type: "ha_housekeeper/exceptions" });
      await this.refreshData();
    } catch (err) { if (form) form.error = this.t("excFailed", { reason: this.errText(err) }); else this.failed(err); }
    this.render();
  }

  commitException() {
    const f = this.excForm;
    if (!f) return;
    if (!f.targets.length) { f.error = this.t("excNeedTarget"); this.render(); return; }
    const draft = this.excDraft(f), rules = this.exc.rules.map(({ effect, ...rule }) => rule);
    const at = rules.findIndex(r => r.id === f.id);
    if (at >= 0) rules[at] = draft; else rules.push(draft);
    this.saveExceptions(rules, f);
  }

  bindExceptions(root) {
    const rules = () => this.exc.rules.map(({ effect, ...rule }) => rule);
    root.querySelectorAll("[data-exc-edit]").forEach(el => el.onclick = () => this.openException(el.dataset.excEdit));
    root.querySelectorAll("[data-exc-delete]").forEach(el => el.onclick = () => this.saveExceptions(rules().filter(r => r.id !== el.dataset.excDelete), null));
    root.querySelectorAll("[data-exc-toggle]").forEach(el => el.onchange = () => this.saveExceptions(rules().map(r => (r.id === el.dataset.excToggle ? { ...r, enabled: el.checked } : r)), null));
    root.querySelectorAll("[data-vac-form]").forEach(form => {
      const v = this.vacForm;
      form.onsubmit = ev => { ev.preventDefault(); this.saveVacation(); };
      form.querySelector("[data-vac-entity]").oninput = ev => { v.entity = ev.target.value; };
      form.querySelector("[data-vac-grace]").oninput = ev => { v.grace = ev.target.value; };
    });
    root.querySelectorAll("[data-vac-go]").forEach(el => el.onclick = ev => {
      ev.preventDefault();
      this.selected = null; this.view = "settings"; this.settingsTab = "protection"; this.pages = {};
      if (el.dataset.vacGo === "hidden") { this.lvState("hidden", "name", "asc"); this.lv.hidden.f.by = "rule"; }
      this.render();
    });
    root.querySelectorAll("[data-exc-cancel]").forEach(el => el.onclick = () => { this.excForm = null; this.render(); });
    root.querySelectorAll("[data-exc-form]").forEach(form => {
      const f = this.excForm;
      form.onsubmit = ev => { ev.preventDefault(); this.commitException(); };
      form.querySelector("[data-exc-kind]").onchange = ev => { f.kind = ev.target.value; f.targets = []; f.preview = null; this.render(); };
      form.querySelector("[data-exc-scope]").onchange = ev => { f.scope = ev.target.value; this.render(); this.excPreview(); };
      const search = form.querySelector("[data-exc-search]");
      if (search) search.oninput = ev => { f.search = ev.target.value; this.render(); this.shadowRoot.querySelector("[data-exc-search]")?.focus(); };
      form.querySelector("[data-exc-note]").oninput = ev => { f.note = ev.target.value; };
      form.querySelector("[data-exc-action]").onchange = ev => { f.action = ev.target.value; this.render(); this.excPreview(); };
      const days = form.querySelector("[data-exc-days]");
      if (days) days.onchange = ev => { f.days = ev.target.value; this.excPreview(); };
      form.querySelectorAll("[data-exc-target]").forEach(el => el.onchange = () => {
        f.targets = [...form.querySelectorAll("[data-exc-target]")].filter(x => x.checked).map(x => x.dataset.excTarget);
        this.excPreview();
      });
      form.onkeydown = ev => { if (ev.key === "Escape") { ev.preventDefault(); this.excForm = null; this.render(); } };
    });
  }
}
