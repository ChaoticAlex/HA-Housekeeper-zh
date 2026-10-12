// SystemMixin: the pages "Storage & system", "Access & data flow" and "Credentials" under Operation and Security; mixed in by 99-register.js.
// All three only read. A page loads on its first visit; its refresh button reads again.
// A page and the WebSocket command it asks.
const SYS_COMMANDS = { storage: "system_usage", dataflow: "access", secrets: "sensitive_fields" };
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

  // The introduction sits behind an (i) after the title instead of in a paragraph of its own.
  infoTip(text) {
    return `<button type="button" class="infotip" data-tip="${this.esc(text)}" data-tip-plain="1" aria-label="${this.esc(text)}"><ha-icon icon="mdi:information-outline"></ha-icon></button>`;
  }

  sysHead(name, title, hint, intro) {
    const st = this.sysState(name);
    const at = st.at ? `<span class="scanago">${this.esc(this.t("sysAsOf", { time: this.formatDate(st.at) }))}</span>` : "";
    return `<div class="panelhead"><div><h2>${this.t(title)}${intro ? this.infoTip(this.t(intro)) : ""}</h2><p>${this.t(hint)}</p></div><div class="actions">${at}<button class="btn" data-sys-refresh="${name}" ${st.loading ? "disabled" : ""}><ha-icon icon="mdi:refresh"></ha-icon>${this.t("sysRefresh")}</button></div></div>`;
  }

  // Loading, error or the page: the frame every one of the three pages shares.
  sysFrame(name, title, hint, loading, build, intro) {
    const st = this.sysEnsure(name), head = this.sysHead(name, title, hint, intro);
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
      return `<div class="stack"><div class="panel">${head}</div>${tiles}${swapLine ? `<div class="panel"><div class="pad">${swapLine}</div></div>` : ""}<div class="sysnav">${this.navTiles("storage", tabs, open, this.t("storage"))}</div><div class="panel"><div class="panelhead"><div><h2>${this.esc(tab.label)}</h2><p>${this.esc(tab.hint)}</p></div></div>${body}${this.howCounted("sysFootnote")}</div></div>`;
    }, "sysIntro");
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
      rowAttrs: a => (this.findObject(`app:${a.slug}`) ? this.appRowAttrs(a) : 'class="static"'),
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
      const highCount = entries.filter(e => e.risk === "high").length;
      const appList = r.apps || [];
      const open = this.viewTabOf("dataflow", [{ id: "sys" }, { id: "cloud" }, ...(r.apps_available ? [{ id: "apps" }] : [])], "sys");
      const high = id => this.lv?.[id]?.f?.risk === "high";
      const tiles = this.sumTiles([
        { label: this.t("accSumTotal"), value: this.esc(this.formatNumber(entries.length)), tone: "mute" },
        { label: this.t("accSumAccess"), value: this.esc(this.formatNumber(sys.length)), tone: sys.length ? "warn" : "ok", attr: ["data-acc-show", "sys"], active: open === "sys" && !high("accsys") },
        { label: this.t("accSumHigh"), value: this.esc(this.formatNumber(highCount)), tone: highCount ? "red" : "ok", attr: ["data-acc-show", "sys|high"], active: open === "sys" && high("accsys") },
        { label: this.t("accSumExternal"), value: this.esc(this.formatNumber(cloud.length)), tone: cloud.length ? "warn" : "ok", attr: ["data-acc-show", "cloud"], active: open === "cloud" },
        r.apps_available ? { label: this.t("accSumApps"), value: this.esc(this.formatNumber(appList.filter(a => a.risk === "high").length)), sub: this.esc(this.t("accSumAppsSub", { n: this.formatNumber(appList.length) })), tone: appList.some(a => a.risk === "high") ? "red" : "ok", attr: ["data-acc-show", "apps|high"], active: open === "apps" && high("accapps") } : null,
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
      const chip = id => high(id) ? `<div class="pad"><button class="pill red" data-acc-clear="${id}" title="${this.esc(this.t("accClearFilter"))}">${this.esc(`${this.t("accColRisk")}: ${this.t("accRisk_high")}`)} ✕</button></div>` : "";
      const panel = (title, hint, id, body) => `<div class="panel"><div class="panelhead"><div><h2>${this.t(title)}</h2><p>${this.t(hint)}</p></div></div>${chip(id)}${body}</div>`;
      const tabs = [
        { id: "sys", icon: "mdi:shield-key-outline", label: this.t("accSysTitle"), hint: this.t("accSysHint"), count: sys.length },
        { id: "cloud", icon: "mdi:cloud-outline", label: this.t("accCloudTitle"), hint: this.t("accCloudHint"), count: cloud.length },
        r.apps_available ? { id: "apps", icon: "mdi:package-variant-closed", label: this.t("accAppsTitle"), hint: this.t("accAppsHint"), count: appList.length } : { id: "apps", icon: "mdi:package-variant-closed", label: this.t("accAppsTitle"), hint: this.t("accAppsNoSupervisor"), disabled: true },
      ];
      const body = open === "cloud" ? panel("accCloudTitle", "accCloudHint", "acccloud", cloudTable)
        : open === "apps" ? panel("accAppsTitle", "accAppsHint", "accapps", this.accAppsTable(appList, risks, sorts.find(x => x.key === "risk")))
        : panel("accSysTitle", "accSysHint", "accsys", sysTable);
      return `<div class="stack"><div class="panel">${head}</div>${tiles}<div class="sysnav">${this.navTiles("dataflow", tabs, open, this.t("dataflow"))}</div>${body}<div class="panel">${this.howCounted("accFootnote")}</div></div>`;
    }, "accIntro");
  }

  // A row of an app opens its detail page when the scan knows it, else the app in Home Assistant.
  appRowAttrs(a) {
    const key = `app:${a.slug}`;
    return this.findObject(key) ? `data-object="${this.esc(key)}" tabindex="0" role="button" aria-label="${this.esc(a.name)}"` : `data-ha-path="${this.esc(`/hassio/addon/${encodeURIComponent(a.slug)}/info`)}" tabindex="0" role="link" aria-label="${this.esc(a.name)}"`;
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
      rowAttrs: a => this.appRowAttrs(a),
      columns: [
        { key: "name", label: "accColApp", cell: a => this.nameCell(a.name, a.slug) },
        { key: "state", label: "sysColState", sortable: false, cell: a => `<span class="pill ${running(a) ? "ok" : "mute"}">${this.t(running(a) ? "sysAppRunning" : "sysAppStopped")}</span>` },
        { key: "rights", label: "accColRights", sortable: false, cell: rights },
        { key: "risk", label: "accColRisk", cell: a => (a.risk ? this.accRiskPill(a.risk) : `<span class="pill mute">${this.t("accAppUncheckedShort")}</span>`) },
      ],
      exportName: "app-rights", header: [this.t("accColApp"), "Slug", this.t("sysColState"), this.t("accColRights"), this.t("accColRisk")], rows: a => [a.name, a.slug, a.state || "", a.access.map(x => this.accAppRight(x)).join("; "), a.risk ? this.t(`accRisk_${a.risk}`) : ""],
    });
  }

  // ---------------------------------------------------------------- Detail page of an app

  appRights(item) { return (this.sysState("dataflow").data?.apps || []).find(a => a.slug === item.object_id) || null; }

  appUsage(item) { return (this.sysState("storage").data?.apps || []).find(a => a.slug === item.object_id) || null; }

  // The dot at the rights tab: red for a high risk, once the report is read.
  appAccessTone(item) { return this.appRights(item)?.risk === "high" ? "red" : ""; }

  appOverview(item) {
    const fact = (k, v) => `<div class="fact"><span>${this.t(k)}</span><b>${v}</b></div>`;
    const update = item.update_available ? `<span class="pill warn">${this.esc(this.t("appUpdate", { version: item.version_latest || "?" }))}</span>` : "";
    const rows = [
      item.status_since ? fact("since", `${this.esc(this.formatDate(item.status_since))}<small>${this.esc(this.relTime(item.status_since))}</small>`) : "",
      item.version ? fact("appVersion", `${this.esc(item.version)} ${update}`) : "",
      item.repository ? fact("appRepository", this.esc(item.repository)) : "",
      item.stage && item.stage !== "stable" ? fact("appStage", this.esc(item.stage)) : "",
    ].join("");
    const text = item.description ? `<div class="pad"><p class="factnote">${this.esc(item.description)}</p></div>` : "";
    return `<div class="stack"><section class="panel"><div class="panelhead"><div><h2>${this.t("app")}</h2><p>${this.t("appHint")}</p></div></div><div class="facts">${rows}</div>${text}</section></div>`;
  }

  appAccessCard(item) {
    const df = this.sysState("dataflow");
    if (df.error) return `<div class="panel"><div class="error">${this.esc(df.error)}</div></div>`;
    if (!df.data) return `<div class="panel">${this.skeleton("accLoading")}</div>`;
    const app = this.appRights(item);
    if (!df.data.apps_available || !app) return `<div class="panel"><div class="emptymsg">${this.t("accAppsNoSupervisor")}</div></div>`;
    const tone = { high: "red", medium: "warn", low: "mute" };
    const rights = app.access.length
      ? app.access.map(x => `<div class="row static"><span class="row-text"><strong>${this.esc(this.accAppRight(x))}</strong></span><span class="pill ${tone[x.level] || "mute"}">${this.t(`accRisk_${x.level}`)}</span></div>`).join("")
      : `<div class="emptymsg">${this.t(app.checked ? "accAppNoRights" : "accAppUnchecked")}</div>`;
    const head = `<div class="panelhead"><div><h2>${this.t("accColRights")}</h2><p>${this.t("accAppsHint")}</p></div>${app.risk ? this.accRiskPill(app.risk) : ""}</div>`;
    return `<div class="stack"><section class="panel">${head}${rights}</section><section class="panel"><div class="pad"><small><button class="link" data-jump="dataflow">${this.t("accDetAllFlow")}</button></small></div></section></div>`;
  }

  appLoadCard(item) {
    const st = this.sysState("storage");
    if (st.error) return `<div class="panel"><div class="error">${this.esc(st.error)}</div></div>`;
    if (!st.data) return `<div class="panel">${this.skeleton("sysLoading")}</div>`;
    const app = this.appUsage(item);
    if (!st.data.supervisor || !app) return `<div class="panel"><div class="emptymsg">${this.t("accAppsNoSupervisor")}</div></div>`;
    const fact = (k, v) => `<div class="fact"><span>${this.t(k)}</span><b>${this.esc(v)}</b></div>`;
    const dash = v => (v === null || v === undefined ? "–" : v);
    const cpu = app.cpu_percent === null || app.cpu_percent === undefined ? "–" : `${this.formatNumber(Math.round(app.cpu_percent * 10) / 10)} %`;
    const ram = app.memory_usage === null || app.memory_usage === undefined ? "–" : `${this.formatBytes(app.memory_usage)}${app.memory_limit ? ` / ${this.formatBytes(app.memory_limit)}` : ""}`;
    const size = b => (b === null || b === undefined ? "–" : this.formatBytes(b));
    const rows = fact("sysColCpu", cpu) + fact("sysColRam", ram) + fact("sysColData", size(app.data_bytes)) + fact("accAppConfig", size(app.config_bytes)) + (app.size_bytes !== null && app.size_bytes !== undefined ? fact("accAppTotal", size(app.size_bytes)) : "");
    return `<div class="stack"><section class="panel"><div class="panelhead"><div><h2>${this.t("accAppLoad")}</h2><p>${this.t("sysTabAppsHint")}</p></div></div><div class="facts">${rows}</div></section><section class="panel"><div class="pad"><small><button class="link" data-jump="storage">${this.t("storage")}</button></small></div></section></div>`;
  }

  // ---------------------------------------------------------------- Detail page of an integration

  // The entry of the reports that are already read; null while they are not.
  accessEntryOf(item) { return (this.sysState("dataflow").data?.entries || []).find(e => e.entry_id === item.object_id) || null; }

  credentialsOf(item) { return (this.sysState("secrets").data?.entries || []).find(e => e.entry_id === item.object_id) || null; }

  // The dot at the tab: red for a high risk, amber for a field without a value; nothing before the reports are read.
  accessTone(item) {
    if (this.accessEntryOf(item)?.risk === "high") return "red";
    return (this.credentialsOf(item)?.fields || []).some(f => !f.set) ? "warn" : "";
  }

  // Overview of the integration: one red line for a high system access, once the report has been read.
  accessAlert(item) {
    const e = item.object_type === "config_entry" ? this.accessEntryOf(item) : null;
    if (!e || e.risk !== "high" || !(e.access.length || e.gps || e.camera)) return "";
    return `<div class="outcome warn" role="status"><ha-icon icon="mdi:shield-alert-outline"></ha-icon><span><strong>${this.esc(this.t("accAlertHigh", { list: this.accAccessLabels(e).join(", ") }))}</strong> <button class="link" data-detail-tab-go="access">${this.t("accAlertMore")}</button></span></div>`;
  }

  accessDetailCard(item) {
    const df = this.sysState("dataflow"), se = this.sysState("secrets");
    const err = df.error || se.error;
    if (err) return `<div class="panel"><div class="error">${this.esc(err)}</div></div>`;
    if (!df.data || !se.data) return `<div class="panel">${this.skeleton("accLoading")}</div>`;
    const e = this.accessEntryOf(item), cred = this.credentialsOf(item);
    const section = (title, body) => `<section class="panel"><div class="panelhead"><h2>${this.t(title)}</h2></div>${body}</section>`;
    const none = key => `<div class="emptymsg">${this.t(key)}</div>`;
    const access = e && (e.access.length || e.gps || e.camera)
      ? `<div class="facts"><div class="fact"><span>${this.t("accColAccess")}</span><b>${this.accPills(this.accAccessLabels(e), "warn")}</b></div><div class="fact"><span>${this.t("accColRisk")}</span><b>${this.accRiskPill(e.risk)}</b></div></div>`
      : none("accDetNoAccess");
    const flows = e && e.flows?.length ? e.flows.map(f => this.t(`accFlow_${f}`)) : [];
    const iot = e?.iot_class ? (TEXT[this.lang][`accIot_${e.iot_class}`] ? this.t(`accIot_${e.iot_class}`) : e.iot_class) : "";
    const flow = e && (flows.length || e.external)
      ? `<div class="facts"><div class="fact"><span>${this.t("accDetConnection")}</span><b>${this.esc(this.t(e.external ? "accDetCloud" : "accDetLocal"))}</b></div>${flows.length ? `<div class="fact"><span>${this.t("accColFlow")}</span><b>${this.accPills(flows, "mute")}</b></div>` : ""}${iot ? `<div class="fact"><span>${this.t("accColIot")}</span><b>${this.esc(iot)}</b></div>` : ""}</div>`
      : none("accDetNoFlow");
    const fields = cred ? cred.fields.map(f => `<div class="row static"><span class="row-text"><strong>${this.esc(this.t(`secKind_${f.kind}`))}</strong><small>${this.esc(f.key)}</small></span><span class="pill ${f.set ? "ok" : "warn"}">${this.t(f.set ? "accDetSet" : "accDetEmpty")}</span></div>`).join("") : none("accDetNoCredentials");
    const links = `<div class="pad"><small>${this.t("accDetNever")} · <button class="link" data-jump="dataflow">${this.t("accDetAllFlow")}</button> · <button class="link" data-jump="secrets">${this.t("accDetAllSecrets")}</button></small></div>`;
    return `<div class="stack">${section("accSysTitle", access)}${section("accDetFlow", flow)}${section("accDetCredentials", fields)}<section class="panel">${links}</section></div>`;
  }

  // ---------------------------------------------------------------- Credentials

  // Which integrations hold credentials, of what kind, and whether a value is set. Never a value.
  secretsView() {
    return this.sysFrame("secrets", "secTitle", "secHint", "secLoading", (r, head) => {
      const entries = r.entries || [];
      const count = (e, set) => e.fields.filter(f => f.set === set).length;
      const kinds = e => [...new Set(e.fields.map(f => f.kind))];
      const empty = entries.reduce((n, e) => n + count(e, false), 0);
      const gap = this.lv?.seclist?.f?.state === "gap", anyFilter = Object.values(this.lv?.seclist?.f || {}).some(Boolean);
      const tiles = this.sumTiles([
        { label: this.t("secSumEntries"), value: this.esc(this.formatNumber(entries.length)), tone: "mute", attr: ["data-sec-show", ""], active: !anyFilter },
        { label: this.t("secSumSet"), value: this.esc(this.formatNumber(entries.reduce((n, e) => n + count(e, true), 0))), tone: "mute" },
        { label: this.t("secSumEmpty"), value: this.esc(this.formatNumber(empty)), sub: this.esc(this.t("secSumEmptySub")), tone: empty ? "warn" : "ok", attr: ["data-sec-show", "gap"], active: gap },
      ]);
      const chip = gap ? `<div class="pad"><button class="pill warn" data-sec-show="" title="${this.esc(this.t("accClearFilter"))}">${this.esc(`${this.t("secColState")}: ${this.t("secStateGap")}`)} ✕</button></div>` : "";
      const state = e => (count(e, false) === 0 ? "set" : count(e, true) === 0 ? "empty" : "part");
      const stateCell = e => `<span class="pill ${{ set: "ok", part: "warn", empty: "warn" }[state(e)]}">${this.esc(this.t("secState", { n: count(e, true), total: e.fields.length }))}</span>`;
      const kindNames = e => kinds(e).map(k => this.t(`secKind_${k}`));
      const names = e => e.fields.map(f => f.key).join(", ");
      const table = this.sysList("seclist", entries, {
        sort: "name", dir: "asc", cls: "acc", tie: e => e.entry_id,
        sorts: [{ key: "name", label: "accColIntegration", dir: "asc", get: e => `${e.domain} ${e.title}` }, { key: "state", label: "secColState", dir: "desc", get: e => ({ empty: 2, part: 1, set: 0 })[state(e)] }],
        filters: [
          { name: "kind", all: this.t("secAllKinds"), options: ["password", "token", "api_key", "secret", "webhook", "pin"].map(k => [k, this.t(`secKind_${k}`)]) },
          { name: "state", all: this.t("secAllStates"), options: [["gap", this.t("secStateGap")], ["set", this.t("secStateSet")], ["part", this.t("secStatePart")], ["empty", this.t("secStateEmpty")]] },
        ],
        filterFns: { kind: (e, v) => kinds(e).includes(v), state: (e, v) => (v === "gap" ? state(e) !== "set" : state(e) === v) },
        text: e => `${e.domain} ${e.title} ${names(e)} ${kindNames(e).join(" ")}`, empty: "secNone",
        rowAttrs: e => `data-ha-path="${this.esc(`/config/integrations/integration/${encodeURIComponent(e.domain)}`)}" tabindex="0" role="link" aria-label="${this.esc(this.t("secOpen", { name: e.title || e.domain }))}"`,
        columns: [
          { key: "name", label: "accColIntegration", cell: e => this.accIntegrationCell(e) },
          { key: "kind", label: "secColKind", sortable: false, cell: e => this.accPills(kindNames(e)) },
          { key: "fields", label: "secColFields", sortable: false, cell: e => `<span class="muted">${this.esc(names(e))}</span>` },
          { key: "state", label: "secColState", dir: "desc", cell: stateCell },
          { key: "open", label: "secColOpen", sortable: false, cell: () => `<ha-icon icon="mdi:open-in-new"></ha-icon>` },
        ],
        exportName: "credential-fields", header: [this.t("accColIntegration"), "Domain", this.t("secColKind"), this.t("secColFields"), this.t("secColSetCount"), this.t("secColEmptyCount")],
        rows: e => [e.title, e.domain, kindNames(e).join("; "), names(e), count(e, true), count(e, false)],
      });
      return `<div class="stack"><div class="panel">${head}</div>${tiles}<div class="panel"><div class="panelhead"><div><h2>${this.t("secListTitle")}</h2><p>${this.t("secListHint")}</p></div></div>${chip}${table}${this.howCounted("secFootnote")}</div></div>`;
    }, "secIntro");
  }

  // ---------------------------------------------------------------- bindings

  bindSystem(root) {
    root.querySelectorAll("[data-sys-refresh]").forEach(el => el.onclick = () => this.sysLoad(el.dataset.sysRefresh));
    // A tap on the (i) shows its text for a few seconds, as touch has no hover.
    root.querySelectorAll(".infotip").forEach(el => el.addEventListener("click", () => {
      this.showTip(el); globalThis.clearTimeout?.(this._tipHide);
      this._tipHide = globalThis.setTimeout?.(() => this.hideTip(), 6000);
    }));
    root.querySelectorAll("[data-detail-tab-go]").forEach(el => el.onclick = () => { this.detailTab = el.dataset.detailTabGo; this.render(); });
    // A key figure of Access & data flow opens its list, with or without the filter for high risk.
    root.querySelectorAll("[data-acc-show]").forEach(el => el.onclick = () => {
      const [tab, filter] = el.dataset.accShow.split("|"), id = { sys: "accsys", cloud: "acccloud", apps: "accapps" }[tab];
      (this.viewTab ||= {}).dataflow = tab;
      this.lvState(id, "risk", "asc").f.risk = filter ? "high" : ""; this.persistLv(id); this.pages = {}; this.render();
    });
    // A key figure of the credential overview sets the state filter ("gap": some field empty) or clears all filters.
    root.querySelectorAll("[data-sec-show]").forEach(el => el.onclick = () => {
      const st = this.lvState("seclist", "name", "asc");
      st.f = el.dataset.secShow ? { ...st.f, state: el.dataset.secShow } : {};
      this.persistLv("seclist"); this.pages = {}; this.render();
    });
    root.querySelectorAll("[data-acc-clear]").forEach(el => el.onclick = () => { this.lvState(el.dataset.accClear, "risk", "asc").f.risk = ""; this.persistLv(el.dataset.accClear); this.pages = {}; this.render(); });
    root.querySelector("[data-ha-menu]")?.addEventListener("click", () => this.toggleHaSidebar());
    // Rows that lead into Home Assistant (apps) open with Enter and Space like the other rows.
    root.querySelectorAll("tr[data-ha-path]").forEach(el => el.onkeydown = ev => {
      if (ev.target !== el || (ev.key !== "Enter" && ev.key !== " ")) return;
      ev.preventDefault(); this.navigateHA(el.dataset.haPath);
    });
  }
}
