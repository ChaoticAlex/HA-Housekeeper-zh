// The texts of renaming entity IDs with their references (plan states, reasons, checks); the form is in 71-detail-edit.js and 74-policy-row.js.
Object.assign(TEXT.de, {
  state_rename: "Umbenennen mit Verweisen",
  reason_not_registered: "Die Entität steht nicht in der Registry und lässt sich nicht umbenennen.", reason_bad_new_id: "Die neue ID ist ungültig oder hat eine andere Domain.", reason_target_taken: "Die neue ID ist schon vergeben.",
  reason_rename_unwritable: "Ein Verweis steht in einer Quelle, die Housekeeper nicht schreiben darf (zum Beispiel ein Paket). Er würde brechen.", reason_rename_templates: "Eine Vorlage nennt die ID als Text. Sie würde brechen und muss von Hand angepasst werden.",
  check_entity_renamed: "Neue ID ist da, alte ist weg", confirmedSummaryRename: "{count} Entitäten bekommen eine neue ID, Verweise werden umgeschrieben. Rückgängig ist möglich, solange die Dateien unverändert sind.", result_renamed: "Umbenannt",
  abort_rename_failed: "Home Assistant konnte die ID nicht ändern; die Dateien wurden zurückgesetzt.", confirmWordRename: "UMBENENNEN",
});
Object.assign(TEXT.en, {
  state_rename: "Rename with references",
  reason_not_registered: "The entity is not in the registry and cannot be renamed.", reason_bad_new_id: "The new ID is invalid or has another domain.", reason_target_taken: "The new ID is taken already.",
  reason_rename_unwritable: "A reference sits in a source Housekeeper may not write (a package, for example). It would break.", reason_rename_templates: "A template names the ID as text. It would break and has to be changed by hand.",
  check_entity_renamed: "New ID exists, old one is gone", confirmedSummaryRename: "{count} entities get a new ID, references are rewritten. Undo works while the files are unchanged.", result_renamed: "Renamed",
  abort_rename_failed: "Home Assistant could not change the ID; the files were put back.", confirmWordRename: "RENAME",
});
