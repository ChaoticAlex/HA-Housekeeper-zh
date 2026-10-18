// "Apps & integrations": the installed apps and the integrations by domain in one place. It only gathers what the scan, the
// reliability numbers and the storage page already know and links to the detail pages; it keeps no numbers of its own.
Object.assign(TEXT.de, {
  components: "Apps & Integrationen", componentsSubtitle: "Was installiert ist und ob es läuft: Apps und Integrationen nach Domain, mit Version, Status und Umfang. Liest nur, die Zahlen kommen aus dem Scan.",
  compTabApps: "Apps", compTabAppsHint: "Status, CPU, RAM, Daten", compTabCore: "Core-Integrationen", compTabCoreHint: "von Home Assistant, nach Domain", compTabCustom: "Custom-Integrationen", compTabCustomHint: "Version, Updates, Ordnergröße", compSumSize: "{size} belegt",
  compEntries: "{n} Einträge", compNoApps: "Keine Apps (kein Supervisor oder keine installiert).", compNoIntegrations: "Keine Integrationen gefunden.",
  compSumApps: "Apps", compSumRunning: "laufen", compSumCore: "Core-Integrationen", compSumCustomInt: "Custom-Integrationen", compSumProblem: "mit Problem", compSumUpdates: "Updates über HACS", compSumAppUpdates: "App-Updates", compColLatest: "Neueste Version", compFilterHacs: "HACS", compFilterUpdate: "Update verfügbar", compFilterViaHacs: "Über HACS",
  compColVersion: "Version", compColEntries: "Einträge", compColDevices: "Geräte", compColAvail: "Verfügbarkeit", compColOrigin: "Herkunft", compUpdate: "Update", compUpdateHint: "Neuere Version: {v}",
  compOpenEntries: "Einträge anzeigen", compCloseEntries: "Einträge ausblenden", compFilterState: "Zustand",
  compAvailHint: "Schlechtester Wert der Einträge; erscheint, sobald die Zuverlässigkeit berechnet ist.", compSizeHint: "Ordnergröße; erscheint, sobald „Speicher & System“ geladen ist.",
  compTabHacs: "HACS", compTabHacsHint: "alle installierten Repositories", compSumHacsRemoved: "aus HACS entfernt", compSumHacsUpdates: "Updates",
  hacsColRepo: "Repository", hacsColKind: "Art", hacsColInstalled: "Installiert", hacsColLatest: "Neueste", hacsColState: "Zustand",
  hacsKind_integration: "Integration", hacsKind_plugin: "Karte", hacsKind_theme: "Theme", hacsKind_python_script: "Python-Skript", hacsKind_appdaemon: "AppDaemon", hacsKind_template: "Vorlage", hacsFilterKind: "Art", hacsFilterState: "Zustand",
  hacsStateRemoved: "Aus HACS entfernt", hacsStateRemovedIgnored: "Aus HACS entfernt (ignoriert)", hacsStateArchived: "Archiviert", hacsStateUpdate: "Update", hacsStateCurrent: "Aktuell",
  hacsTodoOne: "{name} wurde von HACS entfernt", hacsTodoMany: "{n} Repositories wurden von HACS entfernt", hacsTodoPill: "Prüfen",
  hacsTodoHint: "Sie laufen weiter, bekommen aber keine Updates mehr.", hacsWhatTitle: "Aus HACS entfernt: was tun?",
  hacsStep1: "Den Grund in HACS ansehen (Zeile öffnen).", hacsStep2: "Prüfen, was daran hängt: bei einer Integration die Entitäten und Automationen, bei einer Karte die Dashboards.",
  hacsStep3: "Je nach Grund zu einem Nachfolger wechseln, weiter nutzen oder in HACS entfernen. Housekeeper ändert in HACS nichts.", hacsStep4: "Wer es bewusst weiter nutzt, ignoriert die Reparatur in Home Assistant. Sie steht dann hier als „ignoriert“.",
  hacsOpenRepairs: "Reparaturen in Home Assistant", hacsRemovedNote: "HACS hat dieses Repository aus seiner Liste genommen: {reason}. Es läuft weiter, bekommt aber keine Updates mehr. Was zu tun ist, steht unter Apps & Integrationen → HACS.",
  hacsNone: "Keine installierten Repositories gefunden.", hacsLoading: "Die Repositories werden gelesen …", hacsOpenInHacs: "In HACS öffnen",
});
Object.assign(TEXT.en, {
  components: "Apps & integrations", componentsSubtitle: "What is installed and whether it runs: apps and integrations by domain, with version, status and scope. Read-only; the numbers come from the scan.",
  compTabApps: "Apps", compTabAppsHint: "state, CPU, RAM, data", compTabCore: "Core integrations", compTabCoreHint: "from Home Assistant, by domain", compTabCustom: "Custom integrations", compTabCustomHint: "version, updates, folder size", compSumSize: "{size} used",
  compEntries: "{n} entries", compNoApps: "No apps (no Supervisor, or none installed).", compNoIntegrations: "No integrations found.",
  compSumApps: "Apps", compSumRunning: "running", compSumCore: "Core integrations", compSumCustomInt: "Custom integrations", compSumProblem: "with a problem", compSumUpdates: "Updates via HACS", compSumAppUpdates: "App updates", compColLatest: "Latest version", compFilterHacs: "HACS", compFilterUpdate: "Update available", compFilterViaHacs: "Via HACS",
  compColVersion: "Version", compColEntries: "Entries", compColDevices: "Devices", compColAvail: "Availability", compColOrigin: "Origin", compUpdate: "Update", compUpdateHint: "Newer version: {v}",
  compOpenEntries: "Show entries", compCloseEntries: "Hide entries", compFilterState: "State",
  compAvailHint: "Worst value of the entries; appears once reliability is calculated.", compSizeHint: "Folder size; appears once Storage & system is loaded.",
  compTabHacs: "HACS", compTabHacsHint: "every installed repository", compSumHacsRemoved: "removed from HACS", compSumHacsUpdates: "updates",
  hacsColRepo: "Repository", hacsColKind: "Kind", hacsColInstalled: "Installed", hacsColLatest: "Latest", hacsColState: "State",
  hacsKind_integration: "Integration", hacsKind_plugin: "Card", hacsKind_theme: "Theme", hacsKind_python_script: "Python script", hacsKind_appdaemon: "AppDaemon", hacsKind_template: "Template", hacsFilterKind: "Kind", hacsFilterState: "State",
  hacsStateRemoved: "Removed from HACS", hacsStateRemovedIgnored: "Removed from HACS (ignored)", hacsStateArchived: "Archived", hacsStateUpdate: "Update", hacsStateCurrent: "Up to date",
  hacsTodoOne: "{name} was removed from HACS", hacsTodoMany: "{n} repositories were removed from HACS", hacsTodoPill: "Review",
  hacsTodoHint: "They keep running but get no more updates.", hacsWhatTitle: "Removed from HACS: what to do?",
  hacsStep1: "Look up the reason in HACS (open the row).", hacsStep2: "Check what depends on it: for an integration the entities and automations, for a card the dashboards.",
  hacsStep3: "Depending on the reason, switch to a successor, keep using it or remove it in HACS. Housekeeper changes nothing in HACS.", hacsStep4: "If you keep using it on purpose, ignore the repair in Home Assistant. It then shows here as “ignored”.",
  hacsOpenRepairs: "Repairs in Home Assistant", hacsRemovedNote: "HACS took this repository out of its list: {reason}. It keeps running but gets no more updates. What to do is under Apps & integrations → HACS.",
  hacsNone: "No installed repositories found.", hacsLoading: "Reading the repositories …", hacsOpenInHacs: "Open in HACS",
});

const COMP_RANK = { problem: 3, disabled: 2, active: 1, ignored: 0 };

class ComponentsMixin {
  // The config entries grouped by domain, with the sums the list shows.
  compIntegrations() {
    return this.memo("compInt", [this.data?.objects, this.reliability?.entries, this.sysState("storage").data, this.lang], () => {
      const sizes = new Map((this.sysState("storage").data?.custom_integrations || []).map(x => [x.domain, x.bytes]));
      const groups = new Map();
      for (const o of this.data?.objects || []) {
        if (o.object_type !== "config_entry") continue;
        const g = groups.get(o.domain) || { domain: o.domain, name: o.integration_name || o.domain, custom: false, version: null, entries: [], entities: 0, devices: 0, status: "ignored", avail: null, hacs: null, bytes: sizes.get(o.domain) ?? null };
        g.entries.push(o);
        g.custom ||= Boolean(o.custom);
        g.version ||= o.integration_version || null;
        g.hacs ||= o.hacs || null;
        g.entities += o.entity_count || 0;
        g.devices += o.device_count || 0;
        if ((COMP_RANK[o.status] ?? 1) > (COMP_RANK[g.status] ?? 1)) g.status = o.status;
        const row = this.reliability?.available ? this.reliabilityRow(o) : null;
        if (row && row.availability !== null && row.availability !== undefined) g.avail = g.avail === null ? row.availability : Math.min(g.avail, row.availability);
        groups.set(o.domain, g);
      }
      return [...groups.values()];
    });
  }

  compRowAttrs(g) {
    return `data-object="${this.esc(`integration:${g.domain}`)}" tabindex="0" role="button" aria-label="${this.esc(g.name)}"`;
  }

  compNameCell(g) {
    const sub = [g.domain, g.entries.length > 1 ? this.t("compEntries", { n: g.entries.length }) : ""].filter(Boolean).join(" · ");
    const open = (this.compOpen || []).includes(g.domain);
    const lead = g.entries.length > 1 ? this.expandBtn("data-comp-open", g.domain, open, this.t(open ? "compCloseEntries" : "compOpenEntries")) : `<span class="tile compgap" aria-hidden="true"></span>`;
    return `<div class="compname">${lead}${this.nameCell(g.name, sub)}</div>`;
  }

  // The entries of an opened integration: one line each, a click opens the entry.
  compEntryRows(g, span) {
    if (!(this.compOpen || []).includes(g.domain)) return "";
    return g.entries.map(o => `<tr data-object="${this.esc(this.objectKey(o))}" tabindex="0" role="button" class="compentry"><td colspan="${span}">${this.nameCell(o.name || g.name, o.title && o.title !== o.name ? o.title : "")}<span class="compentrymeta">${this.pill(o.status)} · ${this.esc(this.formatNumber(o.entity_count || 0))} ${this.t("entities")} · ${this.esc(this.formatNumber(o.device_count || 0))} ${this.t("compColDevices")}</span></td></tr>`).join("");
  }

  compIntegrationsList(items, name) {
    const hasSize = items.some(g => g.bytes !== null);
    const hasAvail = items.some(g => g.avail !== null);
    const max = Math.max(0, ...items.map(g => g.bytes || 0));
    const origin = g => this.t(g.custom ? "originKindCustom" : "originKindCore");
    const columns = [
      { key: "name", label: "sysColIntegration", cell: g => this.compNameCell(g) },
      { key: "version", label: "compColVersion", cell: g => `${this.esc(g.version || "–")}${g.hacs?.pending_update ? ` <span class="pill warn" title="${this.esc(this.t("compUpdateHint", { v: g.hacs.available_version || "" }))}">${this.t("compUpdate")}</span>` : ""}` },
      { key: "state", label: "sysColState", cell: g => this.pill(g.status) },
      { key: "entities", label: "entities", dir: "desc", cell: g => this.esc(this.formatNumber(g.entities)) },
      { key: "devices", label: "compColDevices", dir: "desc", cell: g => this.esc(this.formatNumber(g.devices)) },
      ...(hasAvail ? [{ key: "avail", label: "compColAvail", dir: "asc", cell: g => (g.avail === null ? "–" : `${this.esc(this.formatNumber(Math.round(g.avail * 10) / 10))} %`) }] : []),
      ...(hasSize ? [{ key: "size", label: "sysColSize", dir: "desc", cell: g => (g.bytes === null ? "–" : `${this.esc(this.formatBytes(g.bytes))}${this.sysShare(g.bytes, max)}`) }] : []),
    ];
    return this.sysList(`compint_${name}`, items, {
      sort: "name", dir: "asc",
      sorts: [
        { key: "name", label: "sysColIntegration", dir: "asc", get: g => g.name },
        { key: "entities", label: "entities", dir: "desc", get: g => g.entities },
        { key: "version", label: "compColVersion", dir: "asc", get: g => g.version },
        { key: "state", label: "sysColState", dir: "desc", get: g => COMP_RANK[g.status] ?? 1 },
        { key: "devices", label: "compColDevices", dir: "desc", get: g => g.devices },
        ...(hasSize ? [{ key: "size", label: "sysColSize", dir: "desc", get: g => g.bytes }] : []),
        ...(hasAvail ? [{ key: "avail", label: "compColAvail", dir: "asc", get: g => g.avail }] : []),
      ],
      filters: [
        { name: "state", all: this.t("compFilterState"), options: [["problem", this.statusLabel("problem")], ["disabled", this.statusLabel("disabled")], ["active", this.statusLabel("active")]] },
        ...(items.some(g => g.hacs) ? [{ name: "hacs", all: this.t("compFilterHacs"), options: [["update", this.t("compFilterUpdate")], ["hacs", this.t("compFilterViaHacs")]] }] : []),
      ],
      filterFns: { state: (g, v) => g.status === v, hacs: (g, v) => (v === "update" ? Boolean(g.hacs?.pending_update) : Boolean(g.hacs)) },
      text: g => `${g.name} ${g.domain}`, tie: g => g.domain, empty: "compNoIntegrations",
      rowAttrs: g => this.compRowAttrs(g), columns, after: g => this.compEntryRows(g, columns.length),
      exportName: "integrations", header: [this.t("sysColIntegration"), "Domain", this.t("compColOrigin"), this.t("compColVersion"), this.t("sysColState"), this.t("compColEntries"), this.t("entities"), this.t("compColDevices"), this.t("intHacsAvailable"), this.t("compUpdate")],
      rows: g => [g.name, g.domain, origin(g), g.version || "", this.statusLabel(g.status), g.entries.length, g.entities, g.devices, g.hacs ? g.hacs.available_version || "" : "", g.hacs ? (g.hacs.pending_update ? "yes" : "no") : ""],
    });
  }

  // The state of one HACS repository: what HACS removed comes first, then archived, then an open update.
  hacsState(r) {
    if (r.removed) return { key: r.removed.ignored ? "hacsStateRemovedIgnored" : "hacsStateRemoved", tone: r.removed.ignored ? "mute" : "warn", rank: r.removed.ignored ? 2 : 4 };
    if (r.archived) return { key: "hacsStateArchived", tone: "warn", rank: 3 };
    if (r.pending_update) return { key: "hacsStateUpdate", tone: "warn", rank: 1 };
    return { key: "hacsStateCurrent", tone: "ok", rank: 0 };
  }

  hacsKind(r) {
    const key = `hacsKind_${r.category}`;
    return TEXT[this.lang]?.[key] ? this.t(key) : r.category || "–";
  }

  // What to do about a repository that HACS took out of its list; shown above the list while one is not ignored.
  hacsAdvice(rows) {
    const open = rows.filter(r => r.removed && !r.removed.ignored);
    if (!open.length) return "";
    return `<div class="hacsadvice"><div class="panelhead"><h2>${this.t("hacsWhatTitle")}</h2><div class="actions"><button class="btn" data-ha-path="/config/repairs"><ha-icon icon="mdi:open-in-new"></ha-icon>${this.t("hacsOpenRepairs")}</button></div></div><ol class="factnote">${[1, 2, 3, 4].map(n => `<li>${this.t(`hacsStep${n}`)}</li>`).join("")}</ol></div>`;
  }

  compHacsList(rows) {
    const st = row => this.hacsState(row);
    const columns = [
      { key: "name", label: "hacsColRepo", cell: r => this.nameCell(r.name, r.full_name) },
      { key: "kind", label: "hacsColKind", cell: r => this.esc(this.hacsKind(r)) },
      { key: "installed", label: "hacsColInstalled", cell: r => this.esc(r.installed_version || "–") },
      { key: "latest", label: "hacsColLatest", cell: r => this.esc(r.available_version || "–") },
      { key: "state", label: "hacsColState", cell: r => `<span class="pill ${st(r).tone}">${this.t(st(r).key)}</span>${r.removed?.reason ? `<small>${this.esc(r.removed.reason)}</small>` : ""}` },
    ];
    const kinds = [...new Set(rows.map(r => r.category).filter(Boolean))];
    return this.sysList("hacsrepos", rows, {
      sort: "state", dir: "desc",
      sorts: [
        { key: "state", label: "hacsColState", dir: "desc", get: r => st(r).rank },
        { key: "name", label: "hacsColRepo", dir: "asc", get: r => r.name },
        { key: "kind", label: "hacsColKind", dir: "asc", get: r => this.hacsKind(r) },
      ],
      filters: [
        { name: "kind", all: this.t("hacsFilterKind"), options: kinds.map(k => [k, this.hacsKind({ category: k })]) },
        { name: "state", all: this.t("hacsFilterState"), options: [["removed", this.t("hacsStateRemoved")], ["update", this.t("hacsStateUpdate")], ["archived", this.t("hacsStateArchived")]] },
      ],
      filterFns: { kind: (r, v) => r.category === v, state: (r, v) => (v === "removed" ? Boolean(r.removed) : v === "update" ? Boolean(r.pending_update) : r.archived) },
      text: r => `${r.name} ${r.full_name}`, tie: r => r.id, empty: "hacsNone",
      rowAttrs: r => `data-ha-path="${this.esc(`/hacs/repository/${encodeURIComponent(r.id)}`)}" tabindex="0" role="link" aria-label="${this.esc(`${r.name} · ${this.t("hacsOpenInHacs")}`)}"`,
      columns, exportName: "hacs", header: [this.t("hacsColRepo"), "ID", this.t("hacsColKind"), this.t("hacsColInstalled"), this.t("hacsColLatest"), this.t("hacsColState")],
      rows: r => [r.full_name, r.id, r.category || "", r.installed_version || "", r.available_version || "", this.t(st(r).key)],
    });
  }

  compAppsList(apps) {
    // CPU, RAM and data come from the system report; it is read when this tab opens (see componentsView).
    const usage = new Map((this.sysState("storage").data?.apps || []).map(a => [a.slug, a]));
    const use = a => usage.get(a.object_id) || null;
    const has = key => [...usage.values()].some(u => u[key] !== null && u[key] !== undefined);
    const hasLoad = has("cpu_percent") || has("memory_usage"), hasSize = has("size_bytes");
    const max = Math.max(0, ...[...usage.values()].map(u => u.size_bytes || 0));
    const running = a => a.state === "started";
    const columns = [
      { key: "name", label: "sysColApp", cell: a => this.nameCell(a.name, a.object_id) },
      { key: "state", label: "sysColState", cell: a => `<span class="pill ${running(a) ? "ok" : "mute"}">${this.t(running(a) ? "sysAppRunning" : "sysAppStopped")}</span>` },
      { key: "version", label: "compColVersion", cell: a => `${this.esc(a.version || "–")}${a.update_available ? ` <span class="pill warn" title="${this.esc(this.t("compUpdateHint", { v: a.version_latest || "" }))}">${this.t("compUpdate")}</span>` : ""}` },
      { key: "latest", label: "compColLatest", cell: a => this.esc(a.version_latest || "–") },
      ...(hasLoad ? [
        { key: "cpu", label: "sysColCpu", dir: "desc", cell: a => this.esc(use(a) ? this.sysAppCpu(use(a)) : "–") },
        { key: "ram", label: "sysColRam", dir: "desc", cell: a => this.esc(use(a) ? this.sysAppRam(use(a)) : "–") },
      ] : []),
      ...(hasSize ? [{ key: "size", label: "sysColData", dir: "desc", cell: a => (use(a)?.size_bytes == null ? "–" : `${this.esc(this.formatBytes(use(a).size_bytes))}${this.sysShare(use(a).size_bytes, max)}`) }] : []),
    ];
    return this.sysList("compapps", apps, {
      sort: "name", dir: "asc",
      sorts: [
        { key: "name", label: "sysColApp", dir: "asc", get: a => a.name }, { key: "state", label: "sysColState", dir: "desc", get: a => (running(a) ? 1 : 0) }, { key: "version", label: "compColVersion", dir: "asc", get: a => a.version }, { key: "latest", label: "compColLatest", dir: "asc", get: a => a.version_latest },
        ...(hasLoad ? [{ key: "ram", label: "sysColRam", dir: "desc", get: a => use(a)?.memory_usage ?? null }, { key: "cpu", label: "sysColCpu", dir: "desc", get: a => use(a)?.cpu_percent ?? null }] : []),
        ...(hasSize ? [{ key: "size", label: "sysColData", dir: "desc", get: a => use(a)?.size_bytes ?? null }] : []),
      ],
      filters: [
        { name: "state", all: this.t("sysColState"), options: [["on", this.t("sysAppRunning")], ["off", this.t("sysAppStopped")]] },
        ...(apps.some(a => a.update_available) ? [{ name: "update", all: this.t("compUpdate"), options: [["yes", this.t("compFilterUpdate")]] }] : []),
      ],
      filterFns: { state: (a, v) => running(a) === (v === "on"), update: a => Boolean(a.update_available) },
      text: a => `${a.name} ${a.object_id}`, tie: a => a.object_id, empty: "compNoApps",
      rowAttrs: a => `data-object="${this.esc(this.objectKey(a))}" tabindex="0" role="button" aria-label="${this.esc(a.name)}"`, columns,
      exportName: "apps", header: [this.t("sysColApp"), "Slug", this.t("sysColState"), this.t("compColVersion"), this.t("compColLatest"), "CPU %", "RAM bytes", "Data bytes"],
      rows: a => [a.name, a.object_id, a.state || "", a.version || "", a.version_latest || "", use(a)?.cpu_percent ?? "", use(a)?.memory_usage ?? "", use(a)?.size_bytes ?? ""],
    });
  }

  // What Home Assistant still waits for (discoveries, set-up requests): information only, no finding; it is left out when there is none.
  openFlowsFold() {
    const flows = this.sysState("flows").data?.flows || [];
    if (!flows.length) return "";
    const kinds = ["discovered", "reconfigure"].map(kind => [kind, flows.filter(f => f.kind === kind).length]).filter(([, n]) => n);
    const row = f => `<div class="row" data-ha-path="/config/integrations" tabindex="0" role="link" aria-label="${this.esc(this.t("flowsOpenHa"))}"><span class="tile mute"><ha-icon icon="${f.kind === "reconfigure" ? "mdi:cog-outline" : "mdi:radar"}"></ha-icon></span><span class="row-text"><strong>${this.esc(f.name)}</strong><small>${this.esc(f.kind === "reconfigure" ? this.t("flowReconfigure") : this.t("flowDiscovered", { source: f.source }))}</small></span><span class="pill mute">${this.t(f.kind === "reconfigure" ? "flowPillReconfigure" : "flowPillDiscovered")}</span></div>`;
    const sub = kinds.map(([kind, n]) => this.t(`flowsCount_${kind}`, { n: this.formatNumber(n) })).join(" · ");
    return `<div class="panel">${this.fold("open_flows", { tone: "mute", title: this.t("flowsTitle"), sub: `${sub} · ${this.t("flowsNote")}`, pill: this.formatNumber(flows.length) }, flows.map(row).join(""), false)}</div>`;
  }

  componentsView() {
    const apps = (this.data?.objects || []).filter(o => o.object_type === "app");
    const ints = this.compIntegrations();
    const core = ints.filter(g => !g.custom), custom = ints.filter(g => g.custom);
    const storage = this.sysState("storage").data;
    // Disk space only once "Storage & system" is loaded; apps without a figure add nothing.
    const sum = list => (list.some(x => x !== null && x !== undefined) ? list.reduce((t, x) => t + (x || 0), 0) : null);
    const appBytes = storage ? sum(apps.map(a => (storage.apps || []).find(u => u.slug === a.object_id)?.size_bytes)) : null;
    const customBytes = storage ? sum(custom.map(g => g.bytes)) : null;
    const size = b => (b === null ? "" : this.t("compSumSize", { size: this.formatBytes(b) }));
    const n = f => this.formatNumber(f);
    const bad = list => list.filter(g => g.status === "problem").length;
    const fact = (count, label, tone) => (count ? { text: `${n(count)} ${this.t(label)}`, tone } : null);
    const sizeFact = b => (size(b) ? { text: size(b), tone: "mute" } : null);
    const tabs = [
      { id: "apps", icon: "mdi:apps", label: this.t("compTabApps"), hint: this.t("compTabAppsHint"), count: apps.length,
        facts: [fact(apps.filter(a => a.update_available).length, "compSumAppUpdates", "warn"), fact(apps.filter(a => a.state === "started").length, "compSumRunning", "ok"), sizeFact(appBytes)] },
      { id: "core", icon: "mdi:puzzle-outline", label: this.t("compTabCore"), hint: this.t("compTabCoreHint"), count: core.length,
        facts: [fact(bad(core), "compSumProblem", "red")] },
      { id: "custom", icon: "mdi:puzzle-plus-outline", label: this.t("compTabCustom"), hint: this.t("compTabCustomHint"), count: custom.length,
        facts: [fact(bad(custom), "compSumProblem", "red"), fact(custom.filter(g => g.hacs?.pending_update).length, "compSumUpdates", "warn"), sizeFact(customBytes)] },
    ];
    const hacsSt = this.data?.meta?.hacs_available ? this.sysEnsure("hacs") : null;
    const repos = hacsSt?.data?.repositories || [];
    if (hacsSt) {
      tabs.push({ id: "hacs", icon: "mdi:store-outline", label: this.t("compTabHacs"), hint: this.t("compTabHacsHint"), count: hacsSt.data ? repos.length : null,
        facts: [fact(repos.filter(r => r.removed && !r.removed.ignored).length, "compSumHacsRemoved", "warn"), fact(repos.filter(r => r.pending_update).length, "compSumHacsUpdates", "warn")] });
    }
    tabs.forEach((t, i) => { tabs[i] = { ...t, facts: t.facts.filter(Boolean), tone: t.facts.some(f => f?.tone === "red") ? "red" : "mute" }; });
    const open = this.viewTabOf("components", tabs, "core");
    if (apps.length || custom.length) this.sysEnsure("storage"); // CPU, RAM and data of the apps, folder sizes of custom integrations
    this.sysEnsure("flows");
    const hacsBody = !hacsSt?.data ? (hacsSt?.error ? `${this.notice("err", hacsSt.error)}` : this.skeleton("hacsLoading")) : `${this.hacsAdvice(repos)}${this.compHacsList(repos)}`;
    const body = open === "apps" ? this.compAppsList(apps) : open === "hacs" ? hacsBody : this.compIntegrationsList(open === "custom" ? custom : core, open);
    const st = this.sysState(open === "hacs" ? "hacs" : "storage");
    const bar = this.pageBar({ at: st.at, loading: st.loading, attr: `data-sys-refresh="${open === "hacs" ? "hacs" : "storage"}"` });
    return `<div class="stack">${bar}${this.openFlowsFold()}${this.navTiles("components", tabs, open, this.t("components"), true)}<div class="panel">${body}</div></div>`;
  }
}
