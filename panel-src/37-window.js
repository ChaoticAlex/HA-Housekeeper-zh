// WindowMixin: the maintenance window (experimental): a guided run through checks, one cleanup plan, a reload, a restart you do
// yourself and a comparison; mixed in by 99-register.js. It only chains steps that exist elsewhere and never restarts Home Assistant.
const WINDOW_STEPS = ["preflight", "baseline", "plan", "reload", "restart", "compare", "report"];

class WindowMixin {
  async loadWindow() {
    try { this.win = await this._hass.callWS({ type: "ha_housekeeper/window" }); } catch (_) { this.win = { enabled: false, state: null, current: null, error: true }; }
    this.render();
  }

  ensureWindow() {
    if (this._winRequested) return;
    this._winRequested = true;
    if (this.journal === null && !this._journalRequested) { this._journalRequested = true; this.loadJournal(); }
    setTimeout(() => this.loadWindow(), 0);
  }

  async windowSet(fields) {
    this.winError = "";
    try { this.win = await this._hass.callWS({ type: "ha_housekeeper/window_set", ...fields }); }
    catch (err) { this.winError = this.errText(err); }
    this.render();
    return !this.winError;
  }

  winStepLabel(step) { return this.t(`win_${step}`); }

  async winAct(name, arg) {
    this.winError = "";
    if (["enable", "disable", "clear"].includes(name)) { if (name === "clear") { this.winTargets = null; this.winCompared = false; } return this.windowSet({ action: name }); }
    if (name === "begin") return this.windowSet({ action: "begin", plan_id: arg });
    if (name === "preflight") { await this.loadPreflight(); return; }
    if (name === "next") return this.windowSet({ action: "advance", step: arg });
    if (name === "skip") return this.windowSet({ action: "advance", step: arg, skip: true });
    if (name === "baseline") { await this.loadPreflight("save"); return this.windowSet({ action: "advance", step: "baseline" }); }
    if (name === "plan") { this.noteJump("journal"); this.view = "journal"; await this.openPlan(arg); return; }
    if (name === "targets" || name === "reload") {
      try { this.winTargets = (await this._hass.callWS({ type: "ha_housekeeper/window_reload", execute: name === "reload" })).targets; }
      catch (err) { this.winError = this.errText(err); }
      if (name === "reload" && !this.winError) return this.windowSet({ action: "advance", step: "reload" });
      this.render(); return;
    }
    if (name === "compare") { await this.load(true); await this.loadPreflight(); this.winCompared = true; this.render(); return; }
    if (name === "report") { this.downloadText("maintenance-window.md", this.windowReport(), "text/markdown"); }
  }

  downloadText(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const a = document.createElement("a");
    a.href = url; a.download = `ha-housekeeper-${name}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // The report of the window as Markdown: the steps with their times, the plan and what changed since the saved state.
  windowReport() {
    const state = this.win?.state;
    if (!state) return "";
    const plan = (this.journal || []).find(p => p.plan_id === state.plan_id);
    const lines = [`# ${this.t("winTitle")}`, "", `${this.t("winStarted")}: ${this.formatDate(state.started_at)}`, ""];
    lines.push(`## ${this.t("winSteps")}`);
    for (const e of state.log) lines.push(`- ${this.winStepLabel(e.step)} · ${this.formatDate(e.at)}${e.note ? ` · ${e.note}` : ""}`);
    if (plan) lines.push("", `## ${this.t("winPlan")}`, `- ${this.t("planSummary", { total: plan.summary?.total ?? 0, ok: plan.summary?.ok ?? 0, review: plan.summary?.review ?? 0, blocked: plan.summary?.blocked ?? 0 })}`);
    const after = this.preflight?.after;
    if (after) {
      lines.push("", `## ${this.t("winAfter")}`);
      for (const [label, items] of [["pfNewRepairs", after.new_repairs], ["pfNewFailed", after.new_failed_entries], ["pfNewBroken", after.new_broken]]) lines.push(`- ${this.t(label)}: ${items.length}`);
      const inv = after.inventory || {};
      for (const [label, part] of [["newObjects", inv.new_objects], ["removedObjects", inv.removed_objects], ["statusChanges", inv.status_changes], ["newFindings", inv.new_findings], ["resolvedFindings", inv.resolved_findings]]) lines.push(`- ${this.t(label)}: ${part?.total ?? 0}`);
    }
    return `${lines.join("\n")}\n`;
  }

  winButton(label, name, arg = "", primary = false, disabled = false) {
    return `<button class="btn ${primary ? "primary" : ""}" data-win-act="${name}:${this.esc(arg)}" ${disabled ? "disabled" : ""}>${this.t(label)}</button>`;
  }

  // What the open step asks for.
  winStepBody(step, state) {
    const p = this.preflight;
    if (step === "preflight") return `<p class="factnote">${this.t("winPreflightHint")}</p>${p ? this.preflightRows(p.state, p.checks) : ""}<div class="actions">${this.winButton("winCheck", "preflight")}${this.winButton("winNext", "next", step, true, !p)}</div>`;
    if (step === "baseline") return `<p class="factnote">${this.t("winBaselineHint")}</p><div class="actions">${this.winButton("winSave", "baseline", "", true)}</div>`;
    if (step === "plan") return `<p class="factnote">${this.t("winPlanHint")}</p><div class="actions">${this.winButton("winOpenPlan", "plan", state.plan_id)}${this.winButton("winPlanDone", "next", step, true)}</div>`;
    if (step === "reload") {
      const list = this.winTargets ? (this.winTargets.length ? this.winTargets.map(x => `<div class="row rel"><span class="tile ${x.ok === false ? "red" : "mute"}"><ha-icon icon="mdi:reload"></ha-icon></span><span class="row-text"><strong>${this.esc(x.title)}</strong><small>${this.esc(x.domain)}${x.ok === false ? ` · ${this.esc(x.error || "")}` : ""}</small></span></div>`).join("") : `<p class="factnote">${this.t("winNoTargets")}</p>`) : "";
      return `<p class="factnote">${this.t("winReloadHint")}</p>${list}<div class="actions">${this.winButton("winShowTargets", "targets")}${this.winButton("winReload", "reload", "", true, !this.winTargets?.length)}${this.winButton("winSkip", "skip", step)}</div>`;
    }
    if (step === "restart") return `<p class="factnote">${this.t("winRestartHint")}</p><div class="actions">${this.winButton("winRestartSeen", "next", step, true)}${this.winButton("winSkip", "skip", step)}</div>`;
    if (step === "compare") return `<p class="factnote">${this.t("winCompareHint")}</p>${this.winCompared && p?.after ? this.preflightAfter(p.after) : ""}<div class="actions">${this.winButton("winCompare", "compare")}${this.winButton("winNext", "next", step, true, !this.winCompared)}</div>`;
    return `<p class="factnote">${this.t("winReportHint")}</p><div class="actions">${this.winButton("winDownload", "report", "", true)}${this.winButton("winClose", "clear")}</div>`;
  }

  windowCard() {
    this.ensureWindow();
    const head = `<p class="factnote pad">${this.t("winHint")}</p>`;  // the tool bar above the card carries the "experimental" label; the title is on the tile
    const w = this.win;
    if (!w) return `<div class="panel">${head}${this.skeleton("loading")}</div>`;
    const error = this.winError ? `<div class="error">${this.esc(this.winError)}</div>` : "";
    if (!w.enabled) return `<div class="panel">${head}<div class="pad"><p class="factnote">${this.t("winWarning")}</p><div class="actions">${this.winButton("winEnable", "enable", "", true)}</div>${error}</div></div>`;
    if (!w.state) {
      const plans = (this.journal || []).filter(plan => !plan.executed && plan.status === "dry_run");
      const rows = plans.map(plan => `<div class="row rel"><span class="tile mute"><ha-icon icon="mdi:clipboard-text-clock-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(this.formatDate(plan.created_at))}</strong><small>${this.t("planSummary", { total: plan.summary?.total ?? 0, ok: plan.summary?.ok ?? 0, review: plan.summary?.review ?? 0, blocked: plan.summary?.blocked ?? 0 })}</small></span>${this.winButton("winBegin", "begin", plan.plan_id, true)}</div>`).join("");
      return `<div class="panel">${head}<div class="pad"><p class="factnote">${this.t("winChoose")}</p></div>${rows || `<div class="emptymsg"><ha-icon icon="mdi:clipboard-outline"></ha-icon>${this.t("winNoPlans")}</div>`}<div class="pad"><div class="actions">${this.winButton("winDisable", "disable")}</div>${error}</div></div>`;
    }
    const open = w.current;
    const steps = WINDOW_STEPS.map(step => {
      const done = w.state.done.includes(step), current = step === open;
      const note = w.state.log.find(e => e.step === step)?.note;
      return `<div class="row rel"><span class="tile ${done ? "ok" : current ? "warn" : "mute"}"><ha-icon icon="${done ? "mdi:check" : current ? "mdi:arrow-right-bold" : "mdi:circle-outline"}"></ha-icon></span><span class="row-text"><strong>${this.winStepLabel(step)}</strong>${note ? `<small>${this.esc(note)}</small>` : ""}</span></div>${current ? `<div class="pad">${this.winStepBody(step, w.state)}</div>` : ""}`;
    }).join("");
    const after = w.state.done.includes("plan") ? this.t("winAfterPlan") : "";
    return `<div class="panel">${head}${steps}<div class="pad">${error}${after ? `<p class="factnote">${after}</p>` : ""}<div class="actions">${this.winButton(open ? "winAbort" : "winClose", "clear")}</div></div></div>`;
  }
}
