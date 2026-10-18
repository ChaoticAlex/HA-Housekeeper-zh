// AI access (MCP): the two switches, how to connect and the log of calls; mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  setTabMcp: "KI-Zugriff", setHintMcp: "Programme und KI-Agenten Housekeeper lesen lassen",
  mcpTitle: "KI-Zugriff (MCP)",
  mcpHint: "Ein Programm oder KI-Agent, das Home-Assistant-Dienste aufrufen kann (zum Beispiel ha-mcp), kann Housekeeper dann wie das Panel nutzen: Befunde ansehen, prüfen, ignorieren und markieren. Housekeeper startet dafür keinen Server und öffnet keinen Port.",
  mcpEnable: "KI-Zugriff aktivieren", mcpEnableDetail: "Nur lesend: Status, Befunde, Objekte und das Protokoll. Aus, solange du es nicht einschaltest.",
  mcpWrite: "Merkliste ändern", mcpWriteDetail: "Befunde ignorieren, behalten oder zurückstellen, Objekte markieren, Logbuch-Einträge schreiben. Nur Housekeepers eigene Liste, nie Home Assistant; alles lässt sich im Protokoll zurücknehmen.", mcpWriteNeeds: "Zuerst „KI-Zugriff aktivieren“ einschalten.",
  mcpStateOff: "Aus", mcpStateRead: "Aktiv, nur lesend", mcpStateWrite: "Aktiv, mit Ändern",
  mcpPrivacy: "Das Modell sieht Namen und IDs, Bereiche, Befunde und die Struktur deiner Konfiguration; läuft es in der Cloud, gehen diese Angaben dorthin. Nie übertragen werden Passwörter, Tokens, Webhook-IDs und Zugangsdaten. Nur Administratoren können die Dienste nutzen.",
  mcpHowTitle: "So nutzt du es",
  mcpHow1: "„KI-Zugriff aktivieren“ einschalten.",
  mcpHow2: "Dem KI-Agenten erlauben, diese Dienste der Integration ha_housekeeper aufzurufen (die Antwort kommt mit return_response):", mcpHowWrite: "Zusätzlich, wenn „Merkliste ändern“ an ist:",
  mcpHow3: "Fragen, zum Beispiel: „Welche Sensoren sind seit Wochen weg, und braucht sie jemand?“",
  mcpHowNote: "Bei ha-mcp die Dienste über ha_call_service aufrufen, nicht über ws_command: Die Panel-Befehle sind nicht dokumentiert, und die Gesamtliste kann bei großen Installationen über 10 MB groß werden.",
  mcpLogTitle: "Protokoll", mcpLogHint: "Jeder Aufruf mit Zeit, Dienst und Ergebnis, nie die Inhalte der Antworten.", mcpLogHint2: "Viele Lesezugriffe hintereinander stehen in einer Zeile. Höchstens 2000 Einträge und 90 Tage.", mcpToday: "Heute", mcpYesterday: "Gestern", mcpNoParams: "Keine Angaben übermittelt.", mcpParams: "Übermittelte Angaben",
  mcpLogCalls: "{n} Aufrufe in 24 Stunden", mcpLogEmpty: "Noch keine Aufrufe.", mcpLogLoading: "Protokoll wird geladen …",
  mcpFilterAll: "Alle", mcpFilterRead: "Lesen", mcpFilterWrite: "Ändern", mcpFilterDenied: "Abgewiesen", mcpFilterFailed: "Fehler",
  mcpKind_read: "Lesen", mcpKind_write: "Ändern", mcpKind_denied: "Abgewiesen", mcpBadgeError: "Fehler",
  mcpResult_ok: "ok", mcpResult_disabled: "KI-Zugriff war aus", mcpResult_write_disabled: "Ändern war aus", mcpResult_not_admin: "kein Administrator", mcpResult_invalid_format: "Angaben unvollständig oder falsch", mcpResult_rate_limited: "zu viele Änderungen", mcpResult_too_many_calls: "zu viele Aufrufe", mcpResult_reason_required: "Grund fehlt", mcpResult_error: "Fehler",
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
  mcpWrite: "Change the list", mcpWriteDetail: "Ignore, keep or put off findings, mark objects, write logbook entries. Only Housekeeper's own list, never Home Assistant; everything can be taken back in the log.", mcpWriteNeeds: "Switch on “Switch on AI access” first.",
  mcpStateOff: "Off", mcpStateRead: "On, read-only", mcpStateWrite: "On, with changes",
  mcpPrivacy: "The model sees names and ids, areas, findings and the structure of your configuration; if it runs in the cloud, these details go there. Passwords, tokens, webhook ids and credentials are never sent. Only administrators can use the services.",
  mcpHowTitle: "How to use it",
  mcpHow1: "Switch on “Switch on AI access”.",
  mcpHow2: "Allow the AI agent to call these services of the ha_housekeeper integration (the answer comes with return_response):", mcpHowWrite: "Additionally, when “Change the list” is on:",
  mcpHow3: "Ask, for example: “Which sensors have been gone for weeks, and does anyone use them?”",
  mcpHowNote: "With ha-mcp call the services through ha_call_service, not ws_command: the panel commands are not documented, and the full list can be over 10 MB on large installations.",
  mcpLogTitle: "Log", mcpLogHint: "Every call with time, service and result, never the content of the answers.", mcpLogHint2: "Many reads in a row are one line. At most 2,000 entries and 90 days.", mcpToday: "Today", mcpYesterday: "Yesterday", mcpNoParams: "No parameters sent.", mcpParams: "Parameters sent",
  mcpLogCalls: "{n} calls in 24 hours", mcpLogEmpty: "No calls yet.", mcpLogLoading: "Loading the log …",
  mcpFilterAll: "All", mcpFilterRead: "Reads", mcpFilterWrite: "Changes", mcpFilterDenied: "Refused", mcpFilterFailed: "Errors",
  mcpKind_read: "Read", mcpKind_write: "Change", mcpKind_denied: "Refused", mcpBadgeError: "Error",
  mcpResult_ok: "ok", mcpResult_disabled: "AI access was off", mcpResult_write_disabled: "changing was off", mcpResult_not_admin: "not an administrator", mcpResult_invalid_format: "invalid parameters", mcpResult_rate_limited: "too many changes", mcpResult_too_many_calls: "too many calls", mcpResult_reason_required: "reason missing", mcpResult_error: "error",
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

  mcpSwitch(attr, on, label, detail, icon, disabled = false, needs = "") {
    return `<div class="row mcprow"><span class="tile ${on ? "ok" : "mute"}"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${label}</strong><small>${detail}</small>${needs ? `<small class="mcpneeds">${needs}</small>` : ""}</span><input class="policyswitch" type="checkbox" role="switch" aria-label="${this.esc(label)}" ${attr} ${on ? "checked" : ""} ${disabled ? "disabled" : ""}></div>`;
  }

  mcpTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value ?? "");
    try { return new Intl.DateTimeFormat(this.lang, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(d); } catch (_) { return String(value); }
  }

  mcpDay(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(new Date()) - day(d)) / 86400000);
    if (diff === 0) return this.t("mcpToday");
    if (diff === 1) return this.t("mcpYesterday");
    const opts = { day: "2-digit", month: "2-digit" };
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
    const tint = e.kind === "denied" ? " warn" : failed ? " red" : "";
    const params = Object.keys(p).length ? `<pre>${this.esc(JSON.stringify(p, null, 2))}</pre>` : `<p class="factnote">${this.t("mcpNoParams")}</p>`;
    return `<details class="logitem${tint}${e.undone ? " undone" : ""}"><summary class="logline"><time class="logtime" datetime="${this.esc(e.at)}">${this.esc(this.mcpTime(e.at))}</time><span class="pill logbadge ${tone}">${badge}</span><span class="logfn">${this.esc(this.t(`mcpFn_${e.fn}`) || e.fn)}</span><span class="logwhat">${target ? `<code>${this.esc(target)}</code>` : ""}${notes ? `<small>${this.esc(notes)}</small>` : ""}${times}${who ? `<small>${this.esc(who)}</small>` : ""}</span>${undo}</summary><div class="logdetail"><small>${this.t("mcpParams")}</small>${params}</div></details>`;
  }

  mcpCard() {
    const m = this.data?.meta?.mcp || {};
    const on = Boolean(m.enabled), write = Boolean(m.write);
    const chips = list => list.map(n => `<code class="mcpchip">${n}</code>`).join("");
    const switches = this.mcpSwitch("data-mcp-enabled", on, this.t("mcpEnable"), this.t("mcpEnableDetail"), "mdi:robot-outline")
      + this.mcpSwitch("data-mcp-write", write && on, this.t("mcpWrite"), this.t("mcpWriteDetail"), "mdi:pencil-outline", !on, on ? "" : this.t("mcpWriteNeeds"));
    const state = !on ? ["mute", "mcpStateOff"] : write ? ["", "mcpStateWrite"] : ["ok", "mcpStateRead"];
    const calls = on && this.mcp ? ` <span class="mcpcalls">${this.t("mcpLogCalls", { n: this.formatNumber(this.mcp.calls_24h || 0) })}</span>` : "";
    const privacy = `<div class="mcpnote"><ha-icon icon="mdi:shield-lock-outline"></ha-icon><span>${this.t("mcpPrivacy")}</span></div>`;
    const how = `<details class="howto mcphow"><summary>${this.t("mcpHowTitle")}</summary><ol class="mcpsteps"><li>${this.t("mcpHow1")}</li><li>${this.t("mcpHow2")} ${chips(["status", "findings", "object", "audit"])}<br>${this.t("mcpHowWrite")} ${chips(["finding_decide", "mark", "note_set", "undo"])}</li><li>${this.t("mcpHow3")}</li></ol><p class="factnote">${this.t("mcpHowNote")}</p></details>`;
    const main = `<section class="panel"><div class="panelhead"><div><h2>${this.t("mcpTitle")} <span class="pill ${state[0]}">${this.t(state[1])}</span>${calls}</h2><p>${this.t("mcpHint")}</p></div></div>${switches}${privacy}${how}</section>`;
    if (!this.mcp) { this.loadMcp(); return `${main}<section class="panel"><div class="panelhead"><h2>${this.t("mcpLogTitle")}</h2></div><div class="pad"><p class="factnote">${this.t("mcpLogLoading")}</p></div></section>`; }
    const filter = this.mcpFilter || "all";
    const shown = this.mcp.entries.filter(e => filter === "all" || (filter === "failed" ? e.result !== "ok" : e.kind === filter));
    const match = (e, f) => f === "all" || (f === "failed" ? e.result !== "ok" : e.kind === f);
    const tabs = ["all", "read", "write", "denied", "failed"].map(f => {
      const n = this.mcp.entries.filter(e => match(e, f)).length;
      return `<button class="btn small${filter === f ? " primary" : ""}" data-mcp-filter="${f}" aria-pressed="${filter === f}">${this.t(`mcpFilter${f[0].toUpperCase()}${f.slice(1)}`)} <span class="logcount">${n}</span></button>`;
    }).join("");
    const multi = new Set(shown.map(x => x.user)).size > 1;
    let lastDay = null;
    const rows = shown.length ? shown.map(e => {
      const day = this.mcpDay(e.at);
      const head = day !== lastDay ? `<div class="logday">${this.esc(day)}</div>` : "";
      lastDay = day;
      return head + this.mcpEntryRow(e, multi);
    }).join("") : `<div class="pad"><p class="factnote">${this.t("mcpLogEmpty")}</p></div>`;
    return `${main}<section class="panel"><div class="panelhead"><div><h2>${this.t("mcpLogTitle")}</h2><p>${this.t("mcpLogHint")} ${this.t("mcpLogCalls", { n: this.formatNumber(this.mcp.calls_24h || 0) })}.</p><p class="factnote">${this.t("mcpLogHint2")}</p></div></div><div class="pad toolbar">${tabs}</div>${rows}</section>`;
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
    root.querySelectorAll("[data-mcp-undo]").forEach(el => el.onclick = async ev => {
      ev.preventDefault();
      try { await this._hass.callWS({ type: "ha_housekeeper/mcp_undo", at: el.dataset.mcpUndo }); this.mcp = null; this.data = await this._hass.callWS({ type: "ha_housekeeper/inventory" }); }
      catch (err) { this.failed(err); }
      this.render();
    });
  }
}
