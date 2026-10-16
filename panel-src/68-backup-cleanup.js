// Housekeeper's own safety backups: list, rule, deletion plan; and "delete automation" from the findings.
// Mixed into the panel in 99-register.js. Deleting is planned like everything else under Cleanup.
Object.assign(TEXT.de, {
  bkcTab: "Backups aufräumen", maintHintBkc: "Eigene Housekeeper-Backups löschen.",
  bkcTitle: "Housekeeper-Backups aufräumen", bkcHint: "Housekeeper legt vor riskanten Plänen ein eigenes Backup an. Home Assistant löscht diese nicht von selbst. Deine regulären Backups werden nie angezeigt und nie angefasst.",
  bkcCount: "Housekeeper-Backups", bkcBytes: "belegt", bkcSuggested: "zum Löschen vorgeschlagen", bkcRule: "Was behalten wird", bkcKeepLast: "Die letzten", bkcKeepDays: "Backups und alle aus den letzten", bkcDays: "Tagen.", bkcReset: "Auf Vorschlag zurücksetzen",
  bkcProtectNote: "Ältere Backups sind zum Löschen vorausgewählt; du kannst die Auswahl unten ändern. Nie auswählbar sind Backups von Plänen, die noch beobachtet werden, und das jüngste Backup eines Plans, der sich noch rückgängig machen lässt.", bkcSelSum: "{count} ausgewählt · {bytes}",
  bkcProtected_watching: "geschützt: Beobachtung läuft", bkcProtected_undo: "geschützt: Rückgängig möglich", bkcAge: "{days} Tage alt", bkcToday: "von heute", bkcDb: "mit Datenbank", bkcNoDb: "ohne Datenbank", bkcNoPlan: "Plan nicht mehr im Journal",
  bkcOnlyReturn: "Dieses Backup ist die einzige Möglichkeit, gelöschte oder zusammengeführte Daten dieses Plans zurückzuholen.", bkcPlan: "Löschen vorbereiten ({count})", bkcFinal: "Löschen ist endgültig. Es gibt kein Rückgängig.",
  bkcNone: "Es gibt keine Housekeeper-Backups.", bkcUnavailable: "Die Backups ließen sich nicht lesen.", bkcLoading: "Backups werden gelesen …", bkcFailed: "Der Plan konnte nicht erstellt werden: {detail}",
  reason_backup_missing: "Das Backup gibt es nicht mehr.", reason_not_housekeeper_backup: "Das ist kein Backup von Housekeeper.", reason_backup_protected: "Geschützt: Der Plan wird noch beobachtet oder das Backup erlaubt noch ein Rückgängig.", reason_only_return: "Einzige Möglichkeit, Daten dieses Plans zurückzuholen.",
  check_backup_deleted: "Backup ist gelöscht", confirmedSummaryBackups: "{count} Backups werden gelöscht. Das ist endgültig; es wird kein neues Backup angelegt.", undoFinal: "endgültig",
  abort_delete_failed: "Home Assistant konnte das Backup nicht überall löschen.", abort_not_housekeeper_backup: "Das ist kein Backup von Housekeeper; nichts wurde gelöscht.", abort_backup_unavailable: "Der Backup-Manager ist nicht erreichbar.",
  autoDelete: "Löschen vorbereiten", autoDeleteFailed: "Der Plan konnte nicht erstellt werden: {detail}",
  reason_not_a_candidate: "Kein Befund nennt diese Automation als ungenutzt.", reason_not_in_yaml: "Nicht in der automations.yaml definiert: nicht automatisch löschbar.", reason_file_too_large: "Die Datei ist zu groß, um sie für das Rückgängig zu sichern.",
  reason_deletes_config: "Die Konfiguration wird aus der Datei entfernt, danach werden die Automationen neu geladen. Rückgängig stellt die Datei wieder her, solange sie nicht anders geändert wurde.",
  reason_used_by_mentions: "Wird noch erwähnt (Skripte, Szenen, Dashboards): nach dem Löschen laufen diese Verweise ins Leere.", check_automation_gone: "Automation ist aus der Datei entfernt", confirmedSummaryAutoDelete: "{count} Automationen werden aus der Datei entfernt. Vorher legt Housekeeper ein kleines Backup an. Rückgängig stellt die Datei wieder her.",
  abort_file_too_large: "Die Datei ist zu groß für eine Sicherung; nichts wurde geändert.", abort_not_in_yaml: "Die Automation steht nicht in der automations.yaml.",
});
Object.assign(TEXT.en, {
  bkcTab: "Tidy backups", maintHintBkc: "Delete Housekeeper's own backups.",
  bkcTitle: "Tidy up Housekeeper backups", bkcHint: "Housekeeper makes its own backup before risky plans. Home Assistant does not delete these by itself. Your regular backups are never shown and never touched.",
  bkcCount: "Housekeeper backups", bkcBytes: "used", bkcSuggested: "suggested for deleting", bkcRule: "What is kept", bkcKeepLast: "The last", bkcKeepDays: "backups and all from the last", bkcDays: "days.", bkcReset: "Reset to the suggestion",
  bkcProtectNote: "Older backups are preselected for deleting; you can change the selection below. Never selectable are backups of plans that are still watched, and the newest backup of a plan that can still be undone.", bkcSelSum: "{count} selected · {bytes}",
  bkcProtected_watching: "protected: being watched", bkcProtected_undo: "protected: undo possible", bkcAge: "{days} days old", bkcToday: "from today", bkcDb: "with database", bkcNoDb: "without database", bkcNoPlan: "plan no longer in the journal",
  bkcOnlyReturn: "This backup is the only way to get back data this plan deleted or merged.", bkcPlan: "Prepare deletion ({count})", bkcFinal: "Deleting is final. There is no undo.",
  bkcNone: "There are no Housekeeper backups.", bkcUnavailable: "The backups could not be read.", bkcLoading: "Reading backups …", bkcFailed: "The plan could not be created: {detail}",
  reason_backup_missing: "The backup no longer exists.", reason_not_housekeeper_backup: "This is not a Housekeeper backup.", reason_backup_protected: "Protected: the plan is still watched or the backup still allows an undo.", reason_only_return: "The only way to get back data of this plan.",
  check_backup_deleted: "Backup is deleted", confirmedSummaryBackups: "{count} backups will be deleted. This is final; no new backup is made.", undoFinal: "final",
  abort_delete_failed: "Home Assistant could not delete the backup everywhere.", abort_not_housekeeper_backup: "This is not a Housekeeper backup; nothing was deleted.", abort_backup_unavailable: "The backup manager is not reachable.",
  autoDelete: "Prepare deletion", autoDeleteFailed: "The plan could not be created: {detail}",
  reason_not_a_candidate: "No finding calls this automation unused.", reason_not_in_yaml: "Not defined in automations.yaml: cannot be deleted automatically.", reason_file_too_large: "The file is too large to be saved for the undo.",
  reason_deletes_config: "The configuration is removed from the file, then the automations are reloaded. Undo puts the file back as long as it was not changed otherwise.",
  reason_used_by_mentions: "Still mentioned (scripts, scenes, dashboards): after deleting, those references point nowhere.", check_automation_gone: "Automation is removed from the file", confirmedSummaryAutoDelete: "{count} automations will be removed from the file. Housekeeper makes a small backup first. Undo puts the file back.",
  abort_file_too_large: "The file is too large to save; nothing was changed.", abort_not_in_yaml: "The automation is not in automations.yaml.",
});

class BackupCleanupMixin {
  ensureBackupCleanup() {
    if (this.bkcLoading || this._bkcRequested) return;
    this._bkcRequested = true;
    setTimeout(() => this.loadBackupCleanup(true), 0);
  }

  async loadBackupCleanup(pick = false) {
    this.bkcLoading = true; this.render();
    try {
      const keep_last = this.bkcLast ?? 3, keep_days = this.bkcDaysValue ?? 14;
      this.bkc = await this._hass.callWS({ type: "ha_housekeeper/backup_cleanup", keep_last, keep_days });
      this.bkcError = "";
      if (pick) this.bkcSel = new Set(this.bkc.rows.filter(r => r.suggested).map(r => r.backup_id));
      else this.bkcSel = new Set([...(this.bkcSel || [])].filter(id => this.bkc.rows.some(r => r.backup_id === id && !r.protected)));
    } catch (err) { this.bkcError = this.errText(err); }
    this.bkcLoading = false; this.render();
  }

  backupCleanupCard() {
    this.ensureBackupCleanup();
    const head = `<p class="factnote pad">${this.t("bkcHint")}</p>`;  // the title is on the tile of the tab
    if (this.bkcError) return `<div class="panel">${head}<div class="error">${this.esc(this.bkcError)}</div></div>`;
    const d = this.bkc;
    if (!d) return `<div class="panel">${head}${this.skeleton("bkcLoading")}</div>`;
    if (!d.available) return `<div class="panel">${head}<div class="emptymsg">${this.t("bkcUnavailable")}</div></div>`;
    if (!d.rows.length) return `<div class="panel">${head}<div class="emptymsg">${this.t("bkcNone")}</div></div>`;
    const sel = this.bkcSel || new Set();
    const sum = `<div class="bkcsum">${this.sumTiles([
      { label: this.t("bkcCount"), value: this.formatNumber(d.total.count) },
      { label: this.t("bkcBytes"), value: this.formatBytes(d.total.bytes) },
      { label: this.t("bkcSuggested"), value: this.formatNumber(d.suggested.count), sub: this.formatBytes(d.suggested.bytes), tone: d.suggested.count ? "warn" : "ok" },
    ])}</div>`;
    // The rule only suggests: changing a number selects anew; a hand-made selection can go back to it.
    const suggested = d.rows.filter(r => r.suggested && !r.protected).map(r => r.backup_id);
    const changed = sel.size !== suggested.length || suggested.some(id => !sel.has(id));
    const rule = `<div class="bkcrule"><strong>${this.t("bkcRule")}</strong><div class="line"><label for="hk-bkc-last">${this.t("bkcKeepLast")}</label><input id="hk-bkc-last" type="number" min="0" max="100" value="${this.bkcLast ?? 3}" data-bkc-last><label for="hk-bkc-days">${this.t("bkcKeepDays")}</label><input id="hk-bkc-days" type="number" min="0" max="3650" value="${this.bkcDaysValue ?? 14}" data-bkc-days><span>${this.t("bkcDays")}</span>${changed ? `<button class="btn quiet" data-bkc-pick>${this.t("bkcReset")}</button>` : ""}</div><p>${this.t("bkcProtectNote")}</p></div>`;
    const age = r => (r.age_days === null || r.age_days === undefined ? -1 : r.age_days);
    const columns = [
      { key: "sel", label: "selectPage", narrow: true, sortable: false, allBox: rows => this.bkcHeadBox(rows), cell: r => `<input type="checkbox" class="selbox" data-bkc-sel="${this.esc(r.backup_id)}" ${sel.has(r.backup_id) ? "checked" : ""} ${r.protected ? "disabled" : ""} aria-label="${this.esc(r.name)}">` },
      { key: "name", label: "bkcColName", dir: "asc", cell: r => `<div class="statcell"><span class="tile ${r.protected ? "ok" : r.only_return ? "warn" : "mute"}"><ha-icon icon="mdi:backup-restore"></ha-icon></span><div>${this.nameCell(r.name, r.plan_id ? "" : this.t("bkcNoPlan"))}${r.only_return ? `<small class="bkcwarn"><ha-icon icon="mdi:alert-outline"></ha-icon>${this.t("bkcOnlyReturn")}</small>` : ""}</div></div>` },
      { key: "date", label: "bhColDate", dir: "desc", cell: r => (r.date ? this.esc(this.formatDate(r.date).split(",")[0]) : "–") },
      { key: "size", label: "bhColSize", dir: "desc", cell: r => this.esc(this.formatBytes(r.size)) },
      { key: "db", label: "bkcColDb", dir: "desc", cell: r => this.t(r.with_database ? "bkcDb" : "bkcNoDb") },
      { key: "state", label: "bkcColState", dir: "asc", cell: r => (r.protected ? `<span class="pill ok">${this.t(`bkcProtected_${r.protected}`)}</span>` : r.age_days !== null && r.age_days !== undefined ? `<span class="pill ${r.suggested ? "" : "mute"}">${r.age_days ? this.t("bkcAge", { days: r.age_days }) : this.t("bkcToday")}</span>` : "–") },
    ];
    const list = this.sysList("bkc", d.rows, {
      sort: "date", dir: "desc", columns, cls: "bkc", empty: "bkcNone",
      sorts: [
        { key: "date", label: "bhColDate", dir: "desc", get: r => r.date },
        { key: "name", label: "bkcColName", dir: "asc", get: r => r.name },
        { key: "size", label: "bhColSize", dir: "desc", get: r => r.size },
        { key: "db", label: "bkcColDb", dir: "desc", get: r => (r.with_database ? 1 : 0) },
        { key: "state", label: "bkcColState", dir: "asc", get: age },
      ],
      filters: [{ name: "state", all: this.t("bkcAllStates"), options: [["suggested", this.t("bkcSuggested")], ["protected", this.t("bkcFilterProtected")], ["selected", this.t("bkcFilterSelected")]] }],
      filterFns: { state: (r, v) => (v === "suggested" ? r.suggested : v === "protected" ? Boolean(r.protected) : sel.has(r.backup_id)) },
      text: r => `${r.name} ${r.backup_id}`, tie: r => r.backup_id,
    });
    const bytes = d.rows.filter(r => sel.has(r.backup_id)).reduce((n, r) => n + (r.size || 0), 0);
    const error = this.bkcPlanError ? `<p class="bkcerr" role="alert">${this.esc(this.t("bkcFailed", { detail: this.bkcPlanError }))}</p>` : "";
    const action = `<div class="bkcfoot"><div><strong>${this.t("bkcSelSum", { count: this.formatNumber(sel.size), bytes: this.formatBytes(bytes) })}</strong><small>${this.t("bkcFinal")}</small>${error}</div><button class="btn dangersoft" data-bkc-plan ${sel.size && !this.bkcBusy ? "" : "disabled"}>${this.bkcBusy ? this.t("trimBusy") : this.t("bkcPlan", { count: sel.size })}</button></div>`;
    return `<div class="panel">${head}${sum}${rule}${list}${action}</div>`;
  }

  // The box in the table head: every backup of the page that can be ticked.
  bkcHeadBox(rows) {
    const ids = (rows || []).filter(r => !r.protected).map(r => r.backup_id);
    if (!ids.length) return "";
    const n = ids.filter(id => this.bkcSel?.has(id)).length;
    return `<input type="checkbox" class="selbox" data-bkc-page="${this.esc(ids.join(","))}" ${n === ids.length ? "checked" : ""} ${n && n < ids.length ? "data-partial" : ""} aria-label="${this.esc(this.t("selectPage"))}">`;
  }

  async backupDeletePlan() {
    this.bkcBusy = true; this.bkcPlanError = ""; this.render();
    try {
      const actions = [...(this.bkcSel || [])].slice(0, MAX_PLAN_ACTIONS).map(object_id => ({ kind: "delete_backup", object_id }));
      const plan = await this._hass.callWS({ type: "ha_housekeeper/plan_create", actions });
      this.openNewPlan(plan);
    } catch (err) { this.bkcPlanError = this.errText(err); }
    this.bkcBusy = false; this.render();
  }

  async automationDeletePlan(entityId) {
    try {
      if (!await this.newPlan([{ kind: "delete_automation", object_id: entityId }])) return;
    } catch (err) { this.toast?.(this.t("autoDeleteFailed", { detail: this.errText(err) })); }
    this.render();
  }

  // What leaves the file: the whole block of the automation, line by line.
  deleteDiff(a) {
    if (!a.yaml) return "";
    return `<pre class="code codefull">${a.yaml.trimEnd().split("\n").map(line => this.esc(`- ${line}`)).join("\n")}</pre>`;
  }

  autoDeleteButton(finding) {
    if (!["automation.never_triggered", "automation.stale", "automation.disabled_long"].includes(finding.rule_id)) return "";
    return `<button class="btn quiet" data-auto-delete="${this.esc(finding.object_id)}" ${this.planBusy ? 'disabled aria-busy="true"' : ""}>${this.t("autoDelete")}</button>`;
  }

  bindBackupCleanup(root) {
    root.querySelectorAll("[data-bkc-page]").forEach(el => { el.indeterminate = el.hasAttribute("data-partial"); el.onchange = () => { el.dataset.bkcPage.split(",").forEach(id => (el.checked ? this.bkcSel.add(id) : this.bkcSel.delete(id))); this.render(); }; });
    root.querySelectorAll("[data-bkc-sel]").forEach(el => el.onchange = () => { el.checked ? this.bkcSel.add(el.dataset.bkcSel) : this.bkcSel.delete(el.dataset.bkcSel); this.render(); });
    root.querySelector("[data-bkc-last]")?.addEventListener("change", e => { this.bkcLast = Math.max(0, Math.min(100, Number(e.target.value) || 0)); this.loadBackupCleanup(true); });
    root.querySelector("[data-bkc-days]")?.addEventListener("change", e => { this.bkcDaysValue = Math.max(0, Math.min(3650, Number(e.target.value) || 0)); this.loadBackupCleanup(true); });
    root.querySelector("[data-bkc-pick]")?.addEventListener("click", () => this.loadBackupCleanup(true));
    root.querySelector("[data-bkc-plan]")?.addEventListener("click", () => this.backupDeletePlan());
    root.querySelectorAll("[data-auto-delete]").forEach(el => el.addEventListener("click", () => this.automationDeletePlan(el.dataset.autoDelete)));
  }
}
