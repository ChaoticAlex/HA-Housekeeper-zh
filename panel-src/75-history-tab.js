// HistoryTabMixin: the tab "History" of an object: its logbook, the plans of the journal that touched it and, for a
// device, its life. Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  tabHistory: "Verlauf", histPlans: "Pläne zu diesem Objekt", histPlansHint: "Bestätigte und geplante Änderungen aus dem Journal, die dieses Objekt betrafen.", histPlansNone: "Bisher kein Plan zu diesem Objekt.", histPlansLoading: "Journal wird geladen …",
  lifeTitle: "Lebenslauf",
});
Object.assign(TEXT.en, {
  tabHistory: "History", histPlans: "Plans for this object", histPlansHint: "Confirmed and planned changes from the journal that concerned this object.", histPlansNone: "No plan for this object so far.", histPlansLoading: "Loading the journal …",
  lifeTitle: "Life",
});

class HistoryTabMixin {
  // The plans of the journal that name this object (the journal list carries the object IDs of each plan).
  plansOf(item) { return (this.journal || []).filter(p => (p.objects || []).includes(item.object_id)); }

  historyCount(item) {
    const key = this.objectKey(item);
    return this.notesList().filter(n => n.target === key).length + this.plansOf(item).length;
  }

  plansCard(item) {
    const plans = this.plansOf(item);
    const head = `<div class="panelhead"><div><h2>${this.t("histPlans")}</h2><p>${this.t("histPlansHint")}</p></div></div>`;
    if (this.journal === null || this.journal === undefined) return `<section class="panel">${head}${this.skeleton("histPlansLoading")}</section>`;
    const rows = plans.map(plan => `<div class="row jrow"><span class="tile mute"><ha-icon icon="mdi:clipboard-text-clock-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(this.formatDate(plan.created_at))}</strong><small>${this.t("planSummary", { total: plan.summary?.total ?? 0, ok: plan.summary?.ok ?? 0, review: plan.summary?.review ?? 0, blocked: plan.summary?.blocked ?? 0 })}</small></span><span class="pill ${plan.status === "verified" ? "ok" : plan.status === "dry_run" ? "mute" : "warn"}">${this.t(`plan_status_${plan.status || "dry_run"}`)}</span><button class="btn small" data-plan-open="${this.esc(plan.plan_id)}">${this.t("openPlan")}</button></div>`).join("");
    return `<section class="panel">${head}${rows || `<div class="emptymsg"><ha-icon icon="mdi:clipboard-text-outline"></ha-icon>${this.t("histPlansNone")}</div>`}</section>`;
  }

  historyTab(item) {
    const right = `${item.object_type === "device" ? this.lifeCard(item) : ""}${this.plansCard(item)}`;
    return `<div class="detailgrid"><div class="stack">${this.noteCard(item)}</div><div class="stack">${right}</div></div>`;
  }
}
