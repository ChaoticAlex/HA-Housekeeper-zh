# HA Housekeeper: Code-, Integrations- und UI-Review

Stand: 13. Oktober 2026

## Kurzfazit

Die Oberfläche ist gestalterisch weitgehend konsistent. Navigation, Typografie, Karten und Abstände ergeben über die geprüften Ansichten hinweg ein zusammengehöriges Gesamtbild. Alle 14 konkreten Befunde sind inzwischen im Code korrigiert. Von den vorrangigen Ausbauideen ist die Beobachtung wichtiger Hausfunktionen als **Hausmonitor** umgesetzt; die **Beobachtung nach Updates** bleibt offen.

✅ kennzeichnet bereits behobene Befunde (Stand der Korrekturen siehe unten).

**P1** bezeichnet verlorene oder irreführende Information beziehungsweise einen unterbrochenen wichtigen Ablauf. **P2** steht für spürbare Fehlbedienung oder falsche Rückmeldung. **P3** betrifft Orientierung und Komfort. Die Fundstellen und Empfehlungen stehen in den folgenden Abschnitten.

| Priorität | Befund | Bereich |
| --- | --- | --- |
| P1 | ✅ Teilfehler bei Sammelentscheidungen verlieren Auswahl und Formular (behoben) | Workflow |
| P1 | ✅ Planüberwachung endet nach einem einzelnen Statusfehler (behoben) | Workflow |
| P1 | ✅ Die elfte gespeicherte Ansicht ersetzt still eine ältere (behoben) | Bedienung |
| P1 | ✅ Mobile Tabellen zeigen Werte ohne Spaltenbezeichnungen (behoben) | Darstellung |
| P1 | ✅ Die Zugriffsübersicht kann einen offenen Webhook übersehen (behoben) | Datenqualität |
| P1 | ✅ Reparaturhinweise können Integrationsfehler als nicht verfügbare Entitäten melden (behoben) | Integration |
| P2 | ✅ Fehlgeschlagener Planabbruch gibt keine Rückmeldung (behoben) | Workflow |
| P2 | ✅ Deaktivierte Automationen werden als offene Webhooks gezählt (behoben) | Datenqualität |
| P2 | Reine Sortierung lässt sich nicht als Ansicht speichern | Bedienung |
| P2 | ✅ Bestätigungsdialoge führen den Tastaturfokus nicht vollständig (behoben) | Bedienung |
| P2 | ✅ Deaktivierte Buttons sehen nach laufender Arbeit aus (behoben) | Darstellung |
| P2 | ✅ Einige Statusfarben folgen dem Theme nicht (behoben) | Darstellung |
| P3 | ✅ Nach Seitenwechseln langer Listen fehlt die Orientierung (behoben) | Bedienung |
| P3 | ✅ Listensuche hat keine dauerhafte zugängliche Bezeichnung (behoben) | Bedienung |

## Stand der Korrekturen

Am 12. Oktober 2026 sind die Befunde 1, 2, 3, 4, 5, 6, 7, 8, 12, 13 und 14 behoben; am 13. Oktober 2026 auch 9, 10 und 11. Damit sind alle 14 Befunde im Code korrigiert. Umgesetzt sind außerdem die Scan-Gesundheit (Technische Erweiterungen 1), die Prüfabdeckung (2), das Ende eines Befunds (Featureidee 5) und der Hausmonitor (Featureidee 1). Die Event-Entität aus Featureidee 3 ist für Hausmonitor-Zustandswechsel vorhanden; der Scan-Knopf bleibt offen. Teilweise umgesetzt sind die Datenhaltung (nur die lesende Übersicht) und der Teil „Ordnerlauf wiederverwenden, Phasenzeiten zeigen“ des Laufzeitbudgets (3). Nicht umgesetzt sind einstellbare Aufbewahrung, Löschen und `runtime_data`.

| Befund | Änderung |
| --- | --- |
| 12 Offener Webhook fehlt | `webhook_triggers` (`access.py`) wertet alle Webhook-Trigger einer Automation aus. Die Zeile gilt als „von außen erreichbar“, sobald ein Trigger offen ist; die Methoden aller Trigger werden vereinigt. |
| 13 Deaktivierte Automationen als offen | Die Zugriffsansicht (`73-system.js`) zählt nur aktive Automationen als „offen“. Deaktivierte tragen das Etikett „deaktiviert“ und eine graue Erreichbarkeits-Pille. |
| 5 Planüberwachung | `pollPlan` (`18-cleanup.js`) bricht bei einem Statusfehler nicht mehr ab. Es meldet einmal, dass der Status nicht abrufbar ist, wartet länger (bis 5 s) und gibt erst nach 15 Fehlern in Folge auf. |
| 6 Planabbruch | `cancelPlan` meldet einen Fehler und weist darauf hin, dass bereits ausgeführte Schritte nicht zurückgenommen werden. |
| 4 Sammelaktionen | `runBulk` (`54-finding-status.js`) sendet je Befund einzeln. Erfolgreiche verlassen die Auswahl, fehlgeschlagene bleiben ausgewählt, das Formular bleibt offen, die Meldung lautet „x von y erledigt, k fehlgeschlagen“. Ein neuer Versuch sendet nur die übrigen. |
| 7 Gespeicherte Ansichten | `commitView` (`13-lists.js`) stoppt bei zehn Ansichten mit einem Hinweis, statt die letzte zu ersetzen. Derselbe Name überschreibt weiterhin die eigene Ansicht. |
| 2 Deaktivierte Buttons | Gesperrte Buttons haben `cursor:not-allowed` und drehen nicht mehr. Cursor und Drehung gelten nur bei `aria-busy="true"`; 19 Stellen mit Busy-/Loading-Flags, der Scan-Knopf und der Refresh-Knopf setzen das Attribut. Gesperrte Buttons mit zusätzlicher Bedingung (zum Beispiel „oder kein Ziel gewählt“) drehen nicht. |
| 3 Themefarben | `--hk-ok` und `--hk-warn` sind durch `--hk-green` und `--hk-amber` ersetzt. |
| 1 Mobile Tabellen | „Nach Objekttyp“ (auch die Zeilen „Alle“ und „Weitere“) und die Backup-Liste tragen `data-label` je Zelle. |
| Scan-Gesundheit | Neues Modul `scan_health.py` speichert letzten Versuch, letzten Erfolg, letzten Fehler, Phase, Fehlerklasse und Fehlschläge in Folge, auch über einen Neustart. Der Zustand ist `ok`, `stale` (kein Erfolg seit dem Dreifachen des Scanintervalls, mindestens 6 Stunden), `failed` oder `preliminary`. Ein Band im Panel erscheint nur bei `failed` und `stale`. Der neue Diagnose-Sensor „Scan-Zustand“ zeigt den Zustand ohne Fehlertext. Ein Reparaturhinweis erscheint bei `stale` oder nach drei Fehlern in Folge und endet beim nächsten Erfolg. Ein stündlicher Check erkennt auch einen Scan, der nie kommt. |
| Ende eines Befunds | `diff_checkpoints` (`history.py`) zählt einen verschwundenen Befund nur dann als behoben, wenn sein Objekt noch da ist, die Quelle gelesen wurde und die Einstellung der Regel gleich blieb. Sonst steht er in der Rubrik „Ohne Reparatur beendet“ mit dem Grund „Objekt entfernt“, „nicht geprüft“ (Dashboards, Energie, Apps), „Einstellung geändert“ oder „Grund unbekannt“. Der Checkpoint speichert dafür die drei Einstellungen. Ausgeblendete Befunde waren nie fälschlich „behoben“ und brauchen keinen Grund. |
| Datenhaltung (Übersicht) | `storage_sizes` (`inventory.py`) liest alle Dateien `ha_housekeeper.*` mit Größe und Änderungszeit; „Was Housekeeper speichert“ (`17-settings.js`) zeigt sie gruppiert mit Zweck, Größe und Gesamtgröße, ohne Inhalte. Löschen und einstellbare Aufbewahrung sind bewusst nicht umgesetzt. |
| 8 Reine Sortierung | `lvState` (`13-lists.js`) merkt sich die Standardsortierung; „Ansicht speichern“ erscheint, sobald Suche, Filter, Sortierung oder Richtung von der gewählten Ansicht beziehungsweise vom Standard abweichen. |
| Prüfabdeckung | `scan_coverage.py` meldet je Quelle (Register, Automationen, Dashboards, Energie, Apps, Statistik, Datenbank) gelesen, teilweise, übersprungen, nicht vorhanden oder unbekannt mit Grundcode; Übersichtszeile, Liste in Einstellungen, Info, Sensorattribut `unread_sources`; Objekte nicht gelesener Quellen zählen im Vergleich weder als neu noch als entfernt. |
| Laufzeit | `_folder_walk` (`system_usage.py`) verwendet den Ordnerlauf 5 Minuten wieder (Mindestabstand 30 s für „Aktualisieren“); Einstellungen, Info zeigt die Dauer je Scan-Phase. |
| 14 Reparaturhinweise | `issues.py` ordnet nur noch `broken_reference`, `orphaned` und `unavailable` einer Kategorie zu. Alle anderen Arten, auch `problem`, bleiben Befunde im Panel. |
| 9 Dialogfokus | `bindModalFocus` (`90-panel.js`) setzt den Hintergrund auf `inert`, hält Tab und Shift+Tab im obersten Dialog und stellt nach dem Schließen den Fokus zum Auslöser wieder her. |
| 10 Listenpagination | `focusListPage` (`90-panel.js`) scrollt nach dem Seitenwechsel zum betroffenen Listenbereich und fokussiert ihn mit einer Seitenansage. |
| 11 Listensuche | Die gemeinsame Suche (`13-lists.js`) besitzt ein dauerhaftes `aria-label` in Deutsch und Englisch. |

Tests: Der Webhook-Test in `tests/test_access.py` enthält jetzt eine Automation mit einem lokalen und einem späteren offenen Trigger. Neu ist `test_repairs_hints_only_cover_entity_and_reference_findings` in `tests/test_homeassistant_runtime.py`, dazu Panel-Tests für Sammelaktion, volle Ansichtenliste und das Scan-Band. Für die beiden Vorschläge kommen `test_scan_health_tells_a_failed_and_an_old_scan_from_a_good_one` und zwei Diff-Tests in `test_history.py` dazu. Am 13. Oktober kamen Panel-Tests für Suchbezeichnung, Pagination und Dialogfokus hinzu; `node --test tests/panel.test.mjs` besteht mit 249 Tests. Die Python-Tests konnten lokal nicht ausgeführt werden (`homeassistant` und `pytest` fehlen); die Webhook-Logik wurde einzeln mit Beispieldaten geprüft, die Reparaturzuordnung nur auf Syntax. Die neuen Fokus- und Scrollabläufe wurden nicht in einer laufenden Home-Assistant-Oberfläche geprüft.

## Dringlichkeit

Die Prüfung ergab **keinen bestätigten akuten Sicherheitsvorfall und keinen nachgewiesenen irreversiblen Verlust von Home-Assistant-Konfiguration oder Recorder-Daten**. Die P1-Kennzeichnung beschreibt hier mögliche Fehlentscheidungen durch irreführende Anzeigen, verlorene Eingaben oder unterbrochene wichtige Abläufe; sie ist keine Aussage über einen bereits eingetretenen Notfall. Die Auswirkungen wurden aus dem Quellcode abgeleitet und sollten in einer laufenden Home-Assistant-Instanz nachvollzogen werden.

**Zeitnah vor dem nächsten Release korrigieren:**

1. ✅ **Offene Webhooks vollständig anzeigen (behoben).** Bei mehreren Triggern kann ein von außen erreichbarer Trigger übersehen werden. Das betrifft eine sicherheitsrelevante Entscheidung anhand der Übersicht (Befund 12).
2. ✅ **Laufende Pläne nach einem Statusfehler weiter überwachen (behoben).** Ein einzelner Abfragefehler darf die Fortschrittsanzeige nicht dauerhaft beenden, während der Plan auf dem Server weiterlaufen kann; auch ein fehlgeschlagener Abbruch braucht Rückmeldung (Befunde 5 und 6).
3. ✅ **Teilfehler bei Sammelaktionen nachvollziehbar behandeln (behoben).** Auswahl und Formular für fehlgeschlagene Einträge erhalten und erfolgreiche Einträge gesondert bestätigen (Befund 4).

**Im selben Korrekturdurchgang:** ✅ Reparaturhinweise richtig zuordnen (Befund 14, behoben) und das stille Überschreiben einer gespeicherten Ansicht verhindern (Befund 7, behoben). Beides kann Nutzer in die Irre führen beziehungsweise eine persönliche Einstellung ohne Rückfrage entfernen.

## Darstellung und visuelle Zustände

### ✅ 1. Mobile Tabellen verlieren ihren Kontext

**Priorität: P1 – sichtbar und inhaltlich relevant**

Die allgemeine Responsive-Regel in `panel-src/12-styles.js` wandelt Tabellen unterhalb von 860 px in vertikale Kartenzeilen um:

- Der Tabellenkopf wird ausgeblendet.
- Jede Tabellenzeile wird zum Block.
- Die ursprünglichen Spalten werden untereinander dargestellt.
- Die Bezeichnung einer Zelle wird aus ihrem `data-label` erzeugt.

Das funktioniert bei der eigentlichen Inventarliste, weil deren Zellen beispielsweise so erzeugt werden:

```html
<td data-label="Status">…</td>
```

Die Tabelle „Nach Objekttyp“ verwendet diese Attribute dagegen nicht. Mobil sieht eine Zeile deshalb ungefähr so aus:

```text
Entität
97   80,2 %
12
12
```

Aus der Anzeige geht nicht mehr hervor, dass die Werte für „Anzahl“, „Anteil“, „Nicht verfügbar“ und „Verwaist“ stehen. Der ausgeblendete Tabellenkopf war die einzige Quelle dieser Information.

#### Betroffene Stellen

- Responsive Tabellenregeln: `panel-src/12-styles.js`, ungefähr Zeile 122
- Inventarzusammenfassung: `panel-src/19-inventory.js`, ungefähr Zeile 128
- Gesamtsumme der Inventartabelle: `panel-src/19-inventory.js`, ungefähr Zeile 130
- Backup-Tabelle: `panel-src/25-backup.js`, ungefähr Zeile 87

Bei der Backup-Tabelle entsteht mobil dasselbe Problem:

```text
09.10.2026, 19:24
900 MB
hassio.local
Nein
```

Ohne Überschriften ist „Nein“ nicht eindeutig als „Verschlüsselt: Nein“ zu verstehen.

#### Empfohlene Lösung

Es gibt zwei geeignete Varianten:

1. Jede relevante Tabellenzelle erhält ein `data-label`. Das entspricht dem bereits vorhandenen Muster und wäre die kleinste Änderung.
2. Kompakte Statistiktabellen wie „Nach Objekttyp“ erhalten eine eigene mobile Darstellung.

Eine mögliche Darstellung wäre:

```text
Entität                         97
Anteil                      80,2 %
Nicht verfügbar                 12
Verwaist                        12
```

Für diese Übersicht wäre eine kleine Grid-Legende wahrscheinlich lesbarer als das generische Tabellen-zu-Karten-Verhalten.

Zusätzlich sollte die Inventarkarte mobil kompakter werden. Aktuell benötigt die Kombination aus Donut und einzeln gestapelten Tabellenzellen sehr viel vertikalen Raum, bevor die eigentliche Inventarliste beginnt.

### ✅ 2. „Deaktiviert“ wird visuell mit „Lädt gerade“ gleichgesetzt

**Priorität: P2 – irreführendes Feedback**

Die globale Button-Regel in `panel-src/12-styles.js` setzt für jeden deaktivierten Button:

```css
.btn[disabled] {
  opacity: .6;
  cursor: wait;
}
```

Zusätzlich wird jedes Icon in einem deaktivierten Button gedreht:

```css
.btn[disabled] ha-icon {
  animation: hk-spin 1s linear infinite;
}
```

Das ist nur korrekt, wenn ein Button wegen eines laufenden Vorgangs gesperrt ist. Viele Buttons sind jedoch aus anderen Gründen deaktiviert:

- Es wurde keine Zeile ausgewählt.
- Ein Formular ist noch unvollständig.
- Das Bestätigungswort wurde noch nicht eingegeben.
- Für „Zusammenführen“ wurden noch nicht mindestens zwei Pläne ausgewählt.
- Es wurde noch keine gültige Nachfolger-Entität gewählt.

Ein deutliches Beispiel sind die Sammelaktionen der Befundliste in `panel-src/15-findings.js`, ungefähr Zeile 153. Bei null ausgewählten Befunden sind „Zurückstellen“, „Label ergänzen“ und „Ausgewählte ausblenden“ deaktiviert. Der Wartecursor behauptet hier aber implizit, dass die jeweilige Aktion bereits läuft.

Noch problematischer ist die automatische Rotation bei deaktivierten Icon-Buttons. Ein gesperrtes „Neu laden“- oder „Wiederholen“-Symbol sieht dadurch wie ein aktiver Ladevorgang aus, selbst wenn lediglich Voraussetzungen fehlen.

#### Empfohlene Lösung

Der neutrale deaktivierte Zustand sollte wieder neutral sein:

```css
.btn[disabled] {
  opacity: .6;
  cursor: not-allowed;
}
```

Alternativ kann der Standardcursor beibehalten werden, wenn ein Button nur auf eine noch fehlende Auswahl wartet.

Die Ladeanimation sollte an einen expliziten Zustand gekoppelt werden:

```css
.btn.loading ha-icon,
.loading ha-icon {
  animation: hk-spin 1s linear infinite;
}
```

Semantisch noch sauberer wäre ein Attribut wie `aria-busy="true"`:

```css
.btn[aria-busy="true"] ha-icon {
  animation: hk-spin 1s linear infinite;
}
```

Damit wären drei Zustände klar voneinander getrennt:

- nicht verfügbar,
- noch nicht bereit,
- läuft gerade.

### ✅ 3. Ein Teil der Statusfarben folgt dem gewählten Theme nicht

**Priorität: P2 – Konsistenzproblem bei Farbschemata**

Das Theme definiert in `panel-src/11-theme.js` als zentrale semantische Farben:

```css
--hk-green
--hk-amber
--hk-red
```

Einige neuere oder speziellere UI-Elemente verwenden stattdessen:

```css
--hk-ok
--hk-warn
```

Diese Variablen werden vom Theme nicht gesetzt. Deshalb greifen feste Ersatzfarben, zum Beispiel:

```css
color: var(--hk-ok, #3f7d4e);
color: var(--hk-warn, #b8860b);
```

#### Betroffene Elemente

- positive Richtlinienprüfung in `panel-src/12-styles.js`, ungefähr Zeile 87
- Qualitätsampeln in `panel-src/12-styles.js`, ungefähr Zeile 146
- positive und warnende Prüfschritte
- positive Diff-Zeilen bei Änderungen

#### Sichtbare Auswirkung

Im Standard-Theme fällt der Unterschied nur wenig auf, weil die Ersatzfarben ähnlich gewählt sind. Bei einem alternativen Farbschema, Home-Assistant-Themefarben, dunklem Modus oder stärker angepassten Akzentfarben können jedoch beispielsweise ein grünes Status-Pill, eine grüne Qualitätsampel und eine positive Prüfzeile drei unterschiedliche Grüntöne verwenden.

Das widerspricht dem ansonsten gut durchgezogenen semantischen Farbsystem:

- Blau: Auswahl und Aktion
- Grün: in Ordnung
- Amber: Hinweis und Prüfung
- Rot: Problem
- Grau: neutral oder inaktiv
- Violett: Sonderstatus

#### Empfohlene Lösung

Die abweichenden Variablen sollten vereinheitlicht werden:

```css
var(--hk-ok, #3f7d4e)
```

wird zu:

```css
var(--hk-green)
```

und:

```css
var(--hk-warn, #b8860b)
```

wird zu:

```css
var(--hk-amber)
```

Falls die Aliasnamen bewusst verwendet werden sollen, sollten sie zentral definiert werden:

```css
--hk-ok: var(--hk-green);
--hk-warn: var(--hk-amber);
```

Die direkte Verwendung von `--hk-green` und `--hk-amber` ist klarer, weil dies bereits die überwiegende Konvention der Oberfläche ist.

## Arbeitsabläufe und Fehlersituationen

### ✅ 4. Sammelentscheidungen verlieren bei Teilfehlern ihren Arbeitsstand — P1

**Fundstellen:** `panel-src/54-finding-status.js:112–134`, `panel-src/15-findings.js:163–192`

„Als bekannt markieren“ und „Zurückstellen“ senden für jeden ausgewählten Befund eine eigene Anfrage. Scheitert eine Anfrage nach bereits erfolgreichen Änderungen, zeigt die Oberfläche zwar einen Fehler an, schließt danach aber das Formular und leert die gesamte Auswahl. Der Nutzer muss die noch offenen Befunde erneut suchen und auswählen. Das gemeinsame Aus- und Einblenden verwendet dasselbe Muster. Beim Einblenden folgt auf einen Fehler zudem noch eine Erfolgsmeldung mit der Zahl der bereits erledigten Einträge; der Gesamtzustand bleibt unklar.

**Empfehlung:** Erfolgreiche und fehlgeschlagene Einträge getrennt zählen. Nach einem Teilfehler nur die erfolgreichen Schlüssel aus der Auswahl entfernen, das Formular mit den übrigen Schlüsseln offen halten und „N von M erledigt; K fehlgeschlagen“ anzeigen. Ein erneuter Versuch sollte nur die fehlgeschlagenen Einträge senden. Ein Test mit einem Fehler in der Mitte der Liste ist hierfür besonders wichtig.

### ✅ 5. Planüberwachung endet nach einem einzelnen Statusfehler — P1 (behoben)

**Fundstelle:** `panel-src/18-cleanup.js:272–288`

Nach dem Start fragt die Oberfläche den Planstatus regelmäßig ab. Jeder Fehler bei einer solchen Abfrage beendet die Schleife sofort. Der Plan kann auf dem Server weiterlaufen, während die Oberfläche den letzten bekannten Zustand und keine neue Fortschrittszahl zeigt. Ein Hinweis auf die unterbrochene Verbindung oder ein automatischer neuer Versuch fehlt.

**Empfehlung:** Bei vorübergehenden Fehlern mit begrenzter Verzögerung erneut fragen. Währenddessen den zuletzt bestätigten Status erhalten und sichtbar erklären, dass der aktuelle Status gerade nicht abgerufen werden kann. Nach Wiederverbindung den Plan über seine ID neu laden. Erst ein bestätigter Endstatus sollte als Abschluss erscheinen. Den Ablauf mit einer fehlschlagenden Statusabfrage zwischen zwei erfolgreichen Abfragen testen.

### ✅ 6. „Abbrechen“ eines Plans gibt bei Fehler keine Rückmeldung — P2 (behoben)

**Fundstellen:** `panel-src/18-cleanup.js:270`, `panel-src/90-panel.js:907`

Der Abbruch-Button sendet eine Anfrage, aber ein Fehler wird vollständig verworfen. Dadurch erfährt der Nutzer nicht, ob der Abbruch angekommen ist. Gerade während eines Backups oder einer Änderung ist das eine wichtige Information.

**Empfehlung:** Den Button während der Anfrage als beschäftigt markieren und danach den vom Server bestätigten Zustand anzeigen. Bei einem Fehler sollte eine Meldung zum erneuten Statusabruf führen. Die Beschriftung sollte verdeutlichen, dass bereits abgeschlossene Schritte durch einen Abbruch nicht automatisch zurückgenommen werden.

### Stärke des Planablaufs

Der Weg von Auswahl und Vorschau über Bestätigung und Ausführung bis zu Prüfung, Bericht und Journal ist klar aufgebaut. Kritische Aktionen nennen ihre Folgen, verlangen eine zusätzliche Bestätigung und zeigen, ob ein Rückgängig möglich ist. Die Befunde oben betreffen vor allem Fehler während dieses Ablaufs.

## Listen und allgemeine Bedienung

### ✅ 7. Die elfte gespeicherte Ansicht ersetzt still die zehnte — P1

**Fundstelle:** `panel-src/13-lists.js:273–280`

Pro Liste sind zehn gespeicherte Ansichten erlaubt. Wenn eine elfte Ansicht unter einem neuen Namen gespeichert wird, ersetzt der Code ohne Warnung den letzten Eintrag. Eine persönliche Auswahl geht verloren, obwohl der Nutzer nur eine weitere Ansicht speichern wollte.

**Empfehlung:** Bei erreichter Grenze den Speichervorgang stoppen und die Grenze erklären. Der Nutzer kann dann eine Ansicht löschen oder bewusst auswählen, welche ersetzt werden soll. Das Überschreiben einer Ansicht mit demselben Namen kann angeboten werden, sollte aber im Formular erkennbar sein.

### 8. ✅ Reine Sortierungen lassen sich nicht speichern — P2 (behoben am 12. Oktober 2026)

**Fundstelle:** `panel-src/13-lists.js:240–249`

Eine gespeicherte Ansicht enthält Suche, Filter und Sortierung. Der Speichern-Button erscheint jedoch nur, wenn ein Suchtext oder ein Filter gesetzt ist. Wer lediglich eine nützliche Sortierung eingestellt hat, kann diese nicht als Ansicht speichern.

**Empfehlung:** Den aktuellen Zustand mit dem Standard beziehungsweise der gewählten gespeicherten Ansicht vergleichen. Jede relevante Änderung, auch Sortierung und Richtung, sollte „Ansicht speichern“ verfügbar machen.

### ✅ 9. Bestätigungsdialoge führen den Tastaturfokus nicht vollständig — P2 (behoben am 13. Oktober 2026)

**Fundstellen:** `panel-src/76-confirm.js:11–29`, `panel-src/90-panel.js:392–415`

Beim Öffnen des Löschdialogs wird „Abbrechen“ fokussiert, und Escape schließt ihn. Es gibt jedoch keine Begrenzung der Tab-Reihenfolge auf den Dialog. Nach dem Schließen wird der Fokus nicht gezielt an den auslösenden Button zurückgegeben. Da ein Rendern den Dialog aus dem DOM entfernt, kann die Tastaturposition verloren gehen. Der Notizdialog verwendet ein ähnliches Schließmuster (`panel-src/63-notes.js:186–190`).

**Empfehlung:** Hintergrundinhalt während eines modalen Dialogs für Tastatur und Screenreader inaktiv machen, den Fokus innerhalb des Dialogs führen und ihn nach dem Schließen zum Auslöser zurückgeben. Dies mit Tab, Shift+Tab und Escape in einem echten Browser prüfen.

### ✅ 10. Nach einem Seitenwechsel in langen Listen fehlt die Orientierung — P3 (behoben am 13. Oktober 2026)

**Fundstellen:** `panel-src/13-lists.js:295–305`, `panel-src/90-panel.js:1020`

Die Seitenschalter befinden sich unter der Liste. Ein Klick auf „Weiter“ zeichnet die neue Seite, führt den Nutzer aber weder zum Anfang der neuen Zeilen noch zu einer passenden Überschrift. Besonders bei 50 oder 100 Zeilen kann die neue Seite dadurch abseits des sichtbaren Bereichs beginnen. Dieser Effekt ist aus dem Ablauf im Code abgeleitet und sollte im Browser bei Desktop und Mobil geprüft werden.

**Empfehlung:** Nach dem Wechsel den Listenanfang in Sicht bringen und den Fokus auf eine aussagekräftige Stelle setzen, etwa die Tabellenüberschrift oder eine Statuszeile „Seite 2 von 5“. Optional können die Seitenschalter bei langen Listen auch oberhalb der Zeilen stehen.

### ✅ 11. Zugängliche Bezeichnung der Listensuche prüfen — P3 (behoben am 13. Oktober 2026)

**Fundstelle:** `panel-src/13-lists.js:130`

Die gemeinsame Listensuche verwendet einen Platzhalter, aber kein eigenes `label` oder `aria-label`. Ein Platzhalter verschwindet beim Tippen und ist kein verlässlicher Ersatz für eine Feldbezeichnung. Die globale Schnellsuche besitzt dagegen ein `aria-label` (`panel-src/31-search.js:36`).

**Empfehlung:** Jeder Listensuche eine dauerhaft verfügbare, zur Liste passende Bezeichnung geben. Die frühere pauschale Aussage, alle sichtbaren Eingabefelder hätten zugängliche Namen, sollte erst nach einer erneuten Prüfung gelten.

## Zuverlässigkeit der Sicherheitsansicht

Diese Punkte betreffen die Daten hinter „Zugriffe & Datenfluss“. Sie sind keine reinen Layoutfehler, verändern aber die Entscheidung, die ein Nutzer anhand dieser Seite trifft.

### ✅ 12. Ein offener Webhook kann fehlen — P1 (behoben)

**Fundstellen:** `custom_components/ha_housekeeper/access.py:280–296`, `tests/test_access.py:170–196`

Die Prüfung beendet die Suche nach dem ersten Webhook-Trigger einer Automation. Hat dieselbe Automation mehrere Webhook-Trigger und ist erst ein späterer von außen erreichbar, erscheint dieser Zugang nicht in der Übersicht. Der vorhandene Test legt pro Automation nur einen Trigger an.

**Empfehlung:** Alle Webhook-Trigger prüfen. Wenn die UI weiter nur eine Zeile pro Automation zeigen soll, muss sie die weiteste Erreichbarkeit zusammenfassen: Ein einziger offener Trigger macht die Zeile „von außen erreichbar“. Ein Test mit einem lokalen und einem späteren offenen Trigger sollte dies absichern.

### ✅ 13. Deaktivierte Automationen zählen als offene Webhooks — P2 (behoben)

**Fundstellen:** `custom_components/ha_housekeeper/access.py:290`, `panel-src/73-system.js:269`, `panel-src/73-system.js:315–328`

Der Server liefert für jeden Eintrag `enabled`, aber die Oberfläche ignoriert dieses Feld beim Zählen und Kennzeichnen offener Webhooks. Eine deaktivierte Automation kann daher einen Warnhinweis und die Zahl „offen“ erhöhen, obwohl sie derzeit nicht ausgelöst wird.

**Empfehlung:** Deaktivierte Automationen getrennt kennzeichnen und nicht in die Zahl derzeit erreichbarer Webhooks aufnehmen. Der Trigger kann weiterhin als Konfigurationshinweis sichtbar bleiben, falls die Automation später wieder aktiviert wird.

## Integration in Home Assistant

### ✅ 14. Reparaturhinweise ordnen Befunde falsch zu — P1 (behoben)

**Fundstellen:** `custom_components/ha_housekeeper/issues.py:21–39`, `custom_components/ha_housekeeper/inventory.py:488–512`

Die Kategoriezuordnung in `issues.py` kennt ausdrücklich nur `broken_reference` und `orphaned`. Alle anderen nicht ausgeschlossenen Befundarten zählen als `unavailable_entities`. Ein länger fehlgeschlagener Config-Entry erzeugt aber beispielsweise einen Befund mit `classification: "problem"`. Dadurch kann Home Assistant einen Reparaturhinweis „nicht verfügbare Entitäten“ anzeigen, dessen Link auf einen Filter ohne den verursachenden Befund führt. Das ist ein überprüfbarer Zuordnungsfehler, kein rein sprachliches Problem.

**Empfehlung:** Eine explizite Zuordnung zulässiger Klassifikationen zu Reparaturkategorien verwenden; unbekannte Arten nicht still der Kategorie „nicht verfügbar“ zuordnen. Für weitere Arten entweder eigene Hinweise mit passendem Link anlegen oder sie bewusst nur im Panel zeigen. Einen Test für `problem` und für unbekannte Klassifikationen ergänzen. Die Schwere eines Reparaturhinweises sollte zur aktuellen Wirkung passen; [Home Assistant beschreibt](https://developers.home-assistant.io/docs/core/platform/repairs/) `ERROR` für bereits defekte Funktionen und `WARNING` für künftig drohende Probleme.

### Technische Erweiterungen

Diese Punkte sind Vorschläge aus der Architekturprüfung, keine nachgewiesenen Defekte:

1. ✅ **Scan-Gesundheit sichtbar machen (umgesetzt am 12. Oktober 2026).** Der Scanner kennt `running`, `phase` und `last_error`; die Entitäten zeigen derzeit Zählwerte und den Zeitpunkt des letzten Snapshots. Ein Diagnosezustand mit letztem Versuch, letztem erfolgreichen vollständigen Scan und Fehlerphase würde veraltete Zahlen erkennbar machen. Für technische Details eignet sich zusätzlich die [System-Health-Plattform](https://developers.home-assistant.io/docs/core/integration/system_health/). Einen Reparaturhinweis erst bei anhaltendem Fehler oder deutlich veraltetem Ergebnis auslösen, damit einzelne Aussetzer keine Warnflut erzeugen.
2. ✅ **Prüfabdeckung pro Datenquelle ausweisen (umgesetzt am 12. Oktober 2026).** Eine leere Befundliste sollte erkennen lassen, welche Quellen tatsächlich geprüft wurden und welche wegen fehlender Berechtigung, Plattform oder Zeitüberschreitung ausgelassen wurden. Pro Prüfung genügen Status, Zeitpunkt und kurzer Grund; in der Übersicht könnte „geprüft“, „übersprungen“ und „unbekannt“ zusammengefasst werden. Das erweitert die bereits vorhandenen punktuellen Unsicherheitsangaben zu einer konsistenten Aussage über die Gesamtprüfung.
3. ✅ **Laufzeitbudget für teure Prüfungen nutzen (teilweise umgesetzt am 12. Oktober 2026: Ordnerlauf wiederverwendet, Phasenzeiten sichtbar; kein Abbruchbudget).** Der Snapshot enthält bereits Phasenlaufzeiten. Daraus lassen sich auffällig langsame Prüfungen identifizieren. Die Speicheranalyse durchsucht Konfigurationsordner bei Anfragen; dafür wären Wiederverwendung eines aktuellen Ergebnisses, ein Mindestabstand zwischen vollständigen Durchläufen und ein sichtbarer Zeitstempel sinnvoll. Große Installationen sollten mit einer entsprechenden Testkonfiguration gemessen werden.
4. **Laufzeitdaten am Config-Entry bündeln.** Scanner und weitere Objekte liegen derzeit zentral in `hass.data[DOMAIN]`. Eine typisierte [`ConfigEntry.runtime_data`](https://developers.home-assistant.io/docs/core/integration-quality-scale/rules/runtime-data/)-Struktur würde Besitz und Lebensdauer der Daten klarer an den geladenen Eintrag binden. Das ist eine Wartbarkeitsverbesserung und sollte nur zusammen mit Setup-, Reload- und Unload-Tests erfolgen.

Assist, MQTT, ESPHome, Funknetze und weitere fachliche Prüfungen sind bereits als Ausbauideen erfasst. Die vier Punkte oben betreffen die Verlässlichkeit und Einbindung der bestehenden Integration.

## Neue Featureideen

Die folgenden Vorschläge erweitern bestehende Daten und Arbeitsabläufe. Sie sind keine bestätigten Fehler. Der Hausmonitor setzt die Beobachtung kritischer Abläufe um; die Beobachtung nach Updates bleibt besonders empfehlenswert.

### 1. ✅ Kritische Abläufe beobachten (als Hausmonitor umgesetzt am 13. Oktober 2026)

**Stand:** Funktionen mit direkten Objekten, Soll-Regeln für Entitäten, Vorschau, Abhängigkeitsvorschlägen und vorübergehender Deaktivierung sind vorhanden. Die Seite und die Übersicht zeigen belegte Ausfälle und Prüflücken; Sensoren, HA-Ereignisse und optionale Mitteilungen machen Zustandswechsel in Home Assistant nutzbar. Aktive Funktionstests bleiben offen.

Ein Nutzer legt wenige wichtige Funktionen fest, etwa „Heizung“, „Türklingel“ oder „Wasseralarm“, und ordnet ihnen Geräte, Entitäten und Automationen zu. Housekeeper zeigt je Ablauf **bereit**, **beeinträchtigt** oder **unbekannt** und nennt die Befunde, die den Status begründen. Von der Ablaufkarte führen Links zu den betroffenen Objekten und ihren bestehenden Diagnose- und Aufräumansichten.

**Nutzen:** Die vorhandene Abhängigkeits- und Auswirkungsanalyse beantwortet damit eine Alltagsfrage: Welche Funktion im Haus ist von diesem Befund betroffen? Kritische Objekte erhalten einen verständlichen Zusammenhang, statt nur als einzelne Liste zu erscheinen.

**Erster Umfang:** Manuell definierte Abläufe mit wenigen direkt zugeordneten Objekten; Status aus bereits vorhandenen Befunden und Verfügbarkeitsdaten ableiten. Indirekte oder dynamische Beziehungen nur anzeigen, wenn sie belegt sind. Bei unvollständiger Datenlage **unbekannt** statt „bereit“ melden. Ein aktiver Funktionstest, der Geräte schaltet oder Alarmierungen auslöst, gehört nicht zum ersten Schritt.

### 2. Freigegebenen Zustand als Vergleichspunkt speichern

Für ausgewählte kritische Objekte und Freigaben kann ein Nutzer einen Zustand bewusst als Ausgangspunkt bestätigen. Housekeeper meldet Abweichungen davon, zum Beispiel eine deaktivierte wichtige Automation, eine geänderte Exponierung einer sensiblen Entität oder eine verschwundene benötigte Integration. Der vorhandene Verlauf vergleicht mit früheren Scans; dieser Vergleichspunkt hält zusätzlich fest, was ausdrücklich beabsichtigt war.

**Erster Umfang:** Nur ausdrücklich ausgewählte Objekte und wenige stabile Eigenschaften. Jede Meldung nennt Ausgangswert, aktuellen Wert und Zeitpunkt; normale Zustandswechsel oder beliebige Attribute bleiben außen vor. Der Vergleichspunkt lässt sich nach einer gewollten Änderung neu bestätigen.

### 3. Ereignisse und Scans direkt in Home Assistant anbieten (Event-Entität für Hausmonitor ✅, Scan-Knopf offen)

Housekeeper veröffentlicht bereits Ereignisse auf dem Home-Assistant-Bus. Eine zusätzliche [Event-Entität](https://developers.home-assistant.io/docs/integration_events/) mit klaren Ereignistypen würde neue kritische Befunde, Rückfälle und überfällige Backups im Automationseditor leichter auffindbar machen. Ein optionaler Scan-Knopf als Entität könnte den manuellen Scan aus Dashboards und Automationen starten.

**Erster Umfang:** Bestehende Bus-Ereignisse beibehalten, Event-Entität mit sparsamen, nicht sensiblen Angaben ergänzen. Den Scan-Knopf gegen häufiges Auslösen begrenzen und den laufenden beziehungsweise zuletzt abgeschlossenen Scan sichtbar machen.

### 4. Beobachtung nach Updates — besonders empfohlen

Nach einem Update von Home Assistant oder einer Integration beginnt auf Wunsch ein begrenzter Beobachtungszeitraum, etwa 24 bis 48 Stunden. Housekeeper vergleicht einen Stand vor dem Update mit den folgenden Scans und bündelt neue Ausfälle, behobene Probleme und Änderungen an kritischen Abläufen. Eine Abschlussansicht zeigt, was stabil blieb, was sich verschlechterte und was noch unbekannt ist.

**Nutzen:** Die bereits vorhandenen Hinweise „zeitlich zusammen mit Update“ und der Änderungsverlauf werden zu einem klaren Prüfablauf. Nutzer können nach einem Update gezielt entscheiden, ob Handlungsbedarf besteht.

**Erster Umfang:** Nur lesender Vorher-nachher-Vergleich auf Basis vorhandener Snapshots und Update-Zeitpunkte, mit direktem Link zu betroffenen Objekten. Zeitliche Nähe ausdrücklich als Zusammenhang kennzeichnen, nicht als bewiesene Ursache. Ist kein geeigneter Stand vor dem Update vorhanden, diesen Teil als **unbekannt** ausweisen.

### 5. ✅ Das Ende eines Befunds nachvollziehbar machen (umgesetzt am 12. Oktober 2026: Gründe „Objekt entfernt“, „nicht geprüft“ (Dashboards, Apps), „Einstellung geändert“ und „Grund unbekannt“; offen bleibt die Prüfabdeckung für weitere Quellen)

Die Änderungsansicht nennt einen Befund derzeit „behoben“, sobald sein Schlüssel im nächsten Snapshot fehlt (`custom_components/ha_housekeeper/history.py:106–115`). Daraus allein folgt keine Reparatur: Das Objekt kann entfernt worden sein, oder eine Prüfung konnte keine Aussage mehr liefern. Der Befundverlauf sollte zwischen **nachweislich behoben**, **Objekt entfernt**, **ausgeblendet beziehungsweise bewusst akzeptiert** und **nicht mehr prüfbar** unterscheiden. Wenn der Grund nicht belegbar ist, heißt der Zustand **nicht mehr beobachtet** statt „behoben“.

**Nutzen:** Die Historie und die Beobachtung nach Updates melden keine scheinbare Verbesserung, wenn lediglich Daten oder Prüfgrundlagen fehlen. Ein Nutzer kann nachvollziehen, warum ein Befund aus der offenen Liste verschwunden ist.

**Erster Umfang:** Beim Vergleich den aktuellen Objektstatus und die Prüfabdeckung heranziehen. Nur belegte Gründe automatisch vergeben; ältere Checkpoints ohne diese Informationen behalten den neutralen Zustand. Die bisherige Zählung „behoben“ erst dann verwenden, wenn der Grund hinreichend sicher ist.

### 6. Eigene Datenhaltung sichtbar und steuerbar machen (Übersicht ✅ umgesetzt am 12. Oktober 2026, Aufbewahrung und Löschen offen)

Housekeeper speichert unter anderem Beobachtungen, Scanverlauf, Automationsläufe, Ereignisse, Notizen und ein Planjournal in eigenen Home-Assistant-Speichern. Eine Übersicht sollte je Datenart Zweck, Aufbewahrungsdauer und ungefähren Speicherbedarf zeigen. Für geeignete Datenarten kann der Nutzer die Aufbewahrung einstellen oder alte Daten gezielt entfernen.

**Nutzen:** Nutzer verstehen, welche Daten die Integration selbst über längere Zeit behält, und können den Platzbedarf steuern. Die bestehende Verlaufsaufbewahrung wird als Teil eines Gesamtbilds sichtbar.

**Erster Umfang:** Zunächst nur lesende Übersicht mit vorhandenen Fristen und Größen. Eine Löschfunktion braucht eine Vorschau der Folgen, insbesondere für Vergleiche, Nachkontrollen und Audit- oder Planjournal; sicherheitsrelevante Nachweise sollten nicht beiläufig durch eine allgemeine Bereinigung verschwinden.

### 7. Abwesenheits-Check

Vor einer Reise gibt der Nutzer **Beginn und geplantes Ende der Abwesenheit** an; alternativ reicht ein Startdatum mit Dauer. Die Übersicht zeigt den Prüfzeitpunkt, den Zeitraum und die verbleibenden Tage. Ein kleiner, einstellbarer Puffer nach der geplanten Rückkehr berücksichtigt Verspätungen. Wird die Reise verlängert, lässt sich derselbe Check mit neuem Enddatum erneut auswerten.

Die lesende Checkliste bündelt vorhandene Befunde und ergänzt wenige zeitbezogene Fragen:

- **Batterien:** Aktuell schwache Batterien und Sensoren zeigen, deren vorhandene Trendprognose den Warnschwellwert vor Rückkehr einschließlich Puffer erreicht. Der Hinweis nennt aktuellen Wert, geschätzten Zeitpunkt und Datenbasis. Geräte ohne brauchbare Historie, mit unklarer Batterieart oder mit nicht verfügbaren Sensoren erscheinen als **unbekannt**; ebenso eine Prognose über den belastbaren Horizont der Trenddaten hinaus. Ein stabiler Trend ist keine Garantie für die ganze Reise. Für besonders wichtige Geräte darf der Nutzer unabhängig von der Prognose eine manuelle Prüfung vormerken.
- **Backups und Speicher:** Prüfen, ob ein aktuelles Backup vorhanden ist, der letzte Lauf erfolgreich war und der geplante Rhythmus während der Abwesenheit weiterläuft. Für den bekannten lokalen Backup-Speicher eine vorsichtige Platzabschätzung aus freiem Speicher, jüngsten Backup-Größen, geplantem Rhythmus, Aufbewahrung und bisherigem Speicherwachstum anzeigen. Eine Reserve für andere Daten und die Rückkehr einrechnen. Aufbewahrung kann alte Backups freigeben; deshalb geplante Kopien nicht einfach aufsummieren. Externe Ziele, Quoten oder freier Platz ohne verfügbare Daten bleiben **unbekannt**. Unzureichender oder nur knapp ausreichender Platz ist Handlungsbedarf; fehlen die Grundlagen für eine Abschätzung, bleibt das Ergebnis **unbekannt**.
- **Erwartete Zustände:** Der Nutzer wählt Entitäten und den Zustand, den sie zur Abreise haben sollen, etwa „Urlaubsmodus an“, „Lichtautomatik aus“ oder „Beschattung im Urlaubsmodus“. Bei passenden Entitäten können auch Attributwerte oder eine erlaubte Menge von Zuständen nötig sein; diese Regeln müssen ausdrücklich konfiguriert werden. Housekeeper vergleicht Soll und Ist zur Prüfung, zeigt Abweichung, letzten Zustandswechsel und Link zur Entität. `unknown`, `unavailable` und nicht mehr vorhandene Entitäten sind eigene Ergebnisse. Ein Abgleich vor der Abreise sagt nichts darüber aus, ob der Zustand während der gesamten Reise bestehen bleibt.
- **Kritische Funktionen und Erreichbarkeit:** Bestehende Befunde zu gewählten kritischen Abläufen, wichtigen Integrationen und Geräten bündeln. Besonders sinnvoll sind Alarmierung, Wasser- und Rauchmelder, Heizung oder Frostschutz sowie die für Benachrichtigungen nötigen Verbindungen. Nur prüfen, was Housekeeper tatsächlich beobachten kann; eine funktionierende Meldung an eine Person wird dadurch nicht bewiesen.

**Weitere sinnvolle Ergänzungen:** Eine kurze, frei konfigurierbare manuelle Liste für Dinge ohne verlässlichen Sensor, zum Beispiel Fenster, Wasserhahn oder Ersatzschlüssel, mit „erledigt“ und „nicht geprüft“ statt automatischer Bestätigung. Der Bericht sollte offene Punkte nach „vor Abreise beheben“, „während der Reise beobachten“ und „nur manuell prüfbar“ ordnen. Optional kann ein erneuter Check kurz vor dem Start auf neue Abweichungen hinweisen; nach der Rückkehr ein Vergleich mit der gespeicherten Abreise-Momentaufnahme zeigen, welche erwarteten Zustände oder kritischen Funktionen noch abweichen. Laufende Überwachung und Benachrichtigungen während der Reise wären ein späterer, ausdrücklich aktivierbarer Schritt mit wählbaren Empfängern und nur bei neuen oder wesentlich veränderten Problemen.

**Erster Umfang:** Zeitraum erfassen, vorhandene Batterie-, Backup-, Speicher- und Befunddaten zusammenführen, eine kleine Menge manuell definierter Soll-Zustände prüfen und das Ergebnis als datierte Momentaufnahme speichern oder exportieren. Jeder Punkt zeigt Quelle und Zeitpunkt seiner letzten Prüfung sowie einen Link zur Ursache. Ergebnisse heißen **in Ordnung**, **Handlungsbedarf** oder **unbekannt**; unbekannte und manuell ungeprüfte Punkte dürfen nicht als reisebereit gezählt werden. Keine Geräte schalten, Automationen ändern oder neue Diagnose-Engine aufbauen. Prognosen immer als Schätzungen mit ihrer Datenbasis kennzeichnen.

### 8. Umzugs-Check für einen Hardwarewechsel

Ein Bericht vor dem Wechsel des Home-Assistant-Hosts listet die erkennbaren Abhängigkeiten: Apps, lokale Hardware und Funksticks, externe Speicherorte, Custom Integrations und Karten sowie den Backup-Status. Zu jedem Punkt steht, ob er im bestehenden Inventar belegt oder noch manuell zu prüfen ist. [Home Assistant beschreibt Backups als Weg zur Migration auf neue Hardware](https://www.home-assistant.io/common-tasks/general/); Housekeeper könnte die praktische Vor- und Nachkontrolle bündeln.

**Erster Umfang:** Lesende Checkliste und Export vor dem Wechsel; nach dem Restore ein Vergleich der tatsächlich wieder vorhandenen Integrationen, Geräte und kritischen Abläufe. Keine automatische Migration und keine Garantie, dass ein Backup externe Geräte oder Dienste vollständig wiederherstellt.

### 9. Gebündelte Mitteilungen

Optional erhält der Nutzer täglich oder wöchentlich eine Zusammenfassung neuer wichtiger Befunde, fälliger Wiedervorlagen und noch offener Aufgaben, mit Links ins Panel. Die vorhandene einmalige Meldung für neue defekte Referenzen bleibt als sofortiger Kanal erhalten.

**Erster Umfang:** Nur neue beziehungsweise seit der letzten Zusammenfassung wesentlich veränderte Punkte, keine Nachricht bei unverändertem Zustand. Häufigkeit, Schweregrenze und Aktivierung sind wählbar; der Versand ist standardmäßig aus.

### 10. „Schnell erledigt“ für klare, risikoarme Schritte

Eine Ansicht bündelt Befunde, für die Housekeeper einen eindeutigen nächsten Schritt anbieten kann, etwa eine fehlende Beschreibung ergänzen oder eine geprüfte Bereichszuordnung vorbereiten. Zu jedem Vorschlag stehen Wirkung, Grenzen und der Link zur bestehenden Vorschau beziehungsweise zur zuständigen Home-Assistant-Ansicht.

**Erster Umfang:** Eine kleine feste Menge nachvollziehbarer Vorschlagstypen. Keine automatische Ausführung und keine geschätzten Minutenwerte, die im konkreten Haushalt nicht belastbar wären. Befunde mit unbekannter Abhängigkeit oder kritischem Objekt gehören nicht in diese Gruppe.

### 11. Begrenzte Haushaltsansicht für Nicht-Administratoren — optional

Das aktuelle Panel ist nur für Administratoren registriert (`custom_components/ha_housekeeper/__init__.py:120–129`), und seine WebSocket-Befehle verlangen überwiegend Administratorrechte. Wenn mehrere Personen im Haushalt Housekeeper nutzen sollen, wäre eine eigenständige, lesende Ansicht für freigegebene kritische Abläufe und ausgewählte Aufgaben denkbar. Sie zeigt keine technischen IDs, Zugangsdaten-Hinweise, Sicherheitsdetails oder Aufräumaktionen.

**Erster Umfang:** Nur ausdrücklich ausgewählte Statusdaten über eigene serverseitig begrenzte Endpunkte. Die bestehende Admin-Oberfläche darf dafür nicht durch das Ausblenden einzelner Knöpfe zu einer allgemeinen Ansicht werden. Der Nutzen hängt davon ab, ob tatsächlich Nicht-Administratoren den Status brauchen.

### 12. Geplante Ausfälle als zusammenhängender Wartungsfall — optional

Housekeeper kennt bereits Vermerke wie „absichtlich offline“ mit Prüfdatum und ein geführtes Wartungsfenster. Für einen bewusst abgeschalteten Hub oder eine vorübergehend stromlose Gerätegruppe könnte ein zeitlich begrenzter Wartungsfall mehrere betroffene Objekte bündeln, Benachrichtigungen dazu zurückhalten und nach Ablauf automatisch eine erneute Prüfung anstoßen.

**Erster Umfang:** Manuell gewählter Umfang und Endzeit; bestehende Befunde bleiben sichtbar und werden als geplant gekennzeichnet. Nach Ablauf erscheint ein klarer Hinweis, falls betroffene Geräte nicht wieder verfügbar sind. Diese Funktion lohnt sich vor allem bei häufigen geplanten Eingriffen.

**Empfohlene Feature-Reihenfolge:** Hausmonitor und die Unterscheidung, warum Befunde enden, sind umgesetzt. Als Nächstes bietet sich die Beobachtung nach Updates an. Abwesenheits- und Umzugs-Check nutzen anschließend viele dieser Grundlagen. Vergleichspunkt, schnelle Schritte und weitere native Home-Assistant-Entitäten sind spätere Verbesserungen; Haushaltsansicht hängt vom tatsächlichen Bedarf ab.

## Was bereits gut und einheitlich funktioniert

- Alle Hauptansichten verwenden dieselbe Seitenhierarchie aus Bereichsbezeichnung, Hauptüberschrift, Untertitel und Aktionen.
- „Neu scannen“ steht konsistent als globale Primäraktion rechts im Seitenkopf.
- Lokale Aktualisierungen heißen dagegen „Aktualisieren“ und stehen beim jeweiligen Datenbereich.
- Kartenradien, Schatten, Rahmen und Innenabstände wirken über Übersicht, Wartung, Recorder und Einstellungen hinweg zusammengehörig.
- Status-Pills und farbige linke Kartenkanten verwenden eine verständliche gemeinsame Semantik.
- Der Wechsel von horizontaler Navigation zu „Menü“ funktioniert bei 375 px gut.
- Die Navigationskacheln wechseln mobil sauber auf zwei Spalten.
- Lange Überschriften und Beschreibungen brechen ohne horizontales Überlaufen um.
- Die geprüften Ansichten besitzen jeweils genau eine Hauptüberschrift.
- Die globale Schnellsuche und die gemeinsame Listensuche besitzen zugängliche Bezeichnungen; die Listensuche verwendet ein dauerhaftes `aria-label`.
- Die Detailseite unterscheidet Hauptaktionen, Statusinformationen, Registerkarten und Diagnosebereiche klar.
- Der Plan zeigt Vorschau, Bestätigung, Ausführung, Prüfung, Bericht und Rückgängig im Journal als zusammenhängenden Ablauf.
- Hell- und Dunkelmodus sind strukturell praktisch identisch; es gibt keine auffälligen Layoutsprünge zwischen den Modi.

## Geprüfte Bereiche und Zustände

Geprüft wurden insbesondere:

- Übersicht
- Befunde
- Inventar
- Detailansicht einer Entität
- Aufräumen
- Wartung
- Zuverlässigkeit
- Recorder
- Speicher und System
- Home-Assistant-Reparaturhinweise und Scanstatus im Quellcode
- Einstellungen
- Desktop-Darstellung
- Mobile Darstellung bei 375 px
- heller Modus
- dunkler Modus

In der bisherigen visuellen Prüfung wurden außerdem Hauptüberschriften, sichtbare Steuerelemente, horizontales Überlaufen und die Aktualität des gebündelten Panels kontrolliert. Die Listensuche wurde danach im Code mit einem `aria-label` ergänzt; ihre Wirkung wurde nicht erneut im Browser mit einem Screenreader geprüft.

Die neu ergänzten Befunde zu Sammelaktionen, Planstatus, gespeicherten Ansichten, Dialogfokus, Webhooks und Reparaturhinweisen wurden aus dem aktuellen Quellcode abgeleitet. Die Fehlerpfade sind dort nachvollziehbar; die genaue Wirkung auf Fokus und Scrollposition sowie die Darstellung von Verbindungsfehlern sollten zusätzlich in einer laufenden Home-Assistant-Oberfläche geprüft werden. Die Integrationsideen sind Empfehlungen und wurden nicht als bereits auftretende Fehler gewertet.

Alle 226 Panel-Tests bestanden beim Review. Die Python-Tests konnten in der lokalen Laufzeit nicht vollständig gesammelt werden, weil `homeassistant` dort fehlt. Das ist keine Feststellung über das Verhalten der Integration in Home Assistant.

## Empfohlene Reihenfolge der Korrekturen

1. ✅ Webhook-Übersicht für mehrere Trigger und deaktivierte Automationen korrigieren.
2. ✅ Planstatus nach Verbindungsfehlern erneut abrufen; Abbruch und Wiederverbindung sichtbar machen.
3. ✅ Sammelaktionen bei Teilfehlern korrigieren und Auswahl und Formular erhalten.
4. ✅ Reparaturhinweise korrekt klassifizieren und mit passenden Filtern verlinken.
5. ✅ Mobile Tabellenbeschriftungen ergänzen (bei 375 px noch nicht im Browser geprüft).
6. Stilles Überschreiben gespeicherter Ansichten verhindern ✅; reine Sortierung speicherbar machen ✅.
7. Fokusführung in Dialogen und Orientierung nach Seitenwechseln im Code korrigiert ✅; die Wirkung im Browser noch prüfen.
8. Lade- und Disabled-Zustände trennen ✅, Themefarben vereinheitlichen ✅ und die Listensuche zugänglich beschriften ✅.
9. Danach Scan-Gesundheit ✅ und das Ende eines Befunds ✅ (Prüfabdeckung für weitere Quellen offen); Laufzeitbudget und Datenhaltung gezielt verbessern.

Ein größerer visueller Umbau ist nach der bisherigen Prüfung nicht erforderlich. Die genannten Arbeitsabläufe brauchen jedoch gezielte Fehler- und Wiederaufnahmetests, bevor ihre Bedienung als stabil gelten kann.
