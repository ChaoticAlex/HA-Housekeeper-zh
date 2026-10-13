// BackupMixin: the backup protection card in Maintenance; mixed into the panel in 99-register.js.
class BackupMixin {
  // `call` is the attest command or nothing (just read). Every reply is the full report.
  async loadBackup(call) {
    if (call) this.bhForm = null;
    this.backupLoading = true; this.backupError = ""; this.render();
    try { this.backup = await this._hass.callWS(call || { type: "ha_housekeeper/backup_health" }); this.markLoaded("backup"); }
    catch (err) { this.backupError = err?.message || String(err); }
    this.backupLoading = false; this.render();
  }

  // Loads once, and again after every new scan, so the overview and Maintenance never show an old report.
  ensureBackup() {
    const key = this.data?.meta?.scanned_at || "";
    if (this.backupLoading || (this._bhKey === key && this._bhRequested)) return;
    this._bhRequested = true; this._bhKey = key;
    setTimeout(() => this.loadBackup(), 0);
  }

  bhAge(hours) { return hours >= 48 ? this.t("bhAgeDays", { n: Math.round(hours / 24) }) : this.t("bhAgeHours", { n: Math.max(1, Math.round(hours)) }); }

  bhDay(iso) {
    if (!iso) return "—";
    try { return new Intl.DateTimeFormat(this.lang, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso)); } catch (_) { return iso; }
  }

  bhList(items) { return items?.length ? items.map(i => this.esc(i)).join(", ") : this.t("bhNone"); }

  // The sentence for one check; the backend sends numbers and ids only.
  bhText(c) {
    const v = c.values || {}, t = (k, vars) => this.t(k, vars);
    switch (c.id) {
      case "setup":
        if (c.level === "problem") return t("bhSetupProblem");
        if (c.level === "note") return t("bhSetupNote");
        return t("bhSetupOk", { agents: this.bhList(v.agents), recurrence: t(`bhRec_${v.recurrence}`) });
      case "newest":
        return v.age_hours === null || v.age_hours === undefined ? t("bhNewestNone") : t("bhNewestText", { age: this.bhAge(v.age_hours), limit: this.bhAge(v.limit_hours) });
      case "last_run": {
        if (c.level === "unknown") return t("bhRunUnknown");
        const parts = [];
        if (v.failed_attempt) parts.push(t("bhRunFailed", { attempted: this.formatDate(v.attempted), completed: v.completed ? this.formatDate(v.completed) : t("bhNever") }));
        if (v.failed_agents?.length) parts.push(t("bhRunAgents", { agents: this.bhList(v.failed_agents) }));
        return parts.length ? parts.join(" ") : t("bhRunOk", { completed: this.formatDate(v.completed) });
      }
      case "targets":
        if (v.at && !v.remote?.length) return t("bhTargetsConfirmed", { local: this.bhList(v.local), date: this.bhDay(v.at) });
        if (v.at) return t("bhTargetsOkConfirmed", { local: this.bhList(v.local), remote: this.bhList(v.remote), date: this.bhDay(v.at) });
        return c.level === "ok" ? t("bhTargetsOk", { local: this.bhList(v.local), remote: this.bhList(v.remote) }) : c.level === "note" ? t("bhTargetsNote", { local: this.bhList(v.local) }) : "";
      case "size":
        if (c.level === "unknown") return t("bhSizeUnknown");
        return t(c.level === "ok" ? "bhSizeOk" : "bhSizeNote", { size: this.formatBytes(v.size), expected: this.formatBytes(v.expected), percent: Math.round(v.ratio * 100) });
      case "retention": {
        if (c.level === "note") return t("bhRetentionNote", { count: v.count });
        const limit = [v.copies !== null && v.copies !== undefined ? t("bhRetCopies", { n: v.copies }) : "", v.days !== null && v.days !== undefined ? t("bhRetDays", { n: v.days }) : ""].filter(Boolean).join(" · ");
        return t("bhRetentionOk", { limit, count: v.count, oldest: v.oldest_days === null ? "—" : Math.round(v.oldest_days) });
      }
      case "encryption":
        if (c.level === "ok") return t("bhEncOk");
        return t(v.configured ? "bhEncNotProtected" : "bhEncNoPassword");
      case "emergency_kit":
        return v.at ? t("bhKitOk", { date: this.bhDay(v.at) }) : t("bhKitNone");
      case "restore_test":
        if (!v.at) return t("bhRestoreNone");
        return t(c.level === "ok" ? "bhRestoreOk" : "bhRestoreOld", { date: this.bhDay(v.at), days: v.age_days, limit: 180 });
      case "plan_backups":
        return c.level === "ok" ? t("bhPlansOk", v) : t("bhPlansNote", v);
      default:
        return "";
    }
  }

  bhRow(c) {
    const tone = { ok: "ok", note: "warn", problem: "red", unknown: "mute" }[c.level] || "mute";
    const icon = { ok: "mdi:check", note: "mdi:alert-outline", problem: "mdi:close-octagon-outline", unknown: "mdi:help-circle-outline" }[c.level] || "mdi:help-circle-outline";
    const attest = c.id === "targets" || c.id === "emergency_kit" || c.id === "restore_test";
    const open = attest && c.level !== "unknown" && this.bhForm === c.id;
    const opener = attest && c.level !== "unknown" ? `<button class="bhopen" data-bh-open="${c.id}" aria-expanded="${open}">${this.t(c.values?.at ? "bhAttestAgain" : c.id === "targets" ? "bhAttestTargets" : "bhAttestMark")}</button>` : "";
    const row = `<div class="row rel bh${open ? " open" : ""}"><span class="tile ${tone}"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${this.t(`bh_${c.id}`)}</strong><small>${this.bhText(c)}</small></span><span class="bhactions"><span class="pill ${tone}">${this.t(`bhLevel_${c.level}`)}</span>${opener}</span></div>`;
    if (!open) return row;
    const today = new Date().toISOString().slice(0, 10);
    const clear = c.values?.at ? `<button class="bhtake" data-bh-clear="${c.id}">${this.t("bhAttestClear")}</button>` : "";
    return `${row}<div class="bhattest"><label>${this.t("bhAttestDate")} <input type="date" data-bh-date="${c.id}" value="${today}" max="${today}"></label><button class="btn small primary" data-bh-save="${c.id}">${this.t("bhAttestSave")}</button><button class="bhcancel" data-bh-cancel>${this.t("bhAttestCancel")}</button>${clear}</div>`;
  }

  bhBackups(list) {
    if (!list?.length) return "";
    const backupRows = list.map(b => `<tr><td>${this.formatDate(b.date)}</td><td data-label="${this.t("bhColSize")}">${this.formatBytes(b.size)}</td><td data-label="${this.t("bhColTargets")}">${this.bhList(b.agents)}</td><td data-label="${this.t("bhColProtected")}">${this.t(b.protected ? "bhYes" : "bhNo")}</td></tr>`);
    const pg = this.paginate("bhbackups", backupRows), rows = pg.rows.join("");
    return `<div class="panel"><div class="sectionlabel">${this.t("bhListTitle")}</div><div class="tablewrap"><table><thead><tr><th>${this.t("bhColDate")}</th><th>${this.t("bhColSize")}</th><th>${this.t("bhColTargets")}</th><th>${this.t("bhColProtected")}</th></tr></thead><tbody>${rows}</tbody></table></div>${pg.footer}</div>`;
  }

  backupCard() {
    const head = this.pageBar({ at: this.loadedAt("backup"), loading: this.backupLoading, attr: "data-bh-refresh" });
    if (this.backupError) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(this.backupError)}</div></div></div>`;
    const b = this.backup;
    if (!b) return `<div class="stack">${head}<div class="panel">${this.skeleton("backupLoading")}</div></div>`;
    if (!b.available) return `<div class="stack">${head}<div class="panel"><div class="emptymsg">${this.t("backupUnavailable")}</div></div></div>`;
    const guide = `<details class="bhguide"><summary>${this.t("bhGuideTitle")}</summary><p class="factnote">${this.t("bhGuideSteps")}</p></details>`;
    return `<div class="stack">${head}<div class="panel">${b.checks.map(c => this.bhRow(c)).join("")}${guide}</div>${this.bhBackups(b.backups)}</div>`;
  }
}
