// "Known about this entity": everything Housekeeper knows about one entity in one card, grouped, with the source of each line.
// It replaces the facts card for entities; the recorder values come on request (the same load as the recorder view). Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  knownTitleDevice: "Bekannt über dieses Gerät", knownTitleEntry: "Bekannt über diese Integration", knownTitleAutomation: "Bekannt über diese Automation", knownTitleScript: "Bekannt über dieses Skript",
  knownHintDevice: "Was Housekeeper aus Scan, Verlauf und Logbuch weiß. Zeilen ohne Wissen fehlen.", knownHintEntry: "Was Housekeeper aus Scan, Zuverlässigkeit und Recorder weiß. Zeilen ohne Wissen fehlen.", knownHintAuto: "Was Housekeeper aus Scan, Läufen und Beziehungen weiß. Zeilen ohne Wissen fehlen.",
  knownGroupDevice: "Gerät", knownGroupOrigin: "Herkunft", knownGroupScope: "Umfang", knownGroupBuild: "Aufbau",
  knownEntitiesState: "Zustand", knownEntitiesBad: "{bad} von {n} Entitäten nicht verfügbar", knownEntitiesAll: "Alle {n} Entitäten laufen", knownNoEntities: "Keine Entitäten",
  knownModel: "Modell", knownVia: "Angeschlossen über", knownEntities: "Entitäten", knownEntitiesHidden: "{n} versteckt oder deaktiviert", knownUsedViaEntities: "über die Entitäten des Geräts",
  knownAgain: "Wieder aufgetaucht", knownAgainText: "Wurde am {date} vergessen und ist wieder da", knownLife: "Lebenslauf", knownLifeText: "{n} Schritte, mehr im Reiter „Verlauf“", knownCreated: "Angelegt", knownModified: "Geändert",
  knownLoaded: "Zustand", knownAvail: "Verfügbarkeit", knownAvailText: "{pct} % in {days} Tagen", knownShared: "{n} gemeinsame Ausfälle, längster {longest}", knownKind: "Art", knownCustom: "Benutzerdefiniert", knownCore: "Kern", knownVersion: "Version {v}",
  knownScope: "Geräte, Entitäten", knownScopeText: "{d} Geräte · {e} Entitäten", knownScopeBad: "{n} nicht verfügbar", knownRecShare: "Anteil am Recorder", knownRecText: "mindestens {n} Einträge pro Tag", knownRecShareOf: "etwa {share} % aller Einträge",
  knownFindings: "Befunde", knownFindingsNone: "Keine offenen", knownFindingsOpen: "{n} offen",
  knownMode: "Zustand", knownModeText: "{state} · Modus „{mode}“", knownOn: "An", knownOff: "Aus", knownRuns: "Läufe", knownRunsText: "{runs} Läufe, {errors} mit Fehler", knownRunsCond: "Bedingung hielt in {n} Fällen an", knownDuration: "Dauer", knownDurationText: "im Mittel {mean}, höchstens {max}",
  knownStructure: "Struktur", knownStructureText: "{t} Auslöser, {c} Bedingungen, {a} Aktionen", knownStructureScript: "{a} Aktionen", knownBlueprint: "Herkunft", knownBlueprintText: "Blueprint „{name}“",
  knownRefs: "Verweist auf", knownRefsText: "{n} Objekte", knownRefsMissing: "davon {n} nicht vorhanden", knownCalledBy: "Aufgerufen von", knownLastTriggered: "Zuletzt ausgelöst",
  knownTitle: "Bekannt über diese Entität", knownHint: "Was Housekeeper aus Scan, Recorder, Freigaben und Logbuch weiß. Zeilen ohne Wissen fehlen.",
  knownLoad: "Recorder-Werte laden", knownLoading: "Lädt …",
  knownTimes: "Zeiten", knownState: "Zustand", knownRecorder: "Recorder", knownUse: "Nutzung", knownCare: "Regeln und Pflege", knownHistory: "Verlauf",
  knownSrcScan: "Scan", knownSrcRecorder: "Recorder", knownSrcRelations: "Beziehungen", knownSrcRules: "Regeln", knownSrcReliability: "Zuverlässigkeit", knownSrcLog: "Logbuch", knownSrcCorr: "Korrelation", knownSrcExposure: "Freigaben", knownSrcDecisions: "Entscheidungen", knownSrcJournal: "Journal", knownSrcRuns: "Läufe",
  knownRunning: "Zustand", knownDevice: "Gerät", knownAttrs: "Eigenschaften", knownUnit: "Einheit", knownClass: "Geräteklasse", knownStateClass: "Zustandsklasse",
  knownWriteRate: "Schreibrate", knownRate: "{n} Einträge pro Tag", knownRank: "Platz {n} der lautesten", knownShare: "etwa {share} % aller Einträge", knownExcluded: "Wird nicht aufgezeichnet (Recorder-Filter)", knownQuiet: "Nicht unter den {n} lautesten Entitäten",
  knownUsedIn: "Verwendet in", knownUsedNone: "Nirgends verwendet", knownAssist: "Für Assistenten", knownAssistYes: "Freigegeben für {list}", knownAssistNo: "Nicht freigegeben",
  knownArea: "Bereich", knownIgnored: "Entscheidung", knownIgnoredYes: "Der Befund ist ausgeblendet", knownLog: "Logbuch", knownLogLine: "{n} Einträge, zuletzt „{title}“ am {date}", knownLogOne: "„{title}“ am {date}", knownCorr: "Zeitlicher Zusammenhang",
});
Object.assign(TEXT.en, {
  knownTitleDevice: "Known about this device", knownTitleEntry: "Known about this integration", knownTitleAutomation: "Known about this automation", knownTitleScript: "Known about this script",
  knownHintDevice: "What Housekeeper knows from the scan, the history and the logbook. Lines without knowledge are left out.", knownHintEntry: "What Housekeeper knows from the scan, the reliability and the recorder. Lines without knowledge are left out.", knownHintAuto: "What Housekeeper knows from the scan, the runs and the relations. Lines without knowledge are left out.",
  knownGroupDevice: "Device", knownGroupOrigin: "Origin", knownGroupScope: "Scope", knownGroupBuild: "Structure",
  knownEntitiesState: "State", knownEntitiesBad: "{bad} of {n} entities unavailable", knownEntitiesAll: "All {n} entities are running", knownNoEntities: "No entities",
  knownModel: "Model", knownVia: "Connected via", knownEntities: "Entities", knownEntitiesHidden: "{n} hidden or disabled", knownUsedViaEntities: "through the entities of the device",
  knownAgain: "Came back", knownAgainText: "Was forgotten on {date} and is back", knownLife: "Life", knownLifeText: "{n} steps, more in the tab “History”", knownCreated: "Created", knownModified: "Modified",
  knownLoaded: "State", knownAvail: "Availability", knownAvailText: "{pct} % in {days} days", knownShared: "{n} shared outages, longest {longest}", knownKind: "Kind", knownCustom: "Custom", knownCore: "Core", knownVersion: "Version {v}",
  knownScope: "Devices, entities", knownScopeText: "{d} devices · {e} entities", knownScopeBad: "{n} unavailable", knownRecShare: "Share of the recorder", knownRecText: "at least {n} records a day", knownRecShareOf: "about {share} % of all records",
  knownFindings: "Findings", knownFindingsNone: "None open", knownFindingsOpen: "{n} open",
  knownMode: "State", knownModeText: "{state} · mode “{mode}”", knownOn: "On", knownOff: "Off", knownRuns: "Runs", knownRunsText: "{runs} runs, {errors} with an error", knownRunsCond: "The condition stopped it {n} times", knownDuration: "Duration", knownDurationText: "{mean} on average, {max} at most",
  knownStructure: "Structure", knownStructureText: "{t} triggers, {c} conditions, {a} actions", knownStructureScript: "{a} actions", knownBlueprint: "Origin", knownBlueprintText: "Blueprint “{name}”",
  knownRefs: "Refers to", knownRefsText: "{n} objects", knownRefsMissing: "{n} of them missing", knownCalledBy: "Called by", knownLastTriggered: "Last triggered",
  knownTitle: "Known about this entity", knownHint: "What Housekeeper knows from the scan, the recorder, the exposure and the logbook. Lines without knowledge are left out.",
  knownLoad: "Load recorder values", knownLoading: "Loading …",
  knownTimes: "Times", knownState: "State", knownRecorder: "Recorder", knownUse: "Use", knownCare: "Rules and care", knownHistory: "History",
  knownSrcScan: "Scan", knownSrcRecorder: "Recorder", knownSrcRelations: "Relations", knownSrcRules: "Rules", knownSrcReliability: "Reliability", knownSrcLog: "Logbook", knownSrcCorr: "Correlation", knownSrcExposure: "Exposure", knownSrcDecisions: "Decisions", knownSrcJournal: "Journal", knownSrcRuns: "Runs",
  knownRunning: "State", knownDevice: "Device", knownAttrs: "Properties", knownUnit: "Unit", knownClass: "Device class", knownStateClass: "State class",
  knownWriteRate: "Write rate", knownRate: "{n} records a day", knownRank: "Rank {n} of the loudest", knownShare: "about {share} % of all records", knownExcluded: "Not recorded (recorder filter)", knownQuiet: "Not among the {n} loudest entities",
  knownUsedIn: "Used in", knownUsedNone: "Used nowhere", knownAssist: "For assistants", knownAssistYes: "Exposed to {list}", knownAssistNo: "Not exposed",
  knownArea: "Area", knownIgnored: "Decision", knownIgnoredYes: "The finding is hidden", knownLog: "Logbook", knownLogLine: "{n} entries, latest “{title}” on {date}", knownLogOne: "“{title}” on {date}", knownCorr: "Connection in time",
});

class KnownMixin {
  // One line: tone dot, label, value (HTML), source tag. `tone` is ok, warn, red or mute.
  knownLine(tone, label, value, source) {
    const dot = { ok: "✓", warn: "!", red: "✕", mute: "·" }[tone] || "·";
    return `<div class="knline"><span class="kdot k-${tone}">${dot}</span><span class="kk">${label}</span><span class="kval">${value}</span><span class="ksrc">${this.t(source)}</span></div>`;
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

  knownLoadRecorder(id, type = "entity") {
    if (!this.storms && !this.stormsLoading) this.loadStorms();
    if (type === "entity" && !this.entityRec?.[id]?.data && !this.entityRec?.[id]?.loading) this.loadEntityRecorder(id);
  }

  // The groups of one entity as [titleKey, lines]; the card around them is knownCard.
  knownEntity(item, key) {
    const id = item.object_id, t = (k, v) => this.t(k, v);
    const when = value => `${this.esc(this.formatDate(value))}<small>${this.esc(this.relTime(value))}</small>`;
    const finding = this.data.findings.find(f => this.findingKey(f) === key);
    this.ensureExposure();
    // Times: the state, the stability and the device are in the diagnosis; the recorder numbers are in "In the recorder".
    const device = item.device_id ? this.findObject(`device:${item.device_id}`) : null;
    const state = [];
    if (item.status_since) state.push(this.knownLine("mute", t("since"), when(item.status_since), "knownSrcScan"));
    if (item.last_changed) state.push(this.knownLine("mute", t("propLastChanged"), when(item.last_changed), "knownSrcScan"), this.knownLine("mute", t("propLastReported"), when(item.last_reported || item.last_updated), "knownSrcScan"));
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
    if (item.mark) care.push(this.knownMarkLine(item));
    if (finding?.ignored) care.push(this.knownLine("mute", t("knownIgnored"), this.esc(finding.mark ? this.markLine(finding.mark) : this.decisionLabel(finding)), "knownSrcDecisions"));
    const quarantined = this.quarantineOf(id);
    if (quarantined) care.push(this.knownLine("warn", t("quarantine"), `${t("quarantineFact", { date: this.formatDate(quarantined.since), days: this.daysSince(quarantined.since) })}<span class="factaction">${this.releaseControl(quarantined)}</span>`, "knownSrcDecisions"));
    // History
    const hist = [this.knownHistoryLink(item, key)];
    const corr = finding ? this.corrLine(finding.key) : "";
    if (corr) hist.push(this.knownLine("mute", t("knownCorr"), this.esc(corr), "knownSrcCorr"));
    return [["knownTimes", state], ["knownUse", use], ["knownCare", care], ["knownHistory", hist]];
  }

  // The usage by type of several objects at once, each source counted once: "3 automations, 1 script".
  knownUsageOf(keys) {
    const sources = new Map();
    for (const key of keys) for (const e of this.edgesTo(key)) if (USAGE_RELATIONS.includes(e.relation)) sources.set(e.source, e.source.split(":")[0]);
    const counts = {};
    for (const type of sources.values()) counts[type] = (counts[type] || 0) + 1;
    return Object.entries(counts).map(([type, n]) => `${this.formatNumber(n)} ${this.t(type)}`).join(", ");
  }

  knownMarkLine(item) {
    return this.knownLine(item.mark_due ? "warn" : "mute", this.t("markTitle"), `${this.esc(this.t(`mark_${item.mark.kind}`))}<small>${this.esc(this.markLine(item.mark))}${item.mark_due ? ` · ${this.t("markDue")}` : ""}</small>`, "knownSrcDecisions");
  }

  // `runRow` adds the findings of the counted runs (overlap, failing, ...), which are not scan findings.
  knownFindingsLine(key, runRow = null) {
    const scan = this.data.findings.filter(f => !f.ignored && this.findingKey(f) === key);
    const names = [...scan.map(f => this.findingTitle(f)), ...(runRow?.findings || []).map(f => this.t((RUN_FINDINGS[f.kind] || ["rfLabelFailing"])[0]))];
    return this.knownLine(names.length ? "warn" : "ok", this.t("knownFindings"), names.length ? `${this.t("knownFindingsOpen", { n: names.length })}<small>${names.slice(0, 3).map(n => this.esc(n)).join(" · ")}</small>` : this.t("knownFindingsNone"), "knownSrcRules");
  }

  knownDevice(item, key) {
    const id = item.object_id, t = (k, v) => this.t(k, v);
    const ents = (this.data.objects || []).filter(o => o.object_type === "entity" && o.device_id === id);
    const bad = ents.filter(o => ["unavailable", "orphaned"].includes(o.status)).length, hidden = ents.filter(o => o.disabled_by || o.hidden_by).length;
    const life = this.life?.get(id);
    const state = [this.knownLine(!ents.length ? "mute" : bad ? "warn" : "ok", t("knownEntitiesState"), !ents.length ? t("knownNoEntities") : bad ? t("knownEntitiesBad", { bad, n: ents.length }) : t("knownEntitiesAll", { n: ents.length }), "knownSrcScan")];
    if (life?.unstable) state.push(this.knownLine(life.unstable === "flapping" ? "red" : "warn", t("stability"), `<span class="pill ${life.unstable === "flapping" ? "red" : "warn"}">${t(life.unstable === "flapping" ? "relFlapping" : "relUnstable")}</span>`, "knownSrcReliability"));
    const entries = (item.config_entry_ids || []).map(e => this.findObject(`config_entry:${e}`)).filter(Boolean);
    if (entries.length) state.push(this.knownLine("mute", t("integration"), entries.map(e => `${this.esc(e.name)}${e.state ? ` (${t(`cs_${e.state}`)})` : ""}`).join(", "), "knownSrcScan"));
    const dev = [];
    const model = [[item.manufacturer, item.model].filter(Boolean).join(" "), item.sw_version ? `${t("propFirmware")} ${item.sw_version}` : "", item.hw_version ? `${t("propHardware")} ${item.hw_version}` : ""].filter(Boolean).join(" · ");
    if (model) dev.push(this.knownLine("mute", t("knownModel"), this.esc(model), "knownSrcScan"));
    const area = item.area_id ? this.findObject(`area:${item.area_id}`) : null;
    if (area) dev.push(this.knownLine("mute", t("knownArea"), this.esc(area.name), "knownSrcScan"));
    const via = item.via_device_id ? this.findObject(`device:${item.via_device_id}`) : null;
    if (via) dev.push(this.knownLine("mute", t("knownVia"), this.esc(via.name), "knownSrcScan"));
    const use = [];
    if (ents.length) {
      const kinds = {}; ents.forEach(o => { kinds[o.object_id.split(".")[0]] = (kinds[o.object_id.split(".")[0]] || 0) + 1; });
      use.push(this.knownLine("mute", t("knownEntities"), `${this.formatNumber(ents.length)} (${Object.entries(kinds).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([d, n]) => `${n} ${this.esc(d)}`).join(", ")})${hidden ? `<small>${t("knownEntitiesHidden", { n: hidden })}</small>` : ""}`, "knownSrcRelations"));
      const used = this.knownUsageOf(ents.map(o => this.objectKey(o)));
      use.push(this.knownLine("mute", t("knownUsedIn"), used ? `${used}<small>${t("knownUsedViaEntities")}</small>` : t("knownUsedNone"), "knownSrcRelations"));
    }
    const care = [this.knownFindingsLine(key)];
    if (item.mark) care.push(this.knownMarkLine(item));
    const quarantined = this.quarantineOf(id);
    if (quarantined) care.push(this.knownLine("warn", t("quarantine"), `${t("quarantineFact", { date: this.formatDate(quarantined.since), days: this.daysSince(quarantined.since) })}<span class="factaction">${this.releaseControl(quarantined)}</span>`, "knownSrcDecisions"));
    const again = (this.data.recurring_devices || []).find(r => r.device_id === id);
    if (again) care.push(this.knownLine("warn", t("knownAgain"), t("knownAgainText", { date: this.esc(this.formatDate(again.forgotten_at)) }), "knownSrcJournal"));
    const hist = [this.knownHistoryLink(item, key)];
    return [["knownState", state], ["knownGroupDevice", dev], ["knownUse", use], ["knownCare", care], ["knownHistory", hist]];
  }

  knownEntry(item, key) {
    const id = item.object_id, t = (k, v) => this.t(k, v);
    const ents = (this.data.objects || []).filter(o => o.object_type === "entity" && o.config_entry_id === id);
    const bad = ents.filter(o => ["unavailable", "orphaned"].includes(o.status)).length;
    const st = item.disabled_by ? "disabled" : item.state || "not_loaded";
    const tone = st === "loaded" ? "ok" : st === "disabled" ? "mute" : ["setup_error", "migration_error", "failed_unload"].includes(st) ? "red" : "warn";
    const state = [this.knownLine(tone, t("knownLoaded"), `${st === "disabled" ? t("disabled") : t(`cs_${st}`)}${item.error ? `<small>${this.esc(item.error)}</small>` : ""}`, "knownSrcScan")];
    const row = this.reliability?.available ? this.reliabilityRow(item) : null;
    if (row && row.availability !== null && row.availability !== undefined) {
      const rtone = row.availability >= 99.5 ? "ok" : row.availability >= 95 ? "warn" : "red";
      state.push(this.knownLine(rtone, t("relFactAvail", { days: this.reliability.window_days }), `${this.formatNumber(row.availability)} %${row.shared_outages ? `<small>${t("knownShared", { n: row.shared_outages, longest: this.relDuration(row.longest_outage) })}</small>` : ""}`, "knownSrcReliability"));
    }
    const origin = [];
    const kind = [item.custom ? t("knownCustom") : t("knownCore"), item.integration_version ? t("knownVersion", { v: this.esc(item.integration_version) }) : ""].filter(Boolean).join(" · ");
    origin.push(this.knownLine("mute", t("knownKind"), kind, "knownSrcScan"));
    if (this.realTime(item.created_at)) origin.push(this.knownLine("mute", t("knownCreated"), `${this.esc(this.formatDate(item.created_at))}${this.realTime(item.modified_at) ? `<small>${t("knownModified")}: ${this.esc(this.formatDate(item.modified_at))}</small>` : ""}`, "knownSrcScan"));
    const scope = [this.knownLine("mute", t("knownScope"), `${t("knownScopeText", { d: this.formatNumber(item.device_count ?? 0), e: this.formatNumber(item.entity_count ?? ents.length) })}${bad ? `<small>${t("knownScopeBad", { n: bad })}</small>` : ""}`, "knownSrcRelations")];
    const used = this.knownUsageOf(ents.map(o => this.objectKey(o)));
    scope.push(this.knownLine("mute", t("knownUsedIn"), used || t("knownUsedNone"), "knownSrcRelations"));
    const rec = [];
    const storms = this.data.meta.recorder_available && this.storms?.available && !this.storms.busy ? this.storms : null;
    if (storms) {
      const mine = (storms.entities || []).filter(e => e.entry_id === id);
      if (mine.length) {
        const perDay = mine.reduce((sum, e) => sum + e.per_day, 0), share = storms.per_day ? Math.round((1000 * perDay) / storms.per_day) / 10 : null;
        rec.push(this.knownLine(share >= 10 ? "warn" : "mute", t("knownRecShare"), `${t("knownRecText", { n: this.formatNumber(perDay) })}${share !== null ? `<small>${t("knownRecShareOf", { share: this.formatNumber(share) })}</small>` : ""}`, "knownSrcRecorder"));
      }
    }
    const hist = [this.knownHistoryLink(item, key)];
    return [["knownState", state], ["knownGroupOrigin", origin], ["knownGroupScope", scope], ["knownRecorder", rec], ["knownCare", [this.knownFindingsLine(key, row)]], ["knownHistory", hist]];
  }

  knownAutomation(item, key) {
    const t = (k, v) => this.t(k, v);
    const script = item.object_type === "script";
    const state = [this.knownLine(item.status === "disabled" ? "mute" : "ok", t("knownMode"), t("knownModeText", { state: t(item.state === "on" || (script && item.status !== "disabled") ? "knownOn" : "knownOff"), mode: this.esc(item.mode || "single") }), "knownSrcScan")];
    const row = this.runs ? this.runsRow(item) : null;
    if (row) {
      state.push(this.knownLine(row.errors ? "warn" : "ok", t("knownRuns"), `${t("knownRunsText", { runs: `${this.formatNumber(row.runs)}${row.lower_bound ? "+" : ""}`, errors: this.formatNumber(row.errors) })}${row.conditions ? `<small>${t("knownRunsCond", { n: this.formatNumber(row.conditions) })}</small>` : ""}<small>${this.runsTrend(row)}</small>`, "knownSrcRuns"));
      state.push(this.knownLine("mute", t("knownDuration"), t("knownDurationText", { mean: this.runsDuration(row.mean_ms), max: this.runsDuration(row.max_ms) }), "knownSrcRuns"));
    }
    const build = [];
    if (item.action_count || item.trigger_count || item.condition_count) build.push(this.knownLine("mute", t("knownStructure"), script ? t("knownStructureScript", { a: item.action_count || 0 }) : t("knownStructureText", { t: item.trigger_count || 0, c: item.condition_count || 0, a: item.action_count || 0 }), "knownSrcScan"));
    if (item.blueprint) build.push(this.knownLine("mute", t("knownBlueprint"), t("knownBlueprintText", { name: this.esc(String(item.blueprint)) }), "knownSrcScan"));
    const use = [];
    const out = this.edgesFrom(key).filter(e => USAGE_RELATIONS.includes(e.relation) || e.relation === "REFERENCES");
    const targets = [...new Set(out.map(e => e.target))];
    const missing = [...new Set(this.data.findings.filter(f => this.findingKey(f) === key && f.rule_id.includes(".missing_")).map(f => f.affected_object))];
    if (targets.length) use.push(this.knownLine(missing.length ? "warn" : "mute", t("knownRefs"), `${t("knownRefsText", { n: this.formatNumber(targets.length) })}${missing.length ? `<small>${t("knownRefsMissing", { n: missing.length })}: ${this.esc(missing.slice(0, 3).join(", "))}</small>` : ""}`, "knownSrcRelations"));
    const by = {};
    for (const e of this.edgesTo(key)) { const type = e.source.split(":")[0]; if (["script", "scene", "automation"].includes(type)) by[type] = (by[type] || 0) + 1; }
    const called = Object.entries(by).map(([type, n]) => `${this.formatNumber(n)} ${t(type)}`).join(", ");
    if (called) use.push(this.knownLine("mute", t("knownCalledBy"), called, "knownSrcRelations"));
    const hist = [];
    if (item.last_triggered) hist.push(this.knownLine("mute", t("knownLastTriggered"), `${this.esc(this.formatDate(item.last_triggered))}<small>${this.esc(this.relTime(item.last_triggered))}</small>`, "knownSrcScan"));
    hist.push(this.knownHistoryLink(item, key));
    return [["knownState", state], ["knownGroupBuild", build], ["knownUse", use], ["knownCare", [this.knownFindingsLine(key)]], ["knownHistory", hist]];
  }

  // The card for one object: its groups, and the button for the recorder values where they matter.
  knownCard(item, key) {
    const type = item.object_type, t = (k, v) => this.t(k, v);
    if (type === "entity") this.ensureExposure();
    const groups = { entity: () => this.knownEntity(item, key), device: () => this.knownDevice(item, key), config_entry: () => this.knownEntry(item, key), automation: () => this.knownAutomation(item, key), script: () => this.knownAutomation(item, key) }[type]();
    const title = { entity: "knownTitle", device: "knownTitleDevice", config_entry: "knownTitleEntry", automation: "knownTitleAutomation", script: "knownTitleScript" }[type];
    const hint = { entity: "knownHint", device: "knownHintDevice", config_entry: "knownHintEntry", automation: "knownHintAuto", script: "knownHintAuto" }[type];
    const recorder = this.data.meta.recorder_available;
    const needLoad = recorder && type === "config_entry" && !this.storms?.available && !this.stormsError;
    const head = needLoad ? `<button class="btn" data-known-load="${this.esc(item.object_id)}" data-known-type="${type}" ${this.stormsLoading ? 'disabled aria-busy="true"' : ""}>${t(this.stormsLoading ? "knownLoading" : "knownLoad")}</button>` : "";
    const finding = type === "entity" ? this.data.findings.find(f => this.findingKey(f) === key) : null;
    const note = type === "entity" && item.status === "unavailable" && !finding && (this.data.meta.min_unavailable_days || 0) > 0 ? `<p class="factnote">${t("belowThreshold", { days: this.data.meta.min_unavailable_days })}</p>` : "";
    return `<section class="panel"><div class="panelhead"><div><h2>${t(title)}</h2><p>${t(hint)}</p></div>${head}</div><div class="known">${groups.map(([name, lines]) => this.knownGroup(name, lines)).join("")}</div>${note}</section>`;
  }

  bindKnown(root) {
    root.querySelectorAll("[data-known-load]").forEach(el => el.onclick = () => this.knownLoadRecorder(el.dataset.knownLoad, el.dataset.knownType));
  }
}
