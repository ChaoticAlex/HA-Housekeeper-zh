// SearchMixin: one search box in the top bar for entities, devices, integrations, automations and scripts.
const QUICK_TYPES = ["entity", "device", "config_entry", "automation", "script"];
const QUICK_LIMIT = 12;

class SearchMixin {
  // The one object search: every word must occur in the name, the id, the integration, the maker or the model; names that
  // start with the first word come first. The top bar, the dependency path and the sensor fields all use it.
  searchObjects(query, { types = QUICK_TYPES, limit = QUICK_LIMIT, filter = null } = {}) {
    const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
    if (!this.data || !terms.length) return [];
    const found = [];
    for (const item of this.data.objects) {
      if ((types && !types.includes(item.object_type)) || (filter && !filter(item))) continue;
      const name = String(item.name || "").toLowerCase();
      const hay = `${name} ${String(item.object_id).toLowerCase()} ${String(item.platform || item.domain || "").toLowerCase()} ${String(item.manufacturer || "").toLowerCase()} ${String(item.model || "").toLowerCase()}`;
      if (!terms.every(term => hay.includes(term))) continue;
      found.push({ item, rank: name.startsWith(terms[0]) ? 0 : name.includes(terms[0]) ? 1 : 2 });
    }
    const order = types || QUICK_TYPES;
    found.sort((a, b) => a.rank - b.rank || order.indexOf(a.item.object_type) - order.indexOf(b.item.object_type) || String(a.item.name).localeCompare(String(b.item.name)));
    return found.slice(0, limit).map(entry => entry.item);
  }

  quickResults() {
    return this.quickQuery.trim().length < 2 ? [] : this.searchObjects(this.quickQuery);
  }

  quickSearchBox() {
    if (!this.data) return "";
    const entries = this.quickOpen ? this.quickEntries() : [];
    const active = Math.min(this.quickIndex, Math.max(entries.length - 1, 0));
    let heading = "";
    const rows = entries.map((entry, i) => {
      const group = entry.kind === "object" ? "quickGroupObjects" : entry.kind === "filter" ? "quickGroupFilters" : "quickGroupPages";
      const head = group !== heading ? `<li class="grp" role="presentation">${this.t(group)}</li>` : "";
      heading = group;
      const attrs = `role="option" id="quick-opt-${i}" aria-selected="${i === active}" data-quick-entry="${i}" class="${i === active ? "on" : ""}"`;
      if (entry.kind === "object") {
        const item = entry.item;
        return `${head}<li ${attrs}>${this.tile(item.object_type)}<span class="row-text"><strong>${this.esc(item.name)}</strong><small>${this.esc(this.t(item.object_type))} · ${this.esc(item.object_id)}</small></span></li>`;
      }
      const icon = entry.kind === "filter" ? "mdi:filter-outline" : NAV_ICONS[entry.view] || "mdi:compass-outline";
      const note = entry.kind === "filter" ? `${this.t("quickFilterHint")} · ${this.formatNumber(entry.count)}` : entry.path;
      return `${head}<li ${attrs}><span class="tile mute"><ha-icon icon="${icon}"></ha-icon></span><span class="row-text"><strong>${this.esc(entry.label)}</strong>${note ? `<small>${this.esc(note)}</small>` : ""}</span></li>`;
    }).join("");
    const list = this.quickOpen && this.quickQuery.trim().length >= 2
      ? `<ul class="quicklist" id="quick-list" role="listbox" aria-label="${this.esc(this.t("quickLabel"))}">${entries.length ? rows : `<li class="none">${this.t("quickNone")}</li>`}</ul>` : "";
    return `<div class="quick"><ha-icon icon="mdi:magnify"></ha-icon><input type="search" data-quick autocomplete="off" role="combobox" aria-expanded="${Boolean(list)}" aria-controls="quick-list" aria-autocomplete="list" ${list && entries.length ? `aria-activedescendant="quick-opt-${active}"` : ""} placeholder="${this.esc(this.t("quickPlaceholder"))}" aria-label="${this.esc(this.t("quickLabel"))}" value="${this.esc(this.quickQuery)}">${list}</div>`;
  }

  quickPick(key) {
    const obj = this.findObject(key);
    if (!obj) return;
    this.quickQuery = ""; this.quickOpen = false; this.quickIndex = 0; this.menuOpen = null; this.navOpen = false;
    this.openObject(obj);
  }

  bindQuick(root) {
    const input = root.querySelector("[data-quick]");
    if (input) {
      input.oninput = () => { this.quickQuery = input.value; this.quickOpen = true; this.quickIndex = 0; this.scheduleRender(); };
      input.onfocus = () => { if (this.quickQuery && !this.quickOpen) { this.quickOpen = true; this.render(); } };
      input.onkeydown = ev => {
        const results = this.quickEntries();
        if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
          if (!results.length) return;
          ev.preventDefault();
          this.quickOpen = true;
          this.quickIndex = (this.quickIndex + (ev.key === "ArrowDown" ? 1 : results.length - 1)) % results.length;
          this.render();
        } else if (ev.key === "Enter" && results.length) {
          ev.preventDefault();
          this.quickGo(results[Math.min(this.quickIndex, results.length - 1)]);
        } else if (ev.key === "Escape" && (this.quickOpen || this.quickQuery)) {
          ev.stopPropagation();
          this.quickQuery = ""; this.quickOpen = false; this.render();
        }
      };
    }
    root.querySelectorAll("[data-quick-entry]").forEach(el => el.onclick = () => { const entry = this.quickEntries()[Number(el.dataset.quickEntry)]; if (entry) this.quickGo(entry); });
    if (!this._quickBound && root.addEventListener) {
      this._quickBound = true;
      root.addEventListener("click", ev => {
        if (!this.quickOpen || (ev.composedPath?.() || []).some(node => node.classList?.contains?.("quick"))) return;
        this.quickOpen = false; this.render();
      });
    }
  }
}
