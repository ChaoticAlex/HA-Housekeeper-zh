// Texts for the findings that began together with an update or restart; merged into TEXT.
Object.assign(TEXT.de, {
  corrAfter: "Zeitlich zusammen mit: {what} ({when})", corrTile: "Nach Update neu", corrTileSub: "begannen zusammen mit einem Update", corrTitle: "Zeitlich zusammen mit Updates und Neustarts",
  sumGroupAll: "Gesamt", sumGroupUrgent: "Dringend", sumGroupTidy: "Aufräumen", corrShow: "{n} Befunde anzeigen",
  corrIncidents: "{n} Vorfälle", corrAlso: "Zusammen mit: {list}",
  corrHint: "Befunde, die zur selben Zeit begannen wie ein Update, ein Neustart oder ein Plan. Updates kurz nacheinander und der Neustart dabei sind ein Vorfall; ein Befund kann zu mehreren Vorfällen zählen. Das ist ein zeitlicher Zusammenhang, keine Ursache.",
  corr_ha_version: "Home-Assistant-Update {from} → {to}", corr_os_version: "Betriebssystem-Update {from} → {to}", corr_supervisor_version: "Supervisor-Update {from} → {to}", corr_entry_version: "Update von {domain} {from} → {to}", corr_start: "Neustart von Home Assistant", corr_plan: "Plan ausgeführt", corr_purge: "Statistiken gelöscht", corrCount: "{n} Befunde", corrReason: "{n}× {what}", corrSpan: "Begannen zwischen {first} und {last}.", corrMore: "{n} weitere sind hier nicht aufgeführt.",
});
Object.assign(TEXT.en, {
  corrAfter: "At about the same time as: {what} ({when})", corrTile: "New after update", corrTileSub: "began together with an update", corrTitle: "At about the same time as updates and restarts",
  sumGroupAll: "Total", sumGroupUrgent: "Urgent", sumGroupTidy: "Tidying up", corrShow: "Show {n} findings",
  corrIncidents: "{n} incidents", corrAlso: "Together with: {list}",
  corrHint: "Findings that began at the same time as an update, a restart or a plan. Updates shortly after one another and the restart beside them are one incident; a finding can belong to several incidents. This is a link in time, not a cause.",
  corr_ha_version: "Home Assistant update {from} → {to}", corr_os_version: "Operating system update {from} → {to}", corr_supervisor_version: "Supervisor update {from} → {to}", corr_entry_version: "Update of {domain} {from} → {to}", corr_start: "Home Assistant restart", corr_plan: "Cleanup plan run", corr_purge: "Statistics deleted", corrCount: "{n} findings", corrReason: "{n}× {what}", corrSpan: "Began between {first} and {last}.", corrMore: "{n} more are not listed here.",
});

Object.assign(TEXT.de, {
  viewCount: "{n} in dieser Ansicht", foldAll: "Alle aufklappen", foldNone: "Alle zuklappen",
  helpOpen: "Was die Zahlen auf dieser Seite bedeuten", helpClose: "Schließen", helpTitle: "Was du hier siehst",
  helpFindingT: "Befund", helpFinding: "Etwas ist jetzt auffällig, zum Beispiel ein ausgefallenes Gerät, ein Duplikat oder eine fehlende Referenz. Jedes Objekt zählt je Regel einmal.",
  helpFollowupsT: "Folgen", helpFollowups: "Fällt ein Gerät aus, ziehen seine Entitäten nach. Sie hängen als Folgen an der Ursache und zählen nicht als eigene Befunde.",
  helpWatchT: "Beobachtung nach Updates", helpWatch: "Nach einem Update von Home Assistant, Betriebssystem oder Supervisor scannt Housekeeper einige Stunden zusätzlich und vergleicht mit dem Stand davor. So siehst du, was seitdem nicht mehr läuft.",
  helpTogetherT: "Zeitlich zusammen", helpTogether: "Befunde, die zur selben Zeit begannen wie ein Update oder ein Neustart. Das ist ein Zusammenhang in der Zeit, keine Ursache.",
  helpNAllT: "Alle Befunde", helpNAll: "Befunde ohne ihre Folgen; eine Ursache mit Folgen zählt einmal. Die Kacheln darunter zählen dasselbe, nach Grund aufgeteilt, mit den Folgen klein dabei.",
  helpNTrendT: "+n in 5 Tagen", helpNTrend: "Veränderung über die letzten Tage, rot bei Anstieg. Die Kurve zählt die Folgen mit, die Zahl in der Kachel nicht.",
  helpNTabsT: "Offen, Bekannt, Ausgeblendet, Erledigt", helpNTabs: "Befunde nach Status: noch zu tun, bewusst behalten, nicht mehr gezeigt, inzwischen behoben. „Mit Folgen“ zählt die Ursachen, an denen Folgen hängen, nicht die Befunde.",
  helpNFollowT: "n Folgen", helpNFollow: "Befunde, die nur entstehen, weil eine Ursache ausfiel. „erklärt n Befunde“ nennt dieselben, „n Entitäten betroffen“ die Entitäten dahinter.",
  helpNLevelT: "Schweregrad", helpNLevel: "Wie sehr es zählt: nach Dauer, Abhängigkeiten und kritischen Objekten. Im Detail steht der Grund.",
  helpNCertT: "Sicherheit", helpNCert: "Wie sicher die Diagnose ist, nicht wie schlimm der Befund ist.",
  helpNSinceT: "Erkannt seit", helpNSince: "Wann der Befund zuerst auffiel; bei Ausfällen der Beginn der Störung.",
  helpNWatchedT: "n Objekte betroffen", helpNWatched: "Objekte, die seit dem Update nicht mehr laufen (Vergleich mit dem Scan davor). Das ist eine andere Zählung als die Befunde.",
  helpNIncidentsT: "n Vorfälle", helpNIncidents: "Updates kurz nacheinander und der Neustart dabei als eine Zeile. Ein Befund kann zu mehreren Vorfällen gehören; „n Befunde“ je Zeile zählt je Vorfall.",
  helpNOftenT: "Regelmäßig ausfallen", helpNOften: "Befunde auf Objekten, die oft ausfallen (instabil oder flatternd). Im Detail steht der Vorschlag für einen Vermerk.",
});

Object.assign(TEXT.en, {
  viewCount: "{n} in this view", foldAll: "Open all", foldNone: "Close all",
  helpOpen: "What the numbers on this page mean", helpClose: "Close", helpTitle: "What you see here",
  helpFindingT: "Finding", helpFinding: "Something is conspicuous right now, for example a failed device, a duplicate or a missing reference. Each object counts once per rule.",
  helpFollowupsT: "Follow-ups", helpFollowups: "When a device fails, its entities follow. They hang on the cause as follow-ups and do not count as findings of their own.",
  helpWatchT: "Watch after updates", helpWatch: "After an update of Home Assistant, the operating system or the Supervisor, Housekeeper scans a few extra hours and compares with the state before. It shows what has stopped working since.",
  helpTogetherT: "At the same time", helpTogether: "Findings that began at the same time as an update or a restart. This is a link in time, not a cause.",
  helpNAllT: "All findings", helpNAll: "Findings without their follow-ups; a cause with follow-ups counts once. The tiles below count the same, split by reason, with the follow-ups small beside them.",
  helpNTrendT: "+n in 5 days", helpNTrend: "Change over the last days, red when it rises. The line counts the follow-ups, the number in the tile does not.",
  helpNTabsT: "Open, Known, Hidden, Done", helpNTabs: "Findings by status: still to do, kept on purpose, no longer shown, mended since. “With follow-ups” counts the causes that have follow-ups, not the findings.",
  helpNFollowT: "n follow-ups", helpNFollow: "Findings that only exist because a cause failed. “explains n findings” names the same ones, “n entities affected” the entities behind them.",
  helpNLevelT: "Severity", helpNLevel: "How much it matters: by duration, dependencies and critical objects. The detail page names the reason.",
  helpNCertT: "Certainty", helpNCert: "How sure the diagnosis is, not how bad the finding is.",
  helpNSinceT: "Detected since", helpNSince: "When the finding first showed up; for outages, the start of the fault.",
  helpNWatchedT: "n objects affected", helpNWatched: "Objects that have stopped working since the update (compared with the scan before). This counts differently from findings.",
  helpNIncidentsT: "n incidents", helpNIncidents: "Updates shortly after one another and the restart beside them as one row. A finding can belong to several incidents; “n findings” per row counts per incident.",
  helpNOftenT: "Fail regularly", helpNOften: "Findings on objects that fail often (unstable or flapping). The detail page offers a mark.",
});
