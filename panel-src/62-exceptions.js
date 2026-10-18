// Exception rules: objects in an area or with a label are left out of the findings; mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  excTitle: "Ausnahmeregeln", excHint: "Objekte in einem Bereich, mit einem Label, von einer Integration oder eines Typs (Domain) meldet Housekeeper nicht. Die Regeln gelten für Geräte und ihre Entitäten und nur in Housekeeper; Home Assistant bleibt unverändert. Das Label housekeeper_ignore wirkt zusätzlich fest.",
  excNone: "Noch keine Regeln.", excAdd: "Regel hinzufügen", excEdit: "Ändern", excDelete: "Löschen", excLoading: "Regeln werden geladen …",
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
});
Object.assign(TEXT.en, {
  excTitle: "Exception rules", excHint: "Housekeeper does not report objects in an area, with a label, from an integration or of a type (domain). The rules cover devices and their entities and apply only in Housekeeper; Home Assistant stays unchanged. The label housekeeper_ignore keeps working on top.",
  excNone: "No rules yet.", excAdd: "Add rule", excEdit: "Change", excDelete: "Delete", excLoading: "Loading rules …",
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
});

class ExceptionsMixin {
  // "Area Lager" or "Label ignore_status, other": what a rule names, in the words of Home Assistant.
  excRuleName(rule) {
    const list = this.data?.objects || [], lookup = rule.kind === "area" || rule.kind === "label";
    const names = rule.targets.map(id => (lookup ? list.find(x => x.object_type === rule.kind && x.object_id === id)?.name : "") || id).join(", ");
    return this.t({ area: "excRuleArea", label: "excRuleLabel", integration: "excRuleIntegration", domain: "excRuleDomain" }[rule.kind], { names });
  }

  // What a rule did to a finding: hidden, held back until a date, or its time has passed; "" for a finding no rule touched.
  findingRuleLine(f) {
    const info = f.ignore_rule;
    if (!info) return "";
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
    const rows = this.exc.rules.map(rule => `<div class="row"><span class="tile ${rule.enabled ? (rule.effect?.due ? "warn" : "ok") : "mute"}"><ha-icon icon="${{ area: "mdi:floor-plan", label: "mdi:label-outline", integration: "mdi:puzzle-outline", domain: "mdi:shape-outline" }[rule.kind]}"></ha-icon></span>
        <span class="row-text"><strong>${this.esc(this.excRuleName(rule))}</strong><small>${this.esc(this.excRuleLine(rule))} · ${this.esc(this.excEffect(rule))}${rule.note ? ` · ${this.esc(rule.note)}` : ""}</small></span>
        <label class="inline"><input type="checkbox" data-exc-toggle="${this.esc(rule.id)}" ${rule.enabled ? "checked" : ""} aria-label="${this.esc(this.t("excOn"))}"></label>
        <button class="btn quiet" data-exc-edit="${this.esc(rule.id)}">${this.t("excEdit")}</button><button class="btn quiet" data-exc-delete="${this.esc(rule.id)}">${this.t("excDelete")}</button></div>`).join("");
    const form = this.excForm ? this.excFormHtml(this.excForm) : `<div class="pad"><button class="btn" data-exc-edit=""><ha-icon icon="mdi:plus"></ha-icon>${this.t("excAdd")}</button></div>`;
    return `<section class="panel">${head}${rows || `<div class="pad"><p class="factnote">${this.t("excNone")}</p></div>`}${form}</section>`;
  }

  excFormHtml(f) {
    const list = { area: this.exc.areas, label: this.exc.labels, integration: this.exc.integrations, domain: this.exc.domains }[f.kind] || [];
    const boxes = list.map(x => `<label class="inline"><input type="checkbox" data-exc-target="${this.esc(x.id)}" ${f.targets.includes(x.id) ? "checked" : ""}> ${this.esc(x.name)}</label>`).join("") || `<small class="factnote">${this.t("excNoTargets")}</small>`;
    const kinds = ["area", "label", "integration", "domain"].map(k => `<option value="${k}" ${f.kind === k ? "selected" : ""}>${this.t(`excKind_${k}`)}</option>`).join("");
    const pv = f.preview;
    const preview = pv ? `<div class="factnote" role="status"><strong>${this.t("excPreview")}:</strong> ${f.action === "delay" ? this.t("excPreviewDelay", { hold: pv.hold, due: pv.due }) : this.t("excPreviewHide", { objects: pv.objects, n: pv.hide })}
        ${pv.important?.length ? `<br><span class="error">${this.t("excImportant", { names: this.esc(pv.important.map(x => x.name).join(", ")) })}</span>` : ""}</div>` : "";
    return `<form class="pad markform" data-exc-form>
      <div class="mrow"><label class="mfield"><span>${this.t("excKind")}</span><select data-exc-kind>${kinds}</select></label>
        <label class="mfield grow"><span>${this.t("excNote")}</span><input data-exc-note maxlength="200" autocomplete="off" value="${this.esc(f.note)}"></label></div>
      <div class="mfield"><span>${this.t("excTargets")}</span><div class="mrow" style="max-height:11em;overflow:auto">${boxes}</div></div>
      <small class="factnote">${this.t("excInherit")}</small>
      <div class="mrow"><label class="mfield"><span>${this.t("excAction")}</span><select data-exc-action><option value="hide" ${f.action === "hide" ? "selected" : ""}>${this.t("excAction_hide")}</option><option value="delay" ${f.action === "delay" ? "selected" : ""}>${this.t("excAction_delay")}</option></select></label>
        ${f.action === "delay" ? `<label class="mfield"><span>${this.t("excDays")}</span><input type="number" min="1" max="${this.exc.days_max || 365}" data-exc-days value="${this.esc(f.days)}"></label>` : ""}</div>
      ${f.action === "delay" ? `<small class="factnote">${this.t("excDelayHint")}</small>` : ""}<small class="factnote">${this.t("excWinner")}</small>
      ${preview}${f.error ? `<small class="error" role="alert">${this.esc(f.error)}</small>` : ""}
      <div class="mbtns"><button type="button" class="btn quiet" data-exc-cancel>${this.t("excCancel")}</button><button type="submit" class="btn primary">${this.t("excSave")}</button></div></form>`;
  }

  excDraft(f) {
    return { ...(f.id ? { id: f.id } : {}), kind: f.kind, targets: f.targets, action: f.action, ...(f.action === "delay" ? { days: Math.max(1, Number(f.days) || 7) } : {}), enabled: f.enabled !== false, note: f.note.trim() };
  }

  openException(id) {
    const rule = this.exc.rules.find(r => r.id === id);
    this.excForm = rule ? { id, kind: rule.kind, targets: [...rule.targets], action: rule.action, days: rule.days || 7, enabled: rule.enabled, note: rule.note || "", error: "", preview: null }
      : { id: "", kind: "area", targets: [], action: "hide", days: 7, enabled: true, note: "", error: "", preview: null };
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
    root.querySelectorAll("[data-exc-cancel]").forEach(el => el.onclick = () => { this.excForm = null; this.render(); });
    root.querySelectorAll("[data-exc-form]").forEach(form => {
      const f = this.excForm;
      form.onsubmit = ev => { ev.preventDefault(); this.commitException(); };
      form.querySelector("[data-exc-kind]").onchange = ev => { f.kind = ev.target.value; f.targets = []; f.preview = null; this.render(); };
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
