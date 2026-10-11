// The Batteries view as one table: level, type and forecast side by side, and the need of the next 30 days above it.
// The forecast comes from ha_housekeeper/battery_trend (loaded in the background, 53-battery-care.js); a battery without
// one still has its row. Mixed into the panel in 99-register.js.
const BATTERY_NEED_DAYS = 30;
const BATTERY_SOON_DAYS = 14;
const BATTERY_FAR_DAYS = 90;

Object.assign(TEXT.de, {
  btColName: "Gerät", btColArea: "Bereich", btColType: "Typ", btColLevel: "Stand", btColSlope: "Verbrauch", btColLeft: "Leer in", btColAct: "Aktion", btTypeChange: "Typ ändern", btLevelOk: "in Ordnung",
  btSlopeDay: "{n} %/Tag", btVoltDay: "{n} V/Tag", btSlopeStable: "stabil", btLeftLow: "darunter", btLeftDays: "{n} Tage", btLeftFar: "> {n} Tage", btLeftStable: "stabil",
  btFilterSoon: "Bald leer", btFilterUntyped: "Ohne Typ", btAllTypes: "Alle Typen",
  needTitle: "Benötigte Batterien in den nächsten 30 Tagen", needSub: "{n} Geräte fallen laut Prognose in 30 Tagen unter die Grenze von {limit} %.", needSub1: "1 Gerät fällt laut Prognose in 30 Tagen unter die Grenze von {limit} %.",
  needNone: "Keine Batterie wird in den nächsten 30 Tagen leer.", needUntyped: "ohne Typ", needUntypedHint: "Typ in der Tabelle setzen", needSoon: "In den nächsten 14 Tagen", needLater: "In 15 bis 30 Tagen", needMore: "… {n} weitere in der Tabelle",
  needNote: "Gezählt werden Geräte, die laut Prognose innerhalb von 30 Tagen unter die Grenze fallen. Der Typ kommt von dir.",
  btTableNote: "Prognose nur bis 90 Tage, aus den letzten fünf Wochen: eine Schätzung, keine Zusage. Ohne Prognose: {unknown} (zu wenige Tage oder stabil). Nach einem Wechsel zählt nur der Verlauf danach.",
  btFarMore: "{n} halten laut Prognose länger als 90 Tage.",
});
Object.assign(TEXT.en, {
  btColName: "Device", btColArea: "Area", btColType: "Type", btColLevel: "Level", btColSlope: "Drain", btColLeft: "Empty in", btColAct: "Action", btTypeChange: "Change type", btLevelOk: "ok",
  btSlopeDay: "{n} %/day", btVoltDay: "{n} V/day", btSlopeStable: "stable", btLeftLow: "below", btLeftDays: "{n} days", btLeftFar: "> {n} days", btLeftStable: "stable",
  btFilterSoon: "Empty soon", btFilterUntyped: "No type", btAllTypes: "All types",
  needTitle: "Batteries needed in the next 30 days", needSub: "{n} devices will fall below the limit of {limit} % within 30 days, by the forecast.", needSub1: "1 device will fall below the limit of {limit} % within 30 days, by the forecast.",
  needNone: "No battery runs out in the next 30 days.", needUntyped: "no type", needUntypedHint: "set the type in the table", needSoon: "In the next 14 days", needLater: "In 15 to 30 days", needMore: "… {n} more in the table",
  needNote: "Counted are devices that fall below the limit within 30 days by the forecast. The type comes from you.",
  btTableNote: "Forecast only up to 90 days, from the last five weeks: an estimate, not a promise. No forecast for {unknown} (too few days or stable). After a change only the time since counts.",
  btFarMore: "{n} last longer than 90 days by the forecast.",
});

class BatteryTableMixin {
  // The forecast of one row: from the percent trend, or the one of a battery that reports volts.
  batteryForecast(row) {
    if (row.volt) return { state: row.volt.state, days: row.volt.days_left, slope: row.volt.slope, unit: "V" };
    const f = (this.batteryTrend?.rows || []).find(r => r.entity_id === row.item.object_id);
    return f ? { state: f.state, days: f.days_left, slope: f.slope, unit: "%" } : null;
  }

  // The battery type of a row: yours, or for volts the guess from the voltage.
  batteryTypeOf(row) { return this.batteryTrend?.types?.[row.item.object_id] || ""; }

  // Rows with the forecast joined on, for the table, the filters and the sorting.
  batteryTableRows() {
    return [...this.batteryRows(), ...this.batteryVoltRows()].map(row => {
      const fc = this.batteryForecast(row);
      return { ...row, fc, type: this.batteryTypeOf(row), days: row.low ? 0 : fc?.state === "falling" ? fc.days : null };
    });
  }

  batteryTableSorts() {
    const left = r => (r.low ? 0 : r.days ?? 1e5) * 1000 + (r.level ?? 999) / 1000 + (r.volt ? 0.5 : 0);
    return [
      { key: "left", label: "btColLeft", dir: "asc", get: left },
      { key: "level", label: "btColLevel", dir: "asc", get: r => (r.low ? 0 : 1e6) + (r.volt ? 1000 : 0) + (r.level ?? -1) },
      { key: "slope", label: "btColSlope", dir: "asc", get: r => r.fc && r.fc.slope !== null && r.fc.slope !== undefined ? r.fc.slope : 1e6 },
      { key: "name", label: "btColName", dir: "asc", get: r => this.batteryName(r.item).title },
      { key: "area", label: "btColArea", dir: "asc", get: r => this.areaName(r.item) },
      { key: "type", label: "btColType", dir: "asc", get: r => r.type || "~" },
    ];
  }

  batteryLevelCell(row, limit) {
    const { item, level, low, volt } = row;
    if (volt) return `<span class="${low ? "red" : ""}">${this.esc(this.voltNum(level))}</span>`;
    if (level === null || level === undefined) return `<span class="pill ${low ? "red" : "mute"}">${this.t(low ? "batteryLow" : "btLevelOk")}</span>`;
    const tone = low ? (level <= limit / 2 ? "red" : "amber") : level <= limit * 2 ? "amber" : "green";
    const width = Math.max(2, Math.min(100, level));
    return `<div class="lvl"><div class="bar"><i style="width:${width}%;background:var(--hk-${tone})"></i></div><span class="lvlnum ${low ? "red" : ""}">${this.esc(`${Math.round(level)} ${item.unit || "%"}`)}</span></div>`;
  }

  batterySlopeCell(row) {
    const fc = row.fc;
    if (!fc || fc.slope === null || fc.slope === undefined) return `<span class="muted">—</span>`;
    if (fc.state === "stable") return `<span class="muted">${this.t("btSlopeStable")}</span>`;
    const digits = fc.unit === "V" ? 3 : 1, n = new Intl.NumberFormat(this.lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(fc.slope).replace("-", "−");
    return this.t(fc.unit === "V" ? "btVoltDay" : "btSlopeDay", { n });
  }

  batteryLeftCell(row) {
    const fc = row.fc;
    if (row.low) return `<b class="red">${this.t("btLeftLow")}</b>`;
    if (!fc) return `<span class="muted">—</span>`;
    if (fc.state === "falling") return `<b class="${fc.days <= BATTERY_SOON_DAYS ? "red" : fc.days <= BATTERY_NEED_DAYS ? "amber" : ""}">${this.t("btLeftDays", { n: fc.days })}</b>`;
    if (fc.state === "far") return `<span class="muted">${this.t("btLeftFar", { n: BATTERY_FAR_DAYS })}</span>`;
    return `<span class="muted">${this.t("btLeftStable")}</span>`;
  }

  batteryTypeCell(row) {
    const id = row.item.object_id;
    if (this.btEdit === id) return this.batteryTypeControls(id);
    if (row.type) return `<span class="btctl"><span class="pill">${this.esc(row.type)}</span><button class="btn quiet iconbtn" data-bt-type="${this.esc(id)}" title="${this.esc(this.t("btTypeChange"))}" aria-label="${this.esc(this.t("btTypeLabel", { name: this.batteryName(row.item).title }))}"><ha-icon icon="mdi:pencil-outline"></ha-icon></button></span>`;
    if (row.volt) return `<span class="muted" title="${this.esc(this.t("bvLine", { now: this.voltNum(row.level), kind: this.t(`bvType_${row.volt.type}`), limit: this.voltNum(row.volt.limit) }))}">${this.esc(this.t(`bvType_${row.volt.type}`).split(" (")[0])}</span><button class="btn quiet iconbtn" data-bt-type="${this.esc(id)}" title="${this.t("btTypeChange")}" aria-label="${this.t("btTypeChange")}"><ha-icon icon="mdi:pencil-outline"></ha-icon></button>`;
    return `<button class="btn quiet miss" data-bt-type="${this.esc(id)}">${this.t("btTypeNone")}</button>`;
  }

  // The table: one row per battery. A row opens the device; the buttons inside it do not (90-panel.js ignores their clicks).
  batteryTable(rows) {
    const limit = this.data.meta.low_battery_percent ?? 20;
    this.lvState("batteries", "left", "asc");
    const pg = this.paginate(`batteries-${this.batteryFilter}`, rows);
    const columns = [
      { key: "name", label: "btColName", dir: "asc", cell: r => { const n = this.batteryName(r.item); return this.nameCell(n.title, n.entity || r.item.object_id); } },
      { key: "area", label: "btColArea", dir: "asc", cell: r => this.esc(this.areaName(r.item) || "—") },
      { key: "type", label: "btColType", dir: "asc", cell: r => this.batteryTypeCell(r) },
      { key: "level", label: "btColLevel", dir: "asc", cell: r => this.batteryLevelCell(r, limit) },
      { key: "slope", label: "btColSlope", dir: "asc", cell: r => this.batterySlopeCell(r) },
      { key: "left", label: "btColLeft", dir: "asc", cell: r => this.batteryLeftCell(r) },
      { key: "act", label: "btColAct", sortable: false, cell: r => `${this.batteryKindControl(r.item)}${this.batteryKindForm(r.item)}` },
    ];
    const table = this.listTable("batteries", columns, pg.rows, { cls: "batt", rowAttrs: r => `data-object="${this.esc(this.objectKey(r.item))}" tabindex="0" role="button" aria-label="${this.esc(this.batteryName(r.item).title)}"` });
    return `${table}${pg.footer}`;
  }

  // The need of the next 30 days: how many of which cell to buy, tiles of one size, and who runs out first.
  batteryNeed() {
    const b = this.batteryTrend;
    if (this.batteryTrendError) return `<div class="panel"><div class="error">${this.esc(this.batteryTrendError)}</div></div>`;
    if (!b) return `<div class="panel"><div class="panelhead"><div><h2>${this.t("needTitle")}</h2></div></div>${this.skeleton("btLoading")}</div>`;
    if (!b.available) return `<div class="panel"><div class="emptymsg">${this.t("btNoRecorder")}</div></div>`;
    if (b.busy) return `<div class="panel"><p class="factnote">${this.t("relBusy")}</p></div>`;
    const soon = b.rows.filter(r => r.state === "low" || (r.days_left !== null && r.days_left <= BATTERY_NEED_DAYS))
      .sort((x, y) => (x.state === "low" ? -1 : x.days_left) - (y.state === "low" ? -1 : y.days_left) || String(x.name || "").localeCompare(String(y.name || "")));
    const limit = b.limit ?? this.data.meta.low_battery_percent ?? 20;
    const counts = new Map();
    let untyped = 0;
    for (const r of soon) {
      const type = b.types?.[r.entity_id];
      if (!type) { untyped++; continue; }
      const match = /^(\d+)\s*[×x]\s*(.+)$/i.exec(type);
      const [n, name] = match ? [Number(match[1]), match[2].trim()] : [1, type];
      counts.set(name, (counts.get(name) || 0) + n);
    }
    const tile = (count, name, cls = "") => `<div class="needtile ${cls}"><b>${this.esc(count)}</b><span>${this.esc(name)}</span></div>`;
    const tiles = [...counts].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).map(([name, n]) => tile(`${this.formatNumber(n)}×`, name));
    if (untyped) tiles.push(tile(this.formatNumber(untyped), `${this.t("needUntyped")} · ${this.t("needUntypedHint")}`, "miss"));
    const name = r => { const item = this.findObject(`entity:${r.entity_id}`); return item ? this.batteryName(item).title : (r.name || r.entity_id); };
    const line = r => `<li><button class="linkbtn" data-object="entity:${this.esc(r.entity_id)}">${this.esc(name(r))}</button> <span>${this.esc([b.types?.[r.entity_id], r.state === "low" ? this.t("btLeftLow") : this.t("btLeftDays", { n: r.days_left })].filter(Boolean).join(" · "))}</span></li>`;
    const list = (title, rows) => {
      if (!rows.length) return "";
      const shown = rows.slice(0, 5);
      return `<div><h3>${this.t(title)} · ${this.formatNumber(rows.length)}</h3><ul>${shown.map(line).join("")}${rows.length > shown.length ? `<li class="muted">${this.t("needMore", { n: rows.length - shown.length })}</li>` : ""}</ul></div>`;
    };
    const near = soon.filter(r => r.state === "low" || r.days_left <= BATTERY_SOON_DAYS), later = soon.filter(r => !near.includes(r));
    const sub = this.t(soon.length === 1 ? "needSub1" : "needSub", { n: this.formatNumber(soon.length), limit: this.formatNumber(limit) });
    const body = soon.length ? `<div class="needgrid">${tiles.join("")}</div><div class="needsplit">${list("needSoon", near)}${list("needLater", later)}</div>` : `<div class="emptymsg"><ha-icon icon="mdi:battery-check-outline"></ha-icon>${this.t("needNone")}</div>`;
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("needTitle")}</h2>${soon.length ? `<p>${this.esc(sub)}</p>` : ""}</div></div>${this.batterySuggestions()}${body}<p class="factnote">${this.t("needNote")}</p></div>`;
  }
}
