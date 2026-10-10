// PickerMixin: a text field that lists matching objects while typing, like the search in the top bar. A field is
// described by its name: where its text lives, which objects it may offer and what picking one does.
class PickerMixin {
  pickerDef(name) {
    return {
      counter: {
        get: () => this.counterId || "", set: v => { this.counterId = v; }, min: 1, types: ["entity"],
        filter: o => o.has_statistics && o.object_id.startsWith("sensor."), pick: o => { this.counterId = o.object_id; },
      },
      replOld: {
        get: () => this.replOld || "", set: v => this.setPair("repl", "Old", v), min: 1, types: ["entity"], limit: 30,
        filter: o => this.edgeIndex().used.has(`entity:${o.object_id}`), pick: o => this.setPair("repl", "Old", o.object_id),
      },
      replNew: {
        get: () => this.replNew || "", set: v => { this.replNew = v; }, min: 1, types: ["entity"], limit: 30,
        filter: o => o.status === "active" && o.object_id !== this.replOld && this.sameDomain(o, this.replOld), pick: o => { this.replNew = o.object_id; },
      },
      meterOld: {
        get: () => this.meterOld || "", set: v => this.setPair("meter", "Old", v), min: 1, types: ["entity"], limit: 30,
        filter: o => o.has_statistics && o.object_id.startsWith("sensor."), pick: o => this.setPair("meter", "Old", o.object_id),
      },
      meterNew: {
        get: () => this.meterNew || "", set: v => { this.meterNew = v; }, min: 1, types: ["entity"], limit: 30,
        filter: o => {
          const unit = this.findObject(`entity:${this.meterOld}`)?.unit;
          return o.status === "active" && o.object_id !== this.meterOld && this.sameDomain(o, this.meterOld) && (!unit || o.unit === unit);
        }, pick: o => { this.meterNew = o.object_id; },
      },
      note: {
        get: () => this.noteDraft?.targetText ?? "", set: v => { if (this.noteDraft) { this.noteDraft.targetText = v; this.noteDraft.target = ""; } }, min: 2, types: null, limit: 15,
        pick: o => { this.noteDraft.target = this.objectKey(o); this.noteDraft.targetText = o.name; },
      },
      graph: {
        get: () => this.graphQuery, set: v => { this.graphQuery = v; }, min: 2, types: null, limit: 15,
        pick: o => { this.noteGraphStep(o); this.graphSelected = o; this.graphQuery = ""; this.graphLimit = GRAPH_NODE_STEP; },
      },
    }[name];
  }

  // The new entity must come from the same domain as the old one.
  sameDomain(o, oldId) {
    const domain = String(oldId || "").split(".")[0];
    return !domain || o.object_id.startsWith(`${domain}.`);
  }

  // Sets the old entity of a pair; a new one from another domain no longer fits and is cleared.
  setPair(prefix, side, value) {
    this[`${prefix}${side}`] = value;
    const other = this[`${prefix}New`];
    if (other && value.includes(".") && other.split(".")[0] !== value.split(".")[0]) this[`${prefix}New`] = "";
  }

  pickerResults(name) {
    const def = this.pickerDef(name), q = def ? String(def.get()).trim() : "";
    if (!def || q.length < def.min) return [];
    return this.searchObjects(q, { types: def.types, limit: def.limit || QUICK_LIMIT, filter: def.filter });
  }

  // The input plus, while it is open, the list of matches. `attrs` carries the field's own data attribute.
  pickerBox(name, placeholder, attrs = "") {
    const def = this.pickerDef(name), value = def.get();
    const open = this._picker?.name === name && this._picker.open && String(value).trim().length >= def.min;
    const results = open ? this.pickerResults(name) : [];
    const active = Math.min(this._picker?.index || 0, Math.max(results.length - 1, 0));
    const sub = o => (def.types?.length === 1 ? o.object_id : `${this.t(o.object_type)} · ${o.object_id}`);
    const list = open ? `<ul class="quicklist" id="picker-${name}" role="listbox" aria-label="${this.esc(this.t("quickLabel"))}">${results.length
      ? results.map((o, i) => `<li role="option" id="picker-${name}-${i}" aria-selected="${i === active}" data-picker-item="${this.esc(this.objectKey(o))}" data-picker-name="${name}" class="${i === active ? "on" : ""}">${this.tile(o.object_type)}<span class="row-text"><strong>${this.esc(o.name)}</strong><small>${this.esc(sub(o))}</small></span></li>`).join("")
      : `<li class="none">${this.t("quickNone")}</li>`}</ul>` : "";
    return `<div class="picker"><input type="text" data-picker="${name}" ${attrs} value="${this.esc(value)}" placeholder="${this.esc(placeholder)}" autocomplete="off" role="combobox" aria-expanded="${Boolean(open)}" aria-controls="picker-${name}" aria-autocomplete="list" ${open && results.length ? `aria-activedescendant="picker-${name}-${active}"` : ""}>${list}</div>`;
  }

  pickerPick(name, key) {
    const obj = this.findObject(key);
    if (obj) this.pickerDef(name).pick(obj);
    this._picker = { name, open: false, index: 0 };
    this.render();
  }

  bindPicker(root) {
    root.querySelectorAll("[data-picker]").forEach(input => {
      const name = input.dataset.picker;
      input.oninput = () => { this.pickerDef(name).set(input.value.trim()); this._picker = { name, open: true, index: 0 }; this.scheduleRender(); };
      input.onkeydown = ev => {
        const results = this._picker?.open ? this.pickerResults(name) : [];
        if ((ev.key === "ArrowDown" || ev.key === "ArrowUp") && results.length) {
          ev.preventDefault();
          this._picker.index = (this._picker.index + (ev.key === "ArrowDown" ? 1 : results.length - 1)) % results.length;
          this.render();
        } else if (ev.key === "Enter" && results.length) {
          ev.preventDefault();
          this.pickerPick(name, this.objectKey(results[Math.min(this._picker.index, results.length - 1)]));
        } else if (ev.key === "Escape" && this._picker?.open) {
          ev.stopPropagation();
          this._picker.open = false; this.render();
        }
      };
    });
    root.querySelectorAll("[data-picker-item]").forEach(el => { el.onclick = () => this.pickerPick(el.dataset.pickerName, el.dataset.pickerItem); });
    if (!this._pickerBound && root.addEventListener) {
      this._pickerBound = true;
      root.addEventListener("click", ev => {
        if (!this._picker?.open || (ev.composedPath?.() || []).some(node => node.classList?.contains?.("picker"))) return;
        this._picker.open = false; this.render();
      });
    }
  }
}
