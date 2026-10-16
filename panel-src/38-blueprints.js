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
      ...d.missing.map(b => ({ kind: "missing", domain: d.domain, path: b.path, title: b.path, users: users(b), raw: b })),
      ...d.broken.map(b => ({ kind: "broken", domain: d.domain, path: b.path, title: b.path, users: b.count ? users(b) : "", raw: b })),
      ...d.unused.map(b => ({ kind: "unused", domain: d.domain, path: b.path, title: b.name === b.path ? b.path : b.name, users: "", raw: b })),
    ]);
    if (this.bpOpen) {
      const item = items.find(i => `${i.domain}/${i.path}` === this.bpOpen);
      if (item) return `<div class="stack">${head}${this.blueprintDetail(item)}</div>`;
      this.bpOpen = "";
    }
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
      rowAttrs: i => `data-bp-open="${this.esc(`${i.domain}/${i.path}`)}" tabindex="0" role="button" aria-label="${this.esc(i.title)}"`,
      columns: [
        { key: "name", label: "bpColFile", dir: "asc", cell: i => `<div class="statcell"><span class="tile ${tone[i.kind]}"><ha-icon icon="${{ missing: "mdi:file-question-outline", broken: "mdi:file-alert-outline", unused: "mdi:file-hidden" }[i.kind]}"></ha-icon></span><div>${this.nameCell(i.title, i.title === i.path ? "" : i.path)}</div></div>` },
        { key: "kind", label: "bpColKind", dir: "asc", cell: i => `<span class="pill ${tone[i.kind]}">${this.t(label[i.kind])}</span>` },
        { key: "domain", label: "bpColDomain", dir: "asc", cell: i => this.esc(this.t(i.domain)) },
        { key: "users", label: "bpColUsers", sortable: false, cell: i => i.users || "–" },
      ],
    });
    return `<div class="stack">${head}<div class="panel"><p class="factnote pad">${this.esc(files)}</p>${table}</div></div>`;
  }

  // One blueprint: what it is and who uses it. A missing or broken file has no metadata; the fields stay out.
  blueprintDetail(i) {
    const b = i.raw, tone = { missing: "red", broken: "red", unused: "mute" }[i.kind];
    const users = (b.users || []).map(u => {
      const obj = this.findObject(`${u.id.split(".")[0]}:${u.id}`);
      return `<li>${obj ? `<button class="linklike" data-object="${this.esc(this.objectKey(obj))}">${this.esc(u.name)}</button>` : this.esc(u.name)}</li>`;
    }).join("");
    const url = typeof b.source_url === "string" && /^https?:\/\//.test(b.source_url) ? `<a href="${this.esc(b.source_url)}" target="_blank" rel="noopener noreferrer">${this.esc(b.source_url)}</a>` : "";
    const fact = (label, value) => value ? `<div class="fact"><span>${this.t(label)}</span><b>${value}</b></div>` : "";
    const rest = Math.max(0, (b.count || 0) - (b.users || []).length);
    return `<section class="panel"><div class="panelhead"><div><h2>${this.esc(i.title)}</h2><p><span class="pill ${tone}">${this.t({ missing: "bpMissing", broken: "bpBroken", unused: "bpUnused" }[i.kind])}</span></p></div><button class="link" data-bp-back><ha-icon icon="mdi:arrow-left"></ha-icon> ${this.t("bpBack")}</button></div>
      <div class="facts">${fact("bpColDomain", this.esc(this.t(i.domain)))}${fact("bpDetPath", `<code>${this.esc(i.path)}</code>`)}${fact("bpDetAuthor", this.esc(b.author || ""))}${fact("bpDetSource", url)}</div>
      ${b.description ? `<p class="factnote pad">${this.esc(b.description)}</p>` : ""}
      <p class="factnote pad">${this.t(`bpHint_${i.kind}`)}</p>
      ${users ? `<h3 class="pad">${this.t("bpColUsers")}</h3><ul class="pad">${users}${rest ? `<li>+${rest}</li>` : ""}</ul>` : ""}</section>`;
  }
}
