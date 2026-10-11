// SystemMixin: the pages "Storage & system" and "Access & data flow" under Explore; mixed in by 99-register.js.
// All three only read. A page loads on its first visit; its refresh button reads again.
// Page and WebSocket command; another page can add itself (see 75-credentials.js).
const SYS_COMMANDS = { storage: "system_usage", dataflow: "access" };
const SYS_WARN_PERCENT = 85, SYS_RED_PERCENT = 95;

class SystemMixin {
  sysState(name) {
    return ((this._sys ||= {})[name] ||= { data: null, loading: false, error: "", requested: false, at: null });
  }

  async sysLoad(name) {
    const st = this.sysState(name);
    st.loading = true; st.error = ""; st.requested = true; this.render();
    try {
      st.data = await this._hass.callWS({ type: `ha_housekeeper/${SYS_COMMANDS[name]}` });
      st.at = new Date().toISOString();
    } catch (err) { st.error = this.errText(err); }
    st.loading = false;
    this.render();
  }

  // Loads on the first visit only; later visits show what was read until the person refreshes.
  sysEnsure(name) {
    const st = this.sysState(name);
    if (!st.loading && !st.requested) { st.requested = true; setTimeout(() => this.sysLoad(name), 0); }
    return st;
  }

  sysHead(name, title, hint) {
    const st = this.sysState(name);
    const at = st.at ? `<span class="scanago">${this.esc(this.t("sysAsOf", { time: this.formatDate(st.at) }))}</span>` : "";
    return `<div class="panelhead"><div><h2>${this.t(title)}</h2><p>${this.t(hint)}</p></div><div class="actions">${at}<button class="btn" data-sys-refresh="${name}" ${st.loading ? "disabled" : ""}><ha-icon icon="mdi:refresh"></ha-icon>${this.t("sysRefresh")}</button></div></div>`;
  }

  // Loading, error or the page: the frame every one of the three pages shares.
  sysFrame(name, title, hint, loading, build) {
    const st = this.sysEnsure(name), head = this.sysHead(name, title, hint);
    if (st.error) return `<div class="panel">${head}<div class="error">${this.esc(st.error)}</div></div>`;
    if (!st.data) return `<div class="panel">${head}${this.skeleton(loading)}</div>`;
    return build(st.data, head);
  }

  sysTone(percent) {
    if (percent === null || percent === undefined) return "mute";
    return percent >= SYS_RED_PERCENT ? "red" : percent >= SYS_WARN_PERCENT ? "warn" : "ok";
  }

  sysPercent(value) {
    return value === null || value === undefined ? "–" : `${this.formatNumber(Math.round(value * 10) / 10)} %`;
  }

  // A thin bar under a key figure.
  sysMeter(percent) {
    if (percent === null || percent === undefined) return "";
    const width = Math.max(0, Math.min(100, Number(percent) || 0));
    return `<span class="sysmeter ${this.sysTone(percent)}" role="img" aria-label="${this.esc(this.sysPercent(percent))}"><i style="width:${width}%"></i></span>`;
  }

  // The share of a row against the largest one of its list, as a bar.
  sysShare(value, max) {
    const width = max > 0 && value > 0 ? Math.max(1, Math.round((value / max) * 100)) : 0;
    return `<span class="sysshare" role="img" aria-label="${width} %"><i style="width:${width}%"></i></span>`;
  }

  // One sortable, searchable list with paging and CSV export: the way every list of Housekeeper works.
  // opt: { sort, dir, sorts, text, tie, filters, filterFns, columns, exportName, header, rows, empty, cls, rowAttrs }
  sysList(id, items, opt) {
    this.lvState(id, opt.sort, opt.dir || "asc");
    if (opt.exportName) this.setExporter(id, opt.exportName, opt.header, () => refined.map(opt.rows));
    const bar = items.length >= 6 || this.lv[id].q || Object.values(this.lv[id].f).some(Boolean) ? this.listBar(id, { sorts: opt.sorts, filters: opt.filters || [] }) : "";
    const refined = this.refine(id, items, { text: opt.text, filters: opt.filterFns || {}, sorts: opt.sorts, tie: opt.tie });
    const pg = this.paginate(id, refined);
    const table = refined.length
      ? this.listTable(id, opt.columns, pg.rows, { cls: opt.cls || "", rowAttrs: opt.rowAttrs || (() => 'class="static"') })
      : `<div class="emptymsg">${items.length ? this.noMatches(id) : `<ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.t(opt.empty)}`}</div>`;
    return `${bar}${table}${pg.footer}`;
  }

  // ---------------------------------------------------------------- Storage & system

  storageView() {
    return this.sysFrame("storage", "sysTitle", "sysHint", "sysLoading", (r, head) => {
      const disk = r.disk || {}, ram = r.ram || {}, cpu = r.cpu || {}, swap = r.swap || {}, load = r.load;
      const of = (used, total) => this.esc(this.t("sysOf", { used: this.formatBytes(used), total: this.formatBytes(total) }));
      const ramSub = [ram.total ? of(ram.used, ram.total) : "", r.apps_memory ? this.esc(this.t("sysAppsRam", { n: this.formatBytes(r.apps_memory) })) : ""].filter(Boolean).join(" · ");
      const cpuSub = [cpu.count ? this.esc(this.t("sysCores", { n: cpu.count })) : "", load ? this.esc(this.t("sysLoad", { a: this.formatNumber(load["1m"]), b: this.formatNumber(load["5m"]), c: this.formatNumber(load["15m"]) })) : ""].filter(Boolean).join(" · ");
      const tiles = this.sumTiles([
        { label: this.t("sysDiskUsed"), value: this.esc(this.sysPercent(disk.percent)), sub: disk.total ? of(disk.used, disk.total) : this.esc(this.t("sysUnknown")), tone: this.sysTone(disk.percent), spark: this.sysMeter(disk.percent) },
        { label: this.t("sysDiskFree"), value: disk.free !== undefined && disk.free !== null ? this.esc(this.formatBytes(disk.free)) : "–", sub: disk.source ? this.esc(this.t(`sysSrc_${disk.source}`)) : "", tone: this.sysTone(disk.percent) },
        { label: this.t("sysRam"), value: this.esc(this.sysPercent(ram.percent)), sub: ramSub || this.esc(this.t("sysUnknown")), tone: this.sysTone(ram.percent), spark: this.sysMeter(ram.percent) },
        { label: this.t("sysCpu"), value: this.esc(this.sysPercent(cpu.percent)), sub: cpuSub || this.esc(this.t("sysUnknown")), tone: this.sysTone(cpu.percent), spark: this.sysMeter(cpu.percent) },
      ]);
      const swapLine = swap.total ? `<p class="factnote">${this.esc(this.t("sysSwap", { used: this.formatBytes(swap.used), total: this.formatBytes(swap.total), pct: this.sysPercent(swap.percent) }))}<br><small>${this.t("sysSwapHint")}</small></p>` : "";
      const cats = r.categories?.children || [];
      const sup = Boolean(r.supervisor);
      const noSup = { disabled: true, hint: this.t("sysNoSupervisor") };
      const tabs = [
        { id: "categories", icon: "mdi:chart-donut", label: this.t("sysTabCategories"), hint: this.t("sysTabCategoriesHint"), count: cats.length, ...(sup ? {} : noSup) },
        { id: "consumers", icon: "mdi:folder-outline", label: this.t("sysTabConsumers"), hint: this.t("sysTabConsumersHint"), count: r.breakdown.length },
        { id: "custom", icon: "mdi:puzzle-outline", label: this.t("sysTabCustom"), hint: this.t("sysTabCustomHint"), count: r.custom_integrations.length },
        { id: "apps", icon: "mdi:package-variant-closed", label: this.t("sysTabApps"), hint: this.t("sysTabAppsHint"), count: r.apps.length, ...(sup ? {} : noSup) },
        { id: "cards", icon: "mdi:cards-outline", label: this.t("sysTabCards"), hint: this.t("sysTabCardsHint"), count: r.cards.length },
        { id: "blueprints", icon: "mdi:floor-plan", label: this.t("sysTabBlueprints"), hint: this.t("sysTabBlueprintsHint"), count: r.blueprints.length },
      ];
      const open = this.viewTabOf("storage", tabs.filter(x => !x.disabled), sup && cats.length ? "categories" : "consumers");
      const tab = tabs.find(x => x.id === open);
      const body = { categories: () => this.sysCategories(cats), consumers: () => this.sysConsumers(r.breakdown), custom: () => this.sysCustom(r.custom_integrations), apps: () => this.sysApps(r.apps), cards: () => this.sysCards(r.cards), blueprints: () => this.sysBlueprints(r.blueprints) }[open]();
      return `<div class="stack"><div class="panel">${head}<div class="pad"><p class="factnote">${this.t("sysIntro")}</p></div></div>${tiles}${swapLine ? `<div class="panel"><div class="pad">${swapLine}</div></div>` : ""}<div class="sysnav">${this.navTiles("storage", tabs, open, this.t("storage"))}</div><div class="panel"><div class="panelhead"><div><h2>${this.esc(tab.label)}</h2><p>${this.esc(tab.hint)}</p></div></div>${body}${this.howCounted("sysFootnote")}</div></div>`;
    });
  }

  sysSizeColumns(max) {
    return [
      { key: "size", label: "sysColSize", dir: "desc", cell: x => (x.bytes === null || x.bytes === undefined ? `<span class="muted">${this.t("sysExternal")}</span>` : this.esc(this.formatBytes(x.bytes))) },
      { key: "share", label: "sysColShare", sortable: false, cell: x => this.sysShare(x.bytes || 0, max) },
    ];
  }

  sysBySize() { return [{ key: "size", label: "sysColSize", dir: "desc", get: x => x.bytes ?? null }]; }

  sysCategories(cats) {
    const max = Math.max(0, ...cats.map(c => c.bytes));
    return this.sysList("syscat", cats, {
      sort: "size", dir: "desc", sorts: [...this.sysBySize(), { key: "name", label: "sysColCategory", dir: "asc", get: c => c.label }],
      text: c => `${c.label} ${c.id}`, tie: c => c.id, empty: "sysNoCategories",
      columns: [{ key: "name", label: "sysColCategory", cell: c => this.nameCell(c.label, c.id !== c.label ? c.id : "") }, ...this.sysSizeColumns(max)],
      exportName: "storage-categories", header: [this.t("sysColCategory"), "ID", "Bytes"], rows: c => [c.label, c.id, c.bytes],
    });
  }

  sysConsumers(items) {
    const max = Math.max(0, ...items.map(x => x.bytes));
    const name = x => this.t(`sysTarget_${x.id}`);
    return this.sysList("syscons", items, {
      sort: "size", dir: "desc", sorts: [...this.sysBySize(), { key: "name", label: "sysColPlace", dir: "asc", get: name }],
      text: x => `${name(x)} ${x.path}`, tie: x => x.id, empty: "sysNoConsumers",
      columns: [{ key: "name", label: "sysColPlace", cell: x => this.nameCell(name(x), `/config/${x.path}`) }, ...this.sysSizeColumns(max)],
      exportName: "storage-consumers", header: [this.t("sysColPlace"), "Path", "Bytes"], rows: x => [name(x), `/config/${x.path}`, x.bytes],
    });
  }

  // The integration's name as Housekeeper's inventory knows it, for a custom_components folder.
  sysIntegrationName(domain) {
    const names = this.memo("sysNames", [], () => {
      const map = new Map();
      for (const o of this.data?.objects || []) if (o.object_type === "config_entry" && o.integration_name && !map.has(o.domain)) map.set(o.domain, o.integration_name);
      return map;
    });
    return names.get(domain) || domain;
  }

  sysCustom(items) {
    const max = Math.max(0, ...items.map(x => x.bytes));
    return this.sysList("syscustom", items, {
      sort: "size", dir: "desc", sorts: [...this.sysBySize(), { key: "name", label: "sysColIntegration", dir: "asc", get: x => this.sysIntegrationName(x.domain) }],
      text: x => `${this.sysIntegrationName(x.domain)} ${x.domain}`, tie: x => x.domain, empty: "sysNoCustom",
      columns: [{ key: "name", label: "sysColIntegration", cell: x => this.nameCell(this.sysIntegrationName(x.domain), `custom_components/${x.domain}`) }, ...this.sysSizeColumns(max)],
      exportName: "storage-custom-integrations", header: [this.t("sysColIntegration"), "Domain", "Bytes"], rows: x => [this.sysIntegrationName(x.domain), x.domain, x.bytes],
    });
  }

  sysApps(apps) {
    const max = Math.max(0, ...apps.map(a => a.size_bytes || 0));
    const ram = a => (a.memory_usage === null || a.memory_usage === undefined ? "–" : `${this.formatBytes(a.memory_usage)}${a.memory_limit ? ` / ${this.formatBytes(a.memory_limit)}` : ""}`);
    const cpu = a => (a.cpu_percent === null || a.cpu_percent === undefined ? "–" : `${this.formatNumber(Math.round(a.cpu_percent * 10) / 10)} %`);
    const running = a => a.state === "started";
    return this.sysList("sysapps", apps, {
      sort: "ram", dir: "desc",
      sorts: [{ key: "ram", label: "sysColRam", dir: "desc", get: a => a.memory_usage ?? null }, { key: "cpu", label: "sysColCpu", dir: "desc", get: a => a.cpu_percent ?? null }, { key: "size", label: "sysColData", dir: "desc", get: a => a.size_bytes ?? null }, { key: "name", label: "sysColApp", dir: "asc", get: a => a.name }],
      filters: [{ name: "state", all: this.t("sysColState"), options: [["on", this.t("sysAppRunning")], ["off", this.t("sysAppStopped")]] }],
      filterFns: { state: (a, v) => running(a) === (v === "on") },
      text: a => `${a.name} ${a.slug}`, tie: a => a.slug, empty: "sysNoApps",
      columns: [
        { key: "name", label: "sysColApp", cell: a => this.nameCell(a.name, a.slug) },
        { key: "state", label: "sysColState", sortable: false, cell: a => `<span class="pill ${running(a) ? "ok" : "mute"}">${this.t(running(a) ? "sysAppRunning" : "sysAppStopped")}</span>` },
        { key: "cpu", label: "sysColCpu", dir: "desc", cell: a => this.esc(cpu(a)) },
        { key: "ram", label: "sysColRam", dir: "desc", cell: a => this.esc(ram(a)) },
        { key: "size", label: "sysColData", dir: "desc", cell: a => (a.size_bytes === null || a.size_bytes === undefined ? "–" : `${this.esc(this.formatBytes(a.size_bytes))}${this.sysShare(a.size_bytes, max)}`) },
      ],
      exportName: "storage-apps", header: [this.t("sysColApp"), "Slug", this.t("sysColState"), "CPU %", "RAM bytes", "RAM limit", "Data bytes"], rows: a => [a.name, a.slug, a.state || "", a.cpu_percent ?? "", a.memory_usage ?? "", a.memory_limit ?? "", a.size_bytes ?? ""],
    });
  }

  sysCards(cards) {
    const max = Math.max(0, ...cards.map(c => c.bytes || 0));
    const file = c => (String(c.url).split("?")[0].split("/").filter(Boolean).pop() || c.url);
    const cols = this.sysSizeColumns(max);
    cols[0] = { ...cols[0], cell: c => (c.bytes === null || c.bytes === undefined ? `<span class="muted">${this.t("sysExternal")}</span>` : `${this.esc(this.formatBytes(c.bytes))}${c.scope === "folder" ? ` <span class="pill mute" title="${this.esc(this.t("sysFolderHint"))}">${this.t("sysFolder")}</span>` : ""}`) };
    return this.sysList("syscards", cards, {
      sort: "size", dir: "desc", sorts: [...this.sysBySize(), { key: "name", label: "sysColUrl", dir: "asc", get: file }],
      text: c => `${c.url} ${c.type}`, tie: c => c.url, empty: "sysNoCards",
      columns: [{ key: "name", label: "sysColUrl", cell: c => this.nameCell(file(c), c.url) }, { key: "type", label: "sysColType", sortable: false, cell: c => `<span class="pill mute">${this.esc(c.type || "–")}</span>` }, ...cols],
      exportName: "storage-custom-cards", header: [this.t("sysColUrl"), this.t("sysColType"), "Bytes"], rows: c => [c.url, c.type, c.bytes ?? ""],
    });
  }

  sysBlueprints(items) {
    const max = Math.max(0, ...items.map(b => b.bytes || 0));
    return this.sysList("sysbp", items, {
      sort: "size", dir: "desc",
      sorts: [...this.sysBySize(), { key: "name", label: "sysColName", dir: "asc", get: b => b.name }, { key: "author", label: "sysColAuthor", dir: "asc", get: b => b.author }],
      filters: [{ name: "domain", all: this.t("sysColDomain"), options: [...new Set(items.map(b => b.domain))].sort().map(d => [d, d]) }],
      filterFns: { domain: (b, v) => b.domain === v },
      text: b => `${b.name} ${b.path} ${b.author || ""}`, tie: b => `${b.domain}/${b.path}`, empty: "sysNoBlueprints",
      columns: [
        { key: "name", label: "sysColName", cell: b => this.nameCell(b.name, `${b.domain}/${b.path}`) },
        { key: "domain", label: "sysColDomain", sortable: false, cell: b => `<span class="pill mute">${this.esc(b.domain)}</span>` },
        { key: "author", label: "sysColAuthor", cell: b => this.esc(b.author || "–") },
        ...this.sysSizeColumns(max),
      ],
      exportName: "storage-blueprints", header: [this.t("sysColName"), this.t("sysColDomain"), "Path", this.t("sysColAuthor"), "Bytes"], rows: b => [b.name, b.domain, b.path, b.author || "", b.bytes ?? ""],
    });
  }

  // ---------------------------------------------------------------- Access & data flow

  accPills(list, tone = "") { return `<span class="pills">${list.map(text => `<span class="pill ${tone}">${this.esc(text)}</span>`).join("")}</span>`; }

  accAccessLabels(e) {
    const labels = e.access.map(a => `${this.t(`accKind_${a.kind}`)}${a.detail ? ` (${a.detail})` : ""}`);
    if (e.gps && !e.access.some(a => a.kind === "location")) labels.push(this.t("accGps"));
    if (e.camera && !e.access.some(a => a.kind === "camera")) labels.push(this.t("accCamera"));
    return labels;
  }

  accRiskPill(risk) { return `<span class="pill ${{ high: "red", medium: "warn", low: "ok" }[risk] || "mute"}">${this.t(`accRisk_${risk}`)}</span>`; }

  accIntegrationCell(e) {
    const disabled = e.disabled ? ` <span class="pill mute">${this.t("accDisabled")}</span>` : "";
    return `${this.nameCell(e.title || e.domain, e.domain)}${disabled}`;
  }

  // A row opens the integration's page in Housekeeper when the inventory knows it.
  accRowAttrs(e) {
    const key = `config_entry:${e.entry_id}`;
    return this.findObject(key) ? `data-object="${this.esc(key)}" tabindex="0" role="button" aria-label="${this.esc(e.title || e.domain)}"` : 'class="static"';
  }

  dataflowView() {
    return this.sysFrame("dataflow", "accTitle", "accHint", "accLoading", (r, head) => {
      const entries = r.entries || [];
      const sys = entries.filter(e => e.access.length || e.gps || e.camera);
      const cloud = entries.filter(e => e.external);
      const high = entries.filter(e => e.risk === "high").length;
      const tiles = this.sumTiles([
        { label: this.t("accSumTotal"), value: this.esc(this.formatNumber(entries.length)), tone: "mute" },
        { label: this.t("accSumAccess"), value: this.esc(this.formatNumber(sys.length)), tone: sys.length ? "warn" : "ok" },
        { label: this.t("accSumHigh"), value: this.esc(this.formatNumber(high)), tone: high ? "red" : "ok" },
        { label: this.t("accSumExternal"), value: this.esc(this.formatNumber(cloud.length)), tone: cloud.length ? "warn" : "ok" },
        r.apps_available ? { label: this.t("accSumApps"), value: this.esc(this.formatNumber((r.apps || []).filter(a => a.risk === "high").length)), sub: this.esc(this.t("accSumAppsSub", { n: this.formatNumber((r.apps || []).length) })), tone: (r.apps || []).some(a => a.risk === "high") ? "red" : "ok" } : null,
      ]);
      const risks = [["high", this.t("accRisk_high")], ["medium", this.t("accRisk_medium")], ["low", this.t("accRisk_low")]];
      const riskOrder = { high: 0, medium: 1, low: 2 };
      const flows = e => e.flows.map(f => this.t(`accFlow_${f}`));
      const base = {
        tie: e => e.entry_id, rowAttrs: e => this.accRowAttrs(e), cls: "acc",
        filters: [{ name: "risk", all: this.t("accAllRisks"), options: risks }], filterFns: { risk: (e, v) => e.risk === v },
        text: e => `${e.domain} ${e.title} ${this.accAccessLabels(e).join(" ")} ${flows(e).join(" ")}`,
      };
      const sorts = [{ key: "risk", label: "accColRisk", dir: "asc", get: e => riskOrder[e.risk] }, { key: "name", label: "accColIntegration", dir: "asc", get: e => `${e.domain} ${e.title}` }];
      const sysTable = this.sysList("accsys", sys, {
        ...base, sort: "risk", sorts, empty: "accNoneSys",
        columns: [
          { key: "name", label: "accColIntegration", cell: e => this.accIntegrationCell(e) },
          { key: "access", label: "accColAccess", sortable: false, cell: e => this.accPills(this.accAccessLabels(e), "warn") },
          { key: "flow", label: "accColFlow", sortable: false, cell: e => this.accPills(flows(e)) },
          { key: "risk", label: "accColRisk", cell: e => this.accRiskPill(e.risk) },
        ],
        exportName: "system-access", header: [this.t("accColIntegration"), "Domain", this.t("accColAccess"), this.t("accColFlow"), this.t("accColRisk")], rows: e => [e.title, e.domain, this.accAccessLabels(e).join("; "), flows(e).join("; "), this.t(`accRisk_${e.risk}`)],
      });
      const target = e => {
        const named = e.access.filter(a => a.kind === "cloud_api" || a.kind === "cloud").map(a => `${this.t(`accKind_${a.kind}`)}${a.detail ? ` (${a.detail})` : ""}`);
        return named.length ? named : [this.t("accExternal")];
      };
      const iot = e => (e.iot_class ? (TEXT[this.lang][`accIot_${e.iot_class}`] ? this.t(`accIot_${e.iot_class}`) : e.iot_class) : "–");
      const cloudTable = this.sysList("acccloud", cloud, {
        ...base, sort: "name", sorts, empty: "accNoneCloud",
        columns: [
          { key: "name", label: "accColIntegration", cell: e => this.accIntegrationCell(e) },
          { key: "target", label: "accColTarget", sortable: false, cell: e => this.accPills(target(e)) },
          { key: "iot", label: "accColIot", sortable: false, cell: e => this.esc(iot(e)) },
          { key: "flow", label: "accColFlow", sortable: false, cell: e => this.accPills(flows(e), "mute") },
          { key: "risk", label: "accColRisk", cell: e => this.accRiskPill(e.risk) },
        ],
        exportName: "cloud-data-flow", header: [this.t("accColIntegration"), "Domain", this.t("accColTarget"), this.t("accColIot"), this.t("accColFlow"), this.t("accColRisk")], rows: e => [e.title, e.domain, target(e).join("; "), iot(e), flows(e).join("; "), this.t(`accRisk_${e.risk}`)],
      });
      const panel = (title, hint, body) => `<div class="panel"><div class="panelhead"><div><h2>${this.t(title)}</h2><p>${this.t(hint)}</p></div></div>${body}</div>`;
      const apps = r.apps_available ? this.accAppsTable(r.apps || [], risks, sorts.find(x => x.key === "risk")) : `<div class="emptymsg">${this.t("accAppsNoSupervisor")}</div>`;
      return `<div class="stack"><div class="panel">${head}<div class="pad"><p class="factnote">${this.t("accIntro")}</p></div></div>${tiles}${panel("accSysTitle", "accSysHint", sysTable)}${panel("accCloudTitle", "accCloudHint", cloudTable)}${panel("accAppsTitle", "accAppsHint", apps)}<div class="panel">${this.howCounted("accFootnote")}</div></div>`;
    });
  }

  // The rights of the installed apps (add-ons), as the Supervisor describes them. A row opens the app in Home Assistant.
  accAppRight(a) { return `${this.t(`accApp_${a.kind}`)}${a.detail ? ` (${a.detail})` : ""}`; }

  accAppsTable(apps, risks, riskSort) {
    const order = { high: 0, medium: 1, low: 2 };
    const tone = { high: "red", medium: "warn", low: "mute" };
    const rights = a => `<span class="pills">${a.access.map(x => `<span class="pill ${tone[x.level] || "mute"}">${this.esc(this.accAppRight(x))}</span>`).join("") || `<span class="muted">${this.t(a.checked ? "accAppNoRights" : "accAppUnchecked")}</span>`}</span>`;
    const running = a => a.state === "started";
    return this.sysList("accapps", apps, {
      sort: "risk", dir: "asc", cls: "acc",
      sorts: [{ ...riskSort, get: a => order[a.risk] ?? 3 }, { key: "name", label: "accColApp", dir: "asc", get: a => a.name }],
      filters: [{ name: "risk", all: this.t("accAllRisks"), options: risks }], filterFns: { risk: (a, v) => a.risk === v },
      text: a => `${a.name} ${a.slug} ${a.access.map(x => this.accAppRight(x)).join(" ")}`, tie: a => a.slug, empty: "accNoneApps",
      rowAttrs: a => `data-ha-path="${this.esc(`/hassio/addon/${encodeURIComponent(a.slug)}/info`)}" tabindex="0" role="link" aria-label="${this.esc(a.name)}"`,
      columns: [
        { key: "name", label: "accColApp", cell: a => this.nameCell(a.name, a.slug) },
        { key: "state", label: "sysColState", sortable: false, cell: a => `<span class="pill ${running(a) ? "ok" : "mute"}">${this.t(running(a) ? "sysAppRunning" : "sysAppStopped")}</span>` },
        { key: "rights", label: "accColRights", sortable: false, cell: rights },
        { key: "risk", label: "accColRisk", cell: a => (a.risk ? this.accRiskPill(a.risk) : `<span class="pill mute">${this.t("accAppUncheckedShort")}</span>`) },
      ],
      exportName: "app-rights", header: [this.t("accColApp"), "Slug", this.t("sysColState"), this.t("accColRights"), this.t("accColRisk")], rows: a => [a.name, a.slug, a.state || "", a.access.map(x => this.accAppRight(x)).join("; "), a.risk ? this.t(`accRisk_${a.risk}`) : ""],
    });
  }

  // ---------------------------------------------------------------- bindings

  bindSystem(root) {
    root.querySelectorAll("[data-sys-refresh]").forEach(el => el.onclick = () => this.sysLoad(el.dataset.sysRefresh));
    root.querySelector("[data-ha-menu]")?.addEventListener("click", () => this.toggleHaSidebar());
    // Rows that lead into Home Assistant (apps) open with Enter and Space like the other rows.
    root.querySelectorAll("tr[data-ha-path]").forEach(el => el.onkeydown = ev => {
      if (ev.target !== el || (ev.key !== "Enter" && ev.key !== " ")) return;
      ev.preventDefault(); this.navigateHA(el.dataset.haPath);
    });
  }
}
