// The plan as a wizard: Review, Confirm, Run, Result. The stage follows from the state of the plan, nothing is stored.
// Mixed into the panel in 99-register.js; the plan card itself is built in 18-cleanup.js.
Object.assign(TEXT.de, {
  wzLabel: "Schritte des Plans", wzReview: "Prüfen", wzConfirm: "Bestätigen", wzRun: "Ausführen", wzResult: "Ergebnis",
  wzSumEntries: "{n} Einträge", wzSumRun: "{done} von {total} erledigt", wzIdleTitle: "Nichts auszuführen", wzIdleBlocked: "Alle {n} Einträge sind blockiert. Die Gründe stehen bei den Einträgen.", wzIdleBlockedOne: "Der Eintrag ist blockiert. Den Grund siehst du beim Eintrag.",
  wzIdleNothingTitle: "Nichts zu ändern", wzIdleNothing: "Housekeeper hat geprüft und nichts gefunden, das sich ändern ließe. Du musst nichts tun.", verdictNothing: "Nichts zu ändern", wzIdleNone: "Dieser Plan enthält keine ausführbare Aktion.", wzBack: "Zurück",
});
Object.assign(TEXT.en, {
  wzLabel: "Steps of the plan", wzReview: "Review", wzConfirm: "Confirm", wzRun: "Run", wzResult: "Result",
  wzSumEntries: "{n} entries", wzSumRun: "{done} of {total} done", wzIdleTitle: "Nothing to run", wzIdleBlocked: "All {n} entries are blocked. The reasons are shown with the entries.", wzIdleBlockedOne: "The entry is blocked. Its reason is shown with the entry.",
  wzIdleNothingTitle: "Nothing to change", wzIdleNothing: "Housekeeper checked and found nothing that could be changed. You do not need to do anything.", verdictNothing: "Nothing to change", wzIdleNone: "This plan holds no action that can run.", wzBack: "Back",
});

class PlanWizardMixin {
  // 0 review, 1 confirm, 2 run (also while the check afterwards is still pending), 3 result.
  planStage(plan, confirming) {
    if (plan.status === "dry_run") return confirming ? 1 : 0;
    if (plan.status === "backup" || plan.status === "running") return 2;
    if (plan.status === "executed" && !plan.verification) return 2;
    return 3;
  }

  // One track instead of two: the four stages of the wizard, each opening into the steps the backend runs in it.
  // The stage that is on is open, the others are one line with what came of them; a click opens any of them.
  planTrack(plan, stage, confirming) {
    const steps = Object.fromEntries(this.planSteps(plan, confirming).map(s => [s.id, s]));
    const groups = [["wzReview", ["stepSelect", "stepAnalysis"]], ["wzConfirm", ["stepConfirm"]], ["wzRun", ["stepBackup", "stepRun"]], ["wzResult", ["stepVerify"]]];
    const total = plan.actions.length, done = plan.actions.filter(a => a.result?.state === "done").length;
    const summary = [
      this.t("wzSumEntries", { n: this.formatNumber(total) }), "",
      stage >= 2 ? this.t("wzSumRun", { done: this.formatNumber(done), total: this.formatNumber(total) }) : "",
      "",
    ];
    const mark = { done: "✓", failed: "!" };
    const items = groups.map(([name, ids], i) => {
      const list = ids.map(id => steps[id]);
      const failed = list.some(x => x.state === "failed");
      const state = failed ? "fail" : stage > i || (stage === 3 && i === 3 && list.every(x => x.state === "done")) ? "done" : stage === i ? "cur" : "todo";
      const id = `planph_${i}`, open = this.foldOpen(id, stage === i || failed);
      const now = state === "cur" && stage < 3;
      const subs = list.map(step => {
        const live = step.id === "stepRun" && step.state === "current";
        const recent = live ? plan.actions.filter(a => a.result?.state === "done").slice(-3).reverse() : [];
        const extra = live ? `${this.planProgressBar()}${recent.length ? `<ul class="items">${recent.map(a => `<li><span class="ok">✓</span><span>${this.esc(a.name || a.object_id)}</span></li>`).join("")}</ul>` : ""}` : "";
        return `<li class="s-${step.state}"><span class="d" aria-hidden="true"></span><span><b>${this.t(step.id)}</b><span class="sr-only">: ${this.t(`step${{ done: "Done", current: "Current", todo: "Todo", skipped: "Skipped", failed: "Failed" }[step.state]}`)}</span>${step.note ? `<small>${this.esc(step.note)}</small>` : ""}${extra}</span></li>`;
      }).join("");
      return `<li class="ph ${state}"${now ? ' aria-current="step"' : ""}><button type="button" class="phh" data-fold="${id}" aria-expanded="${open}"><span class="mk" aria-hidden="true">${mark[state === "fail" ? "failed" : state] || i + 1}</span><span class="phtext"><b>${i + 1}. ${this.t(name)}</b>${summary[i] ? `<small>${this.esc(summary[i])}</small>` : ""}</span><ha-icon icon="mdi:chevron-${open ? "up" : "down"}"></ha-icon></button><ul class="subs"${open ? "" : " hidden"}>${subs}</ul></li>`;
    }).join("");
    const backup = plan.backup ? `<p class="factnote">${this.t("backupRestoreHint")}</p>` : "";
    return `<ol class="track" aria-label="${this.esc(this.t("wzLabel"))}">${items}</ol>${backup}`;
  }

  // The rows of a plan come in pages like every other long list.
  planRowsShown(plan, rowList, texts = []) {
    // One search box for the plan on screen: its text is dropped when another plan opens.
    if (this._planqFor !== plan.plan_id) { this._planqFor = plan.plan_id; this.lvState("planrows", "", "asc").q = ""; }
    const found = this.searchList("planrows", rowList.map((html, i) => ({ html, text: texts[i] || "" })), r => r.text);
    const pg = this.paginate(`planrows-${plan.plan_id}`, found.rows.map(r => r.html));
    return found.bar + found.none + pg.rows.join("") + pg.footer;
  }

  planProgressBar() {
    const p = this.planProgress;
    if (!p?.total) return "";
    const share = Math.max(0, Math.min(100, Math.round((p.done / p.total) * 100)));
    return `<div class="wzprog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${share}"><i style="width:${share}%"></i></div>`;
  }

  bindPlanWizard(root) {
    root.querySelector("[data-plan-back]")?.addEventListener("click", () => { this.confirmation = null; this.confirmWord = ""; this.render(); });
  }
}
