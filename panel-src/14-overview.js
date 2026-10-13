// OverviewMixin: methods of the panel element, mixed into the class in 99-register.js.
class OverviewMixin {
  // Hours since the last scan when it is clearly overdue for the configured interval, else null.
  staleScan() {
    const m = this.data?.meta;
    if (!m?.scanned_at) return null;
    const hours = (Date.now() - new Date(m.scanned_at).getTime()) / 3.6e6;
    const interval = Number(m.scan_interval_hours) || 0;
    if (!Number.isFinite(hours)) return null;
    if (interval > 0 ? hours > interval * 1.5 + 1 : hours > 24 * 7) return { hours: Math.round(hours), interval };
    return null;
  }

  // Shown while the backend treats scans as preliminary because Home Assistant is still starting: the step it is in,
  // the time left of the warm-up and, once that is over, the progress of the final scan.
  warmupBanner() {
    if (!this.data?.meta?.preliminary) return "";
    return `<div class="panel u-mb14" data-warmup><div class="row"><span class="tile warn"><ha-icon icon="mdi:timer-sand"></ha-icon></span><span class="row-text">${this.warmupInner()}</span></div></div>`;
  }

  // A scan that failed, or none that succeeded for a long time: the counts shown then come from an older scan.
  healthBanner() {
    const h = this.data?.meta?.scan_health;
    if (!h || !["failed", "stale"].includes(h.state)) return "";
    const last = h.last_success_at ? this.formatDate(h.last_success_at) : "–";
    const text = h.state === "failed" ? this.t("healthFailed", { phase: h.failed_phase || "–", last }) : this.t("healthStale", { last });
    const more = h.state === "failed" ? [this.t("healthTries", { n: h.consecutive_failures }), h.error].filter(Boolean).join(" · ") : this.t("healthStaleHint");
    return `<div class="panel u-mb14" data-scan-health><div class="row"><span class="tile ${h.state === "failed" ? "red" : "warn"}"><ha-icon icon="mdi:heart-broken-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(text)}</strong><small class="u-m0">${this.esc(more)}</small></span></div></div>`;
  }

  warmupInner() {
    const w = this._warm || {}, left = w.until ? Math.max(0, Math.round((w.until - Date.now()) / 1000)) : null;
    const st = this.scanStatus;
    let step, frac = null;
    if (w.booting) step = this.t("warmupStepBoot");
    else if (left) {
      step = this.t("warmupStepWait", { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` });
      frac = 1 - left / (w.total || 300);
    } else if (st?.running) { step = this.t("warmupStepScan", { percent: st.progress }); frac = st.progress / 100; }
    else step = this.t("warmupStepFinal");
    const bar = frac === null ? "" : `<span class="bar"><i class="warn" style="width:${Math.round(Math.min(1, Math.max(0, frac)) * 100)}%"></i></span>`;
    return `<strong>${this.esc(this.t("warmupBanner"))}</strong><small class="u-m0">${this.esc(step)}</small>${bar}`;
  }

  // Counts the warm-up down in the banner without rebuilding the page; every few seconds the backend is asked for the step.
  startWarmupTicker(meta) {
    this._warm = { booting: Boolean(meta.warmup_booting), until: Date.now() + (Number(meta.warmup_seconds_left) || 0) * 1000, total: 300 };
    if (this._warmTick) return;
    let n = 0;
    this._warmTick = window.setInterval(async () => {
      if (this._gone || !this.data?.meta?.preliminary) { this.stopWarmupTicker(); return; }
      if (++n % 5 === 0 && !this.busy && this._hass) {
        try {
          const s = await this._hass.callWS({ type: "ha_housekeeper/status" });
          this.scanStatus = s;
          this._warm = { ...this._warm, booting: Boolean(s.warmup?.booting), until: Date.now() + (Number(s.warmup?.seconds_left) || 0) * 1000 };
        } catch (_) { /* the next tick asks again */ }
      }
      const box = this.shadowRoot?.querySelector?.("[data-warmup] .row-text");
      if (box) box.innerHTML = this.warmupInner();
    }, 1000);
  }

  stopWarmupTicker() {
    if (this._warmTick) window.clearInterval(this._warmTick);
    this._warmTick = null;
    this._warm = null;
  }

  // What to do now, most urgent first: outages (integrations and devices that are down) and new critical findings, then an
  // overdue scan and the backup, then removals that are ready. Rows without data are left out.
  todoItems() {
    const items = [], m = this.data.meta;
    const monitored = this.monitorFunctions?.() || [];
    const impaired = monitored.filter(item => item.state === "problem" || item.incident_open);
    const uncertain = monitored.filter(item => item.state === "unverified" && !item.incident_open);
    if (impaired.length) {
      const first = impaired[0], key = first.state === "unverified" ? first.last_problem_key : first.reason_key, object = key ? this.findObject(key) : null;
      const uncovered = impaired.some(item => !(this.data.findings || []).some(f => !f.ignored && this.findingKey(f) === (item.state === "unverified" ? item.last_problem_key : item.reason_key)));
      items.push({ key: "monitor_problem", area: uncovered ? "state" : "findings", tone: "red", icon: "mdi:home-alert-outline", text: this.t("monitorOverviewProblem", { n: impaired.length }), hintText: `${first.name} · ${first.incident_open && first.state === "unverified" ? `${this.t("monitorOverviewUnresolved")}: ${this.monitorReason(first.last_problem_reason)}` : [object?.name || key, this.monitorReason(first.reason)].filter(Boolean).join(" · ")} · ${this.t("monitorFindingAt", { date: this.formatDate(first.scanned_at) })}`, view: "monitor", filter: "problem" });
    }
    if (uncertain.length) items.push({ key: "monitor_unknown", area: "state", tone: "warn", icon: "mdi:home-question-outline", text: this.t("monitorOverviewUnknown", { n: uncertain.length }), hintText: uncertain[0].last_verified_at ? this.t("monitorLastVerified", { date: this.formatDate(uncertain[0].last_verified_at) }) : this.t("monitorNeverVerified"), view: "monitor", filter: "unverified" });
    const outages = this.causeList();
    if (outages.length) items.push({ key: "outages", area: "findings", tone: "red", icon: "mdi:source-branch", label: "actOutages", hintText: this.outagesHint(outages), count: outages.length, view: "findingsNav", filter: "" });
    const regressions = (this.data.regressions || []).length;
    if (regressions) items.push({ key: "followup", area: "findings", tone: "red", icon: "mdi:history", label: "actFollowup", hint: "actFollowupHint", count: regressions, view: "journal" });
    const due = (this.data.reminders || []).filter(r => r.state === "due").length;
    if (due) items.push({ key: "reminders", area: "care", tone: "warn", icon: "mdi:wrench-clock", label: "actReminders", hint: "actRemindersHint", count: due, view: "reminders" });
    const missed = (this.data.criteria_alerts || []).length;
    if (missed) items.push({ key: "criteria", area: "care", tone: "warn", icon: "mdi:target", label: "actCriteria", hint: "actCriteriaHint", count: missed, view: "runs" });
    const fresh = (this.trend?.new_findings?.items || []).filter(f => !f.ignored && CRITICAL_CLASSES.includes(f.classification)).length;
    if (fresh) items.push({ key: "critical", area: "findings", tone: "red", icon: "mdi:alert-circle-outline", label: "actNewCritical", hint: "actNewCriticalHint", count: fresh, view: "findingsNav", filter: "" });
    // A nearly full disk, from the light read of the overview; red from 90 % takes points off the ring like any urgent topic.
    this.ensureSysLight();
    const disk = this.sysLight?.disk;
    if (disk?.percent >= SYS_WARN_PERCENT) {
      const tone = disk.percent >= SYS_RED_PERCENT ? "red" : "warn";
      items.push({ key: "disk", area: "state", tone, icon: "mdi:harddisk", label: tone === "red" ? "todoDiskFull" : "todoDiskNear", hintText: this.t("todoDiskHint", { pct: this.sysPercent(disk.percent), free: this.formatBytes(disk.free ?? 0) }), view: "storage" });
    }
    const stale = this.staleScan();
    if (stale) {
      const age = stale.hours >= 48 ? this.t("daysValue", { n: Math.round(stale.hours / 24) }) : `${stale.hours} h`;
      items.push({ key: "stale", area: "state", tone: "warn", icon: "mdi:clock-alert-outline", text: stale.interval > 0 ? this.t("staleScan", { age, hours: stale.interval }) : this.t("staleScanManual", { age }), scan: true });
    }
    // Only real problems are listed; notes such as "emergency kit not confirmed" stay on the Maintenance card.
    const problems = this.backup?.available && this.backup.overall === "problem" ? this.backup.checks.filter(c => c.level === "problem") : [];
    const dbProblems = this.dbHealth?.available ? this.dbHealth.findings.filter(f => f.level === "problem") : [];
    if (dbProblems.length) items.push({ key: "db", area: "state", tone: "red", icon: "mdi:database-alert-outline", label: "todoDbProblem", hintText: dbProblems.map(f => this.t(`dbKind_${f.kind}`)).join(", "), view: "recorder" });
    if (problems.length) items.push({ key: "backup", area: "state", tone: "red", icon: "mdi:backup-restore", label: "todoBackupProblem", count: problems.length, hintText: problems.map(c => this.t(`bh_${c.id}`)).join(", "), view: "maintenance" });
    const limit = m.quarantine_days ?? 14;
    const ready = (this.data.quarantine || []).filter(q => this.daysSince(q.since) >= limit).length;
    if (ready) items.push({ key: "quarantine", area: "care", tone: "warn", icon: "mdi:archive-clock-outline", label: "actQuarantine", hint: "actQuarantineHint", count: ready, view: "cleanup" });
    this.ensureGoals();
    this.ensurePolicies(); // the menu counts need both
    for (const g of (this.goals?.goals || []).filter(x => x.state === "missed")) {
      items.push({ key: `goal_${g.id}`, area: "care", tone: "warn", icon: "mdi:target", text: this.t(`goal_${g.id}`), hintText: `${this.goalNow(g)} · ${g.limit === 0 && g.unit === "count" ? this.t("goalAllowedNone") : this.t("goalAllowed", { limit: this.goalAmount(g, g.limit) })}`, pill: this.t("goalMissedPill"), view: GOAL_VIEWS[g.id] });
    }
    return items;
  }

  // Quarantined objects whose waiting time is over.
  readyQuarantine() {
    const limit = this.data?.meta?.quarantine_days ?? 14;
    return (this.data?.quarantine || []).filter(q => this.daysSince(q.since) >= limit).length;
  }

  // The foot of the to-do card: how many goals are met and where the limits are set, and what changed since the last visit.
  todoFoot() {
    const r = this.goals, visit = this.sinceVisitLine();
    const goals = r?.goals?.length ? `<small>${this.t("goalsLine", { met: r.met, total: r.met + r.missed })} · <button class="link" data-goals-settings>${this.t("goalsAdjust")}</button></small>` : "";
    return goals || visit ? `<div class="pad todofoot">${goals}${visit}</div>` : "";
  }

  // "1 topic urgent, 4 more open": what the headline counts are topics (rows of the list), not objects.
  statusHeadline(health) {
    const urgent = health.red === 1 ? this.t("statusUrgentOne") : this.t("statusUrgent", { n: this.formatNumber(health.red) });
    if (health.red && health.later) return `${urgent}, ${this.t("statusMoreOpen", { n: this.formatNumber(health.later) })}`;
    if (health.red) return urgent;
    return health.later === 1 ? this.t("statusOpenOne") : this.t("statusOpen", { n: this.formatNumber(health.later) });
  }

  statusSubline(health) {
    const topics = health.penalty ? this.t("statusTopicsCost", { n: health.penalty }) : this.t("statusTopicsFree");
    return `${this.t("statusObjects", { affected: this.formatNumber(health.affected), base: this.formatNumber(health.base) })} · ${topics}`;
  }

  // The calculation behind the ring: 100, minus the entries of the findings list by impact, minus the urgent state topics.
  healthWhyCard(health) {
    const row = (label, value, cls = "") => `<div class="row ${cls}"><span>${label}</span><span>${value}</span></div>`;
    const lines = [row(this.t("whyStart"), "100")];
    for (const l of health.lines) lines.push(row(this.t("whyLevel", { n: this.formatNumber(l.n), level: this.t(`impact_${l.level}`), each: l.each }), `− ${l.points}`, "minus"));
    if (health.stateRed) lines.push(row(this.t("whyState", { n: this.formatNumber(health.stateRed), each: HEALTH_STATE_POINTS }), `− ${health.statePoints}`, "minus"));
    lines.push(row(this.t("whyTotal"), `${health.percent}`, "total"));
    return `<div class="healthwhy" role="region" aria-label="${this.esc(this.t("healthWhy"))}">${lines.join("")}<small>${this.t("whyNote", { green: HEALTH_GREEN, yellow: HEALTH_YELLOW })}</small></div>`;
  }

  // A number with its noun, so that the rows count what they say: "8 integrations".
  todoCount(it) {
    const unit = ({ outages: "outages", followup: "followup", reminders: "reminders", criteria: "criteria", critical: "critical", backup: "backup", quarantine: "quarantine" })[it.key];
    return unit ? `${this.formatNumber(it.count)} ${this.t(`unit_${unit}_${it.count === 1 ? "1" : "n"}`)}` : this.formatNumber(it.count);
  }

  // "What do I have to do now?" in up to three areas: Findings (the first entries of the findings list), State (backup, disk,
  // scan: urgent ones take points off the status) and Maintenance (goals, reminders, quarantine: never urgent, folded
  // while something else needs attention). An area without rows is left out.
  todoCard() {
    const items = this.todoItems(), LIMIT = 5;
    const row = it => {
      const inner = `<span class="tile ${it.tone}"><ha-icon icon="${it.icon}"></ha-icon></span><span class="row-text"><strong>${this.esc(it.text || this.t(it.label))}</strong>${it.hint || it.hintText ? `<small>${this.esc(it.hintText || this.t(it.hint))}</small>` : ""}</span>`;
      if (it.scan) return `<div class="row todo" data-todo="${it.key}">${inner}<button class="btn" data-action="scan">${this.t("scan")}</button></div>`;
      const target = `data-jump="${it.view}"${it.filter !== undefined ? ` data-filter="${it.filter}"` : ""}${it.type ? ` data-type="${it.type}"` : ""}${it.status ? ` data-status="${it.status}"` : ""}`;
      const pill = it.count !== undefined ? this.todoCount(it) : it.pill;
      return `<button class="row todo" data-todo="${it.key}" ${target}>${inner}${pill ? `<span class="pill ${it.tone}">${this.esc(pill)}</span>` : ""}</button>`;
    };
    const inArea = area => items.filter(i => i.area === area && i.key !== "outages"); // the outages are entries of the list itself
    const entries = this.findingEntries();
    const entryRow = e => (e.cause ? this.overviewCause(e.cause) : this.findingRow(e.finding));
    const findingRows = [...inArea("findings").filter(i => i.key === "monitor_problem").map(row), ...inArea("findings").filter(i => i.key !== "monitor_problem").map(row), ...entries.slice(0, LIMIT).map(entryRow)];
    const all = `<button class="link" data-jump="findingsNav">${this.t("allFindings")} (${this.formatNumber(this.findingTotal())}) <ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
    const state = [...inArea("state")].sort((x, y) => (y.tone === "red") - (x.tone === "red"));
    const care = inArea("care");
    const sections = [];
    if (findingRows.length) sections.push(`<h3 class="foldhd">${this.t("areaFindings")}</h3>${findingRows.join("")}${entries.length > LIMIT ? `<div class="pad"><small>${all}</small></div>` : ""}`);
    if (state.length) sections.push(`<h3 class="foldhd">${this.t("areaState")}</h3>${state.map(row).join("")}`);
    if (care.length) sections.push(this.fold("todo_care", { tone: "warn", title: this.t("areaCare"), sub: this.t("areaCareSub"), pill: this.formatNumber(care.length) }, care.map(row).join(""), !sections.length));
    const body = sections.length ? sections.join("") : `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${this.esc(this.t("actNone", { date: this.formatDate(this.data.meta.scanned_at) }))}</div>`;
    return `<section class="panel u-mb14" aria-labelledby="hk-todo" id="hk-todo-card" tabindex="-1"><div class="panelhead"><div><h2 id="hk-todo">${this.t("actTitle")}</h2><p>${this.t("actSub")}</p></div>${all}</div>${body}${this.todoFoot()}</section>`;
  }

  // The comparison with the previous scan is fetched once per data set; the overview shows it when it is there.
  ensureTrend() {
    if (this._trendFor === this.data || !this._hass?.callWS) return;
    this._trendFor = this.data;
    this.loadTrend(this.data);
  }

  async loadTrend(data) {
    try {
      const result = await this._hass.callWS({ type: "ha_housekeeper/compare", baseline: "previous" });
      if (this.data !== data) return;
      this.trend = result?.available === true ? result : null;
      this.render(); // the status number counts new critical findings, in every view
    } catch (_) { if (this.data === data) this.trend = null; }
  }

  trendCard() {
    const c = this.trend;
    if (!c?.available) return "";
    const date = this.formatDate(c.baseline_at);
    const rows = [
      ["trendNewFindings", c.new_findings?.total, "mdi:arrow-up-bold", "red", "+"],
      ["trendResolved", c.resolved_findings?.total, "mdi:arrow-down-bold", "ok", "−"],
      ["trendChanged", c.status_changes?.total, "mdi:swap-horizontal", "warn", ""],
      ["trendNewObjects", c.new_objects?.total, "mdi:plus-circle-outline", "mute", "+"],
    ].filter(([, n]) => n);
    const body = rows.length
      ? rows.map(([label, n, icon, tone, sign]) => `<button class="row" data-jump="changes"><span class="tile ${tone}"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${this.t(label)}</strong></span><span class="pill ${tone}">${sign}${this.formatNumber(n)}</span></button>`).join("")
      : `<div class="emptymsg">${this.esc(this.t("trendNone", { date }))}</div>`;
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("trendTitle")}</h2><p>${this.esc(this.t("trendSince", { date }))}</p></div></div>${body}</div>`;
  }

  // What changed since the last visit of this browser: new and gone findings against the state kept then.
  sinceVisit() {
    if (this._visit !== undefined) return this._visit;
    this._visit = null;
    const keys = this.data.findings.filter(f => !f.ignored).map(f => this.findingKey(f));
    let saved = null;
    try { saved = JSON.parse(globalThis.localStorage?.getItem("ha_housekeeper.visit") || "null"); } catch (_) { saved = null; }
    const now = Date.now();
    if (saved && Array.isArray(saved.keys) && now - saved.at >= 30 * 60000) {
      const before = new Set(saved.keys), nowSet = new Set(keys);
      this._visit = { at: saved.at, added: keys.filter(k => !before.has(k)).length, gone: saved.keys.filter(k => !nowSet.has(k)).length };
    }
    if (!saved || now - saved.at >= 30 * 60000) { try { globalThis.localStorage?.setItem("ha_housekeeper.visit", JSON.stringify({ at: now, keys })); } catch (_) { /* no storage */ } }
    return this._visit;
  }

  sinceVisitLine() {
    const v = this.sinceVisit();
    if (!v || (!v.added && !v.gone)) return "";
    const parts = [v.added ? this.t("visitAdded", { n: this.formatNumber(v.added) }) : "", v.gone ? this.t("visitGone", { n: this.formatNumber(v.gone) }) : ""].filter(Boolean).join(", ");
    return `<small class="visitline"><ha-icon icon="mdi:history"></ha-icon>${this.t("visitSince", { ago: this.agoText(new Date(v.at).toISOString()) })}: ${parts}</small>`;
  }

  overview() {
    const m = this.data.meta, counts = m.status_counts || {}, health = this.health();
    const findings = this.sortedFindings(), total = this.findingTotal();
    this.ensureTrend();
    this.ensureSeries();
    this.ensureBackup();
    const kpi = ([label, value, tone, view, status, key, rising]) => `<button class="kpi ${tone}" data-jump="${view}" data-status="${status || ""}"><small>${this.t(label)}</small><strong>${this.formatNumber(value)}</strong>${this.series ? `<span class="spark-row">${this.sparkline(key, rising)}</span>` : ""}</button>`;
    const headline = health.tasks ? `<button type="button" class="headlink" data-todo-jump title="${this.esc(this.t("statusTasksJump"))}">${this.esc(this.statusHeadline(health))}</button>` : this.t("statusAllGood");
    const why = this.healthWhy ? this.healthWhyCard(health) : "";
    return `<section class="statushead" title="${this.esc(this.t("healthTip", { affected: health.affected, base: health.base }))}"><button type="button" class="ring ${health.tone}" style="--p:${health.percent}" data-health-why aria-expanded="${Boolean(this.healthWhy)}" aria-label="${this.esc(this.t("healthWhy"))}"><b>${health.percent}<small>%</small></b></button>
      <div class="statustext"><h2>${headline}</h2><p>${this.statusSubline(health)}</p>${this.series ? `<span class="spark-row">${this.sparkline("share", "good")}</span>` : ""}</div>
      <div class="kpis">${[["objects", m.object_count, "", "inventory", "", "objects"], ["openFindings", total, total ? "warn" : "", "findingsNav", "", "findings", "bad"], ["unavailable", counts.unavailable || 0, counts.unavailable ? "red" : "", "inventory", "unavailable", "unavailable", "bad"]].map(kpi).join("")}</div></section>${why}
      ${this.scanCoverageLine()}${this.todoCard()}<div class="ovzone">${this.cleanupCard()}${this.trendCard()}${this.inventoryStatusCard()}</div>
      <div class="ovzone">${this.systemCard()}${this.databaseCard()}${this.backupSummaryCard()}</div>`;
  }

  // The backup in three lines: the newest backup, the last automatic run and the overall result. The rest is in Maintenance.
  backupSummaryCard() {
    const b = this.backup;
    if (!b?.available) return "";
    const checks = b.checks || [], by = id => checks.find(c => c.id === id);
    const newest = by("newest"), run = by("last_run");
    const problems = checks.filter(c => c.level === "problem").length, notes = checks.filter(c => c.level === "note").length;
    const tone = level => ({ ok: "ok", note: "warn", problem: "red" })[level] || "mute";
    const fact = (label, value, level) => `<div class="fact"><span>${this.t(label)}</span><b>${value}${level ? ` <span class="pill ${tone(level)}">${this.t(`bhLevel_${level}`)}</span>` : ""}</b></div>`;
    const age = newest?.values?.age_hours;
    const rows = [
      fact("bh_newest", age === null || age === undefined ? this.t("safeNoBackup") : this.esc(this.t("backupAgo", { age: this.bhAge(age) })), newest?.level),
      run ? fact("bh_last_run", run.values?.completed ? this.esc(this.formatDate(run.values.completed)) : this.t("bhNever"), run.level) : "",
      fact("bhResult", problems ? this.t("mtProblems", { n: problems }) : notes ? this.t("mtNotes", { n: notes }) : this.t("bhLevel_ok"), ""),
    ].join("");
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("backupTitle")}</h2><p>${this.t("maintHintBackup")}</p></div><button class="link" data-jump="maintenance">${this.t("backupOpen")} <ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="facts">${rows}</div></div>`;
  }

  // Three groups instead of seven raw statuses: what is fine, what to look at, what is broken.
  inventoryStatusCard() {
    const m = this.data.meta, counts = m.status_counts || {}, total = Math.max(1, m.object_count);
    const groups = [
      ["invOk", "ok", ["active"]],
      ["invCheck", "warn", ["unknown", "disabled", "empty"]],
      ["invProblem", "red", ["unavailable", "orphaned", "problem"]],
    ].map(([label, tone, statuses]) => ({ label, tone, statuses, n: statuses.reduce((sum, s) => sum + (counts[s] || 0), 0) }));
    const known = groups.reduce((sum, g) => sum + g.n, 0);
    const percent = n => `${new Intl.NumberFormat(this.lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(100 * n / total)} %`;
    const detail = g => g.statuses.filter(s => counts[s]).map(s => `${this.formatNumber(counts[s])} ${this.t(s)}`).join(" · ");
    const rows = groups.map(g => `<div title="${this.esc(detail(g))}"><span><i class="dot ${g.tone}"></i>${this.t(g.label)}</span><span class="nums"><b>${this.formatNumber(g.n)}</b><em class="pct">${percent(g.n)}</em></span></div>`).join("");
    const bar = groups.filter(g => g.n).map(g => `<i class="${g.tone}" style="width:${(100 * g.n / Math.max(1, known)).toFixed(2)}%"></i>`).join("");
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("inventoryStatus")}</h2><p>${this.t("invHint")}</p></div></div><div class="legend invlegend">${rows}</div><div class="bar">${bar}</div></div>`;
  }

  // The start of the oldest recorder data, read once (the backend keeps it for an hour); the card shows it when it arrives.
  ensureDbFirst() {
    if (this._dbFirstAsked) return;
    this._dbFirstAsked = true;
    setTimeout(async () => {
      try {
        const r = await this._hass.callWS({ type: "ha_housekeeper/database_first" });
        if (r?.busy) { this._dbFirstAsked = false; return; }
        this.dbFirst = r?.first || 0;
      } catch (_) { return; }
      if (this.dbFirst && this.view === "overview") this.render();
    }, 0);
  }

  // Disk, memory and CPU in three bars; read once per data set with a command that walks no folder.
  ensureSysLight() {
    if (this._sysLightFor === this.data || !this._hass?.callWS) return;
    this._sysLightFor = this.data;
    this.loadSysLight(this.data);
  }

  async loadSysLight(data) {
    try {
      const result = await this._hass.callWS({ type: "ha_housekeeper/system_light" });
      if (this.data !== data) return;
      this.sysLight = result;
      this.render(); // the to-do list and the ring count a nearly full disk, in every view
    } catch (_) { if (this.data === data) this.sysLight = null; }
  }

  systemCard() {
    const r = this.sysLight;
    if (!r) return "";
    const disk = r.disk || {}, ram = r.ram || {}, cpu = r.cpu || {};
    const bar = (label, part, sub) => part.percent === null || part.percent === undefined ? "" : `<div class="factbar"><div class="fact"><span>${this.esc(label)}</span><b>${this.esc(this.sysPercent(part.percent))}${sub ? `<small>${this.esc(sub)}</small>` : ""}</b></div>${this.sysMeter(part.percent)}</div>`;
    const rows = [
      bar(this.t("sysDiskUsed"), disk, disk.free !== undefined && disk.free !== null ? this.t("sysFreeOf", { free: this.formatBytes(disk.free), total: this.formatBytes(disk.total) }) : ""),
      bar(this.t("sysRam"), ram, ram.total ? this.t("sysOf", { used: this.formatBytes(ram.used), total: this.formatBytes(ram.total) }) : ""),
      bar(this.t("sysCpu"), cpu, ""),
    ].join("");
    if (!rows) return "";
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("sysOvTitle")}</h2><p>${this.t("sysOvHint")}</p></div><button class="link" data-jump="storage">${this.t("dbOvDetails")} <ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="facts">${rows}</div></div>`;
  }

  // Size of the recorder database from two file stats taken during the scan; the table queries stay in the Recorder view.
  databaseCard() {
    const d = this.data.meta.database;
    if (!d) return "";
    this.ensureDbFirst();
    const measured = d.db_bytes !== null && d.db_bytes !== undefined;
    const rows = measured ? [
      [this.t("dbOvSize"), this.formatBytes(d.db_bytes)],
      [this.t("dbOvWal"), this.formatBytes(d.wal_bytes || 0)],
      ...(d.keep_days ? [[this.t("dbOvKeep"), this.t("dbOvKeepDays", { n: this.formatNumber(d.keep_days) })]] : []),
      ...(this.dbFirst ? [[this.t("dbOvFirst"), `${this.esc(this.formatDate(new Date(this.dbFirst * 1000).toISOString()))}<small>${this.esc(this.relTime(new Date(this.dbFirst * 1000).toISOString()))}</small>`]] : []),
      [this.t("dbOvGrowth"), d.per_day !== null && d.per_day !== undefined ? this.t("dbOvPerDay", { size: this.formatBytes(Math.max(0, d.per_day)) }) : this.t("dbOvObserving")],
    ] : [[this.t("dbOvSize"), this.t("dbOvNoSize", { dialect: this.esc(d.dialect || "?") })]];
    const purgeOff = d.auto_purge === false ? `<p class="factnote">${this.t("dbOvPurgeOff")}</p>` : "";
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("dbOvTitle")}</h2><p>${this.t("dbOvHint")}</p></div><button class="link" data-jump="recorder">${this.t("dbOvDetails")} <ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="facts">${rows.map(([k, v]) => `<div class="fact"><span>${k}</span><b>${v}</b></div>`).join("")}</div>${purgeOff}</div>`;
  }

  // Quick links to the hint views; counts exclude hidden findings.
  cleanupCard() {
    this.ensureBatteryTrend();
    const open = this.data.findings.filter(f => !f.ignored);
    const items = [
      ["batteries", "mdi:battery-alert-variant-outline", "batteries", this.lowBatteries().length, "batteries"],
      ["possible_duplicate", "mdi:content-duplicate", "findingsNav", open.filter(f => f.classification === "possible_duplicate").length, "possible_duplicate"],
      ["unused", "mdi:sleep", "findingsNav", open.filter(f => f.classification === "unused").length, "unused"],
      ["unreferenced", "mdi:link-variant-off", "cleanup", this.unreferencedRows().length, undefined],
      ["quarantine", "mdi:archive-clock-outline", "cleanup", (this.data.quarantine || []).length, undefined],
    ];
    const rows = items.map(([label, icon, view, count, filter]) => `<button class="row" data-jump="${view}"${label === "unreferenced" ? ' data-jump-tab="unused"' : ""}${filter !== undefined && view === "findingsNav" ? ` data-filter="${filter}"` : ""}><span class="tile ${count ? "warn" : "mute"}"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${this.t(label)}</strong></span><span class="pill ${count ? "warn" : "mute"}">${this.formatNumber(count)}</span></button>`).join("");
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("hintsTitle")}</h2><p>${this.t("cleanupHint")}</p></div></div>${rows}</div>`;
  }
}
