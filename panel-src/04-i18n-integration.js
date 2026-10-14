// Texts for the integration detail page; merged into TEXT.
Object.assign(TEXT.de, {
  originKindCore: "Core", originKindCustom: "Custom", invOfCore: "davon Core", invOfCustom: "davon Custom", allOrigins: "Alle Herkünfte", helperKind: "Helfer", usedByCol: "Verwendet von", changedCol: "Zuletzt geändert", helperIdleLabel: "Nutzung", helperIdleAny: "Alle Helfer", helperIdleOpt: "Vermutlich ungenutzt, {days} Tage unverändert", helperIdleHint: "Nur ein Hinweis: Diese Helfer werden in dem, was Housekeeper liest (Automationen, Skripte, Szenen, Dashboards, Gruppen), nicht verwendet. Dashboards außerhalb des Scans, Apps und YAML können sie trotzdem nutzen.",
  ignored: "Ignoriert", integrationCard: "Integration", integrationName: "Integration", origin: "Herkunft", originBuiltIn: "In Home Assistant enthalten", originCustom: "Benutzerdefiniert · {path}{version}",
  entrySource: "Eingerichtet über", entryError: "Fehlermeldung", entryId: "Eintrags-ID", entryUniqueId: "Eindeutige ID", entryCreated: "Angelegt", entryModified: "Geändert", entryEntities: "Entitäten", entryDevices: "Geräte",
  entryDocs: "Dokumentation", entryHaPath: "Pfad in Home Assistant", noneValue: "keine",
  src_user: "Manuell hinzugefügt", src_import: "Aus der YAML-Konfiguration übernommen", src_ignore: "Ignorierte Entdeckung", src_system: "System", src_discovery: "Automatisch entdeckt ({source})", src_reauth: "Erneute Anmeldung", src_reconfigure: "Neu konfiguriert",
  cause_entry_ignored: "Diese Integration wurde nie eingerichtet: Du hast eine automatisch entdeckte Instanz ausdrücklich ignoriert. Das ist kein Fehler, und es gibt dazu keine Entitäten.",
  hint_entry_ignored: "Möchtest du sie doch nutzen, öffne in Home Assistant Einstellungen → Geräte & Dienste, zeige die ignorierten Einträge an und wähle „Hinzufügen“. Sonst kannst du den Eintrag dort löschen.",
  cause_entry_problem_error: "Die Integration ist nicht geladen ({state}). Meldung: {error}",
});
Object.assign(TEXT.en, {
  originKindCore: "Core", originKindCustom: "Custom", invOfCore: "of which core", invOfCustom: "of which custom", allOrigins: "All origins", helperKind: "Helpers", usedByCol: "Used by", changedCol: "Last changed", helperIdleLabel: "Use", helperIdleAny: "All helpers", helperIdleOpt: "Probably unused, unchanged for {days} days", helperIdleHint: "A hint only: nothing Housekeeper reads (automations, scripts, scenes, dashboards, groups) uses these helpers. Dashboards outside the scan, apps and YAML may still use them.",
  ignored: "Ignored", integrationCard: "Integration", integrationName: "Integration", origin: "Origin", originBuiltIn: "Included with Home Assistant", originCustom: "Custom · {path}{version}",
  entrySource: "Set up via", entryError: "Error message", entryId: "Entry ID", entryUniqueId: "Unique ID", entryCreated: "Created", entryModified: "Modified", entryEntities: "Entities", entryDevices: "Devices",
  entryDocs: "Documentation", entryHaPath: "Path in Home Assistant", noneValue: "none",
  src_user: "Added manually", src_import: "Imported from the YAML configuration", src_ignore: "Ignored discovery", src_system: "System", src_discovery: "Discovered automatically ({source})", src_reauth: "Re-authentication", src_reconfigure: "Reconfigured",
  cause_entry_ignored: "This integration was never set up: you explicitly ignored an automatically discovered instance. This is not an error, and it has no entities.",
  hint_entry_ignored: "If you want to use it after all, open Settings → Devices & services in Home Assistant, show the ignored entries and choose “Add”. Otherwise you can delete the entry there.",
  cause_entry_problem_error: "The integration is not loaded ({state}). Message: {error}",
});
