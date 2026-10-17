// Texts of the panel polish: folds, groups and tabs in the cleanup view, filters of the quality view.
Object.assign(TEXT.de, {
 
  journalPlans: "Pläne", journalTabPlansHint: "Alle Pläne mit Ergebnis und Rückgängig.", journalTabDevicesHint: "Was Pläne entfernt oder gelöscht haben.", journalTabPurgesHint: "Ältere Löschungen, vor den Plänen.", purgesInJournal: "{n} ältere Löschungen von Statistiken stehen im Journal.", purgesInJournalLink: "Im Journal ansehen",
  cleanupTabNew: "Neuer Plan", cleanupTabJournal: "Pläne und Journal", cleanupTabPurges: "Gelöschte Statistiken",
  journalEmptyNext: "Noch kein Plan. Wähle unter „Neuer Plan“ Kandidaten aus und lege einen Plan an.",
  
  qualityNoneNext: "Keine Automationen gefunden. Sie erscheinen nach dem nächsten Scan.",
  mergeTooMany: "Höchstens 10 Pläne lassen sich zusammenführen.", mergeButton: "Ausgewählte zusammenführen ({count})", mergeSelect: "Plan zum Zusammenführen auswählen", mergeDone: "{count} Pläne zu einem zusammengeführt. Bewertung und Zahlen sind frisch berechnet.", mergeConflicts: "Zusammengeführt. {count} Objekte wurden nicht übernommen, weil sie in den Plänen verschieden angefragt waren: {list}",
  diagSecDims: "Bewertung", diagSecCriteria: "Erfolgskriterien", diagSecMore: "Abdeckung, Vergleich und Testlauf",
});
Object.assign(TEXT.en, {
 
  journalPlans: "Plans", journalTabPlansHint: "Every plan with result and undo.", journalTabDevicesHint: "What plans removed or deleted.", journalTabPurgesHint: "Older deletions, from before plans.", purgesInJournal: "{n} older deletions of statistics are noted in the Journal.", purgesInJournalLink: "See in the Journal",
  cleanupTabNew: "New plan", cleanupTabJournal: "Plans and journal", cleanupTabPurges: "Deleted statistics",
  journalEmptyNext: "No plan yet. Pick candidates under “New plan” and create one.",
  
  qualityNoneNext: "No automations found. They appear after the next scan.",
  mergeTooMany: "At most 10 plans can be merged.", mergeButton: "Merge selected ({count})", mergeSelect: "Select plan to merge", mergeDone: "{count} plans merged into one. Verdicts and numbers are freshly calculated.", mergeConflicts: "Merged. {count} objects were left out because the plans asked for them in different ways: {list}",
  diagSecDims: "Assessment", diagSecCriteria: "Success criteria", diagSecMore: "Coverage, comparison and test run",
});
Object.assign(TEXT.de, {
  recChoiceLabel: "Recorder-Daten", recChoice_keep: "Behalten", recChoice_statistics: "Statistik löschen", recChoice_states: "Statistik und Verlauf löschen", recChoiceDefault: "Standard für Recorder-Daten", recChoiceWarnOwn: "Gilt für Entitäten ohne eigene Wahl. Gelöschte Recorder-Daten lassen sich nur mit dem Backup zurückholen, auch wenn du das Entfernen rückgängig machst.", recOwnKeep: "Behalten", recOwnStats: "Statistik", recOwnStates: "+ Verlauf", recOwnStatesOnly: "Verlauf löschen", recOwnLock: "Daten bleiben, das Energie-Dashboard nutzt sie", recOwnHasStats: "mit Statistik", recOwnNoStats: "ohne Statistik", recSumStats: "{n} mit Statistik löschen", recSumStates: "{n} mit Statistik und Verlauf löschen", recSumKeep: "{n} behalten ihre Daten", recSumEnergy: "{n} Daten gesperrt (Energie)",
  recChoiceWarn: "Gilt für alle ausgewählten Entfernungen im Plan. Gelöschte Recorder-Daten lassen sich nur mit dem Backup zurückholen, auch wenn du das Entfernen rückgängig machst.",
  result_purge_failed: "Entfernt, Recorder-Daten nicht gelöscht",
});
Object.assign(TEXT.en, {
  recChoiceLabel: "Recorder data", recChoice_keep: "Keep", recChoice_statistics: "Delete statistics", recChoice_states: "Delete statistics and history", recChoiceDefault: "Default for recorder data", recChoiceWarnOwn: "Applies to entities without a choice of their own. Deleted recorder data can only be restored from the backup, even if you undo the removal.", recOwnKeep: "Keep", recOwnStats: "Statistics", recOwnStates: "+ History", recOwnStatesOnly: "Delete history", recOwnLock: "Data stays, the Energy dashboard uses it", recOwnHasStats: "with statistics", recOwnNoStats: "without statistics", recSumStats: "{n} delete statistics", recSumStates: "{n} delete statistics and history", recSumKeep: "{n} keep their data", recSumEnergy: "{n} data locked (Energy)",
  recChoiceWarn: "Applies to every removal in the plan. Deleted recorder data can only be restored from the backup, even if you undo the removal.",
  result_purge_failed: "Removed, recorder data not deleted",
});
