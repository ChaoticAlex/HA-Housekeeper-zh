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

  // The inputs, the file and what each user set are read when a blueprint is opened, not with the list.
  ensureBlueprintDetail(item) {
    const key = `${item.domain}/${item.path}`;
    if (this._bpDetailKey === key) return;
    this._bpDetailKey = key; this.bpDetail = null; this.bpDetailError = "";
    setTimeout(async () => {
      try { const reply = await this._hass.callWS({ type: "ha_housekeeper/blueprint_detail", domain: item.domain, path: item.path }); if (this._bpDetailKey === key) this.bpDetail = reply; }
      catch (err) { if (this._bpDetailKey === key) this.bpDetailError = this.errText(err); }
      this.render();
    }, 0);
  }

  // One blueprint as a page of its own: overview, inputs, who uses it and how, and the file.
  blueprintDetail(i) {
    this.ensureBlueprintDetail(i);
    const b = i.raw, d = this.bpDetail, tone = { missing: "red", broken: "red", unused: "mute" }[i.kind];
    const nUsers = d ? d.user_count : (b.count ?? 0);
    const tabs = [{ id: "overview", label: this.t("tabOverview") }, { id: "inputs", label: this.t("bpTabInputs"), count: d ? d.inputs.length : null }, { id: "users", label: this.t("bpColUsers"), count: d ? nUsers : null }, { id: "technical", label: this.t("tabTechnical") }];
    const open = this.viewTabOf("blueprint", tabs, "overview");
    const head = `<div class="panelhead"><div><h2>${this.esc(i.title)}</h2><p><span class="pill ${tone}">${this.t({ missing: "bpMissing", broken: "bpBroken", unused: "bpUnused" }[i.kind])}</span></p></div><button class="link" data-bp-back><ha-icon icon="mdi:arrow-left"></ha-icon> ${this.t("bpBack")}</button></div>`;
    const fact = (label, value) => value ? `<div class="fact"><span>${this.t(label)}</span><b>${value}</b></div>` : "";
    const url = typeof b.source_url === "string" && /^https?:\/\//.test(b.source_url) ? `<a href="${this.esc(b.source_url)}" target="_blank" rel="noopener noreferrer">${this.esc(b.source_url)}</a>` : "";
    let body;
    if (open === "overview") {
      body = `<div class="facts">${fact("bpColDomain", this.esc(this.t(i.domain)))}${fact("bpDetAuthor", this.esc(b.author || ""))}${fact("bpDetSource", url)}${d ? fact("bpTabInputs", this.formatNumber(d.inputs.length)) : ""}${fact("bpColUsers", this.formatNumber(nUsers))}</div>${b.description ? `<p class="factnote pad">${this.esc(b.description)}</p>` : ""}<p class="factnote pad">${this.t(`bpHint_${i.kind}`)}</p>`;
    } else if (open === "technical") {
      body = `<div class="facts">${fact("bpDetPath", `<code>${this.esc(i.path)}</code>`)}${fact("bpColDomain", this.esc(this.t(i.domain)))}${d?.size != null ? fact("bpDetSize", this.formatBytes(d.size)) : ""}${d?.modified ? fact("bpDetModified", this.esc(this.formatDate(d.modified))) : ""}${d?.min_version ? fact("bpDetMin", this.esc(d.min_version)) : ""}</div>${d ? "" : this.bpLoading()}`;
    } else if (!d) {
      body = this.bpLoading();
    } else if (open === "inputs") {
      body = this.blueprintInputs(d);
    } else {
      body = this.blueprintUsers(d, nUsers);
    }
    return `<section class="panel">${head}${this.viewTabBar("blueprint", tabs, open)}${body}</section>`;
  }

  bpLoading() { return this.bpDetailError ? `<div class="error pad">${this.esc(this.bpDetailError)}</div>` : this.skeleton("loading"); }

  blueprintInputs(d) {
    if (!d.inputs.length) return `<div class="emptymsg">${this.t("bpNoInputs")}</div>`;
    const sections = [...new Set(d.inputs.map(r => r.section))];
    return sections.map(section => `${section ? `<h3 class="pad">${this.esc(section)}</h3>` : ""}<ul class="pad">${d.inputs.filter(r => r.section === section).map(r => `<li><strong>${this.esc(r.name)}</strong> <code>${this.esc(r.key)}</code>${r.selector ? ` <span class="pill mute">${this.esc(r.selector)}</span>` : ""}${r.description ? `<br><small>${this.esc(r.description)}</small>` : ""}<br><small>${r.has_default ? `${this.t("bpInDefaultIs")}: <code>${this.esc(r.default)}</code>` : this.t("bpInNoDefault")}</small></li>`).join("")}</ul>`).join("");
  }

  // Each user with what it set; an input left alone, one that points to an entity that is gone, and a value kept back stand out.
  blueprintUsers(d, count) {
    if (!d.users.length) return `<div class="emptymsg">${this.t("bpUsersNone")}</div>`;
    const names = Object.fromEntries(d.inputs.map(r => [r.key, r.name]));
    const state = { default: ["mute", "bpInDefault"], set: ["ok", "bpInSet"], missing_entity: ["red", "bpInMissing"] };
    const users = d.users.map(u => {
      const obj = this.findObject(`${u.id.split(".")[0]}:${u.id}`);
      const who = obj ? `<button class="linklike" data-object="${this.esc(this.objectKey(obj))}">${this.esc(u.name)}</button>` : this.esc(u.name);
      const rows = u.inputs.map(x => `<li>${this.esc(names[x.key] || x.key)}: ${x.state === "default" ? "" : (x.value === null ? `<small>${this.t("bpValueHidden")}</small>` : `<code>${this.esc(x.value)}</code>`)} <span class="pill ${state[x.state][0]}">${this.t(state[x.state][1])}</span></li>`).join("");
      return `<h3 class="pad">${who}</h3>${rows ? `<ul class="pad">${rows}</ul>` : ""}`;
    }).join("");
    const rest = Math.max(0, count - d.users.length);
    return `${users}${rest ? `<p class="factnote pad">+${rest}</p>` : ""}`;
  }
}
