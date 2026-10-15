// BlueprintsMixin: blueprints nothing uses and automations whose blueprint is gone; mixed into the panel in 99-register.js.
class BlueprintsMixin {
  ensureBlueprints() {
    if (this._blueprintsRequested) return;
    this._blueprintsRequested = true;
    setTimeout(async () => {
      try { this.blueprints = await this._hass.callWS({ type: "ha_housekeeper/blueprints" }); this.blueprintsError = ""; this.markLoaded("blueprints"); }
      catch (err) { this.blueprints = null; this.blueprintsError = this.errText(err); }
      this.render();
    }, 0);
  }

  blueprintsCount() { const b = this.blueprints; return b ? b.unused + b.missing + b.broken : null; }

  blueprintsCard() {
    this.ensureBlueprints();
    const head = this.pageBar({ at: this.loadedAt("blueprints"), loading: !this.blueprints && !this.blueprintsError, attr: "data-bp-refresh" });
    if (this.blueprintsError) return `<div class="stack">${head}<div class="panel"><div class="error">${this.esc(this.blueprintsError)}</div></div></div>`;
    if (!this.blueprints) return `<div class="stack">${head}<div class="panel">${this.skeleton("loading")}</div></div>`;
    const users = (b) => (b.users || []).map(u => {
      const obj = this.findObject(`${u.id.split(".")[0]}:${u.id}`);
      return obj ? `<button class="linklike" data-object="${this.esc(this.objectKey(obj))}">${this.esc(u.name)}</button>` : this.esc(u.name);
    }).join(", ") + (b.count > (b.users || []).length ? ` +${b.count - b.users.length}` : "");
    const items = this.blueprints.domains.flatMap(d => [
      ...d.missing.map(b => ({ kind: "missing", domain: d.domain, path: b.path, title: b.path, users: users(b) })),
      ...d.broken.map(b => ({ kind: "broken", domain: d.domain, path: b.path, title: b.path, users: b.count ? users(b) : "" })),
      ...d.unused.map(b => ({ kind: "unused", domain: d.domain, path: b.path, title: b.name === b.path ? b.path : b.name, users: "" })),
    ]);
    const rank = { missing: 0, broken: 1, unused: 2 }, label = { missing: "bpMissing", broken: "bpBroken", unused: "bpUnused" }, tone = { missing: "red", broken: "red", unused: "mute" };
    const domains = this.blueprints.domains.filter(d => items.some(i => i.domain === d.domain));
    const files = this.blueprints.domains.map(d => `${this.t(d.domain)}: ${this.formatNumber(d.total)} ${this.t("bpFiles")}`).join(" · ");
    const table = this.sysList("blueprints", items, {
      sort: "kind", dir: "asc", empty: "bpNone", cls: "blueprints",
      sorts: [
        { key: "name", label: "bpColFile", dir: "asc", get: i => i.title },
        { key: "kind", label: "bpColKind", dir: "asc", get: i => rank[i.kind] },
        { key: "domain", label: "bpColDomain", dir: "asc", get: i => this.t(i.domain) },
      ],
      filters: [
        { name: "kind", all: this.t("bpAllKinds"), options: ["missing", "broken", "unused"].filter(k => items.some(i => i.kind === k)).map(k => [k, this.t(label[k])]) },
        ...(domains.length > 1 ? [{ name: "domain", all: this.t("bpAllDomains"), options: domains.map(d => [d.domain, this.t(d.domain)]) }] : []),
      ],
      filterFns: { kind: (i, v) => i.kind === v, domain: (i, v) => i.domain === v },
      text: i => `${i.title} ${i.path}`, tie: i => `${i.domain}/${i.path}`,
      columns: [
        { key: "name", label: "bpColFile", dir: "asc", cell: i => `<div class="statcell"><span class="tile ${tone[i.kind]}"><ha-icon icon="${{ missing: "mdi:file-question-outline", broken: "mdi:file-alert-outline", unused: "mdi:file-hidden" }[i.kind]}"></ha-icon></span><div>${this.nameCell(i.title, i.title === i.path ? "" : i.path)}</div></div>` },
        { key: "kind", label: "bpColKind", dir: "asc", cell: i => `<span class="pill ${tone[i.kind]}">${this.t(label[i.kind])}</span>` },
        { key: "domain", label: "bpColDomain", dir: "asc", cell: i => this.esc(this.t(i.domain)) },
        { key: "users", label: "bpColUsers", sortable: false, cell: i => i.users || "–" },
      ],
    });
    return `<div class="stack">${head}<div class="panel"><p class="factnote pad">${this.esc(files)}</p>${table}</div></div>`;
  }
}
