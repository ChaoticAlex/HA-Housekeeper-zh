// GraphMixin: methods of the panel element, mixed into the class in 99-register.js.
// The graph is a second view of the dependency list: origin on the left, the object in the middle,
// what uses it on the right, up to three levels deep. The list stays the default and the fallback.
class GraphMixin {
  // The graph needs room; on a narrow screen only the list is offered.
  canGraph() {
    try { return globalThis.matchMedia ? globalThis.matchMedia("(min-width:600px)").matches : true; } catch (_) { return true; }
  }

  useGraph() { return this.prefs.graphMode === "graph" && this.canGraph(); }

  // Walks the edges level by level from the object. Left: what the object comes from (non-usage
  // edges pointing at it). Right: what uses it (usage edges pointing at it) and what it uses
  // (edges leaving it). Returns nodes per level, the edges between included nodes and the notes.
  graphModel(item, key, { depth = 1, relation = "", certainOnly = false, limit = GRAPH_NODE_STEP, group = true, open = new Set() } = {}) {
    const keep = e => (!relation || e.relation === relation) && (!certainOnly || e.confidence === "certain");
    const sides = {
      left: { levels: [], seen: new Map(), next: node => this.edgesTo(node).filter(e => !USAGE_RELATIONS.includes(e.relation) && keep(e)).map(e => [e.source, e]) },
      right: { levels: [], seen: new Map(), next: (node, via) => (via === "out"
        ? this.edgesFrom(node).filter(keep).map(e => [e.target, e])
        : this.edgesTo(node).filter(e => USAGE_RELATIONS.includes(e.relation) && keep(e)).map(e => [e.source, e])) },
    };
    const edges = [], cycles = new Set();
    let hidden = 0;
    const record = (from, to, edge, cycle) => {
      edges.push({ from, to, edge, cycle });
      if (cycle) cycles.add(edge);
    };
    for (const [name, side] of Object.entries(sides)) {
      let frontier = [{ key, via: null }];
      for (let level = 1; level <= depth && frontier.length; level++) {
        const found = [];
        for (const parent of frontier) {
          const candidates = name === "right" && parent.key === key
            ? [...sides.right.next(key, "in").map(([k, e]) => [k, e, "in"]), ...sides.right.next(key, "out").map(([k, e]) => [k, e, "out"])]
            : side.next(parent.key, parent.via).map(([k, e]) => [k, e, parent.via]);
          for (const [other, edge, via] of candidates) {
            const known = side.seen.get(other);
            const opposite = (name === "left" ? sides.right : sides.left).seen.has(other);
            // Back to the object, to an earlier level or to the other side closes a loop.
            if (other === key || opposite || (known && known.level <= level - 1)) { record(other, parent.key, edge, true); continue; }
            if (known) { record(other, parent.key, edge, false); continue; } // a second way to a node of this level
            if (side.seen.size >= limit) { hidden++; continue; }
            const node = { key: other, level, via, parent: parent.key };
            side.seen.set(other, node);
            found.push(node);
            record(other, parent.key, edge, false);
          }
        }
        if (found.length) side.levels.push(found);
        frontier = found;
      }
    }
    // Leaf nodes of one type that hang on the same node, five or more of them, become one node ("12 × Sensor") until it is opened.
    const repl = new Map();
    if (group) {
      for (const [name, side] of Object.entries(sides)) {
        side.levels = side.levels.map((level, i) => {
          const parents = new Set((side.levels[i + 1] || []).map(n => n.parent));
          const buckets = new Map();
          for (const n of level) {
            if (parents.has(n.key)) continue;
            const id = `${name}|${n.parent}|${n.key.split(":")[0]}|${n.via}`;
            if (!buckets.has(id)) buckets.set(id, []);
            buckets.get(id).push(n);
          }
          const grouped = new Set(), made = [];
          for (const [id, members] of buckets) {
            if (members.length < GRAPH_GROUP_MIN || open.has(id)) continue;
            const g = { key: `group:${id}`, level: members[0].level, via: members[0].via, parent: members[0].parent, group: members.map(m => m.key) };
            members.forEach(m => { repl.set(m.key, g.key); grouped.add(m.key); });
            made.push(g);
          }
          return [...level.filter(n => !grouped.has(n.key)), ...made];
        });
      }
    }
    const seenEdge = new Set(), mapped = [];
    for (const e of edges) {
      const from = repl.get(e.from) ?? e.from, to = repl.get(e.to) ?? e.to;
      const id = `${from}>${to}>${e.edge.relation}`;
      if (from === to || seenEdge.has(id)) continue;
      seenEdge.add(id);
      mapped.push({ ...e, from, to });
    }
    const nodes = new Set([key, ...sides.left.levels.flat().map(n => n.key), ...sides.right.levels.flat().map(n => n.key)]);
    const shown = mapped.filter(e => nodes.has(e.from) && nodes.has(e.to));
    const all = [...sides.left.seen.values(), ...sides.right.seen.values()];
    return {
      key, left: sides.left.levels, right: sides.right.levels, edges: shown,
      hidden, cycles: [...cycles].filter(e => shown.some(s => s.edge === e)).length,
      missing: all.filter(n => !this.findObject(n.key)).length,
      probable: shown.filter(e => e.edge.confidence !== "certain").length,
      count: all.length,
    };
  }

  // Columns from the outermost left level to the outermost right level, the object in the middle.
  graphLayout(model) {
    const W = 232, H = 48, GAPX = 72, GAPY = 14;
    // Children stand in the order of their parents (and then by type and name), so edges run side by side instead of crossing.
    const sortKey = n => { const obj = this.findObject(n.key), [type, ...rest] = n.key.split(":"); return `${type}\u0000${obj?.name || rest.join(":")}`.toLowerCase(); };
    const order = levels => {
      let before = new Map([[model.key, 0]]);
      return levels.map(level => {
        const sorted = [...level].sort((a, b) => (before.get(a.parent) ?? 0) - (before.get(b.parent) ?? 0) || sortKey(a).localeCompare(sortKey(b)));
        before = new Map(sorted.map((n, i) => [n.key, i]));
        return sorted;
      });
    };
    const columns = [...order(model.left).reverse(), [{ key: model.key, center: true }], ...order(model.right)];
    const tallest = Math.max(...columns.map(c => c.length));
    const height = tallest * H + (tallest - 1) * GAPY;
    const at = new Map();
    columns.forEach((column, i) => {
      const top = (height - (column.length * H + (column.length - 1) * GAPY)) / 2;
      column.forEach((node, j) => at.set(node.key, { x: i * (W + GAPX), y: top + j * (H + GAPY), node }));
    });
    // Room on the right for the arcs between nodes of one column.
    return { W, H, width: columns.length * W + (columns.length - 1) * GAPX + 48, height, at };
  }

  graphClip(text, max) { const s = String(text ?? ""); return s.length > max ? `${s.slice(0, max - 1)}…` : s; }

  graphSvg(model, item, hitKeys) {
    const layout = this.graphLayout(model), { W, H, at } = layout;
    // Every edge ends at a port on a node's right or left side. Several edges on one side get their own height
    // (ordered by where the other end stands), so they leave the node side by side instead of on top of each other.
    const geo = model.edges.map(({ from, to, edge, cycle }) => {
      const a = at.get(from), b = at.get(to);
      if (!a || !b) return null;
      const sameColumn = a.x === b.x;
      const [l, r] = sameColumn ? (a.y < b.y ? [a, b] : [b, a]) : a.x < b.x ? [a, b] : [b, a];
      return { from, to, edge, cycle, a, l, r, sameColumn, lp: `${l === a ? from : to}|R`, rp: `${r === a ? from : to}|${sameColumn ? "R" : "L"}` };
    }).filter(Boolean);
    const ports = new Map();
    for (const g of geo) {
      ports.set(g.lp, [...(ports.get(g.lp) || []), { g, end: "l", other: g.r.y }]);
      ports.set(g.rp, [...(ports.get(g.rp) || []), { g, end: "r", other: g.l.y }]);
    }
    for (const list of ports.values()) {
      list.sort((p, q) => p.other - q.other);
      list.forEach((entry, i) => { entry.g[`${entry.end}y`] = (list.length === 1 ? 0.5 : i / (list.length - 1)) * (H - 16) + 8; });
    }
    const edgeSvg = geo.map(({ edge, cycle, a, from, to, l, r, sameColumn, ly, ry }) => {
      const x1 = l.x + W, y1 = l.y + ly, x2 = sameColumn ? r.x + W : r.x, y2 = r.y + ry;
      // Arcs between nodes of one column bulge out further the more rows they span, so nested arcs do not coincide.
      const rows = Math.round(Math.abs(y2 - y1) / (H + 14));
      const dx = sameColumn ? Math.min(14 + 10 * rows, 44) : (x2 - x1) / 2;
      const forward = edge.source === (l === a ? from : to); // the data direction runs from the first to the second end
      const hit = hitKeys && (hitKeys.has(edge.source) && (hitKeys.has(edge.target) || edge.target === model.key));
      const cls = ["gedge", edge.confidence === "certain" ? "" : "prob", cycle ? "cycle" : "", hit ? "hit" : "", hitKeys && !hit ? "gdim" : ""].filter(Boolean).join(" ");
      const mark = forward ? 'marker-end="url(#hk-arrow)"' : 'marker-start="url(#hk-arrow)"';
      return `<path class="${cls}" d="M${x1},${y1} C${x1 + dx},${y1} ${sameColumn ? x2 + dx : x2 - dx},${y2} ${x2},${y2}" ${mark}><title>${this.esc(`${edge.source} → ${edge.target}: ${this.t(edge.relation)} (${this.t(edge.confidence)})`)}</title></path>`;
    }).join("");
    const nodeSvg = [...at.entries()].map(([key, { x, y, node }]) => {
      if (node.group) {
        const type = node.group[0].split(":")[0], hit = hitKeys && node.group.some(k => hitKeys.has(k));
        const names = node.group.slice(0, 8).map(k => this.findObject(k)?.name || k.split(":").slice(1).join(":")).join(", ") + (node.group.length > 8 ? ", …" : "");
        const label = this.t("graphGroup", { n: node.group.length, type: this.t(type) });
        return `<g class="gnode ggroup ${hit ? "hit" : ""}" data-graph-group="${this.esc(key.slice(6))}" tabindex="0" role="button" aria-label="${this.esc(`${label}. ${this.t("graphGroupOpen")}`)}" data-tip="${this.esc(label)}" data-tip-sub="${this.esc(names)}" transform="translate(${x},${y})">
          <rect width="${W}" height="${H}" rx="8"></rect><text class="t1" x="14" y="18">${this.esc(this.graphClip(label, 30))}</text><text x="14" y="36">${this.esc(this.graphClip(this.t("graphGroupOpen"), 30))}</text></g>`;
      }
      const obj = this.findObject(key), [type, ...rest] = key.split(":"), id = rest.join(":");
      const name = obj?.name || id, status = obj ? this.statusLabel(obj.status) : this.t("missing");
      const hit = hitKeys?.has(key), tone = obj ? this.tone(obj.status) : "red";
      const cls = ["gnode", node.center ? "center" : "", obj ? "" : "missing", hit ? "hit" : "", hitKeys && !hit && !node.center ? "gdim" : ""].filter(Boolean).join(" ");
      const label = `${this.t(type)}: ${name}, ${status}${hit ? `, ${this.t("graphBreaks")}` : ""}`;
      return `<g class="${cls}" ${node.center ? "" : `data-graph="${this.esc(key)}" tabindex="0" role="button"`} aria-label="${this.esc(label)}" data-tip="${this.esc(name)}" data-tip-sub="${this.esc(`${this.t(type)} · ${status}${hit ? ` · ${this.t("graphBreaks")}` : ""} · ${id}`)}" transform="translate(${x},${y})">
        <rect width="${W}" height="${H}" rx="8"></rect><rect class="bar ${tone}" width="5" height="${H}" rx="2"></rect>
        <text class="t1" x="14" y="18">${this.esc(this.graphClip(`${this.t(type)} · ${status}${hit ? ` · ${this.t("graphBreaks")}` : ""}`, 38))}</text>
        <text x="14" y="36">${this.esc(this.graphClip(name, 27))}</text></g>`;
    }).join("");
    return `<div class="graphwrap"><svg class="graphsvg" role="group" aria-label="${this.esc(this.t("graphLabel", { name: item.name }))}" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
      <defs><marker id="hk-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="garrow" d="M0,0 L8,4 L0,8z"></path></marker></defs>${edgeSvg}${nodeSvg}</svg></div>`;
  }

  // The switch between list and graph, and for the graph the depth, filters and the removal highlight.
  graphBar(item, key) {
    const canGraph = this.canGraph(), graph = this.useGraph();
    const toggle = canGraph ? `<div class="seg" role="group" aria-label="${this.esc(this.t("graphMode"))}">${[["list", "graphList"], ["graph", "graphGraph"]].map(([mode, label]) => `<button class="btn ${(graph ? "graph" : "list") === mode ? "primary" : ""}" data-pref="graphMode|${mode}" aria-pressed="${(graph ? "graph" : "list") === mode}">${this.t(label)}</button>`).join("")}</div>` : "";
    if (!graph) return toggle ? `<div class="panel graphbar">${toggle}</div>` : `<p class="factnote graphphone">${this.t("graphPhone")}</p>`;
    const depth = [1, 2, 3].map(n => `<button class="btn ${this.graphDepth === n ? "primary" : ""}" data-graph-depth="${n}" aria-pressed="${this.graphDepth === n}">${n}</button>`).join("");
    const relations = [...new Set(this.graphModel(item, key, { depth: this.graphDepth, limit: 400 }).edges.map(e => e.edge.relation))].sort();
    const relSelect = `<select id="graphRel" aria-label="${this.esc(this.t("graphRelation"))}"><option value="">${this.t("graphAllRelations")}</option>${relations.map(r => `<option value="${r}" ${this.graphRel === r ? "selected" : ""}>${this.t(r)}</option>`).join("")}</select>`;
    const confSelect = `<select id="graphConf" aria-label="${this.esc(this.t("graphConfidence"))}"><option value="all" ${this.graphConf === "all" ? "selected" : ""}>${this.t("graphAllConf")}</option><option value="certain" ${this.graphConf === "certain" ? "selected" : ""}>${this.t("graphCertainOnly")}</option></select>`;
    const impact = this.impact(item, key);
    const impactBtn = impact ? `<button class="btn ${this.graphImpact ? "primary" : ""}" data-graph-impact aria-pressed="${this.graphImpact}">${this.t("graphImpact")}</button>` : "";
    return `<div class="panel graphbar">${toggle}<span class="graphctl"><small>${this.t("graphDepth")}</small><span class="seg" role="group" aria-label="${this.esc(this.t("graphDepth"))}">${depth}</span></span>${relSelect}${confSelect}${impactBtn}</div>`;
  }

  graphPanel(item, key) {
    const model = this.graphModel(item, key, { depth: this.graphDepth, relation: this.graphRel, certainOnly: this.graphConf === "certain", limit: this.graphLimit, open: this.graphOpen });
    const impact = this.graphImpact ? this.impact(item, key) : null;
    const hitKeys = impact ? new Set([...impact.hits.map(h => h.key)]) : null;
    const nothing = !model.count;
    const shownHits = hitKeys ? [...hitKeys].filter(k => model.left.concat(model.right).some(level => level.some(n => n.key === k || n.group?.includes(k)))).length : 0;
    const notes = [
      hitKeys && hitKeys.size > shownHits ? this.t("graphHitsOutside", { n: hitKeys.size - shownHits }) : "",
      model.missing ? this.t("graphMissing", { n: model.missing }) : "", model.probable ? this.t("graphProbable", { n: model.probable }) : "",
      model.cycles ? this.t("graphCycles", { n: model.cycles }) : "", model.hidden ? this.t("graphHidden", { n: model.hidden }) : "",
    ].filter(Boolean).join(" · ");
    const more = (model.hidden ? `<button class="btn" data-graph-more>${this.t("graphMore")}</button>` : "") + (this.graphOpen.size ? ` <button class="btn" data-graph-regroup>${this.t("graphRegroup")}</button>` : "");
    return `<div class="panel"><div class="panelhead"><h2>${this.t("origin")} → ${this.t("usage")}</h2><span class="date">${this.t("graphNodes", { n: model.count })}</span></div>
      ${nothing ? `<p style="padding:6px 16px;color:var(--hk-muted)">${this.t("noRelations")}</p>` : this.graphSvg(model, item, hitKeys)}
      ${notes || more.trim() ? `<p class="factnote">${this.esc(notes)} ${more}</p>` : ""}${this.fold("graph_legend", { title: this.t("graphLegendTitle") }, `<p class="factnote">${this.t("graphLegend")}</p>`, false)}</div>`;
  }
}
