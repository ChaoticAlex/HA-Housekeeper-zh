// "Apps & integrations": the installed apps and the integrations by domain in one place. It only gathers what the scan, the
// reliability numbers and the storage page already know and links to the detail pages; it keeps no numbers of its own.
Object.assign(TEXT.de, {
  components: "Apps & Integrationen", componentsSubtitle: "Was installiert ist und ob es läuft: Apps und Integrationen nach Domain, mit Version, Status und Umfang. Liest nur, die Zahlen kommen aus dem Scan.",
  compTabApps: "Apps", compTabAppsHint: "Status, CPU, RAM, Daten", compTabIntegrations: "Integrationen", compTabIntegrationsHint: "nach Domain",
  compEntries: "{n} Einträge", compNoApps: "Keine Apps (kein Supervisor oder keine installiert).", compNoIntegrations: "Keine Integrationen gefunden.",
  compSumApps: "Apps", compSumRunning: "laufen", compSumIntegrations: "Integrationen", compSumCustom: "davon Custom", compSumProblem: "mit Problem", compSumUpdates: "Updates über HACS", compFilterHacs: "HACS", compFilterUpdate: "Update verfügbar", compFilterViaHacs: "Über HACS",
  compColVersion: "Version", compColEntries: "Einträge", compColDevices: "Geräte", compColAvail: "Verfügbarkeit", compColOrigin: "Herkunft", compUpdate: "Update", compUpdateHint: "Neuere Version: {v}",
  compAvailHint: "Schlechtester Wert der Einträge; erscheint, sobald die Zuverlässigkeit berechnet ist.", compSizeHint: "Ordnergröße; erscheint, sobald „Speicher & System“ geladen ist.",
});
Object.assign(TEXT.en, {
  components: "Apps & integrations", componentsSubtitle: "What is installed and whether it runs: apps and integrations by domain, with version, status and scope. Read-only; the numbers come from the scan.",
  compTabApps: "Apps", compTabAppsHint: "state, CPU, RAM, data", compTabIntegrations: "Integrations", compTabIntegrationsHint: "by domain",
  compEntries: "{n} entries", compNoApps: "No apps (no Supervisor, or none installed).", compNoIntegrations: "No integrations found.",
  compSumApps: "Apps", compSumRunning: "running", compSumIntegrations: "Integrations", compSumCustom: "of them custom", compSumProblem: "with a problem", compSumUpdates: "Updates via HACS", compFilterHacs: "HACS", compFilterUpdate: "Update available", compFilterViaHacs: "Via HACS",
  compColVersion: "Version", compColEntries: "Entries", compColDevices: "Devices", compColAvail: "Availability", compColOrigin: "Origin", compUpdate: "Update", compUpdateHint: "Newer version: {v}",
  compAvailHint: "Worst value of the entries; appears once reliability is calculated.", compSizeHint: "Folder size; appears once Storage & system is loaded.",
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
    return this.nameCell(g.name, sub);
  }

  compIntegrationsList(items) {
    const hasSize = items.some(g => g.bytes !== null);
    const hasAvail = items.some(g => g.avail !== null);
    const max = Math.max(0, ...items.map(g => g.bytes || 0));
    const origin = g => this.t(g.custom ? "originKindCustom" : "originKindCore");
    const columns = [
      { key: "name", label: "sysColIntegration", cell: g => this.compNameCell(g) },
      { key: "origin", label: "compColOrigin", cell: g => `<span class="pill ${g.custom ? "violet" : "mute"}">${this.esc(origin(g))}</span>` },
      { key: "version", label: "compColVersion", cell: g => `${this.esc(g.version || "–")}${g.hacs?.pending_update ? ` <span class="pill warn" title="${this.esc(this.t("compUpdateHint", { v: g.hacs.available_version || "" }))}">${this.t("compUpdate")}</span>` : ""}` },
      { key: "state", label: "sysColState", cell: g => this.pill(g.status) },
      { key: "entities", label: "entities", dir: "desc", cell: g => this.esc(this.formatNumber(g.entities)) },
      { key: "devices", label: "compColDevices", dir: "desc", cell: g => this.esc(this.formatNumber(g.devices)) },
      ...(hasAvail ? [{ key: "avail", label: "compColAvail", dir: "asc", cell: g => (g.avail === null ? "–" : `${this.esc(this.formatNumber(Math.round(g.avail * 10) / 10))} %`) }] : []),
      ...(hasSize ? [{ key: "size", label: "sysColSize", dir: "desc", cell: g => (g.bytes === null ? "–" : `${this.esc(this.formatBytes(g.bytes))}${this.sysShare(g.bytes, max)}`) }] : []),
    ];
    return this.sysList("compint", items, {
      sort: "name", dir: "asc",
      sorts: [
        { key: "name", label: "sysColIntegration", dir: "asc", get: g => g.name },
        { key: "entities", label: "entities", dir: "desc", get: g => g.entities },
        { key: "version", label: "compColVersion", dir: "asc", get: g => g.version },
        ...(hasSize ? [{ key: "size", label: "sysColSize", dir: "desc", get: g => g.bytes }] : []),
        ...(hasAvail ? [{ key: "avail", label: "compColAvail", dir: "asc", get: g => g.avail }] : []),
      ],
      filters: [
        { name: "origin", all: this.t("allOrigins"), options: [["core", this.t("originKindCore")], ["custom", this.t("originKindCustom")]] },
        ...(items.some(g => g.hacs) ? [{ name: "hacs", all: this.t("compFilterHacs"), options: [["update", this.t("compFilterUpdate")], ["hacs", this.t("compFilterViaHacs")]] }] : []),
      ],
      filterFns: { origin: (g, v) => g.custom === (v === "custom"), hacs: (g, v) => (v === "update" ? Boolean(g.hacs?.pending_update) : Boolean(g.hacs)) },
      text: g => `${g.name} ${g.domain}`, tie: g => g.domain, empty: "compNoIntegrations",
      rowAttrs: g => this.compRowAttrs(g), columns,
      exportName: "integrations", header: [this.t("sysColIntegration"), "Domain", this.t("compColOrigin"), this.t("compColVersion"), this.t("sysColState"), this.t("compColEntries"), this.t("entities"), this.t("compColDevices"), this.t("intHacsAvailable"), this.t("compUpdate")],
      rows: g => [g.name, g.domain, origin(g), g.version || "", this.statusLabel(g.status), g.entries.length, g.entities, g.devices, g.hacs ? g.hacs.available_version || "" : "", g.hacs ? (g.hacs.pending_update ? "yes" : "no") : ""],
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
      { key: "state", label: "sysColState", sortable: false, cell: a => `<span class="pill ${running(a) ? "ok" : "mute"}">${this.t(running(a) ? "sysAppRunning" : "sysAppStopped")}</span>` },
      { key: "version", label: "compColVersion", cell: a => `${this.esc(a.version || "–")}${a.update_available ? ` <span class="pill warn" title="${this.esc(this.t("compUpdateHint", { v: a.version_latest || "" }))}">${this.t("compUpdate")}</span>` : ""}` },
      ...(hasLoad ? [
        { key: "cpu", label: "sysColCpu", dir: "desc", cell: a => this.esc(use(a) ? this.sysAppCpu(use(a)) : "–") },
        { key: "ram", label: "sysColRam", dir: "desc", cell: a => this.esc(use(a) ? this.sysAppRam(use(a)) : "–") },
      ] : []),
      ...(hasSize ? [{ key: "size", label: "sysColData", dir: "desc", cell: a => (use(a)?.size_bytes == null ? "–" : `${this.esc(this.formatBytes(use(a).size_bytes))}${this.sysShare(use(a).size_bytes, max)}`) }] : []),
    ];
    return this.sysList("compapps", apps, {
      sort: "name", dir: "asc",
      sorts: [
        { key: "name", label: "sysColApp", dir: "asc", get: a => a.name }, { key: "version", label: "compColVersion", dir: "asc", get: a => a.version },
        ...(hasLoad ? [{ key: "ram", label: "sysColRam", dir: "desc", get: a => use(a)?.memory_usage ?? null }, { key: "cpu", label: "sysColCpu", dir: "desc", get: a => use(a)?.cpu_percent ?? null }] : []),
        ...(hasSize ? [{ key: "size", label: "sysColData", dir: "desc", get: a => use(a)?.size_bytes ?? null }] : []),
      ],
      filters: [{ name: "state", all: this.t("sysColState"), options: [["on", this.t("sysAppRunning")], ["off", this.t("sysAppStopped")]] }],
      filterFns: { state: (a, v) => running(a) === (v === "on") },
      text: a => `${a.name} ${a.object_id}`, tie: a => a.object_id, empty: "compNoApps",
      rowAttrs: a => `data-object="${this.esc(this.objectKey(a))}" tabindex="0" role="button" aria-label="${this.esc(a.name)}"`, columns,
      exportName: "apps", header: [this.t("sysColApp"), "Slug", this.t("sysColState"), this.t("compColVersion"), "CPU %", "RAM bytes", "Data bytes"],
      rows: a => [a.name, a.object_id, a.state || "", a.version || "", use(a)?.cpu_percent ?? "", use(a)?.memory_usage ?? "", use(a)?.size_bytes ?? ""],
    });
  }

  componentsView() {
    const apps = (this.data?.objects || []).filter(o => o.object_type === "app");
    const ints = this.compIntegrations();
    const tabs = [
      { id: "apps", icon: "mdi:apps", label: this.t("compTabApps"), hint: this.t("compTabAppsHint"), count: apps.length },
      { id: "integrations", icon: "mdi:puzzle-outline", label: this.t("compTabIntegrations"), hint: this.t("compTabIntegrationsHint"), count: ints.length },
    ];
    const open = this.viewTabOf("components", tabs, "integrations");
    const n = f => this.formatNumber(f);
    const problems = ints.filter(g => g.status === "problem").length, updates = ints.filter(g => g.hacs?.pending_update).length;
    const tiles = this.sumTiles([
      { label: this.t("compSumApps"), value: n(apps.length), sub: `${n(apps.filter(a => a.state === "started").length)} ${this.t("compSumRunning")}`, tone: "mute" },
      { label: this.t("compSumIntegrations"), value: n(ints.length), sub: `${n(ints.filter(g => g.custom).length)} ${this.t("compSumCustom")}`, tone: "mute" },
      problems ? { label: this.t("compSumProblem"), value: n(problems), tone: "red" } : null,
      updates ? { label: this.t("compSumUpdates"), value: n(updates), tone: "warn" } : null,
    ]);
    if (open === "apps" && apps.length) this.sysEnsure("storage"); // CPU, RAM and data of the apps
    const body = open === "apps" ? this.compAppsList(apps) : this.compIntegrationsList(ints);
    return `<div class="stack">${tiles}<div class="sysnav">${this.navTiles("components", tabs, open, this.t("components"), true)}</div><div class="panel">${body}</div></div>`;
  }
}
