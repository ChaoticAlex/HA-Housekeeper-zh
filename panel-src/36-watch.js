// WatchMixin: what stopped working after an update or restart. Worded as "since", never as a cause.
const WATCH_LIST = 20;
class WatchMixin {
  async loadWatches() {
    try { this.watch = await this._hass.callWS({ type: "ha_housekeeper/watches" }); }
    catch (_) { this.watch = { hours: 0, watches: [] }; }
    this.render();
  }

  // Loads once, and again after every new scan.
  ensureWatches() {
    const key = this.data?.meta?.scanned_at || "";
    if (!this.data || (this._watchKey === key && this._watchRequested)) return;
    this._watchRequested = true; this._watchKey = key;
    setTimeout(() => this.loadWatches(), 0);
  }

  watchWhat(w) {
    const first = w.triggers[0];
    if (!first) return "";
    const what = this.t(`corr_${first.kind}`, { domain: this.esc(first.domain || ""), from: this.esc(first.from ?? ""), to: this.esc(first.to ?? "") });
    return w.triggers.length > 1 ? `${what} +${w.triggers.length - 1}` : what;
  }

  // One line while a watch runs; sits in the page header next to the other banners.
  watchBand() {
    const w = this.data?.meta?.watch;
    if (!w) return "";
    const hours = Math.max(0, Math.ceil((Date.parse(w.until) - Date.now()) / 3600000)), n = w.new;
    const text = w.samples ? this.t("watchBand", { what: this.watchWhat(w), hours, n: this.formatNumber(n) }) : this.t("watchBandWait", { what: this.watchWhat(w), hours });
    return `<div class="panel u-mb14" data-watch><button class="row" data-watch-go="${this.esc(w.id || "")}" title="${this.esc(this.t("watchGo"))}"><span class="tile ${n ? "warn" : "mute"}"><ha-icon icon="mdi:eye-check-outline"></ha-icon></span><span class="row-text"><strong>${text}</strong><small>${this.t("watchGo")}</small></span></button></div>`;
  }

  watchRows(keys, tone) {
    const pg = keys.slice(0, WATCH_LIST).map(key => {
      const item = this.findObject(key);
      const name = item?.name || key.split(":").slice(1).join(":");
      return `<button class="row" data-object="${this.esc(key)}">${this.tile(item?.object_type || key.split(":")[0], tone)}<span class="row-text"><strong>${this.esc(name)}</strong><small>${this.esc(key)}</small></span></button>`;
    }).join("");
    const more = keys.length > WATCH_LIST ? `<p class="sub">${this.t("watchMore", { n: this.formatNumber(keys.length - WATCH_LIST) })}</p>` : "";
    return pg + more;
  }

  watchBody(w) {
    const r = w.result, parts = [];
    parts.push(`<p class="sub u-mb14">${w.before ? this.t("watchBefore", { when: this.formatDate(w.before.at) }) : this.t("watchNoBefore")} · ${this.t("watchSamples", { n: w.samples.length })}</p>`);
    if (r.reason === "unread") parts.push(`<p class="factnote">${this.t("watchUnread")}</p>`);
    const section = (id, keys, tone) => keys.length ? `<h3>${this.t(id, { n: this.formatNumber(keys.length) })}</h3>${this.watchRows(keys, tone)}` : "";
    parts.push(section("watchNew", r.new, "warn"), section("watchTransient", r.transient, "mute"), section("watchFixed", r.fixed, "ok"));
    if (r.new_findings.length) parts.push(`<p class="sub">${this.t("watchNewFindings", { n: this.formatNumber(r.new_findings.length) })}</p>`);
    if (!r.new.length && !r.transient.length && !r.fixed.length && !r.new_findings.length && w.before) parts.push(`<p class="sub">${this.t("watchNone")}</p>`);
    return parts.join("");
  }

  // On the findings page next to the card for findings that began with an update.
  watchCard() {
    this.ensureWatches();
    const list = this.watch?.watches || [];
    if (!list.length) return "";
    const tones = { worse: "warn", stable: "ok", transient: "mute", unknown: "mute", pending: "mute" };
    const rows = list.map(w => {
      const verdict = w.result.verdict;
      const sub = w.closed_at ? this.t("watchEnded", { when: this.formatDate(w.closed_at) }) : this.formatDate(w.started_at);
      const open = this.foldOpen(`watch_${w.id}`, false);
      return this.fold(`watch_${w.id}`, { tone: tones[verdict] || "mute", title: this.watchWhat(w), sub, pill: this.t(`watchV_${verdict}`) }, open ? this.watchBody(w) : "", false);
    }).join("");
    return `<div class="panel">${this.fold("watch", { tone: "mute", title: this.t("watchTitle"), sub: this.t("watchHint"), pill: this.formatNumber(list.length) }, rows, false)}</div>`;
  }
}
