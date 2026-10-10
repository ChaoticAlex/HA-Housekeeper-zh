// CleanupMixin: methods of the panel element, mixed into the class in 99-register.js.
class CleanupMixin {
  // Days since an ISO timestamp, never negative.
  daysSince(value) {
    const ms = Date.now() - new Date(value).getTime();
    return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 864e5)) : 0;
  }

  quarantineOf(objectId) { return (this.data?.quarantine || []).find(q => q.object_id === objectId) || null; }

  // Takes one disabled object out of quarantine again: the journal's undo for just that object, after a question.
  releaseControl(q) {
    const key = `${q.object_type || "entity"}:${q.object_id}`;
    if (this.releaseConfirm === key) {
      return `<span class="qconfirm" role="group" aria-label="${this.esc(this.t("releaseQuestion"))}"><span>${this.t("releaseQuestion")}</span><button class="btn" data-release-yes="${this.esc(key)}">${this.t("yes")}</button><button class="btn" data-release-no>${this.t("cancelRun")}</button></span>`;
    }
    return `<button class="btn" data-release="${this.esc(key)}" ${this.cleanupRunning() ? "disabled" : ""}>${this.t("releaseAction")}</button>`;
  }

  async releaseQuarantine(key) {
    const q = (this.data?.quarantine || []).find(e => `${e.object_type || "entity"}:${e.object_id}` === key);
    this.releaseConfirm = null;
    if (!q) return this.render();
    try {
      const res = await this._hass.callWS({ type: "ha_housekeeper/plan_undo", plan_id: q.plan_id, object_ids: [q.object_id] });
      this.releaseMessage = res.results.length
        ? res.results.map(r => `${q.object_id}: ${this.t(`undo_${r.outcome}`)}`).join(" · ")
        : `${q.object_id}: ${this.t("releaseNothing")}`;
      this.journal = null;
      if (this.data) await this.load(false);
    } catch (err) { this.releaseMessage = this.errText(err); }
    this.render();
  }

  // The tiles of the Cleanup view: one job each, with the number of things to do; the chosen one is marked.
  cleanupTiles(tabs, open) {
    return this.navTiles("cleanup", tabs.map(t => ({ ...t, tone: t.count ? t.tone : "mute" })), open, this.t("cleanup"));
  }

  // Devices without a working entity: nothing there to lose by quarantining them.
  deviceCandidates() {
    const members = new Map();
    for (const o of this.data.objects) if (o.object_type === "entity" && o.device_id) (members.get(o.device_id) || members.set(o.device_id, []).get(o.device_id)).push(o);
    return this.data.objects.filter(o => o.object_type === "device" && o.status !== "disabled" && (members.get(o.object_id) || []).every(e => ["orphaned", "unavailable", "unknown", "disabled"].includes(e.status)))
      .map(item => ({ item, finding: null, quarantine: null, count: (members.get(item.object_id) || []).length }));
  }

  quarantineRows(type) {
    return (this.data.quarantine || []).filter(q => (q.object_type || "entity") === type).map(q => ({ item: this.findObject(`${type}:${q.object_id}`), finding: null, quarantine: q })).filter(r => r.item);
  }

  cleanupCandidates(kind = this.cleanupKind) {
    if (kind === "remove_entity") return this.quarantineRows("entity");
    if (kind === "remove_device" || kind === "forget_device") return this.quarantineRows("device");
    if (kind === "disable_device") return this.deviceCandidates();
    const seen = new Set(), rows = [];
    for (const f of this.data.findings) {
      if (f.ignored || !f.rule_id.startsWith("entity.") || !["orphaned", "unavailable"].includes(f.classification) || seen.has(f.object_id)) continue;
      const item = this.findObject(`entity:${f.object_id}`);
      if (!item) continue;
      seen.add(f.object_id);
      rows.push({ item, finding: f });
    }
    return rows;
  }

  // The word that has to be typed before a plan runs: the strongest action in it decides.
  planWord(plan) {
    const executable = (plan?.actions || []).filter(a => a.executable);
    if (executable.some(a => PURGE_KINDS.includes(a.kind))) return this.t("purgeWord");
    if (executable.some(a => REMOVAL_KINDS.includes(a.kind) || a.kind === "delete_automation")) return this.t("confirmWordRemove");
    if (executable.some(a => a.kind === "migrate_meter")) return this.t("confirmWordMeter");
    if (executable.some(a => REPAIR_KINDS.includes(a.kind))) return this.t("confirmWordRepair");
    if (executable.some(a => a.kind === "replace_references" || a.kind === "refactor_automation")) return this.t("confirmWordReplace");
    if (executable.some(a => a.kind === "rename_entity")) return this.t("confirmWordRename");
    return this.t("confirmWord");
  }

  confirmSummary(plan, count) {
    const executable = plan.actions.filter(a => a.executable);
    const devices = executable.some(a => DEVICE_KINDS.includes(a.kind));
    const key = executable.some(a => a.kind === "delete_backup") ? "confirmedSummaryBackups" : executable.some(a => a.kind === "delete_automation") ? "confirmedSummaryAutoDelete" : executable.some(a => a.kind === "trim_history") ? "confirmedSummaryTrim" : executable.some(a => a.kind === "purge_statistics") ? "confirmedSummaryPurge" : executable.some(a => REMOVAL_KINDS.includes(a.kind)) ? (devices ? "confirmedSummaryDeviceRemove" : "confirmedSummaryRemove")
      : executable.some(a => a.kind === "migrate_meter") ? "confirmedSummaryMeter"
      : executable.some(a => REPAIR_KINDS.includes(a.kind)) ? "confirmedSummaryRepair"
      : executable.some(a => a.kind === "add_label") ? "confirmedSummaryLabel"
      : executable.some(a => a.kind === "set_area") ? "confirmedSummaryArea"
      : executable.some(a => a.kind === "rename_entity") ? "confirmedSummaryRename"
      : executable.some(a => a.kind === "replace_references") ? "confirmedSummaryReplace" : executable.some(a => a.kind === "refactor_automation") ? "confirmedSummaryRefactor" : devices ? "confirmedSummaryDeviceDisable" : "confirmedSummary";
    const changes = executable.filter(a => a.kind === "replace_references").flatMap(a => a.sources || []).reduce((n, src) => n + (src.change_count || 0), 0);
    return this.t(key, { count: key === "confirmedSummaryReplace" ? changes : count });
  }

  // "trigger/0/entity_id" reads as "Trigger 1 · entity_id"; a path in another shape stays as it is.
  sourceSpot(location) {
    const m = /^(triggers?|conditions?|actions?|sequence)(?:\[(\d+)\]|\/(\d+))(?:[./](.*))?$/.exec(location || "");
    if (!m) return location || "";
    const word = { trigger: "srcTrigger", condition: "srcCondition", action: "srcAction", sequence: "srcAction" }[m[1].replace(/s$/, "")];
    return `${this.t(word)} ${Number(m[2] ?? m[3]) + 1}${m[4] ? ` · ${m[4]}` : ""}`;
  }

  // What a replacement will touch: every source with what changes in it (old and new line), and what stays by hand.
  sourceList(action) {
    const sources = action.sources || [];
    if (!sources.length) return `<small>${this.t("replaceNoSources")}</small>`;
    const open = sources.filter(src => src.writable && src.change_count);
    const hand = sources.flatMap(src => (src.writable ? [] : [`${src.name} (${this.t(src.type)}): ${this.t(`source_${src.reason}`)}`]).concat((src.manual || []).map(path => `${src.name} (${this.t(src.type)}): ${path}`)));
    const total = open.reduce((n, src) => n + src.change_count, 0);
    const block = src => {
      const lines = (src.changes || []).slice(0, 5).map(c => `<span class="srcspot">${this.esc(this.sourceSpot(c.location))}</span><span class="srcln del"><i>−</i><span>${this.esc(c.from)}</span></span><span class="srcln add"><i>+</i><span>${this.esc(c.to)}</span></span>`).join("");
      const more = src.change_count > Math.min(5, (src.changes || []).length) ? `<small class="u-dim u-block">${this.t("replaceMoreChanges", { count: src.change_count - Math.min(5, (src.changes || []).length) })}</small>` : "";
      return `<div class="srcblock"><div class="srchead"><ha-icon icon="${src.type === "energy" ? "mdi:lightning-bolt-outline" : "mdi:file-edit-outline"}"></ha-icon><span><strong>${this.esc(src.name)}</strong><small>${this.esc(this.t(src.type === "energy" ? "energyDashboard" : src.type))} · ${this.esc(this.t("replaceChanges", { count: src.change_count }))}</small></span></div>${src.undo_per_item ? `<small class="u-amber u-block"><ha-icon icon="mdi:alert-outline" class="u-ic14"></ha-icon> ${this.esc(this.t("sourceUndoPerItem"))}</small>` : ""}${lines ? `<div class="srcdiff">${lines}</div>` : ""}${more}</div>`;
    };
    const shown = open.slice(0, 3), folded = open.slice(3);
    const foldedHtml = folded.length ? `<details class="rowdetails"><summary>${this.t("replaceMoreSources", { count: folded.length })}</summary>${folded.map(block).join("")}</details>` : "";
    const byHand = hand.length ? `<div class="srchand"><strong>${this.t("replaceByHand", { count: hand.length })}</strong><ul>${hand.map(h => `<li>${this.esc(h)}</li>`).join("")}</ul></div>` : "";
    return `<div class="srclist"><small class="u-block">${this.t("replaceSummary", { count: total, sources: open.length })}</small>${shown.map(block).join("")}${foldedHtml}${byHand}</div>`;
  }

  // What a meter change will do: copied hours, the shift of the total, the ID move, and the transition.
  meterDetail(action) {
    const s = action.statistics || {}, lines = [];
    const day = ts => this.formatDate(ts * 1000);
    if (action.mode !== "id" && s.import_count) {
      lines.push(this.t("meterCopy", { count: s.import_count, from: day(s.old_first), to: day(s.old_last) }));
      if (s.switch) lines.push(this.t("meterSwitch", { date: day(s.switch) }));
      if (s.offset !== null && s.offset !== undefined) lines.push(this.t("meterOffset", { offset: this.formatNumber(Math.round(s.offset * 1000) / 1000), unit: s.unit || "" }));
      if (s.dropped_overlap) lines.push(this.t("meterOverlap", { count: s.dropped_overlap }));
      if (s.gap_hours > 0) lines.push(this.t("meterGap", { hours: s.gap_hours }));
    }
    if (action.mode !== "statistics" && action.alt_id) lines.push(this.t("meterIdMove", { old: action.object_id, alt: action.alt_id, new: action.target }));
    const before = (s.preview?.before || []), after = (s.preview?.after || []);
    const cell = row => `${this.esc(day(row.start))}: ${this.esc(this.formatNumber(Math.round((row.sum_after ?? row.sum ?? 0) * 1000) / 1000))}`;
    const rows = before.length || after.length ? `<small class="u-dim u-block">${this.t("meterPreviewRows")}: ${[...before, ...after].map(cell).join(" · ")}</small>` : "";
    const kept = action.result?.statistics_kept ? `<small class="u-block">${this.t("meterStatsKept")}</small>` : "";
    return `<span class="u-pt6 u-block">${lines.map(l => `<small class="u-block">${this.esc(l)}</small>`).join("")}${rows}${kept}</span>`;
  }

  // Recorder purges are no plans and cannot be undone; the journal only notes them.
  purgeJournalCard() {
    const purges = this.purges || [];
    if (!purges.length) return "";
    const me = this._hass?.user?.id;
    const purgeRows = purges.map(p => {
      const what = this.t("purgeEntry", { removed: this.formatNumber(p.removed.length), skipped: this.formatNumber(p.skipped.length) });
      const who = p.by && p.by === me ? this.t("purgeByYou") : p.by ? this.t("purgeByOther") : "";
      const parts = [this.formatDate(p.at), what, p.states ? this.t("purgeWithStates") : "", p.backup ? this.t("purgeBackup", { job: p.backup.job_id || "—" }) : this.t("purgeNoBackup"), who, p.error ? this.t("purgeError", { error: p.error }) : ""];
      return `<div class="row"><span class="tile ${p.error ? "warn" : "mute"}"><ha-icon icon="mdi:database-remove-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(p.removed.slice(0, 3).join(", ") + (p.removed.length > 3 ? ` +${p.removed.length - 3}` : "") || this.t("purgeNothing"))}</strong><small>${parts.filter(Boolean).map(x => this.esc(x)).join(" · ")}</small></span></div>`;
    });
    const pg = this.paginate("purgejournal", purgeRows), rows = pg.rows.join("") + pg.footer;
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("purgeJournal")} (${purges.length})</h2><p>${this.t("purgeJournalHint")}</p></div></div>${rows}</div>`;
  }

  async loadJournal() {
    try {
      const reply = await this._hass.callWS({ type: "ha_housekeeper/plan_list" });
      this.journal = reply.plans || []; this.purges = reply.purges || [];
    } catch (_) { this.journal = []; }
    this.render();
  }

  // The journal list holds short entries only; the plan itself is fetched when it is opened.
  async openPlan(planId) {
    try { this.plan = await this._hass.callWS({ type: "ha_housekeeper/plan_detail", plan_id: planId }); this.cleanupError = ""; } catch (err) { this.cleanupError = this.errText(err); }
    this.render();
  }

  // Removing an entity can also delete its recorder data; the default keeps it, and the choice holds for the whole plan.
  recorderChoice(removal) {
    if (!removal || !this.data?.meta?.recorder_available) return "";
    const value = this.cleanupRecorder || "keep";
    return `<label class="recchoice"><span>${this.t("recChoiceLabel")}</span><select data-recorder-choice aria-label="${this.esc(this.t("recChoiceLabel"))}">${["keep", "statistics", "states"].map(k => `<option value="${k}" ${value === k ? "selected" : ""}>${this.t(`recChoice_${k}`)}</option>`).join("")}</select></label>${value !== "keep" ? `<small class="recwarn">${this.t("recChoiceWarn")}</small>` : ""}`;
  }

  async createPlan() {
    if (this.cleanupKind === "exchange_device") return this.createExchangePlan();
    const pair = this.cleanupKind === "replace_references" ? [this.replOld, this.replNew] : this.cleanupKind === "migrate_meter" ? [this.meterOld, this.meterNew] : this.cleanupKind === "repair_counter" ? [this.counterSel, "-"] : null;
    if (pair ? !(pair[0] && pair[1]) : !this.cleanupSel.size) return;
    this.cleanupBusy = true; this.cleanupError = ""; this.render();
    try {
      const actions = this.cleanupKind === "replace_references" ? [{ kind: "replace_references", object_id: this.replOld, target: this.replNew }]
        : this.cleanupKind === "migrate_meter" ? [{ kind: "migrate_meter", object_id: this.meterOld, target: this.meterNew, mode: this.meterMode }]
        : this.cleanupKind === "repair_counter" ? [this.counterRangeReq ? { kind: "repair_range", object_id: this.counterSel, mode: this.counterRangeReq.mode, range: this.counterRangeReq.range } : { kind: "repair_counter", object_id: this.counterSel, mode: this.counterMode || "hold" }]
        : [...this.cleanupSel].map(object_id => ({ kind: this.cleanupKind, object_id, ...(REMOVAL_KINDS.includes(this.cleanupKind) && this.cleanupRecorder && this.cleanupRecorder !== "keep" ? { recorder: this.cleanupRecorder } : {}) }));
      const plan = await this._hass.callWS({ type: "ha_housekeeper/plan_create", actions });
      this.openNewPlan(plan, null); this.toast(this.t("previewReady"));
    } catch (err) { this.cleanupError = err?.message || String(err); }
    this.cleanupBusy = false; this.render();
  }

  // Creates a fresh preview with the same objects as an earlier plan, for example one that was aborted.
  // `full`: the small backup failed and the person chose the full one (as the backup settings say).
  async repeatPlan(plan, full = false) {
    this.cleanupBusy = true; this.cleanupError = ""; this.render();
    try {
      const actions = plan.actions.map(a => {
        const r = { kind: a.kind, object_id: a.object_id };
        for (const key of ["target", "mode", "range", "recorder", "fix", "values"]) if (a[key]) r[key] = a[key];
        if (a.kind === "purge_statistics") r.states = Boolean(a.states);
        if (a.kind === "trim_history") r.keep_days = a.keep_days;
        return r;
      });
      const fresh = await this._hass.callWS({ type: "ha_housekeeper/plan_create", actions, ...(full ? { full_backup: true } : {}) });
      this.openNewPlan(fresh, null);
    } catch (err) { this.cleanupError = this.errText(err); }
    this.cleanupBusy = false; this.render();
  }

  errText(err) {
    const key = `err_${err?.code}`;
    return TEXT[this.lang][key] ? this.t(key) : (err?.message || String(err));
  }

  async confirmPlan() {
    try {
      this.confirmation = await this._hass.callWS({ type: "ha_housekeeper/plan_confirm", plan_id: this.plan.plan_id, acknowledged: [...this.ack] });
      this.confirmWord = ""; this.cleanupError = "";
    } catch (err) { this.cleanupError = this.errText(err); }
    this.render();
  }

  async executePlan() {
    const { plan_id, token } = this.confirmation;
    try {
      await this._hass.callWS({ type: "ha_housekeeper/plan_execute", plan_id, token });
      this.confirmation = null; this.cleanupError = ""; this._scrollPlan = true;
      this.pollPlan(plan_id);
    } catch (err) { this.cleanupError = this.errText(err); this.confirmation = null; }
    this.render();
  }

  async cancelPlan() { try { await this._hass.callWS({ type: "ha_housekeeper/plan_cancel" }); } catch (_) { /* nothing running */ } }

  // Follow a running plan until it stops; the plan object is replaced everywhere it is shown.
  async pollPlan(planId) {
    this._polling = planId;
    let tries = 0;
    while (this._polling === planId) {
      try {
        const res = await this._hass.callWS({ type: "ha_housekeeper/plan_status", plan_id: planId });
        this.adoptPlan(res.plan); this.planProgress = res.progress; this.render();
        const verifying = res.plan.status === "executed" && !res.plan.verification && (tries += 1) < 60;
        if (!res.progress.running && res.plan.status !== "running" && !verifying) break;
      } catch (_) { break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this._polling = null; this.planProgress = null;
    if (this.plan?.plan_id === planId && ["verified", "executed", "partial", "aborted"].includes(this.plan.status)) this.toast(this.t(`toast_${this.plan.status}`));
    if (this.data) this.load(false);
    this.render();
  }

  // True while a plan is executed: the backend refuses scans then, so the button is disabled.
  cleanupRunning() { return ["backup", "running"].includes(this.plan?.status); }

  adoptPlan(plan) {
    if (this.plan?.plan_id === plan.plan_id) this.plan = plan;
    this.journal = (this.journal || []).map(p => (p.plan_id === plan.plan_id ? plan : p));
  }

  async undoPlan(objectIds) {
    this.undoAsk = null;
    try {
      const res = await this._hass.callWS({ type: "ha_housekeeper/plan_undo", plan_id: this.plan.plan_id, ...(objectIds ? { object_ids: objectIds } : {}) });
      const kindOf = id => this.plan?.actions.find(a => a.object_id === id)?.kind;
      this.undoMessage = res.results.map(r => `${r.object_id}: ${this.t(r.outcome === "undone" && REMOVAL_KINDS.includes(kindOf(r.object_id)) ? "undo_restored" : r.outcome === "undone" && kindOf(r.object_id) === "add_label" ? "undo_unlabelled" : `undo_${r.outcome}`)}`).join(" · ");
      const status = await this._hass.callWS({ type: "ha_housekeeper/plan_status", plan_id: this.plan.plan_id });
      this.adoptPlan(status.plan);
      if (this.data) this.load(false);
    } catch (err) { this.cleanupError = this.errText(err); }
    this.render();
  }

  // Open previews can be merged into one plan: the backend rebuilds it from the requests and reports conflicts.
  mergeable(plan) { return !plan.executed && !plan.run; }

  async mergePlans() {
    const ids = [...(this.mergeSel || [])].filter(id => (this.journal || []).some(p => p.plan_id === id && this.mergeable(p)));
    if (ids.length < 2 || this.cleanupBusy) return;
    this.cleanupBusy = true; this.cleanupError = ""; this.mergeNote = ""; this.render();
    try {
      const result = await this._hass.callWS({ type: "ha_housekeeper/plan_merge", plan_ids: ids });
      this.plan = result.plan; this.confirmation = null; this.ack = new Set(); this.confirmWord = ""; this.mergeSel = new Set();
      this.journal = [result.plan, ...(this.journal || []).filter(p => !result.merged.includes(p.plan_id))];
      this.mergeNote = result.conflicts.length ? this.t("mergeConflicts", { count: result.conflicts.length, list: result.conflicts.slice(0, 5).map(c => `${c.object_id} (${c.kinds.join(" / ")})`).join(", ") }) : this.t("mergeDone", { count: result.merged.length });
    } catch (err) { this.cleanupError = this.errText(err); }
    this.cleanupBusy = false; this.render();
  }

  async deletePlan(id) {
    try { await this._hass.callWS({ type: "ha_housekeeper/plan_delete", plan_id: id }); } catch (_) { /* already gone */ }
    this.journal = (this.journal || []).filter(p => p.plan_id !== id);
    if (this.plan?.plan_id === id) this.plan = null;
    this.render();
  }

  // The stages of a plan in the order the backend runs them: the typed confirmation comes first, the backup
  // is made when the run starts. Each step is "done", "current", "todo", "skipped" or "failed".
  planSteps(plan, confirming) {
    const status = plan.status, open = status === "dry_run";
    const executable = plan.actions.filter(a => a.executable);
    const needsBackup = executable.some(a => BACKUP_KINDS.includes(a.kind));
    const backupFailure = plan.actions.map(a => a.result?.reason).find(r => BACKUP_FAILURES.includes(r));
    const steps = [{ id: "stepSelect", state: "done" }];
    steps.push(open && !confirming ? (executable.length ? { id: "stepAnalysis", state: "current" } : { id: "stepAnalysis", state: "failed", note: this.t("stepAnalysisBlocked") }) : { id: "stepAnalysis", state: "done" });
    steps.push({ id: "stepConfirm", state: open ? (confirming ? "current" : "todo") : "done" });
    if (!needsBackup) steps.push({ id: "stepBackup", state: "skipped", note: this.t("stepBackupSkipped") });
    else if (backupFailure) steps.push({ id: "stepBackup", state: "failed", note: [this.t(`abort_${backupFailure}`), ...(plan.events || []).filter(e => e.error).slice(-2).map(e => e.error), this.t("backupFailHint")].join(" · ") });
    else if (status === "backup") steps.push({ id: "stepBackup", state: "current", note: this.t("backupRunning") });
    else if (open) steps.push({ id: "stepBackup", state: "todo", note: plan.full_backup ? this.t("backupFullPlanned") : null });
    else {
      const job = plan.backup?.job_id ? this.t("stepBackupJob", { id: plan.backup.job_id }) : "";
      steps.push({ id: "stepBackup", state: "done", note: plan.backup?.at ? this.t("stepBackupDone", { date: this.formatDate(plan.backup.at), job }) : null });
    }
    const ranStates = ["executed", "verified", "undone", "partially_undone"];
    steps.push(status === "running" ? { id: "stepRun", state: "current" }
      : ranStates.includes(status) ? { id: "stepRun", state: "done" }
      : status === "partial" ? { id: "stepRun", state: "failed", note: this.t("stepRunPartial") }
      : status === "aborted" && !backupFailure ? { id: "stepRun", state: "failed" } : { id: "stepRun", state: "todo" });
    const verification = plan.verification;
    steps.push(verification ? (verification.ok ? { id: "stepVerify", state: "done" } : { id: "stepVerify", state: "failed", note: this.t("stepVerifyFailed") })
      : status === "executed" ? { id: "stepVerify", state: "current" } : { id: "stepVerify", state: "todo" });
    return steps;
  }

  planStepper(plan, confirming) {
    const mark = { done: "✓", failed: "!", skipped: "–" };
    const items = this.planSteps(plan, confirming).map((step, i) => `<li class="step ${step.state}"${step.state === "current" ? ' aria-current="step"' : ""}><span class="mark" aria-hidden="true">${mark[step.state] || i + 1}</span><span class="steptext"><b>${this.t(step.id)}</b><span class="sr-only">: ${this.t(`step${{ done: "Done", current: "Current", todo: "Todo", skipped: "Skipped", failed: "Failed" }[step.state]}`)}</span>${step.note ? `<small>${this.esc(step.note)}</small>` : ""}</span></li>`).join("");
    const backup = plan.backup ? `<p class="factnote">${this.t("backupRestoreHint")}</p>` : "";
    return `<ol class="steps" aria-label="${this.esc(this.t("stepsLabel"))}">${items}</ol>${backup}`;
  }

  // Housekeeper can take every action back except merged statistics, which only a backup restores.
  undoBadge(action) {
    if (action.kind === "delete_backup") return `<span class="pill mute"><ha-icon icon="mdi:delete-forever-outline" class="u-ic14"></ha-icon>${this.t("undoFinal")}</span>`;
    const backupOnly = action.kind === "migrate_meter" || PURGE_KINDS.includes(action.kind);
    return `<span class="pill ${backupOnly ? "warn" : "mute"}"><ha-icon icon="${backupOnly ? "mdi:backup-restore" : "mdi:undo-variant"}" class="u-ic14"></ha-icon>${this.t(backupOnly ? "undoBackupOnly" : "undoHousekeeper")}</span>`;
  }

  // One clear line with the end of a run: green when it all worked, amber when something is left, red when nothing was done.
  planOutcome(plan) {
    const status = plan.status, total = plan.actions.length;
    const done = plan.actions.filter(a => a.result?.state === "done").length;
    const failedCheck = plan.verification && !plan.verification.ok;
    let tone, icon, text;
    if (status === "verified") { tone = "ok"; icon = "mdi:check-circle"; text = this.t("outcomeDone", { done, total }); }
    else if (status === "executed" && !plan.verification) { tone = "mute"; icon = "mdi:progress-clock"; text = this.t("outcomeVerifying", { done, total }); }
    else if (status === "executed" && failedCheck) { tone = "warn"; icon = "mdi:alert-circle"; text = this.t("outcomeCheckFailed", { done, total }); }
    else if (status === "partial") { tone = "warn"; icon = "mdi:alert-circle"; text = this.t("outcomePartial", { done, total }); }
    else if (status === "aborted") { tone = "red"; icon = "mdi:close-circle"; text = this.t("outcomeAborted"); }
    else return "";
    const doneActions = plan.actions.filter(a => a.result?.state === "done" && a.kind !== "delete_backup");
    const backupOnly = a => ["migrate_meter", ...PURGE_KINDS].includes(a.kind);
    const undo = !doneActions.length ? "" : doneActions.every(backupOnly) ? this.t("outcomeUndoBackup") : doneActions.some(backupOnly) ? this.t("outcomeUndoMixed") : this.t("outcomeUndoYes");
    return `<div class="outcome ${tone}" role="status"><ha-icon icon="${icon}"></ha-icon><span><strong>${this.esc(text)}</strong>${undo ? `<small>${this.esc(undo)}</small>` : ""}</span></div>`;
  }

  planCard(plan) {
    const sm = plan.summary || {};
    const open = plan.status === "dry_run";
    const rowList = plan.actions.map(a => {
      const settled = a.result?.state === "done";
      const idle = a.verdict === "blocked" && (a.reasons || []).length > 0 && a.reasons.every(r => NOTHING_REASONS.includes(r));
      const tone = settled ? "ok" : idle ? "mute" : { ok: "ok", review: "warn", blocked: "red" }[a.verdict] || "mute";
      const uses = (a.used_by || []).slice(0, 4).map(u => {
        const obj = this.findObject(u.source);
        return `<button class="chip" data-object="${this.esc(u.source)}">${this.esc(obj?.name || u.source.split(":").slice(1).join(":"))}</button>`;
      }).join("");
      const more = (a.used_by || []).length > 4 ? `<small>+${a.used_by.length - 4}</small>` : "";
      const reasons = (a.reasons || []).map(r => (r === "quarantine_too_short" && a.quarantine_days_left ? `${this.t("reason_quarantine_too_short")} (${this.t("daysLeftShort", { days: a.quarantine_days_left })})` : this.t(`reason_${r}`))).join(" ");
      const type = a.object_type || "entity", obj = this.findObject(`${type}:${a.object_id}`);
      const result = a.result;
      const resultPill = result ? `<span class="pill ${{ done: "ok", undone: "mute" }[result.state] || "warn"}">${this.t(`result_${result.state === "done" ? DONE_RESULTS[a.kind] || "done" : result.state}`)}</span>` : "";
      const sub0 = a.kind === "set_area" ? `${a.object_id} → ${a.area_name || "?"}${a.suggested && a.area_name ? ` (${this.t("areaSuggested")})` : ""}` : a.kind === "add_label" ? `${a.object_id} + ${a.label_name || a.target || "?"}` : a.kind === "replace_references" || a.kind === "migrate_meter" || a.kind === "rename_entity" ? `${a.object_id} → ${a.target || "?"}` : type === "device" ? `${this.t("deviceEntities", { count: (a.entities || []).length })}` : a.object_id;
      const sub = [sub0 === a.name ? "" : sub0, a.recorder ? this.t(`recChoice_${a.recorder}`) : "", a.kind === "delete_backup" ? [a.backup?.date ? this.formatDate(a.backup.date).split(",")[0] : "", this.formatBytes(a.backup?.size)].filter(Boolean).join(" · ") : "", a.kind === "trim_history" ? this.t("trimSub", { days: a.keep_days, rows: a.trim?.rows ?? "?" }) : ""].filter(Boolean).join(" · ");
      const sources = a.kind === "delete_automation" ? this.deleteDiff(a) : a.kind === "replace_references" || a.kind === "rename_entity" ? this.sourceList(a) : a.kind === "refactor_automation" ? this.refactorDiff(a) : a.kind === "migrate_meter" ? this.meterDetail(a) : REPAIR_KINDS.includes(a.kind) ? this.counterDetail(a) : "";
      const abort = result?.state === "not_run" ? ` · ${this.t(`abort_${result.reason}`)}` : result?.stopped ? ` · ${this.t(`abort_${result.stopped}`)}` : "" + (result?.purge?.state === "failed" ? ` · ${this.t("result_purge_failed")}` : "");
      const ack = "";
      const undo = result?.state !== "done" || PURGE_KINDS.includes(a.kind) ? "" : this.undoAsk === a.object_id
        ? `<span class="askrow"><span>${this.t("undoAskOne")}</span><button class="btn danger" data-undo-one-yes="${this.esc(a.object_id)}">${this.t("undoYes")}</button><button class="btn accent" data-undo-no>${this.t("cancelRun")}</button></span>`
        : `<button class="btn accent" data-undo-one="${this.esc(a.object_id)}"><ha-icon icon="mdi:undo-variant"></ha-icon>${this.t("undoOne")}</button>`;
      return `<div class="row planrow ${a.verdict === "blocked" ? "dim" : ""}"><span class="tile ${tone}"><ha-icon icon="${settled || idle || a.verdict === "ok" ? "mdi:check" : a.verdict === "review" ? "mdi:alert-outline" : "mdi:close-octagon-outline"}"></ha-icon></span>
        <span class="row-text"><strong>${obj ? `<button class="link" data-object="${this.esc(`${type}:${a.object_id}`)}">${this.esc(a.name)}</button>` : this.esc(a.name)}</strong><small>${this.esc([sub, reasons, abort.replace(/^ · /, "")].filter(Boolean).join(" · "))}</small>${ack}${["replace_references", "rename_entity"].includes(a.kind) ? sources : ""}${(["replace_references", "rename_entity"].includes(a.kind) ? "" : sources) || uses ? `<details class="rowdetails"><summary>${this.t("planDetails")}</summary>${["replace_references", "rename_entity"].includes(a.kind) ? "" : sources}${uses ? `<span class="chips" style="padding:6px 0 0;border:0">${uses}${more}</span>` : ""}</details>` : ""}</span>
        <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${resultPill}${undo}${a.executable && (result || !(a.reasons || []).includes("irreversible")) ? this.undoBadge(a) : ""}${result ? "" : `<span class="pill ${tone}">${this.t(idle ? "verdictNothing" : a.verdict === "review" && (a.reasons || []).includes("irreversible") ? "verdictIrreversible" : `verdict_${a.verdict}`)}</span>`}</span></div>`;
    });
    const extra = [sm.uses ? this.t("planUses", { count: sm.uses }) : "", sm.statistics ? this.t("planStats", { count: sm.statistics }) : ""].filter(Boolean).join(" · ");
    const executable = plan.actions.some(a => a.executable);
    const word = this.planWord(plan), conf = this.confirmation?.plan_id === plan.plan_id ? this.confirmation : null;
    let control = "";
    if (open && !executable) control = `<p class="factnote">${this.t("nothingExecutable")}</p>`;
    else if (open && !conf) {
      const review = plan.actions.filter(a => a.verdict === "review" && a.executable);
      const all = review.length && review.every(a => this.ack.has(a.object_id));
      const reviewBox = review.length ? `<label class="factnote reportopt"><input type="checkbox" data-ack-all ${all ? "checked" : ""}><span><strong>${this.t("acknowledgeAll", { count: review.length })}</strong><small>${this.t("acknowledgeAllHint")}</small></span></label>` : "";
      control = `<div class="setrow planfoot">${reviewBox || `<small class="u-m0">${this.t("cleanupDryRun")}</small>`}<button class="btn primary" data-plan-confirm>${this.t("confirmPlan")}</button></div>`;
    }
    else if (open && conf) control = `<div class="setrow planfoot"><button class="btn" data-plan-back><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("wzBack")}</button><div><strong>${this.t("confirmPlanTitle")}</strong><small>${this.confirmSummary(plan, conf.execute.length)}</small>${conf.needs_acknowledgement.length ? `<small>${this.t("skippedUnacknowledged", { count: conf.needs_acknowledgement.length })}</small>` : ""}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="factnote u-m0">${this.t("confirmTypeWord", { word })}</label><input type="text" data-confirm-word value="${this.esc(this.confirmWord)}" style="max-width:180px" autocomplete="off"><button class="btn ${plan.actions.some(a => a.executable && (REMOVAL_KINDS.includes(a.kind) || PURGE_KINDS.includes(a.kind))) ? "danger" : "primary"}" data-plan-execute ${this.confirmWord.trim().toUpperCase() === word ? "" : "disabled"}>${this.t("runNow")} (${conf.execute.length})</button></div></div>`;
    else if (plan.status === "aborted") {
      const small = plan.actions.some(a => a.result?.reason === "backup_small_failed");
      const full = small ? `<button class="btn" data-plan-repeat-full="${this.esc(plan.plan_id)}" ${this.cleanupBusy ? "disabled" : ""}><ha-icon icon="mdi:backup-restore"></ha-icon>${this.t("repeatFull")}</button>` : "";
      control = `<div class="setrow planfoot"><small class="u-m0">${this.t(small ? "repeatFullHint" : "repeatHint")}</small>${full}<button class="btn primary" data-plan-repeat="${this.esc(plan.plan_id)}" ${this.cleanupBusy ? "disabled" : ""}><ha-icon icon="mdi:reload"></ha-icon>${this.t("repeatPlan")}</button></div>`;
    }
    else if (plan.status === "running" || plan.status === "backup") control = `<div class="setrow planfoot"><small class="u-m0">${plan.status === "backup" || this.planProgress?.phase === "backup" ? this.t("backupRunning") : `${this.t("running")} ${this.planProgress ? this.t("progressOf", { done: this.planProgress.done, total: this.planProgress.total }) : ""}`}</small><button class="btn" data-plan-cancel>${this.t("cancelRun")}</button></div>`;
    else if (plan.actions.some(a => a.result?.state === "done" && !PURGE_KINDS.includes(a.kind))) control = this.undoAsk === "all"
      ? `<div class="setrow planfoot askbox"><div><strong>${this.t("undoAskAll")}</strong><small>${this.t("undoAskAllHint")}</small></div><span class="askrow"><button class="btn danger" data-undo-all-yes><ha-icon icon="mdi:undo-variant"></ha-icon>${this.t("undoYes")}</button><button class="btn accent" data-undo-no>${this.t("cancelRun")}</button></span></div>`
      : `<div class="setrow planfoot"><small class="u-m0">${this.esc(this.undoMessage || this.t("undoAllHint"))}</small><button class="btn accent" data-undo-all><ha-icon icon="mdi:undo-variant"></ha-icon>${this.t("undoAll")}</button></div>`;
    const checks = plan.verification ? `<div class="checkrow"><b>${this.t("verification")}</b>${plan.verification.checks.map(c => `<span class="pill ${c.ok ? "ok" : "red"}">${c.ok ? "✓" : "✗"} ${this.t(`check_${c.check}`)}${c.object_id ? ` (${this.esc(c.object_id)})` : ""}</span>`).join("")}</div>` : "";
    const stage = this.planStage(plan, Boolean(conf));
    // Nothing can run: no steps and no confirmation, one clear band and the reasons.
    if (open && !executable) {
      const blocked = plan.actions.filter(a => a.verdict === "blocked").length;
      const nothing = plan.actions.length > 0 && plan.actions.every(a => a.verdict === "blocked" && (a.reasons || []).length > 0 && a.reasons.every(r => NOTHING_REASONS.includes(r)));
      const why = nothing ? this.t("wzIdleNothing") : blocked && blocked === plan.actions.length ? this.t(blocked === 1 ? "wzIdleBlockedOne" : "wzIdleBlocked", { n: blocked }) : this.t("wzIdleNone");
      return `<section class="panel" data-plan-card data-plan-idle><div class="panelhead"><div><h2>${this.t("plan_status_dry_run")}</h2><p>${this.esc(this.formatDate(plan.created_at))}</p></div></div>
        <div class="outcome ${nothing ? "ok" : "warn"}" role="status"><ha-icon icon="${nothing ? "mdi:check-circle-outline" : "mdi:information-outline"}"></ha-icon><span><strong>${this.t(nothing ? "wzIdleNothingTitle" : "wzIdleTitle")}</strong><small>${this.esc(why)}</small></span></div>${rowList.join("")}${this.reportBlock(plan, `<button class="btn primary" data-plan-close>${this.t("planClose")}</button>`)}</section>`;
    }
    const rows = this.planRowsShown(plan, rowList);
    const summary = `<p class="factnote">${this.t("planSummary", { total: sm.total ?? 0, ok: sm.ok ?? 0, review: sm.review ?? 0, blocked: sm.blocked ?? 0 })}${extra ? ` ${this.esc(extra)}` : ""}</p>`;
    const flow = `<details class="rowdetails wzflow"><summary>${this.t("wzFlow")}</summary>${this.planStepper(plan, Boolean(conf))}</details>`;
    const body = stage === 0 ? `${summary}${this.simulationBlock(plan)}${rows}${control}`
      : stage === 1 ? `${summary}${this.simulationBlock(plan)}${rows}${control}`
      : stage === 2 ? `${this.planOutcome(plan)}${this.planProgressBar()}${control}`
      : `${this.planOutcome(plan)}${summary}${this.simulationBlock(plan)}${rows}${checks}${this.followupLine(plan)}${control}`;
    return `<section class="panel" data-plan-card><div class="panelhead"><div><h2>${this.t(plan.status === "dry_run" ? "planResult" : "planResultDone")} · <span class="pill ${plan.status === "verified" ? "ok" : plan.status === "dry_run" ? "mute" : "warn"}">${this.t(`plan_status_${plan.status}`)}</span></h2><p>${this.esc(this.formatDate(plan.created_at))}</p></div><button class="btn" data-plan-close>${this.t("planClose")}</button></div>
      ${this.wizardBar(stage)}${flow}${body}${this.reportBlock(plan)}</section>`;
  }

  kindSelect() {
    if (this.view !== "cleanup" || (this._cleanupKinds || CLEANUP_KINDS).length < 2) return "";
    const labels = { disable_entity: "kindDisable", remove_entity: "kindRemove", disable_device: "kindDisableDevice", remove_device: "kindRemoveDevice", forget_device: "kindForgetDevice" };
    return `<select data-cleanup-kind aria-label="${this.t("actionKind")}">${(this._cleanupKinds || CLEANUP_KINDS).map(value => `<option value="${value}" ${this.cleanupKind === value ? "selected" : ""}>${this.t(labels[value])}</option>`).join("")}</select>`;
  }


  // Replace one entity by another in every configuration that names it exactly.
  entityUnit(id) { return this.findObject(`entity:${id}`)?.unit; }

  // Candidates for the new entity, shown as buttons below the field. They only fill the field; the person decides.
  successorHints(id, unit, attr) {
    if (!id) return "";
    const found = this.successorsOf(id, unit);
    if (!found.length) return "";
    return `<div class="setrow planfoot"><small class="u-m0">${this.t("successorHint")}</small><span class="chips">${found.map(o => `<button class="chip" ${attr}="${this.esc(o.object_id)}" title="${this.esc(o.name)}">${this.esc(o.object_id)}</button>`).join("")}</span></div>`;
  }

  replaceCard() {
    const ready = this.replOld && this.replNew && !this.cleanupBusy;
    const hints = this.successorHints(this.replOld, this.entityUnit(this.replOld), "data-repl-pick");
    return `<div class="panel" style="overflow:visible"><div class="panelhead"><div><h2>${this.t("replaceTitle")}</h2><p>${this.t("replaceHint")}</p></div><div class="actions">${this.kindSelect()}</div></div>
      <div class="setrow"><div><label>${this.t("replaceOld")}</label></div>${this.pickerBox("replOld", "sensor.old_entity")}</div>
      <div class="setrow"><div><label>${this.t("replaceNew")}</label></div>${this.pickerBox("replNew", "sensor.new_entity")}</div>
      ${hints}<div class="setrow planfoot"><small class="u-m0">${this.t("cleanupDryRun")}</small><button class="btn primary" data-plan-create ${ready ? "" : "disabled"}>${this.cleanupBusy ? this.t("planCreating") : this.t("replacePreview")}</button></div></div>`;
  }

  // Join a replaced meter's history to its successor and/or let the successor take over the ID.
  meterCard() {
    const entities = this.data.objects.filter(o => o.object_type === "entity");
    const byId = new Map(entities.map(o => [o.object_id, o]));
    const modes = [["both", "meterModeBoth"], ["statistics", "meterModeStatistics"], ["id", "meterModeId"]];
    const ready = this.meterOld && this.meterNew && !this.cleanupBusy;
    return `<div class="panel" style="overflow:visible"><div class="panelhead"><div><h2>${this.t("meterTitle")}</h2><p>${this.t("meterHint")}</p></div><div class="actions">${this.kindSelect()}</div></div>
      <div class="setrow"><div><label>${this.t("meterOld")}</label></div>${this.pickerBox("meterOld", "sensor.old_meter")}</div>
      <div class="setrow"><div><label>${this.t("meterNew")}</label></div>${this.pickerBox("meterNew", "sensor.new_meter")}</div>
      <div class="setrow"><div><label>${this.t("meterMode")}</label></div><select data-meter-mode style="max-width:460px">${modes.map(([value, label]) => `<option value="${value}" ${this.meterMode === value ? "selected" : ""}>${this.t(label)}</option>`).join("")}</select></div>
      ${this.successorHints(this.meterOld, byId.get(this.meterOld)?.unit, "data-meter-pick")}<div class="setrow planfoot"><small class="u-m0">${this.t("cleanupDryRun")}</small><button class="btn primary" data-plan-create ${ready ? "" : "disabled"}>${this.cleanupBusy ? this.t("planCreating") : this.t("replacePreview")}</button></div></div>`;
  }

  // Devices that an integration created again after they were forgotten.
  recurringCard() {
    const entries = this.data.recurring_devices || [];
    if (!entries.length) return "";
    const rows = entries.map(r => `<button class="row rel" data-object="${this.esc(`device:${r.device_id}`)}"><span class="tile warn"><ha-icon icon="mdi:backup-restore"></ha-icon></span><span class="row-text"><strong>${this.esc(r.name)}</strong><small>${this.t("recurringSince", { date: this.formatDate(r.forgotten_at), domains: this.esc((r.domains || []).join(", ")) })}</small></span></button>`).join("");
    return `<div class="panel"><div class="panelhead"><div><h2>${this.t("recurringTitle")} (${entries.length})</h2><p>${this.t("recurringHint")}</p></div></div>${rows}</div>`;
  }

  cleanupView() {
    this.ensureJournal();
    const purges = this.purges || [];
    const limit = this.data.meta.quarantine_days ?? 14;
    const held = this.data.quarantine || [], heldReady = held.filter(q => this.daysSince(q.since) >= limit).length;
    const unusedCount = this.unreferencedRows().length, statsCount = (this.data.orphaned_statistics || []).length;
    const count = kind => this.cleanupCandidates(kind).length;
    // The tiles are the navigation: each one is one job, with how much there is to do.
    const tabs = [
      { id: "entities", icon: "mdi:shape-outline", label: this.t("cleanupTabEntities"), hint: this.t("cleanupTileEntitiesHint"), count: count("disable_entity"), tone: "warn" },
      { id: "devices", icon: "mdi:devices", label: this.t("cleanupTabDevices"), hint: this.t("cleanupTileDevicesHint"), count: count("disable_device"), tone: "warn" },
      { id: "quarantine", icon: "mdi:archive-clock-outline", label: this.t("cleanupTabQuarantine"), hint: this.t("cleanupTileQuarantineHint", { days: limit }), count: held.length, pill: heldReady ? this.t("cleanupReadyCount", { count: heldReady }) : "", tone: heldReady ? "ok" : "mute" },
      { id: "unused", icon: "mdi:link-variant-off", label: this.t("unreferenced"), hint: this.t("cleanupTileUnusedHint"), count: unusedCount, tone: "mute" },
      { id: "stats", icon: "mdi:database-remove-outline", label: this.t("orphanStats"), hint: this.t("cleanupTileStatsHint"), count: statsCount, tone: "mute" },
      ...(purges.length ? [{ id: "purges", icon: "mdi:history", label: this.t("cleanupTabPurges"), hint: this.t("cleanupTilePurgesHint"), count: purges.length, tone: "mute" }] : []),
    ];
    const open = this.viewTabOf("cleanup", tabs, "entities");
    const tiles = this.cleanupTiles(tabs, open);
    if (["unused", "stats", "purges"].includes(open)) {
      this.unrefTab = open === "stats" ? "statistics" : "entities";
      this._embedUnref = true;
      const body = open === "purges" ? this.purgeJournalCard() : this.unreferencedView();
      this._embedUnref = false;
      return `<div class="stack">${this.planHeader()}${tiles}${body}</div>`;
    }
    const quarantineType = this.quarantineType === "device" ? "device" : "entity";
    this._cleanupKinds = open === "devices" ? ["disable_device"] : open === "quarantine" ? (quarantineType === "device" ? ["remove_device", "forget_device"] : ["remove_entity"]) : ["disable_entity"];
    if (!this._cleanupKinds.includes(this.cleanupKind)) this.cleanupKind = this._cleanupKinds[0];
    this.lvState("cleanup", "name", "asc");
    const all = this.cleanupCandidates();
    const sorts = [
      { key: "name", label: "sortName", dir: "asc", get: r => r.item.name },
      { key: "id", label: "sortId", dir: "asc", get: r => r.item.object_id },
      { key: "since", label: "sortSince", dir: "desc", get: r => (r.quarantine ? r.quarantine.since : r.finding?.first_detected_at) },
      { key: "certainty", label: "sortCertainty", dir: "desc", get: r => (r.finding ? r.finding.confidence : null) },
    ];
    const ready = r => !r.quarantine || this.daysSince(r.quarantine.since) >= limit;
    const classes = [...new Set(all.filter(r => r.finding).map(r => r.finding.classification))];
    const removal = ["remove_entity", "remove_device", "forget_device"].includes(this.cleanupKind);
    const device = DEVICE_KINDS.includes(this.cleanupKind);
    const filterOptions = removal ? [["ready", this.t("removalReady")], ["waiting", this.t("waitingShort")]] : classes.map(c => [c, this.t(c)]);
    const bar = this.listBar("cleanup", { sorts, filters: [{ name: removal ? "readiness" : "classification", all: this.t("all"), options: filterOptions }] });
    const list = this.refine("cleanup", all, {
      text: r => [r.item.name, r.item.object_id, r.item.platform, r.item.manufacturer, r.item.model].join(" "),
      filters: { classification: (r, v) => r.finding && r.finding.classification === v, readiness: (r, v) => (v === "ready") === ready(r) }, sorts, tie: r => r.item.object_id,
    });
    const shownList = this.selOnly?.cleanup ? list.filter(r => this.cleanupSel.has(r.item.object_id)) : list;
    const pg = this.paginate("cleanup", shownList);
    this._cleanupVisible = pg.rows.filter(ready).map(r => r.item.object_id);
    const row = r => {
      const { item, finding, quarantine } = r, left = quarantine ? limit - this.daysSince(quarantine.since) : 0;
      const badge = finding ? this.pill(finding.classification) : quarantine ? `<span class="pill ${left > 0 ? "mute" : "ok"}">${left > 0 ? this.t("daysLeftShort", { days: left }) : this.t("removalReady")}</span>` : `<span class="pill mute">${this.t("deviceEntities", { count: r.count })}</span>`;
      const sub = item.object_type === "device" ? [item.manufacturer, item.model].filter(Boolean).join(" ") || item.object_id : item.object_id;
      return `<div class="row"><input type="checkbox" data-sel="${this.esc(item.object_id)}" ${this.cleanupSel.has(item.object_id) ? "checked" : ""} ${left > 0 ? "disabled" : ""} aria-label="${this.esc(item.name)}">
      <button class="row-text link" style="text-align:left" data-object="${this.esc(`${item.object_type}:${item.object_id}`)}"><strong>${this.esc(item.name)}</strong><small>${this.esc(sub)}</small></button>${badge}${quarantine ? this.releaseControl(quarantine) : ""}</div>`;
    };
    const n = this.cleanupSel.size;
    const candidates = `<div class="panel"><div class="panelhead"><div><h2>${this.t("cleanupCandidates")} (${all.length})</h2><p>${device ? this.t(removal ? "removalDeviceHint" : "deviceCandidatesHint", { days: limit }) : removal ? this.t("removalCandidatesHint", { days: limit }) : this.t("cleanupCandidatesHint")}</p></div></div>
      <div class="toolbar${n ? "" : " nosel"}">${this.kindSelect()}${this.recorderChoice(removal)}<span class="toolgap"></span><span class="date" aria-live="polite">${this.t("selectedCount", { count: n })}</span><button class="btn quiet" data-sel-page>${this.t("selectPage")}</button><button class="btn quiet" data-sel-clear ${n ? "" : "disabled"}>${this.t("clearSelection")}</button>${this.selOnlyButton("cleanup", n)}
      <button class="btn primary" data-plan-create ${n && !this.cleanupBusy ? "" : "disabled"}>${this.cleanupBusy ? this.t("planCreating") : this.t("createPlan")}</button></div>
      ${bar}${shownList.length ? pg.rows.map(row).join("") : `<div class="emptymsg"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${all.length ? this.noMatches("cleanup") : this.t("cleanupNone")}</div>`}${pg.footer}</div>`;
    const typeSwitch = open === "quarantine" ? `<div class="seg qtype" role="group" aria-label="${this.esc(this.t("cleanupTabQuarantine"))}"><button class="chip ${quarantineType === "entity" ? "active" : ""}" data-qtype="entity">${this.t("qTypeEntities", { count: this.quarantineRows("entity").length })}</button><button class="chip ${quarantineType === "device" ? "active" : ""}" data-qtype="device">${this.t("qTypeDevices", { count: this.quarantineRows("device").length })}</button></div>` : "";
    const message = open === "quarantine" && this.releaseMessage ? `<p class="factnote" role="status">${this.esc(this.releaseMessage)}</p>` : "";
    return `<div class="stack">${this.planHeader()}${tiles}${typeSwitch}${open === "devices" ? this.recurringCard() : ""}${candidates}${message}</div>`;
  }

  ensureJournal() {
    if (this.journal === null && !this._journalRequested) { this._journalRequested = true; this.loadJournal(); }
  }

  // Every new plan opens the same way: it becomes the open plan, goes on top of the journal and the
  // page scrolls to its card. `view` switches to the page that shows it; null stays on the current one.
  openNewPlan(plan, view = "cleanup") {
    this.plan = plan; this.confirmation = null; this.ack = new Set(); this.confirmWord = "";
    this.journal = [plan, ...(this.journal || [])];
    this._scrollPlan = true;
    if (view) { this.noteJump?.(view); this.view = view; this.pages = {}; }
  }

  // For the paths without a busy flag of their own: one request at a time, and their buttons are off
  // meanwhile. Returns null when a request is still running; an error goes to the caller.
  async newPlan(actions, view = "cleanup") {
    if (this.planBusy) return null;
    this.planBusy = true; this.render();
    try {
      const plan = await this._hass.callWS({ type: "ha_housekeeper/plan_create", actions });
      this.openNewPlan(plan, view);
      return plan;
    } finally { this.planBusy = false; }
  }

  // The dry-run note, an error from the last request and the plan that is open, on top of every view that can finish one.
  planHeader() {
    return `<div class="panel"><p class="factnote">${this.t("cleanupDryRun")}</p>${this.cleanupError ? `<div class="error">${this.t("planError")}: ${this.esc(this.cleanupError)}</div>` : ""}</div>${this.plan ? this.planCard(this.plan) : ""}`;
  }

  // Every plan from Cleanup and Repair: what changed, what was checked, and what can be undone.
  journalView() {
    this.ensureJournal();
    const journalFound = this.searchList("journal", this.journal || [], plan => `${this.formatDate(plan.created_at)} ${this.t(`plan_status_${plan.status || "dry_run"}`)}`);
    const journalPage = this.paginate("journal", journalFound.rows);
    const journal = journalPage.rows.map(plan => `<div class="row jrow">${this.mergeable(plan) ? `<input type="checkbox" data-merge-sel="${this.esc(plan.plan_id)}" ${this.mergeSel?.has(plan.plan_id) ? "checked" : ""} aria-label="${this.esc(this.t("mergeSelect"))}">` : ""}<span class="tile mute"><ha-icon icon="mdi:clipboard-text-clock-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(this.formatDate(plan.created_at))}</strong><small>${this.t("planSummary", { total: plan.summary?.total ?? 0, ok: plan.summary?.ok ?? 0, review: plan.summary?.review ?? 0, blocked: plan.summary?.blocked ?? 0 })}${plan.file_snapshot_dropped ? ` · ${this.esc(this.t("snapshotDropped"))}` : ""}${plan.followup === "watching" && plan.followup_until ? ` · ${this.esc(this.t("fuWatching", { date: this.formatDate(plan.followup_until) }))}` : ""}</small></span>
      <span class="pill ${plan.status === "verified" ? "ok" : plan.status === "dry_run" ? "mute" : "warn"}">${this.t(`plan_status_${plan.status || "dry_run"}`)}</span>${plan.followup ? `<span class="pill ${this.followupTone(plan.followup?.state ?? plan.followup)}">${this.t(`fu_${plan.followup?.state ?? plan.followup}`)}</span>` : ""}
      <span class="jbtns"><button class="btn" data-plan-open="${this.esc(plan.plan_id)}">${this.t("openPlan")}</button>${plan.executed || plan.run ? "" : `<button class="btn dangersoft" data-plan-delete="${this.esc(plan.plan_id)}"><ha-icon icon="mdi:delete-outline"></ha-icon>${this.t("deletePlan")}</button>`}</span></div>`).join("");
    const journalCard = `<div class="panel"><div class="panelhead"><div><h2>${this.t("journal")} (${(this.journal || []).length})</h2><p>${this.t("journalHint")}</p></div><div class="actions"><button class="btn" data-merge ${(this.mergeSel?.size || 0) >= 2 && !this.cleanupBusy ? "" : "disabled"}>${this.t("mergeButton", { count: this.mergeSel?.size || 0 })}</button></div></div>${this.mergeNote ? `<div class="pad"><small role="status">${this.esc(this.mergeNote)}</small></div>` : ""}${journalFound.bar}${journal || journalFound.none || `<div class="emptymsg mute"><ha-icon icon="mdi:clipboard-text-outline"></ha-icon><strong>${this.t("journalEmpty")}</strong>${this.t("journalEmptyNext")}<button class="btn" data-jump="repair">${this.t("repair")}</button></div>`}${journalPage.footer}</div>`;
    return `<div class="stack">${this.planHeader()}${journalCard}</div>`;
  }

  // Where the person is in an assistant: choose, set up, look at the preview.
  stepsBar(current) {
    const names = ["stepChoose", "stepSetup", "stepPreview"];
    return `<div class="stepsbar" role="list">${names.map((name, i) => `${i ? `<span class="line${i < current ? " done" : ""}"></span>` : ""}<span class="step${i + 1 === current ? " on" : i + 1 < current ? " done" : ""}" role="listitem"${i + 1 === current ? ' aria-current="step"' : ""}><i>${i + 1 < current ? "✓" : i + 1}</i><b class="stepname">${this.t(name)}</b></span>`).join("")}</div>`;
  }

  // Tasks that fix something that stays. A tile opens the assistant for one task; the plan is finished in the same view.
  repairView() {
    this.ensureJournal();
    const task = REPAIR_TASKS.some(([kind]) => kind === this.repairTask) ? this.repairTask : null;
    let body;
    if (task) {
      const card = { exchange_device: () => this.exchangeCard(), replace_references: () => this.replaceCard(), migrate_meter: () => this.meterCard(), repair_counter: () => this.counterCard() }[task]();
      const label = REPAIR_TASKS.find(([kind]) => kind === task)[2];
      const chosen = { repair_counter: (this.counterId || "").trim(), migrate_meter: this.meterOld, replace_references: this.replOld, exchange_device: this.exchangeState().oldDev }[task];
      body = `<button class="btn quiet" data-repair-back><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("repairBack")}</button><h2 class="repairhead">${this.t(label)}</h2>${this.stepsBar(this.plan ? 3 : chosen ? 2 : 1)}${card}`;
    } else {
      const scan = this.counterScan, found = scan?.items?.length || 0;
      // Without a scan there is nothing to count: the tile says so instead of showing nothing (no scan runs by itself).
      const state = kind => kind !== "repair_counter" ? "" : !scan?.available ? ` <span class="pill mute">${this.t("repairNotChecked")}</span>` : found ? ` <span class="pill warn">${this.t("repairFound", { count: found })}</span>` : ` <span class="pill ok">${this.t("repairNoneFound")}</span>`;
      const tone = kind => (kind !== "repair_counter" ? "ac" : !scan?.available ? "mute" : found ? "warn" : "ok");
      const tiles = REPAIR_TASKS.map(([kind, icon, label, hint]) => `<button class="taskcard t-${tone(kind)}" data-repair-task="${kind}"><ha-icon icon="${icon}"></ha-icon><strong>${this.t(label)}${state(kind)}</strong><small>${this.t(hint)}</small></button>`).join("");
      body = `<div class="panel"><div class="panelhead"><div><h2>${this.t("repairTitle")}</h2><p>${this.t("repairHint")}</p></div></div><div class="taskgrid">${tiles}</div></div>`;
    }
    return `<div class="stack">${this.planHeader()}${body}</div>`;
  }
}
