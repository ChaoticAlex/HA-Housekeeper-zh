// AI access (MCP): the two switches, how to connect and the log of calls; mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  setTabMcp: "KI-Zugriff", setHintMcp: "Programme und KI-Agenten Housekeeper lesen lassen",
  mcpTitle: "KI-Zugriff (MCP)",
  mcpHint: "Ein Programm oder KI-Agent, das Home-Assistant-Dienste aufrufen kann (zum Beispiel ha-mcp), kann Housekeeper dann wie das Panel nutzen: Befunde ansehen, prüfen, ignorieren und markieren. Housekeeper startet dafür keinen Server und öffnet keinen Port.",
  mcpEnable: "KI-Zugriff aktivieren", mcpEnableDetail: "Nur lesend: Status, Befunde, Objekte und das Protokoll. Aus, solange du es nicht einschaltest.",
  mcpWrite: "Merkliste ändern", mcpWriteDetail: "Befunde ignorieren, behalten oder zurückstellen, Objekte markieren und Logbuch-Einträge schreiben. Es ändert sich nur Housekeepers eigene Liste, nie Home Assistant, und jede Änderung lässt sich unten zurücknehmen. Braucht „KI-Zugriff aktivieren“.",
  mcpPrivacy: "Was das Modell zu sehen bekommt: Namen und IDs von Geräten, Entitäten und Automationen, Bereiche, Befunde und die Struktur deiner Konfiguration. Läuft das Modell bei einem Anbieter in der Cloud, gehen diese Angaben dorthin. Nie übertragen werden Passwörter, Tokens, Webhook-IDs und Zugangsdaten. Nur Administratoren können die Dienste nutzen.",
  mcpHowTitle: "So nutzt du es",
  mcpHow1: "Oben „KI-Zugriff aktivieren“ einschalten.",
  mcpHow2: "Dem Programm die Dienste ha_housekeeper.* geben (Antwort mit return_response): status, findings, object, audit; mit „Merkliste ändern“ auch finding_decide, mark, note_set und undo.",
  mcpHow3: "Fragen, zum Beispiel: „Welche Sensoren sind seit Wochen weg, und braucht sie jemand?“",
  mcpHowNote: "Die Befehle, die das Panel benutzt, gehen bei ha-mcp zwar auch über ws_command, sind aber nicht dokumentiert, und die Gesamtliste (inventory) ist bei großen Installationen über 10 MB. Nimm die Dienste.",
  mcpLogTitle: "Protokoll", mcpLogHint: "Jeder Aufruf mit Zeit, Benutzer, Dienst und Ergebnis, nie die Inhalte der Antworten. Viele Lesezugriffe hintereinander stehen in einer Zeile. Höchstens 2000 Einträge und 90 Tage.",
  mcpLogCalls: "{n} Aufrufe in 24 Stunden", mcpLogEmpty: "Noch keine Aufrufe.", mcpLogLoading: "Protokoll wird geladen …",
  mcpFilterAll: "Alle", mcpFilterRead: "Lesen", mcpFilterWrite: "Ändern", mcpFilterDenied: "Abgewiesen", mcpFilterFailed: "Fehler",
  mcpKind_read: "Lesen", mcpKind_write: "Ändern", mcpKind_denied: "Abgewiesen", mcpBadgeError: "Fehler",
  mcpResult_ok: "ok", mcpResult_disabled: "KI-Zugriff war aus", mcpResult_write_disabled: "Ändern war aus", mcpResult_not_admin: "kein Administrator", mcpResult_invalid_format: "ungültige Angaben", mcpResult_error: "Fehler",
  mcpTimes: "{n} Aufrufe bis {date}", mcpCount: "{n} Treffer", mcpUndo: "Rückgängig", mcpUndone: "zurückgenommen", mcpUndoFailed: "Nicht zurückgenommen: {reason}",
  mcpUserSystem: "Automation oder System", mcpUserYou: "du", mcpUserOther: "anderer Benutzer",
  mcpFn_status: "Status", mcpFn_findings: "Befunde", mcpFn_object: "Objekt", mcpFn_finding_decide: "Befund entscheiden", mcpFn_mark: "Objekt markieren", mcpFn_note_set: "Logbuch-Eintrag", mcpFn_undo: "Zurücknehmen",
  viaMcp: "über KI-Zugriff", noteSrcAgent: "Von KI-Zugriff geschrieben",
});
Object.assign(TEXT.en, {
  setTabMcp: "AI access", setHintMcp: "Let programs and AI agents read Housekeeper",
  mcpTitle: "AI access (MCP)",
  mcpHint: "A program or AI agent that can call Home Assistant services (for example ha-mcp) can then use Housekeeper like the panel: look at findings, check them, ignore and mark them. Housekeeper starts no server and opens no port for this.",
  mcpEnable: "Switch on AI access", mcpEnableDetail: "Read-only: status, findings, objects and the log. Off until you switch it on.",
  mcpWrite: "Change the list", mcpWriteDetail: "Ignore, keep or put off findings, mark objects and write logbook entries. Only Housekeeper's own list changes, never Home Assistant, and every change can be taken back below. Needs “Switch on AI access”.",
  mcpPrivacy: "What the model gets to see: names and ids of devices, entities and automations, areas, findings and the structure of your configuration. If the model runs at a cloud provider, these details go there. Passwords, tokens, webhook ids and credentials are never sent. Only administrators can use the services.",
  mcpHowTitle: "How to use it",
  mcpHow1: "Switch on “Switch on AI access” above.",
  mcpHow2: "Give the program the services ha_housekeeper.* (answer with return_response): status, findings, object, audit; with “Change the list” also finding_decide, mark, note_set and undo.",
  mcpHow3: "Ask, for example: “Which sensors have been gone for weeks, and does anyone use them?”",
  mcpHowNote: "The commands the panel uses also work through ws_command in ha-mcp, but they are not documented, and the full list (inventory) is over 10 MB on large installations. Use the services.",
  mcpLogTitle: "Log", mcpLogHint: "Every call with time, user, service and result, never the content of the answers. Many reads in a row are one line. At most 2,000 entries and 90 days.",
  mcpLogCalls: "{n} calls in 24 hours", mcpLogEmpty: "No calls yet.", mcpLogLoading: "Loading the log …",
  mcpFilterAll: "All", mcpFilterRead: "Reads", mcpFilterWrite: "Changes", mcpFilterDenied: "Refused", mcpFilterFailed: "Errors",
  mcpKind_read: "Read", mcpKind_write: "Change", mcpKind_denied: "Refused", mcpBadgeError: "Error",
  mcpResult_ok: "ok", mcpResult_disabled: "AI access was off", mcpResult_write_disabled: "changing was off", mcpResult_not_admin: "not an administrator", mcpResult_invalid_format: "invalid parameters", mcpResult_error: "error",
  mcpTimes: "{n} calls until {date}", mcpCount: "{n} results", mcpUndo: "Undo", mcpUndone: "taken back", mcpUndoFailed: "Not taken back: {reason}",
  mcpUserSystem: "Automation or system", mcpUserYou: "you", mcpUserOther: "another user",
  mcpFn_status: "Status", mcpFn_findings: "Findings", mcpFn_object: "Object", mcpFn_finding_decide: "Decide about a finding", mcpFn_mark: "Mark an object", mcpFn_note_set: "Logbook entry", mcpFn_undo: "Undo",
  viaMcp: "via AI access", noteSrcAgent: "Written by AI access",
});

class McpMixin {
  async loadMcp() {
    if (this._mcpLoading) return;
    this._mcpLoading = true;
    try { this.mcp = await this._hass.callWS({ type: "ha_housekeeper/mcp_audit", limit: 100 }); } catch (err) { this.failed(err); this.mcp = this.mcp || { entries: [], calls_24h: 0 }; }
    this._mcpLoading = false;
    this.render();
  }

  mcpSwitch(attr, on, label, detail, icon, disabled = false) {
    return `<div class="row"><span class="tile ${on ? "ok" : "mute"}"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${label}</strong><small>${detail}</small></span><input class="policyswitch" type="checkbox" role="switch" aria-label="${this.esc(label)}" ${attr} ${on ? "checked" : ""} ${disabled ? "disabled" : ""}></div>`;
  }

  mcpTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value ?? "");
    const opts = { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    try { return new Intl.DateTimeFormat(this.lang, opts).format(d); } catch (_) { return String(value); }
  }

  mcpEntryRow(e, multi = false) {
    const me = this._hass?.user?.id;
    const failed = e.kind !== "denied" && e.result !== "ok";
    const tone = e.kind === "denied" ? "warn" : failed ? "red" : e.kind === "write" ? "" : "mute";
    const badge = failed ? this.t("mcpBadgeError") : this.t(`mcpKind_${e.kind}`);
    const p = e.params || {};
    const target = [p.object_id, p.key].find(v => typeof v === "string" && v) || "";
    const notes = [e.result !== "ok" ? this.t(`mcpResult_${e.result}`) : "", e.count != null && e.kind === "read" ? this.t("mcpCount", { n: e.count }) : ""].filter(Boolean).join(" · ");
    const who = !multi ? "" : !e.user ? this.t("mcpUserSystem") : e.user === me ? this.t("mcpUserYou") : this.t("mcpUserOther");
    const times = e.n > 1 ? `<span class="logn" title="${this.esc(this.t("mcpTimes", { n: e.n, date: this.formatDate(e.last) }))}">×${e.n}</span>` : "";
    const undo = e.undone ? `<span class="pill mute">${this.t("mcpUndone")}</span>` : e.undoable ? `<button class="btn" data-mcp-undo="${this.esc(e.at)}"><ha-icon icon="mdi:undo"></ha-icon>${this.t("mcpUndo")}</button>` : "";
    return `<div class="logline${e.undone ? " undone" : ""}"><time class="logtime" datetime="${this.esc(e.at)}">${this.esc(this.mcpTime(e.at))}</time><span class="pill logbadge ${tone}">${badge}</span><span class="logfn">${this.esc(this.t(`mcpFn_${e.fn}`) || e.fn)}</span><span class="logwhat">${target ? `<code>${this.esc(target)}</code>` : ""}${notes ? `<small>${this.esc(notes)}</small>` : ""}${times}${who ? `<small>${this.esc(who)}</small>` : ""}</span>${undo}</div>`;
  }

  mcpCard() {
    const m = this.data?.meta?.mcp || {};
    const on = Boolean(m.enabled), write = Boolean(m.write);
    const switches = this.mcpSwitch("data-mcp-enabled", on, this.t("mcpEnable"), this.t("mcpEnableDetail"), "mdi:robot-outline")
      + this.mcpSwitch("data-mcp-write", write && on, this.t("mcpWrite"), this.t("mcpWriteDetail"), "mdi:pencil-outline", !on);
    const how = `<div class="pad"><h3>${this.t("mcpHowTitle")}</h3><ol><li>${this.t("mcpHow1")}</li><li>${this.t("mcpHow2")}</li><li>${this.t("mcpHow3")}</li></ol><p class="factnote">${this.t("mcpHowNote")}</p></div>`;
    const main = `<section class="panel"><div class="panelhead"><div><h2>${this.t("mcpTitle")}</h2><p>${this.t("mcpHint")}</p></div></div>${switches}<div class="pad"><p class="factnote">${this.t("mcpPrivacy")}</p></div>${how}</section>`;
    if (!this.mcp) { this.loadMcp(); return `${main}<section class="panel"><div class="panelhead"><h2>${this.t("mcpLogTitle")}</h2></div><div class="pad"><p class="factnote">${this.t("mcpLogLoading")}</p></div></section>`; }
    const filter = this.mcpFilter || "all";
    const shown = this.mcp.entries.filter(e => filter === "all" || (filter === "failed" ? e.result !== "ok" : e.kind === filter));
    const tabs = ["all", "read", "write", "denied", "failed"].map(f => `<button class="btn${filter === f ? " primary" : ""}" data-mcp-filter="${f}" aria-pressed="${filter === f}">${this.t(`mcpFilter${f[0].toUpperCase()}${f.slice(1)}`)}</button>`).join("");
    const rows = shown.length ? shown.map(e => this.mcpEntryRow(e, new Set(shown.map(x => x.user)).size > 1)).join("") : `<div class="pad"><p class="factnote">${this.t("mcpLogEmpty")}</p></div>`;
    return `${main}<section class="panel"><div class="panelhead"><div><h2>${this.t("mcpLogTitle")}</h2><p>${this.t("mcpLogHint")} ${this.t("mcpLogCalls", { n: this.formatNumber(this.mcp.calls_24h || 0) })}</p></div></div><div class="pad toolbar">${tabs}</div>${rows}</section>`;
  }

  bindMcp(root) {
    const set = async changes => {
      try {
        const res = await this._hass.callWS({ type: "ha_housekeeper/mcp_set", ...changes });
        this.data.meta.mcp = { enabled: res.enabled, write: res.write };
        this.mcp = null;
      } catch (err) { this.failed(err); }
      this.render();
    };
    root.querySelector("[data-mcp-enabled]")?.addEventListener("change", ev => set({ enabled: ev.target.checked }));
    root.querySelector("[data-mcp-write]")?.addEventListener("change", ev => set({ write: ev.target.checked }));
    root.querySelectorAll("[data-mcp-filter]").forEach(el => el.onclick = () => { this.mcpFilter = el.dataset.mcpFilter; this.render(); });
    root.querySelectorAll("[data-mcp-undo]").forEach(el => el.onclick = async () => {
      try { await this._hass.callWS({ type: "ha_housekeeper/mcp_undo", at: el.dataset.mcpUndo }); this.mcp = null; this.data = await this._hass.callWS({ type: "ha_housekeeper/inventory" }); }
      catch (err) { this.failed(err); }
      this.render();
    });
  }
}
