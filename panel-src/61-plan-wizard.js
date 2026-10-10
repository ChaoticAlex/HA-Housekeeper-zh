// The plan as a wizard: Review, Confirm, Run, Result. The stage follows from the state of the plan, nothing is stored.
// Mixed into the panel in 99-register.js; the plan card itself is built in 18-cleanup.js.
Object.assign(TEXT.de, {
  wzLabel: "Schritte des Plans", wzReview: "Prüfen", wzConfirm: "Bestätigen", wzRun: "Ausführen", wzResult: "Ergebnis",
  wzFlow: "Ablauf im Detail", wzIdleTitle: "Nichts auszuführen", wzIdleBlocked: "Alle {n} Einträge sind blockiert. Die Gründe stehen bei den Einträgen.", wzIdleBlockedOne: "Der Eintrag ist blockiert. Den Grund siehst du beim Eintrag.",
  wzIdleNothingTitle: "Nichts zu ändern", wzIdleNothing: "Housekeeper hat geprüft und nichts gefunden, das sich ändern ließe. Du musst nichts tun.", verdictNothing: "Nichts zu ändern", wzIdleNone: "Dieser Plan enthält keine ausführbare Aktion.", wzBack: "Zurück",
});
Object.assign(TEXT.en, {
  wzLabel: "Steps of the plan", wzReview: "Review", wzConfirm: "Confirm", wzRun: "Run", wzResult: "Result",
  wzFlow: "Flow in detail", wzIdleTitle: "Nothing to run", wzIdleBlocked: "All {n} entries are blocked. The reasons are shown with the entries.", wzIdleBlockedOne: "The entry is blocked. Its reason is shown with the entry.",
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

  wizardBar(stage) {
    const names = ["wzReview", "wzConfirm", "wzRun", "wzResult"];
    const items = names.map((name, i) => `<li class="${i < stage ? "done" : i === stage ? "cur" : ""}"${i === stage ? ' aria-current="true"' : ""}><i aria-hidden="true"></i>${i + 1}. ${this.t(name)}</li>`).join("");
    return `<ol class="wz" aria-label="${this.esc(this.t("wzLabel"))}">${items}</ol>`;
  }

  // The rows of a plan come in pages like every other long list.
  planRowsShown(plan, rowList) {
    const pg = this.paginate(`planrows-${plan.plan_id}`, rowList);
    return pg.rows.join("") + pg.footer;
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
