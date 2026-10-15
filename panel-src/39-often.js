// Devices and entities that fail again and again: the hint "on purpose?" next to the finding, with a mark prepared for it.
// It only reads what the reliability numbers hold already (see stabilityOf); it never starts the recorder query.
Object.assign(TEXT.de, {
  oftenChip: "Fällt regelmäßig aus", oftenChipAt: "Fällt meist zwischen {from} und {to} Uhr aus",
  oftenTitle: "Absichtlich?", oftenText: "{lines} Wenn das gewollt ist, hält ein Vermerk es fest, und Housekeeper meldet den Ausfall dann nicht mehr.",
  oftenSet: "Vermerk mit Zeitfenster setzen", oftenSetPlain: "Vermerk setzen", oftenSkip: "Nicht mehr fragen",
  oftenNote: "{n} Befunde betreffen Objekte, die regelmäßig ausfallen. Absichtlich? Im Detail steht der Vorschlag für einen Vermerk.",
  oftenDevice: "Mehrere Entitäten dieses Geräts fallen zur selben Zeit aus.",
});
Object.assign(TEXT.en, {
  oftenChip: "Fails regularly", oftenChipAt: "Usually fails between {from} and {to}",
  oftenTitle: "On purpose?", oftenText: "{lines} If that is intended, a mark records it and Housekeeper stops reporting the outage.",
  oftenSet: "Set a mark with a time window", oftenSetPlain: "Set a mark", oftenSkip: "Do not ask again",
  oftenNote: "{n} findings concern objects that fail regularly. On purpose? The detail page proposes a mark.",
  oftenDevice: "Several entities of this device fail at the same time.",
});

const OFTEN_RULES = ["entity.state_unavailable", "entity.state_unknown", "device.down"];
const OFTEN_QUIET_DAYS = 180;
const OFTEN_MARK_DAYS = 90;
const OFTEN_DEVICE_MIN = 3;

class OftenMixin {
  oftenDismissed() {
    let stored = {};
    try { stored = JSON.parse(globalThis.localStorage?.getItem("ha_housekeeper.often") || "{}") || {}; } catch (_) { stored = {}; }
    return { ...stored, ...(this._oftenSkip || {}) };
  }

  // { info, days, device } for an entity or a device that falls out regularly, else null; a dismissed one stays quiet for a while.
  oftenOut(type, id) {
    const key = `${type}:${id}`, skipped = this.oftenDismissed()[key];
    if (skipped && Date.now() - skipped < OFTEN_QUIET_DAYS * 86400000) return null;
    const regular = info => info && (info.pattern_hour !== null && info.pattern_hour !== undefined || ["flapping", "unstable"].includes(info.level));
    if (type === "entity") {
      const s = this.stabilityOf({ object_id: id });
      return s?.info && regular(s.info) ? { info: s.info, days: s.r.window_days, device: false } : null;
    }
    if (type !== "device") return null;
    const members = (this.data?.objects || []).filter(o => o.object_type === "entity" && o.device_id === id);
    const infos = members.map(o => this.stabilityOf(o)).filter(s => s?.info && regular(s.info));
    const byHour = new Map();
    for (const s of infos) { const h = s.info.pattern_hour; if (h !== null && h !== undefined) byHour.set(h, [...(byHour.get(h) || []), s]); }
    const best = [...byHour.values()].sort((a, b) => b.length - a.length)[0];
    return best && best.length >= OFTEN_DEVICE_MIN ? { info: best[0].info, days: best[0].r.window_days, device: true } : null;
  }

  oftenFor(finding) {
    if (!finding || finding.ignored || !OFTEN_RULES.includes(finding.rule_id)) return null;
    return this.oftenOut(finding.rule_id === "device.down" ? "device" : "entity", finding.object_id);
  }

  oftenWindow(info) {
    if (info.pattern_hour === null || info.pattern_hour === undefined) return null;
    const pad = n => String(n % 24).padStart(2, "0");
    return { from: `${pad(info.pattern_hour)}:00`, to: `${pad(info.pattern_hour + 2)}:00` };
  }

  // A small chip in the row of the finding.
  oftenChip(finding) {
    const often = this.oftenFor(finding);
    if (!often) return "";
    const w = this.oftenWindow(often.info);
    return ` · <span class="nw">${this.esc(w ? this.t("oftenChipAt", w) : this.t("oftenChip"))}</span>`;
  }

  // One line on top of the findings: how many of them are such objects.
  oftenNote() {
    this.ensureStability?.();
    const n = (this.data?.findings || []).filter(f => this.oftenFor(f)).length;
    return n ? `<p class="factnote">${this.t("oftenNote", { n: this.formatNumber(n) })}</p>` : "";
  }

  // The card of the tab "Actions": what the numbers say, and the mark prepared for it.
  oftenRows(item) {
    if (item.mark || !["entity", "device"].includes(item.object_type)) return [];
    const finding = (this.data?.findings || []).find(f => !f.ignored && OFTEN_RULES.includes(f.rule_id) && f.object_id === item.object_id);
    const often = finding && this.oftenFor(finding);
    if (!often) return [];
    const key = this.objectKey(item), w = this.oftenWindow(often.info);
    const lines = [...this.unstableLines(often.info, often.days), often.device ? this.t("oftenDevice") : ""].filter(Boolean).join(" ");
    const buttons = `<button class="btn" data-often-set="${this.esc(key)}"><ha-icon icon="mdi:bookmark-plus-outline"></ha-icon>${this.t(w ? "oftenSet" : "oftenSetPlain")}</button><button class="btn quiet" data-often-skip="${this.esc(key)}">${this.t("oftenSkip")}</button>`;
    return [this.actRow(this.t("oftenTitle"), this.t("oftenText", { lines }), buttons)];
  }

  openOftenMark(key) {
    const [type, ...rest] = key.split(":"), often = this.oftenOut(type, rest.join(":"));
    this.openMark(key);
    if (!this.markForm) return;
    const w = often && this.oftenWindow(often.info);
    Object.assign(this.markForm, { kind: "expected_offline", days: OFTEN_MARK_DAYS, ...(w ? { wmode: "time", from: w.from, to: w.to } : {}) });
    this.render();
  }

  skipOften(key) {
    (this._oftenSkip ||= {})[key] = Date.now();
    const kept = this.oftenDismissed();
    try { globalThis.localStorage?.setItem("ha_housekeeper.often", JSON.stringify(kept)); } catch (_) { /* no storage */ }
    this.render();
  }

  bindOften(root) {
    root.querySelectorAll("[data-often-set]").forEach(el => el.onclick = () => this.openOftenMark(el.dataset.oftenSet));
    root.querySelectorAll("[data-often-skip]").forEach(el => el.onclick = () => this.skipOften(el.dataset.oftenSkip));
  }
}
