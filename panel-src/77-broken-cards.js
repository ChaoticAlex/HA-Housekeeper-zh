// BrokenCardsMixin: where a broken dashboard reference sits (tab and card instead of a raw path), the close names that
// do exist, and one row per card instead of one per reference. Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  brokenView: "Tab „{view}“", brokenCard: "Karte {card}", brokenSection: "Abschnitt {n}", brokenMaybe: "Vielleicht: {ids}",
  brokenCount: "{n} defekte Referenzen",
  brokenOrphan: "Die Karte wirkt verwaist: {missing} von {total} Referenzen sind defekt. Prüfen, ob sie ganz entfernt werden kann, statt jede Zeile einzeln zu reparieren.",
});
Object.assign(TEXT.en, {
  brokenView: "Tab “{view}”", brokenCard: "Card {card}", brokenSection: "Section {n}", brokenMaybe: "Maybe: {ids}",
  brokenCount: "{n} broken references",
  brokenOrphan: "The card looks abandoned: {missing} of {total} references are broken. Check whether it can be removed as a whole instead of repairing each line.",
});

class BrokenCardsMixin {
  // Tab and card of a reference as text; inside a group the part below the card, because the card is the heading.
  placeText(f, inGroup = false) {
    const e = f.evidence?.[0], p = e?.place;
    if (!p) return e?.location || "";
    if (inGroup && p.card_path && e.location.startsWith(`${p.card_path}/`)) return e.location.slice(p.card_path.length + 1);
    return this.placeParts(p).join(" · ");
  }

  placeParts(p) {
    return [p.view != null ? this.t("brokenView", { view: p.view }) : "",
      p.card ? `${this.t("brokenCard", { card: p.card })}${p.section ? ` (${this.t("brokenSection", { n: p.section })})` : ""}` : ""].filter(Boolean);
  }

  suggestText(f) { return f.suggestions?.length ? this.t("brokenMaybe", { ids: f.suggestions.join(", ") }) : ""; }

  // One entry per card for broken dashboard references with a known card; a card with a single one stays a plain row.
  groupBroken(list) {
    const groups = new Map(), out = [];
    for (const f of list) {
      const p = f.evidence?.[0]?.place;
      if (f.classification === "broken_reference" && f.rule_id.startsWith("dashboard.") && p?.card_path) {
        const id = `${f.object_id}|${p.card_path}`;
        let g = groups.get(id);
        if (!g) { g = { group: id, members: [] }; groups.set(id, g); out.push(g); }
        g.members.push(f);
      } else out.push(f);
    }
    return out.map(x => (x.members?.length === 1 ? x.members[0] : x));
  }

  findingGroup(g) {
    const f = g.members[0], p = f.evidence[0].place, object = this.findObject(this.findingKey(f));
    const keys = g.members.map(m => m.key), n = keys.length, id = `bg:${g.group}`, open = this.foldOpen(id, false);
    (this._findGroups ||= {})[g.group] = keys;
    const orphan = p.card_missing >= 2 && p.card_missing * 2 > p.card_refs;
    const title = `${object?.name || f.object_id}${p.view != null ? ` › ${p.view}` : ""}`;
    const sub = [...this.placeParts({ card: p.card, section: p.section }), this.t("brokenCount", { n })].join(" · ");
    const head = `<div class="rowwrap"><input type="checkbox" class="selbox" data-fsel-group="${this.esc(g.group)}" ${keys.every(k => this.findSel.has(k)) ? "checked" : ""} aria-label="${this.esc(title)}"><button class="row foldhead" data-fold="${this.esc(id)}" aria-expanded="${open}"><span class="tile red"><ha-icon icon="mdi:${open ? "chevron-down" : "chevron-right"}"></ha-icon></span><span class="row-text"><strong>${this.esc(title)}</strong><small>${this.esc(sub)}${orphan ? ` · ${this.esc(this.t("brokenOrphan", { missing: p.card_missing, total: p.card_refs }))}` : ""}</small></span><span class="pill red">${n}</span></button></div>`;
    return `<div class="fold${open ? " open" : ""}">${head}${open ? `<div class="foldbody">${g.members.map(m => this.findingRow(m, true)).join("")}</div>` : ""}</div>`;
  }
}
