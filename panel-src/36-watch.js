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

  // past = a group about the time of the watch (briefly disturbed, fixed): no finding row with the state of today, only a note when it is a finding again.
  watchRows(keys, tone, past = false) {
    const pg = keys.slice(0, WATCH_LIST).map(key => {
      // An object that is a finding already shows as in the findings list: checkbox, menu, decisions.
      const finding = (this.data?.findings || []).find(f => !f.ignored && this.findingKey(f) === key);
      if (finding && !past) return this.findingRow(finding, false, false);
      const item = this.findObject(key);
      const name = item?.name || key.split(":").slice(1).join(":");
      const mark = item?.mark;
      const again = past && finding ? `<span class="pill warn">${this.t("watchAgain")}</span>` : "";
      const act = past ? again : mark ? `<span class="pill mute">${this.esc(this.t(`mark_${mark.kind}`))}</span>` : item ? `<button class="btn quiet" data-watch-mark="${this.esc(key)}"><ha-icon icon="mdi:bookmark-plus-outline"></ha-icon>${this.t("markSet")}</button>` : "";
      return `<div class="row" role="button" tabindex="0" data-object="${this.esc(key)}">${this.tile(item?.object_type || key.split(":")[0], tone)}<span class="row-text"><strong>${this.esc(name)}</strong><small>${this.esc(key)}${item?.status && !past ? ` · ${this.esc(item.status)}` : ""}</small></span>${act}</div>`;
    }).join("");
    const more = keys.length > WATCH_LIST ? `<p class="sub">${this.t("watchMore", { n: this.formatNumber(keys.length - WATCH_LIST) })}</p>` : "";
    return pg + more;
  }

  // Ends the open watch only after the person has said yes: what it measured so far is judged and no more scans follow.
  askEndWatch() {
    this.confirmAsk(this.t("endWatchText"), () => this.endWatch(), { title: this.t("endWatchTitle"), yes: this.t("watchEnd"), danger: false });
  }

  async endWatch() {
    try { await this._hass.callWS({ type: "ha_housekeeper/watch_end" }); } catch (_) { return; }
    if (this.data?.meta) this.data.meta.watch = null;
    await this.loadWatches();
  }

  watchBody(w) {
    const r = { silent: [], marked: [], ...w.result }, parts = [];
    parts.push(`<p class="sub u-mb14">${w.before ? this.t("watchBefore", { when: this.formatDate(w.before.at) }) : this.t("watchNoBefore")} · ${this.t("watchSamples", { n: w.samples.length })}</p>`);
    if (r.reason === "unread") parts.push(`<p class="factnote">${this.t("watchUnread")}</p>`);
    const section = (id, keys, tone, past = false) => keys.length ? `<h3>${this.t(id, { n: this.formatNumber(keys.length) })}</h3>${this.watchRows(keys, tone, past)}` : "";
    parts.push(section("watchNew", r.new, "warn"), section("watchSilent", r.silent, "mute"), section("watchMarked", r.marked, "mute"), section("watchTransient", r.transient, "mute", true), section("watchFixed", r.fixed, "ok", true));
    if (r.new_repairs?.length) {
      const info = this.watch?.repairs || {};
      parts.push(`<h3>${this.t("watchRepairs", { n: this.formatNumber(r.new_repairs.length) })}</h3>${r.new_repairs.slice(0, WATCH_LIST).map(key => {
        const i = info[key], domain = key.split(":")[0], id = key.split(":").slice(1).join(":");
        const sub = [this.esc(domain), ["critical", "error", "warning"].includes(i?.severity) ? this.t(`repairSeverity_${i.severity}`) : "", i?.fixable ? this.t("repairFixable") : ""].filter(Boolean).join(" · ");
        return `<div class="row"><span class="tile warn"><ha-icon icon="mdi:wrench-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(i?.title || id)}</strong><small>${sub}</small></span>${i?.url ? `<a class="btn quiet" href="${this.esc(i.url)}" target="_blank" rel="noopener noreferrer">${this.t("repairMore")}</a>` : ""}</div>`;
      }).join("")}`);
    }
    if (r.new_findings.length) parts.push(`<p class="sub">${this.t("watchNewFindings", { n: this.formatNumber(r.new_findings.length) })}</p>`);
    if (!r.new.length && !r.silent.length && !r.marked.length && !r.transient.length && !r.fixed.length && !r.new_findings.length && !r.new_repairs?.length && w.before) parts.push(`<p class="sub">${this.t("watchNone")}</p>`);
    return parts.join("");
  }
}
