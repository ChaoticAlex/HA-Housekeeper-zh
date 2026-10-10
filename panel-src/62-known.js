// "Known about this entity": everything Housekeeper knows about one entity in one card, grouped, with the source of each line.
// It replaces the facts card for entities; the recorder values come on request (the same load as the recorder view). Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  knownTitle: "Bekannt über diese Entität", knownHint: "Was Housekeeper aus Scan, Recorder, Freigaben und Logbuch weiß. Zeilen ohne Wissen fehlen.",
  knownLoad: "Recorder-Werte laden", knownLoading: "Lädt …",
  knownState: "Zustand", knownRecorder: "Recorder", knownUse: "Nutzung", knownCare: "Regeln und Pflege", knownHistory: "Verlauf",
  knownSrcScan: "Scan", knownSrcRecorder: "Recorder", knownSrcRelations: "Beziehungen", knownSrcRules: "Regeln", knownSrcReliability: "Zuverlässigkeit", knownSrcLog: "Logbuch", knownSrcCorr: "Korrelation", knownSrcExposure: "Freigaben", knownSrcDecisions: "Entscheidungen",
  knownRunning: "Zustand", knownDevice: "Gerät", knownAttrs: "Eigenschaften", knownUnit: "Einheit", knownClass: "Geräteklasse", knownStateClass: "Zustandsklasse",
  knownWriteRate: "Schreibrate", knownRate: "{n} Einträge pro Tag", knownRank: "Platz {n} der lautesten", knownShare: "etwa {share} % aller Einträge", knownExcluded: "Wird nicht aufgezeichnet (Recorder-Filter)", knownQuiet: "Nicht unter den {n} lautesten Entitäten",
  knownUsedIn: "Verwendet in", knownUsedNone: "Nirgends verwendet", knownAssist: "Für Assistenten", knownAssistYes: "Freigegeben für {list}", knownAssistNo: "Nicht freigegeben",
  knownArea: "Bereich", knownIgnored: "Ignoriert", knownIgnoredYes: "Der Befund ist ausgeblendet", knownLog: "Logbuch", knownLogLine: "{n} Einträge, zuletzt „{title}“ am {date}", knownLogOne: "„{title}“ am {date}", knownCorr: "Zeitlicher Zusammenhang",
});
Object.assign(TEXT.en, {
  knownTitle: "Known about this entity", knownHint: "What Housekeeper knows from the scan, the recorder, the exposure and the logbook. Lines without knowledge are left out.",
  knownLoad: "Load recorder values", knownLoading: "Loading …",
  knownState: "State", knownRecorder: "Recorder", knownUse: "Use", knownCare: "Rules and care", knownHistory: "History",
  knownSrcScan: "Scan", knownSrcRecorder: "Recorder", knownSrcRelations: "Relations", knownSrcRules: "Rules", knownSrcReliability: "Reliability", knownSrcLog: "Logbook", knownSrcCorr: "Correlation", knownSrcExposure: "Exposure", knownSrcDecisions: "Decisions",
  knownRunning: "State", knownDevice: "Device", knownAttrs: "Properties", knownUnit: "Unit", knownClass: "Device class", knownStateClass: "State class",
  knownWriteRate: "Write rate", knownRate: "{n} records a day", knownRank: "Rank {n} of the loudest", knownShare: "about {share} % of all records", knownExcluded: "Not recorded (recorder filter)", knownQuiet: "Not among the {n} loudest entities",
  knownUsedIn: "Used in", knownUsedNone: "Used nowhere", knownAssist: "For assistants", knownAssistYes: "Exposed to {list}", knownAssistNo: "Not exposed",
  knownArea: "Area", knownIgnored: "Ignored", knownIgnoredYes: "The finding is hidden", knownLog: "Logbook", knownLogLine: "{n} entries, latest “{title}” on {date}", knownLogOne: "“{title}” on {date}", knownCorr: "Connection in time",
});

class KnownMixin {
  // One line: tone dot, label, value (HTML), source tag. `tone` is ok, warn, red or mute.
  knownLine(tone, label, value, source) {
    const dot = { ok: "✓", warn: "!", red: "✕", mute: "·" }[tone] || "·";
    return `<div class="knline"><span class="kdot k-${tone}">${dot}</span><span class="kk">${label}</span><span class="kv">${value}</span><span class="ksrc">${this.t(source)}</span></div>`;
  }

  knownGroup(title, lines) {
    const rows = lines.filter(Boolean);
    return rows.length ? `<div class="kngrp">${this.t(title)}</div>${rows.join("")}` : "";
  }

  // What hangs on the entity, by type: "3 automations, 1 script".
  knownUsage(key) {
    const counts = {};
    for (const e of this.edgesTo(key)) if (USAGE_RELATIONS.includes(e.relation)) { const type = e.source.split(":")[0]; counts[type] = (counts[type] || 0) + 1; }
    return Object.entries(counts).map(([type, n]) => `${this.formatNumber(n)} ${this.t(type)}`).join(", ");
  }

  knownLoadRecorder(id) {
    if (!this.storms && !this.stormsLoading) this.loadStorms();
    if (!this.entityRec?.[id]?.data && !this.entityRec?.[id]?.loading) this.loadEntityRecorder(id);
  }

  knownCard(item, key) {
    const id = item.object_id, t = (k, v) => this.t(k, v);
    const when = value => `${this.esc(this.formatDate(value))}<small>${this.esc(this.relTime(value))}</small>`;
    const finding = this.data.findings.find(f => this.findingKey(f) === key);
    this.ensureExposure();
    // State
    const device = item.device_id ? this.findObject(`device:${item.device_id}`) : null;
    const entry = item.config_entry_id ? this.findObject(`config_entry:${item.config_entry_id}`) : null;
    const stable = this.stabilityOf(item);
    const state = [];
    if (item.state !== null && item.state !== undefined) {
      const tone = item.state === "unavailable" ? "red" : item.state === "unknown" ? "warn" : "ok";
      const shown = item.state === "unavailable" || item.state === "unknown" ? t(item.state) : item.unit ? `${item.state} ${item.unit}` : item.state;
      state.push(this.knownLine(tone, t("knownRunning"), `${this.esc(shown)}${item.status_since ? `<small>${t("since")}: ${this.esc(this.formatDate(item.status_since))} · ${this.esc(this.relTime(item.status_since))} · ${t("firstSeenNote")}</small>` : ""}`, "knownSrcScan"));
    } else state.push(this.knownLine("mute", t("knownRunning"), t("noState"), "knownSrcScan"));
    if (item.last_changed) state.push(this.knownLine("mute", t("propLastChanged"), when(item.last_changed), "knownSrcScan"), this.knownLine("mute", t("propLastReported"), when(item.last_reported || item.last_updated), "knownSrcScan"));
    if (stable?.missing) state.push(this.knownLine("mute", t("stability"), t("stabilityMissing"), "knownSrcReliability"));
    else if (stable?.info) state.push(this.knownLine(stable.info.level === "flapping" ? "red" : "warn", t("stability"), `<span class="pill ${stable.info.level === "flapping" ? "red" : "warn"}">${t(stable.info.level === "flapping" ? "relFlapping" : "relUnstable")}</span>${this.unstableLines(stable.info, stable.r.window_days).map(line => `<small>${line}</small>`).join("")}`, "knownSrcReliability"));
    else if (stable) state.push(this.knownLine("ok", t("stability"), `${t("stabilityOk")}<small>${t(stable.r.window_days === 1 ? "relWindow1" : "relWindow7")}</small>`, "knownSrcReliability"));
    const where = [device ? `${t("knownDevice")}: ${this.esc(device.name)}` : "", entry ? `${t("integration")}: ${this.esc(entry.name)}` : ""].filter(Boolean).join(" · ");
    if (where) state.push(this.knownLine("mute", t("knownDevice"), where, "knownSrcScan"));
    // Recorder
    const rec = [];
    const attrs = [item.unit && `${t("knownUnit")}: ${this.esc(item.unit)}`, item.device_class && `${t("knownClass")}: ${this.esc(item.device_class)}`, item.state_class && `${t("knownStateClass")}: ${this.esc(item.state_class)}`].filter(Boolean);
    if (attrs.length) rec.push(this.knownLine("mute", t("knownAttrs"), attrs.join(" · "), "knownSrcScan"));
    const recorder = this.data.meta.recorder_available;
    if (recorder) {
      if (item.has_statistics) this.ensureStatLast(id);
      const last = this.statLast?.[id], span = this.statSpan?.[id];
      const fmt = ts => this.esc(this.formatDate(new Date(ts * 1000).toISOString()));
      const lines = [item.has_statistics && span?.first ? `<small>${t("statFirstEntry")}: ${fmt(span.first)} · ${t("statRows", { count: this.formatNumber(span.rows) })}</small>` : "", item.has_statistics && last ? `<small>${t("statLastEntry")}: ${fmt(last)} · ${this.esc(this.relTime(new Date(last * 1000).toISOString()))}</small>` : ""].join("");
      rec.push(this.knownLine(item.has_statistics ? "ok" : "mute", t("longTermStats"), `${t(item.has_statistics ? "yes" : "no")}${lines}`, "knownSrcRecorder"));
      const storms = this.storms?.available && !this.storms.busy ? this.storms : null;
      if (storms) {
        const idx = (storms.entities || []).findIndex(e => e.entity_id === id), row = storms.entities?.[idx];
        if (row?.excluded) rec.push(this.knownLine("mute", t("knownWriteRate"), t("knownExcluded"), "knownSrcRecorder"));
        else if (row) {
          const share = storms.per_day ? Math.round((1000 * row.per_day) / storms.per_day) / 10 : null;
          rec.push(this.knownLine(idx < 10 ? "warn" : "mute", t("knownWriteRate"), `${t("knownRate", { n: this.formatNumber(row.per_day) })}<small>${t("knownRank", { n: idx + 1 })}${share !== null ? ` · ${t("knownShare", { share: this.formatNumber(share) })}` : ""}</small>`, "knownSrcRecorder"));
        } else if ((storms.entities || []).length >= 100) rec.push(this.knownLine("ok", t("knownWriteRate"), t("knownQuiet", { n: 100 }), "knownSrcRecorder"));
      }
    }
    // Use
    const used = this.knownUsage(key);
    const use = [this.knownLine("mute", t("knownUsedIn"), used || t("knownUsedNone"), "knownSrcRelations")];
    const expo = this.exposure;
    if (expo && !this.exposureError) {
      const hit = (expo.exposed_entities || []).find(e => e.entity_id === id);
      if (hit) use.push(this.knownLine("mute", t("knownAssist"), t("knownAssistYes", { list: this.esc(hit.assistants.map(a => this.expoAssistantName(a)).join(", ")) }), "knownSrcExposure"));
      else if ((expo.exposed_total || 0) <= (expo.exposed_entities || []).length) use.push(this.knownLine("mute", t("knownAssist"), t("knownAssistNo"), "knownSrcExposure"));
    }
    const areaId = item.area_id || device?.area_id, area = areaId ? this.findObject(`area:${areaId}`) : null;
    if (area) use.push(this.knownLine("mute", t("knownArea"), this.esc(area.name), "knownSrcScan"));
    // Rules and care
    const care = [this.knownLine(finding ? "warn" : "ok", t("finding"), finding ? `${this.pill(finding.classification)}<small>${t("certainty")}: ${Math.round(finding.confidence * 100)} %</small>` : t("noFinding"), "knownSrcRules")];
    if (finding?.ignored) care.push(this.knownLine("mute", t("knownIgnored"), t("knownIgnoredYes"), "knownSrcDecisions"));
    const quarantined = this.quarantineOf(id);
    if (quarantined) care.push(this.knownLine("warn", t("quarantine"), `${t("quarantineFact", { date: this.formatDate(quarantined.since), days: this.daysSince(quarantined.since) })}<span class="factaction">${this.releaseControl(quarantined)}</span>`, "knownSrcDecisions"));
    // History
    const mine = this.notesList().filter(n => n.target === key);
    const hist = [];
    if (mine.length) {
      const n = mine[0], vars = { n: this.formatNumber(mine.length), title: this.esc(n.title), date: this.esc(this.formatDate(n.at)) };
      hist.push(this.knownLine("mute", t("knownLog"), t(mine.length > 1 ? "knownLogLine" : "knownLogOne", vars), "knownSrcLog"));
    }
    const corr = finding ? this.corrLine(finding.key) : "";
    if (corr) hist.push(this.knownLine("mute", t("knownCorr"), this.esc(corr), "knownSrcCorr"));
    const note = item.status === "unavailable" && !finding && (this.data.meta.min_unavailable_days || 0) > 0 ? `<p class="factnote">${t("belowThreshold", { days: this.data.meta.min_unavailable_days })}</p>` : "";
    const needLoad = recorder && !this.storms?.available && !this.stormsError;
    const head = needLoad ? `<button class="btn" data-known-load="${this.esc(id)}" ${this.stormsLoading ? "disabled" : ""}>${t(this.stormsLoading ? "knownLoading" : "knownLoad")}</button>` : "";
    return `<section class="panel"><div class="panelhead"><div><h2>${t("knownTitle")}</h2><p>${t("knownHint")}</p></div>${head}</div><div class="known">${this.knownGroup("knownState", state)}${this.knownGroup("knownRecorder", rec)}${this.knownGroup("knownUse", use)}${this.knownGroup("knownCare", care)}${this.knownGroup("knownHistory", hist)}</div>${note}</section>`;
  }

  bindKnown(root) {
    root.querySelectorAll("[data-known-load]").forEach(el => el.onclick = () => this.knownLoadRecorder(el.dataset.knownLoad));
  }
}
