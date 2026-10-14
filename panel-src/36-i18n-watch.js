// Texts for the watch after updates; merged into TEXT.
Object.assign(TEXT.de, {
  watchTitle: "Beobachtung nach Updates", watchHint: "Nach einem Update scannt Housekeeper einige Stunden lang zusätzlich und vergleicht mit dem Stand vor dem Neustart. Das zeigt, was seither nicht mehr läuft: ein zeitlicher Zusammenhang, keine Ursache.",
  watchBand: "Beobachtung nach {what}: noch {hours} Std., bisher {n} Objekte betroffen", watchBandWait: "Beobachtung nach {what}: noch {hours} Std. Die erste Auswertung folgt 30 Minuten nach dem Neustart.",
  watchV_worse: "Verschlechtert", watchV_stable: "Stabil", watchV_transient: "Vorübergehend", watchV_unknown: "Unbekannt", watchV_pending: "Läuft",
  watchBefore: "Stand davor: Scan vom {when}", watchNoBefore: "Vor dem Neustart gab es keinen Scan, ein Vergleich ist nicht möglich.",
  watchUnread: "Eine Quelle konnte nicht gelesen werden. Was dort fehlt, gilt als unbekannt, nicht als in Ordnung.",
  watchNew: "Seitdem ausgefallen ({n})", watchFixed: "Wieder in Ordnung ({n})", watchTransient: "Kurz gestört, jetzt wieder in Ordnung ({n})", watchNewFindings: "Neue Befunde seit dem Update: {n}",
  watchNone: "Keine Auffälligkeiten.", watchSamples: "{n} Messungen", watchEnded: "beendet {when}", watchMore: "{n} weitere sind hier nicht aufgeführt.",
  optWatchTitle: "Beobachtung nach Updates", optWatchHint: "Wie viele Stunden nach einem Update zusätzlich gescannt und mit dem Stand davor verglichen wird. 0 schaltet die Beobachtung aus.",
});
Object.assign(TEXT.en, {
  watchTitle: "Watch after updates", watchHint: "After an update Housekeeper scans a few extra times and compares with the state before the restart. It shows what has stopped working since: a link in time, not a cause.",
  watchBand: "Watching after {what}: {hours} h left, {n} objects affected so far", watchBandWait: "Watching after {what}: {hours} h left. The first check comes 30 minutes after the restart.",
  watchV_worse: "Worse", watchV_stable: "Stable", watchV_transient: "Temporary", watchV_unknown: "Unknown", watchV_pending: "Running",
  watchBefore: "State before: scan of {when}", watchNoBefore: "There was no scan before the restart, so there is nothing to compare with.",
  watchUnread: "A source could not be read. What is missing there counts as unknown, not as fine.",
  watchNew: "Failed since ({n})", watchFixed: "Working again ({n})", watchTransient: "Briefly disturbed, fine now ({n})", watchNewFindings: "New findings since the update: {n}",
  watchNone: "Nothing unusual.", watchSamples: "{n} checks", watchEnded: "ended {when}", watchMore: "{n} more are not listed here.",
  optWatchTitle: "Watch after updates", optWatchHint: "For how many hours after an update Housekeeper scans extra and compares with the state before. 0 switches the watch off.",
});
