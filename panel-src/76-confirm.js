// ConfirmMixin: one dialog for every deletion of something you made yourself (a reminder, a plan, a saved view, a template).
// The buttons open `confirmAsk`; nothing is deleted before "Delete". Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, { confirmRunTitle: "Plan jetzt ausführen?", confirmTitle: "Wirklich löschen?", confirmDelete: "Löschen", confirmCancel: "Abbrechen", confirmRem: "Die Erinnerung „{name}“ und ihre Historie werden gelöscht.", confirmRemDay: "Der Eintrag vom {date} wird aus der Historie von „{name}“ gelöscht. Die Fälligkeit bleibt.", confirmPlanDelete: "Der Plan vom {date} wird aus dem Journal gelöscht. Ein bereits ausgeführter Plan bleibt in Home Assistant wirksam; ein Rückgängig ist danach nicht mehr möglich.", confirmView: "Die gespeicherte Ansicht „{name}“ wird gelöscht.", confirmTpl: "Die Vorlage „{name}“ wird gelöscht." });
Object.assign(TEXT.en, { confirmRunTitle: "Run the plan now?", confirmTitle: "Really delete?", confirmDelete: "Delete", confirmCancel: "Cancel", confirmRem: "The reminder “{name}” and its history will be deleted.", confirmRemDay: "The entry of {date} will be deleted from the history of “{name}”. The due day stays.", confirmPlanDelete: "The plan of {date} will be deleted from the journal. A plan that already ran stays in effect in Home Assistant; undoing it is no longer possible afterwards.", confirmView: "The saved view “{name}” will be deleted.", confirmTpl: "The template “{name}” will be deleted." });

class ConfirmMixin {
  // `run` is called only after "Delete"; `text` is the sentence of the dialog.
  confirmAsk(text, run, opts = {}) { this.confirmState = { text, run, ...opts }; this._confirmFocus = true; this.render(); }

  confirmClose() { this.confirmState = null; this.render(); }

  confirmDialog() {
    const c = this.confirmState;
    if (!c) return "";
    return `<div class="hkmodal" data-confirm-modal><div class="hkdialog" role="alertdialog" aria-modal="true" aria-labelledby="hk-confirm-head" aria-describedby="hk-confirm-text">
      <div class="dhead"><h2 id="hk-confirm-head">${this.esc(c.title || this.t("confirmTitle"))}</h2></div>
      <div class="dbody"><p id="hk-confirm-text" class="u-m0">${this.esc(c.text)}</p></div>
      <div class="dfoot"><span></span><span class="dbtns"><button type="button" class="btn" data-confirm-no>${this.t("confirmCancel")}</button><button type="button" class="btn ${c.danger === false ? "primary" : "danger"}" data-confirm-yes>${this.esc(c.yes || this.t("confirmDelete"))}</button></span></div></div></div>`;
  }

  bindConfirm(root) {
    const modal = root.querySelector("[data-confirm-modal]");
    if (!modal) return;
    modal.querySelector("[data-confirm-no]").onclick = () => this.confirmClose();
    modal.querySelector("[data-confirm-yes]").onclick = () => { const run = this.confirmState?.run; this.confirmState = null; this.render(); run?.(); };
    modal.addEventListener("mousedown", ev => { if (ev.target === modal) this.confirmClose(); });
    modal.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); this.confirmClose(); } });
    if (this._confirmFocus) { this._confirmFocus = false; modal.querySelector("[data-confirm-no]")?.focus(); }
  }
}
