// How long the last scan took, phase by phase (Settings > Info): the first place to look when a scan is slow.
// Mixed into the panel in 99-register.js.
Object.assign(TEXT.de, {
  timingTitle: "Dauer des letzten Scans", timingHint: "Gesamt {total} s. Die längste Phase steht oben; bei einer großen Installation ist sie der erste Kandidat, wenn ein Scan langsam wird.",
  timingPhase_entities: "Entitäten lesen", timingPhase_devices: "Geräte, Integrationen und Apps", timingPhase_automations: "Automationen, Skripte und Szenen",
  timingPhase_dashboards: "Dashboards und Energie", timingPhase_tracking: "Beobachtungen, Statistik und Hilfsobjekte", timingPhase_analysis: "Auswertung der Befunde", timingPhase_finalizing: "Abschluss (Dateigrößen, Datenbank)",
});
Object.assign(TEXT.en, {
  timingTitle: "Duration of the last scan", timingHint: "{total} s in total. The longest phase comes first; on a large installation it is the first suspect when a scan gets slow.",
  timingPhase_entities: "Reading entities", timingPhase_devices: "Devices, integrations and apps", timingPhase_automations: "Automations, scripts and scenes",
  timingPhase_dashboards: "Dashboards and Energy", timingPhase_tracking: "Observations, statistics and helpers", timingPhase_analysis: "Evaluating the findings", timingPhase_finalizing: "Finishing (file sizes, database)",
});

class ScanTimingMixin {
  scanTimingCard() {
    const phases = Object.entries(this.data?.meta?.scan_timing || {}).filter(([, seconds]) => typeof seconds === "number").sort((a, b) => b[1] - a[1]);
    if (!phases.length) return "";
    const total = phases.reduce((sum, [, seconds]) => sum + seconds, 0), longest = Math.max(phases[0][1], 0.001);
    const seconds = value => `${this.formatNumber(Math.round(value * 10) / 10)} s`;
    const rows = phases.map(([phase, value]) => {
      const label = this.t(`timingPhase_${phase}`);
      return `<div class="row" data-scan-phase="${this.esc(phase)}"><span class="tile mute"><ha-icon icon="mdi:timer-outline"></ha-icon></span><span class="row-text"><strong>${this.esc(label === `timingPhase_${phase}` ? phase : label)}</strong><span class="bar" style="margin-top:4px"><i style="width:${Math.round((value / longest) * 100)}%"></i></span></span><span class="pill mute">${seconds(value)}</span></div>`;
    }).join("");
    return `<section class="panel"><div class="panelhead"><div><h2>${this.t("timingTitle")}</h2><p>${this.t("timingHint", { total: this.formatNumber(Math.round(total * 10) / 10) })}</p></div></div>${rows}</section>`;
  }
}
