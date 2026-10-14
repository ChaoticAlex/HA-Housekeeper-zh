// Export of chosen entities as CSV, Markdown or JSON, as a wizard: pick, fields, format, preview.
// Only reads the inventory and `hass.states`; nothing leaves the browser. Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  exportCsvItem: "Liste als CSV", exportCsvHint: "Alle Zeilen der Suche, sofort", xpGuided: "Geführter Export …", xpGuidedHint: "Felder, Platzhalter, Vorschau; CSV, Markdown, JSON",
  xpButton: "Exportieren", xpTitle: "Exportieren", xpStepsLabel: "Schritte des Exports", xpCancel: "Abbrechen", xpBack: "Zurück", xpNext: "Weiter",
  xpStep0: "Auswahl", xpStep1: "Angaben", xpStep2: "Format", xpStep3: "Vorschau",
  xpSelTitle: "Was soll in den Export?", xpSelHint: "Wähle Entitäten aus dem Bestand. Schnellwahlen setzen mehrere Häkchen auf einmal.",
  xpQuickAll: "Alle Entitäten ({n})", xpQuickFiltered: "Aktuelles Filterergebnis ({n})", xpQuickShown: "Suchtreffer ({n})", xpQuickClear: "Leeren",
  xpPickArea: "Bereich …", xpPickDomain: "Domain …", xpPickPlatform: "Integration …", xpSearch: "In den Entitäten suchen …",
  xpBackTo: "Zurück zu {name}", xpSelected: "{n} ausgewählt", xpNeedOne: "Wähle mindestens eine Entität.", xpNone: "Keine Treffer.", xpNoEntities: "Dazu gibt es keine Entitäten zum Exportieren.",
  xpFieldsTitle: "Welche Angaben?", xpFieldsHint: "Pro Gruppe ein Häkchen. Eine Voreinstellung setzt sie für dich.",
  xpPresetMin: "Minimal", xpPresetDoc: "Dokumentation", xpPresetState: "Mit Zuständen", xpMyTemplates: "Meine Vorlagen", xpTplDelete: "Vorlage „{name}“ löschen",
  xpGBasis: "Basis", xpGBasisD: "Entity-ID, Name, Domain, Status", xpGZuord: "Zuordnung", xpGZuordD: "Bereich, Gerät, Integration, Geräteklasse, Einheit",
  xpGRel: "Wer verwendet was", xpGRelD: "Automationen, Skripte, Szenen und Dashboards, die die Entität nutzen", xpGState: "Aktueller Zustand", xpGStateD: "Aus, weil Werte privat sein können.",
  xpGAttr: "Attribute", xpGAttrD: "Nur die, die du anhakst. Namen, die nach Zugangsdaten oder Standort aussehen, werden nicht angeboten.", xpNoAttrs: "Die gewählten Entitäten haben keine anbietbaren Attribute.",
  xpFormatTitle: "Format und Datenschutz", xpFormatHint: "Alles passiert in diesem Browser. Es wird nichts hochgeladen.",
  xpFmtCsv: "CSV", xpFmtCsvD: "Tabelle, für Tabellenkalkulationen", xpFmtMd: "Markdown", xpFmtMdD: "lesbar, nach Bereich gruppiert", xpFmtJson: "JSON", xpFmtJsonD: "für Skripte und Werkzeuge",
  xpPh: "Namen und IDs durch Platzhalter ersetzen", xpPhD: "Für Exporte, die du weitergibst. Zustände und Attribute werden nicht ersetzt.", xpSort: "Nach Bereich und Name sortieren",
  xpSaveTpl: "Einstellungen als Vorlage speichern", xpTplName: "Name der Vorlage", xpTplSave: "Speichern", xpTplSaved: "Vorlage „{name}“ gespeichert (nur in diesem Browser).", xpTplFull: "Es sind höchstens 10 Vorlagen möglich.",
  xpPreviewTitle: "Vorschau", xpPreviewHint: "So sieht die Datei aus. Prüfe sie, bevor du sie weitergibst.", xpSummary: "{n} Entitäten, {c} Angaben", xpSize: "{n} Zeichen",
  xpTruncated: "Die Vorschau ist gekürzt; die Datei enthält alles.", xpSafe: "Nur die gewählten Angaben. Zugangsdaten und Attribute ohne Haken werden nie ausgegeben.",
  xpCopy: "Kopieren", xpCopied: "Kopiert", xpDownload: "Herunterladen",
});
Object.assign(TEXT.en, {
  exportCsvItem: "List as CSV", exportCsvHint: "All rows of the search, right away", xpGuided: "Guided export…", xpGuidedHint: "Fields, placeholders, preview; CSV, Markdown, JSON",
  xpButton: "Export", xpTitle: "Export", xpStepsLabel: "Steps of the export", xpCancel: "Cancel", xpBack: "Back", xpNext: "Next",
  xpStep0: "Selection", xpStep1: "Fields", xpStep2: "Format", xpStep3: "Preview",
  xpSelTitle: "What goes into the export?", xpSelHint: "Pick entities from the inventory. Quick picks tick several at once.",
  xpQuickAll: "All entities ({n})", xpQuickFiltered: "Current filter result ({n})", xpQuickShown: "Search hits ({n})", xpQuickClear: "Clear",
  xpPickArea: "Area …", xpPickDomain: "Domain …", xpPickPlatform: "Integration …", xpSearch: "Search the entities …",
  xpBackTo: "Back to {name}", xpSelected: "{n} selected", xpNeedOne: "Pick at least one entity.", xpNone: "No hits.", xpNoEntities: "There are no entities to export for this.",
  xpFieldsTitle: "Which fields?", xpFieldsHint: "One tick per group. A preset sets them for you.",
  xpPresetMin: "Minimal", xpPresetDoc: "Documentation", xpPresetState: "With states", xpMyTemplates: "My templates", xpTplDelete: "Delete template “{name}”",
  xpGBasis: "Basics", xpGBasisD: "Entity ID, name, domain, status", xpGZuord: "Placement", xpGZuordD: "Area, device, integration, device class, unit",
  xpGRel: "Who uses what", xpGRelD: "Automations, scripts, scenes and dashboards that use the entity", xpGState: "Current state", xpGStateD: "Off, because values can be private.",
  xpGAttr: "Attributes", xpGAttrD: "Only the ones you tick. Names that look like credentials or locations are not offered.", xpNoAttrs: "The chosen entities have no attributes that can be offered.",
  xpFormatTitle: "Format and privacy", xpFormatHint: "Everything happens in this browser. Nothing is uploaded.",
  xpFmtCsv: "CSV", xpFmtCsvD: "table, for spreadsheets", xpFmtMd: "Markdown", xpFmtMdD: "readable, grouped by area", xpFmtJson: "JSON", xpFmtJsonD: "for scripts and tools",
  xpPh: "Replace names and IDs with placeholders", xpPhD: "For exports you pass on. States and attributes are not replaced.", xpSort: "Sort by area and name",
  xpSaveTpl: "Save these settings as a template", xpTplName: "Template name", xpTplSave: "Save", xpTplSaved: "Template “{name}” saved (in this browser only).", xpTplFull: "At most 10 templates are possible.",
  xpPreviewTitle: "Preview", xpPreviewHint: "This is what the file looks like. Check it before you pass it on.", xpSummary: "{n} entities, {c} fields", xpSize: "{n} characters",
  xpTruncated: "The preview is shortened; the file holds everything.", xpSafe: "Only the chosen fields. Credentials and attributes without a tick are never written.",
  xpCopy: "Copy", xpCopied: "Copied", xpDownload: "Download",
});

const XP_PREVIEW_CHARS = 6000;
const XP_TEMPLATES_KEY = "ha_housekeeper.export_templates";
const XP_TEMPLATES_MAX = 10;
// Attribute names that are never offered: they tend to hold credentials, places or addresses.
const XP_SENSITIVE_ATTR = /token|password|passwd|secret|key|pin\b|code|credential|auth|latitude|longitude|gps|location|address|ssid|mac\b|ip\b|url|picture|email|phone/i;
const XP_PRESETS = {
  min: { zuord: false, rel: false, state: false, attr: false },
  doc: { zuord: true, rel: true, state: false, attr: false },
  state: { zuord: true, rel: true, state: true, attr: false },
};

class ExportMixin {
  xpFresh(ids = []) {
    return { open: true, step: 0, sel: new Set(ids), q: "", g: { ...XP_PRESETS.doc }, attrs: new Set(), fmt: "csv", ph: false, sort: true, tplName: "", msg: "", copied: false };
  }

  // Opens the wizard in the inventory view; `ids` are entities that are ticked from the start.
  // Started from a detail page, it remembers that page, so the wizard can return to it.
  xpOpen(ids = []) {
    this.xp = this.xpFresh(ids);
    if (this.selected) { this._tabOf.set(this.objectKey(this.selected), this.detailTab); this.xp.origin = { view: this.view, selected: this.selected, trail: this.trail, tab: this.detailTab, name: this.selected.name }; }
    this.view = "inventory"; this.selected = null; this.trail = [];
    this.render();
  }

  // Closes the wizard and goes back to the page it was started from, if there was one.
  xpClose() {
    const origin = this.xp?.origin;
    this.xp = null;
    if (origin) { this.view = origin.view; this.selected = origin.selected; this.trail = origin.trail; this.detailTab = origin.tab; }
    this.render();
  }

  // The entities that belong to an object of the detail page: itself, its entities, or what it uses.
  xpEntitiesOf(key) {
    const item = this.findObject(key);
    if (!item) return [];
    const entities = this.data.objects.filter(o => o.object_type === "entity");
    if (item.object_type === "entity") return [item.object_id];
    if (item.object_type === "device") return entities.filter(o => o.device_id === item.object_id).map(o => o.object_id);
    if (item.object_type === "area") return entities.filter(o => this.xpAreaId(o) === item.object_id).map(o => o.object_id);
    return [...new Set(this.data.edges.filter(e => e.source === key && e.target.startsWith("entity:") && USAGE_RELATIONS.includes(e.relation)).map(e => e.target.slice(7)))];
  }

  xpAreaId(item) {
    return item.area_id || (item.device_id ? this.findObject(`device:${item.device_id}`)?.area_id : "") || "";
  }

  xpEntities() { return this.data.objects.filter(o => o.object_type === "entity"); }

  xpTemplates() {
    try {
      const list = JSON.parse(globalThis.localStorage?.getItem(XP_TEMPLATES_KEY) || "[]");
      return Array.isArray(list) ? list.filter(t => t && typeof t.name === "string" && t.g && typeof t.g === "object").slice(0, XP_TEMPLATES_MAX) : [];
    } catch (_) { return []; }
  }

  xpSaveTemplates(list) {
    try { globalThis.localStorage?.setItem(XP_TEMPLATES_KEY, JSON.stringify(list)); } catch (_) { /* kept until the page closes */ }
  }

  xpApplyTemplate(t) {
    const x = this.xp;
    x.g = { zuord: Boolean(t.g.zuord), rel: Boolean(t.g.rel), state: Boolean(t.g.state), attr: Boolean(t.g.attr) };
    x.attrs = new Set(Array.isArray(t.attrs) ? t.attrs.filter(a => typeof a === "string").slice(0, 50) : []);
    x.fmt = ["csv", "md", "json"].includes(t.fmt) ? t.fmt : "csv"; x.ph = Boolean(t.ph); x.sort = t.sort !== false;
  }

  // Attribute names of the chosen entities, most common first, without the ones that look sensitive.
  xpOfferedAttrs() {
    const counts = {};
    for (const id of this.xp.sel) for (const k of Object.keys(this._hass?.states?.[id]?.attributes || {})) if (!XP_SENSITIVE_ATTR.test(k)) counts[k] = (counts[k] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30).map(([k]) => k);
  }

  xpValueText(value) {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  }

  // The rows of the export: one object per entity with plain keys; placeholders are applied here.
  xpRows() {
    const x = this.xp, g = x.g;
    let items = this.xpEntities().filter(o => x.sel.has(o.object_id)).map(o => ({ o, area: g.zuord || x.sort ? this.areaName(o) : "" }));
    const collator = new Intl.Collator(this.lang === "en" ? "en" : "de", { numeric: true });
    items.sort((a, b) => (x.sort ? collator.compare(a.area, b.area) : 0) || collator.compare(a.o.name || a.o.object_id, b.o.name || b.o.object_id) || collator.compare(a.o.object_id, b.o.object_id));
    const labels = { area: new Map(), device: new Map(), used: new Map() };
    const label = (kind, key, word) => { const m = labels[kind]; if (!m.has(key)) m.set(key, `${word} ${m.size + 1}`); return m.get(key); };
    const usedWord = { automation: "Automation", script: "Script", scene: "Scene", dashboard: "Dashboard" };
    const attrs = g.attr ? [...x.attrs] : [];
    return items.map(({ o, area }, i) => {
      const row = { entity_id: x.ph ? `entity_${i + 1}` : o.object_id, name: x.ph ? `Object ${i + 1}` : o.name, domain: o.object_id.split(".")[0], status: o.status };
      if (g.zuord) {
        const device = o.device_id ? this.findObject(`device:${o.device_id}`) : null;
        row.area = area ? (x.ph ? label("area", area, "Area") : area) : "";
        row.device = device ? (x.ph ? label("device", device.object_id, "Device") : device.name) : "";
        Object.assign(row, { integration: o.platform || "", device_class: o.device_class || "", unit: o.unit || "" });
      }
      if (g.rel) {
        const users = this.edgesTo(`entity:${o.object_id}`).filter(e => USAGE_RELATIONS.includes(e.relation)).map(e => e.source);
        row.used_by = [...new Set(users)].map(source => (x.ph ? label("used", source, usedWord[source.split(":")[0]] || "Object") : this.findObject(source)?.name || source.split(":").slice(1).join(":")));
      }
      const live = this._hass?.states?.[o.object_id];
      if (g.state) row.state = live ? live.state : "";
      if (attrs.length) row.attributes = Object.fromEntries(attrs.filter(k => live && k in live.attributes).map(k => [k, live.attributes[k]]));
      return row;
    });
  }

  xpColumns(rows) {
    const cols = ["entity_id", "name", "domain", "status"];
    const has = key => rows.some(r => key in r);
    for (const key of ["area", "device", "integration", "device_class", "unit", "used_by", "state"]) if (has(key)) cols.push(key);
    for (const k of this.xp.g.attr ? [...this.xp.attrs] : []) cols.push(`attr.${k}`);
    return cols;
  }

  xpCell(row, col) {
    if (col.startsWith("attr.")) { const v = row.attributes?.[col.slice(5)]; return v === undefined ? "" : this.xpValueText(v); }
    const v = row[col];
    return Array.isArray(v) ? v.join("; ") : v ?? "";
  }

  xpMdEscape(text) { return String(text ?? "").replace(/([\\`*_{}[\]<>#|])/g, "\\$1"); }

  xpBuild() {
    const rows = this.xpRows(), cols = this.xpColumns(rows), fmt = this.xp.fmt;
    let text, ext, mime;
    if (fmt === "json") {
      text = JSON.stringify(rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, k === "attributes" ? Object.fromEntries(Object.entries(v).map(([a, val]) => [a, typeof val === "string" && val.length > 200 ? `${val.slice(0, 200)}…` : val])) : v]))), null, 2);
      ext = "json"; mime = "application/json";
    } else if (fmt === "md") {
      const lines = []; let last = null;
      for (const r of rows) {
        if (this.xp.g.zuord && (r.area || "") !== last) { last = r.area || ""; lines.push(`${lines.length ? "\n" : ""}## ${this.xpMdEscape(last || "–")}`); }
        const parts = [`${r.domain}, ${r.status}`];
        if (r.device) parts.push(`${this.t("xpGZuord")}: ${this.xpMdEscape(r.device)}`);
        for (const key of ["integration", "device_class", "unit"]) if (r[key]) parts.push(`${key}: ${this.xpMdEscape(r[key])}`);
        if (r.used_by?.length) parts.push(`used by: ${r.used_by.map(n => this.xpMdEscape(n)).join(", ")}`);
        if ("state" in r) parts.push(`state: ${this.xpMdEscape(r.state)}`);
        for (const [k, v] of Object.entries(r.attributes || {})) parts.push(`${this.xpMdEscape(k)}: ${this.xpMdEscape(this.xpValueText(v))}`);
        lines.push(`- \`${r.entity_id}\` ${this.xpMdEscape(r.name)} (${parts.join(" · ")})`);
      }
      text = `${lines.join("\n")}\n`; ext = "md"; mime = "text/markdown";
    } else {
      text = "﻿" + [cols, ...rows.map(r => cols.map(c => this.xpCell(r, c)))].map(r => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
      ext = "csv"; mime = "text/csv;charset=utf-8";
    }
    return { text, ext, mime, count: rows.length, fields: cols.length };
  }

  xpDownload() {
    const out = this.xpBuild();
    const url = URL.createObjectURL(new Blob([out.text], { type: out.mime }));
    const a = document.createElement("a");
    a.href = url; a.download = `ha-housekeeper-export.${out.ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  xpBar() {
    const x = this.xp;
    const items = [0, 1, 2, 3].map(i => {
      const inner = `<i aria-hidden="true"></i>${i + 1}. ${this.t(`xpStep${i}`)}`;
      return `<li class="${i < x.step ? "done" : i === x.step ? "cur" : ""}"${i === x.step ? ' aria-current="true"' : ""}>${i < x.step ? `<button type="button" class="wzbtn" data-xp-step="${i}">${inner}</button>` : inner}</li>`;
    }).join("");
    return `<ol class="wz" aria-label="${this.esc(this.t("xpStepsLabel"))}">${items}</ol>`;
  }

  xpPickStep() {
    const x = this.xp, all = this.xpEntities();
    const q = x.q.trim().toLowerCase();
    const hits = q ? all.filter(o => this.haystack(o).includes(q)) : all;
    const areas = new Map(), domains = new Set(), platforms = new Set();
    for (const o of all) { const a = this.xpAreaId(o); if (a) areas.set(a, this.findObject(`area:${a}`)?.name || a); domains.add(o.object_id.split(".")[0]); if (o.platform) platforms.add(o.platform); }
    const options = (label, values) => `<option value="">${this.esc(label)}</option>${values.map(([v, text]) => `<option value="${this.esc(v)}">${this.esc(text)}</option>`).join("")}`;
    const byName = (a, b) => a[1].localeCompare(b[1]);
    const filtered = this.filtered().filter(o => o.object_type === "entity");
    const pickRows = hits.map(o => `<label class="row xprow"><input type="checkbox" class="selbox" data-xp-pick="${this.esc(o.object_id)}" ${x.sel.has(o.object_id) ? "checked" : ""}><span class="row-text"><strong>${this.esc(o.name)}</strong>${this.rowId(o.object_id, this.areaName(o) || "")}</span></label>`);
    const pickPage = this.paginate("xppick", pickRows), rows = pickPage.rows.join("") + pickPage.footer;
    return `<h3>${this.t("xpSelTitle")}</h3><p class="factnote">${this.t("xpSelHint")}</p>
      <div class="chips"><button class="chip" data-xp-quick="all">${this.t("xpQuickAll", { n: this.formatNumber(all.length) })}</button><button class="chip" data-xp-quick="filtered">${this.t("xpQuickFiltered", { n: this.formatNumber(filtered.length) })}</button>${q ? `<button class="chip" data-xp-quick="shown">${this.t("xpQuickShown", { n: this.formatNumber(hits.length) })}</button>` : ""}<button class="chip" data-xp-quick="clear">${this.t("xpQuickClear")}</button><span class="pill xpcount ${x.sel.size ? "ok" : "mute"}" role="status"><ha-icon icon="mdi:check-circle-outline" class="u-ic14"></ha-icon>${this.t("xpSelected", { n: this.formatNumber(x.sel.size) })}</span></div>
      <div class="filters"><select data-xp-add="area" aria-label="${this.esc(this.t("xpPickArea"))}">${options(this.t("xpPickArea"), [...areas].sort(byName))}</select><select data-xp-add="domain" aria-label="${this.esc(this.t("xpPickDomain"))}">${options(this.t("xpPickDomain"), [...domains].sort().map(d => [d, d]))}</select><select data-xp-add="platform" aria-label="${this.esc(this.t("xpPickPlatform"))}">${options(this.t("xpPickPlatform"), [...platforms].sort().map(p => [p, p]))}</select></div>
      <input type="search" data-xp-q value="${this.esc(x.q)}" placeholder="${this.esc(this.t("xpSearch"))}">
      ${rows ? `<div class="xplist">${rows}</div>` : `<div class="emptymsg">${this.t("xpNone")}</div>`}`;
  }

  xpFieldsStep() {
    const x = this.xp, g = x.g;
    const group = (key, title, hint, extra = "") => `<div class="xpgrp"><label><input type="checkbox" data-xp-g="${key}" ${key === "basis" || g[key] ? "checked" : ""} ${key === "basis" ? "disabled" : ""}><span><strong>${this.t(title)}</strong><small>${this.t(hint)}</small></span></label>${extra}</div>`;
    const offered = g.attr ? this.xpOfferedAttrs() : [];
    const attrs = g.attr ? `<div class="chips">${offered.length ? offered.map(k => `<button type="button" class="chip ${x.attrs.has(k) ? "active" : ""}" data-xp-attr="${this.esc(k)}" aria-pressed="${x.attrs.has(k)}">${this.esc(k)}</button>`).join("") : `<small>${this.t("xpNoAttrs")}</small>`}</div>` : "";
    const templates = this.xpTemplates();
    const mine = templates.length ? `<div class="chips"><small>${this.t("xpMyTemplates")}:</small>${templates.map((t, i) => `<span class="chip tpl"><button type="button" data-xp-tpl="${i}">${this.esc(t.name)}</button><button type="button" data-xp-tpl-del="${i}" aria-label="${this.esc(this.t("xpTplDelete", { name: t.name }))}">×</button></span>`).join("")}</div>` : "";
    return `<h3>${this.t("xpFieldsTitle")}</h3><p class="factnote">${this.t("xpFieldsHint")}</p>
      <div class="chips">${[["min", "xpPresetMin"], ["doc", "xpPresetDoc"], ["state", "xpPresetState"]].map(([id, label]) => `<button type="button" class="chip" data-xp-preset="${id}">${this.t(label)}</button>`).join("")}</div>${mine}
      ${group("basis", "xpGBasis", "xpGBasisD")}${group("zuord", "xpGZuord", "xpGZuordD")}${group("rel", "xpGRel", "xpGRelD")}${group("state", "xpGState", "xpGStateD")}${group("attr", "xpGAttr", "xpGAttrD", attrs)}`;
  }

  xpFormatStep() {
    const x = this.xp;
    const fmt = (id, name, hint) => `<label class="xpfmt ${x.fmt === id ? "on" : ""}"><input type="radio" name="xpfmt" data-xp-fmt="${id}" ${x.fmt === id ? "checked" : ""}><strong>${this.t(name)}</strong><small>${this.t(hint)}</small></label>`;
    const tplCount = this.xpTemplates().length;
    return `<h3>${this.t("xpFormatTitle")}</h3><p class="factnote">${this.t("xpFormatHint")}</p>
      <div class="xpfmts">${fmt("csv", "xpFmtCsv", "xpFmtCsvD")}${fmt("md", "xpFmtMd", "xpFmtMdD")}${fmt("json", "xpFmtJson", "xpFmtJsonD")}</div>
      <div class="xpgrp"><label><input type="checkbox" data-xp-ph ${x.ph ? "checked" : ""}><span><strong>${this.t("xpPh")}</strong><small>${this.t("xpPhD")}</small></span></label></div>
      <div class="xpgrp"><label><input type="checkbox" data-xp-sort ${x.sort ? "checked" : ""}><span><strong>${this.t("xpSort")}</strong></span></label></div>
      <form class="xpgrp xptpl" data-xp-save><label for="xp-tpl-name"><strong>${this.t("xpSaveTpl")}</strong></label><div class="xprowline"><input id="xp-tpl-name" type="text" maxlength="40" data-xp-tpl-name value="${this.esc(x.tplName)}" placeholder="${this.esc(this.t("xpTplName"))}" autocomplete="off"><button type="submit" class="btn">${this.t("xpTplSave")}</button></div>${tplCount >= XP_TEMPLATES_MAX ? `<small>${this.t("xpTplFull")}</small>` : ""}${x.msg ? `<small role="status">${this.esc(x.msg)}</small>` : ""}</form>`;
  }

  xpPreviewStep() {
    const out = this.xpBuild(), cut = out.text.length > XP_PREVIEW_CHARS;
    return `<h3>${this.t("xpPreviewTitle")}</h3><p class="factnote">${this.t("xpPreviewHint")}</p>
      <div class="xpmeta"><span>${this.t("xpSummary", { n: this.formatNumber(out.count), c: out.fields })}</span><span>${this.t("xpSize", { n: this.formatNumber(out.text.length) })}</span></div>
      <pre class="code xppre">${this.esc(cut ? out.text.slice(0, XP_PREVIEW_CHARS) : out.text)}</pre>${cut ? `<p class="factnote">${this.t("xpTruncated")}</p>` : ""}
      <p class="factnote">${this.t("xpSafe")}</p>`;
  }

  xpView() {
    const x = this.xp;
    const body = [() => this.xpPickStep(), () => this.xpFieldsStep(), () => this.xpFormatStep(), () => this.xpPreviewStep()][x.step]();
    const next = x.step < 3 ? `<button class="btn primary" data-xp-next>${this.t("xpNext")}</button>` : `<button class="btn" data-xp-download><ha-icon icon="mdi:download"></ha-icon>${this.t("xpDownload")}</button><button class="btn primary" data-xp-copy><ha-icon icon="mdi:content-copy"></ha-icon>${x.copied ? this.t("xpCopied") : this.t("xpCopy")}</button>`;
    const hint = x.msg && x.step === 0 ? x.msg : x.step === 0 ? this.t("xpSelected", { n: this.formatNumber(x.sel.size) }) : "";
    return `<div class="stack"><div class="panel xpwiz"><div class="panelhead"><div><h2>${this.t("xpTitle")}</h2></div><span class="xpclose">${x.origin ? `<button class="btn" data-xp-cancel data-xp-return><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("xpBackTo", { name: this.esc(x.origin.name) })}</button>` : ""}<button class="btn" data-xp-cancel>${this.t("xpCancel")}</button></span></div>${this.xpBar()}<div class="xpbody">${body}</div>
      <div class="setrow planfoot"><button class="btn" data-xp-back ${x.step === 0 ? "hidden" : ""}>${this.t("xpBack")}</button><small class="u-m0" role="status">${this.esc(hint)}</small><span class="xpact">${next}</span></div></div></div>`;
  }

  xpBind(root) {
    const x = this.xp;
    if (!x?.open) return;
    const go = () => this.render();
    root.querySelectorAll("[data-xp-step]").forEach(el => el.onclick = () => { x.step = Number(el.dataset.xpStep); x.msg = ""; go(); });
    root.querySelector("[data-xp-next]")?.addEventListener("click", () => {
      if (x.step === 0 && !x.sel.size) { x.msg = this.t("xpNeedOne"); go(); return; }
      x.step += 1; x.msg = ""; x.copied = false; go();
    });
    root.querySelector("[data-xp-back]")?.addEventListener("click", () => { x.step = Math.max(0, x.step - 1); x.msg = ""; go(); });
    root.querySelectorAll("[data-xp-cancel]").forEach(el => el.onclick = () => this.xpClose());
    root.querySelector("[data-xp-q]")?.addEventListener("input", ev => { x.q = ev.target.value; this.scheduleRender(); });
    root.querySelectorAll("[data-xp-pick]").forEach(el => el.onchange = () => { el.checked ? x.sel.add(el.dataset.xpPick) : x.sel.delete(el.dataset.xpPick); x.msg = ""; go(); });
    root.querySelectorAll("[data-xp-quick]").forEach(el => el.onclick = () => {
      const kind = el.dataset.xpQuick, q = x.q.trim().toLowerCase();
      if (kind === "clear") x.sel.clear();
      else if (kind === "all") this.xpEntities().forEach(o => x.sel.add(o.object_id));
      else if (kind === "filtered") this.filtered().filter(o => o.object_type === "entity").forEach(o => x.sel.add(o.object_id));
      else this.xpEntities().filter(o => !q || this.haystack(o).includes(q)).forEach(o => x.sel.add(o.object_id));
      x.msg = ""; go();
    });
    root.querySelectorAll("[data-xp-add]").forEach(el => el.onchange = () => {
      const kind = el.dataset.xpAdd, value = el.value;
      if (!value) return;
      this.xpEntities().filter(o => kind === "area" ? this.xpAreaId(o) === value : kind === "domain" ? o.object_id.startsWith(`${value}.`) : o.platform === value).forEach(o => x.sel.add(o.object_id));
      x.msg = ""; go();
    });
    root.querySelectorAll("[data-xp-preset]").forEach(el => el.onclick = () => { x.g = { ...XP_PRESETS[el.dataset.xpPreset] }; x.attrs = new Set(); go(); });
    root.querySelectorAll("[data-xp-g]").forEach(el => el.onchange = () => { x.g[el.dataset.xpG] = el.checked; if (el.dataset.xpG === "attr" && !el.checked) x.attrs = new Set(); go(); });
    root.querySelectorAll("[data-xp-attr]").forEach(el => el.onclick = () => { x.attrs.has(el.dataset.xpAttr) ? x.attrs.delete(el.dataset.xpAttr) : x.attrs.add(el.dataset.xpAttr); go(); });
    root.querySelectorAll("[data-xp-tpl]").forEach(el => el.onclick = () => { const t = this.xpTemplates()[Number(el.dataset.xpTpl)]; if (t) this.xpApplyTemplate(t); go(); });
    root.querySelectorAll("[data-xp-tpl-del]").forEach(el => el.onclick = () => { const i = Number(el.dataset.xpTplDel); this.confirmAsk(this.t("confirmTpl", { name: this.xpTemplates()[i]?.name || "" }), () => { const list = this.xpTemplates(); list.splice(i, 1); this.xpSaveTemplates(list); go(); }); });
    root.querySelectorAll("[data-xp-fmt]").forEach(el => el.onchange = () => { x.fmt = el.dataset.xpFmt; go(); });
    root.querySelector("[data-xp-ph]")?.addEventListener("change", ev => { x.ph = ev.target.checked; go(); });
    root.querySelector("[data-xp-sort]")?.addEventListener("change", ev => { x.sort = ev.target.checked; go(); });
    root.querySelector("[data-xp-tpl-name]")?.addEventListener("input", ev => { x.tplName = ev.target.value; });
    root.querySelector("[data-xp-save]")?.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = x.tplName.trim().slice(0, 40), list = this.xpTemplates().filter(t => t.name !== name);
      if (!name) return;
      if (list.length >= XP_TEMPLATES_MAX) { x.msg = this.t("xpTplFull"); go(); return; }
      list.push({ name, g: { ...x.g }, attrs: [...x.attrs], fmt: x.fmt, ph: x.ph, sort: x.sort });
      this.xpSaveTemplates(list); x.msg = this.t("xpTplSaved", { name }); x.tplName = ""; go();
    });
    root.querySelector("[data-xp-download]")?.addEventListener("click", () => this.xpDownload());
    root.querySelector("[data-xp-copy]")?.addEventListener("click", async () => {
      try { await globalThis.navigator?.clipboard?.writeText(this.xpBuild().text.replace(/^﻿/, "")); x.copied = true; } catch (_) { x.copied = false; }
      go();
      setTimeout(() => { x.copied = false; if (this.xp === x) this.render(); }, 1500);
    });
  }

  bindExport(root) {
    root.querySelectorAll("[data-xp-open]").forEach(el => el.onclick = () => this.xpOpen());
    root.querySelectorAll("[data-xp-from]").forEach(el => el.onclick = () => {
      const ids = this.xpEntitiesOf(el.dataset.xpFrom);
      this.xpOpen(ids);
      if (!ids.length) { this.xp.msg = this.t("xpNoEntities"); this.render(); }
    });
    this.xpBind(root);
  }
}
