# Changelog

## Unreleased

### Geändert

- **Aufklapp-Pfeile einheitlich:** Alle aufklappbaren Bereiche („Wie wird das gezählt?“, Dateigruppen, Details) haben denselben kleinen Pfeil, der nach rechts zeigt und sich beim Öffnen nach unten dreht, statt des groben Standard-Dreiecks.

- **Listenleiste ruhiger:** Die Suche ist 200 px breit, der Filter heißt „Schweregrad“ (Hoch, Mittel, Niedrig, Info, Keine) und die Sortierung zeigt ihre Richtung im Eintrag („Schweregrad ↓“). Gespeicherte Ansichten sind ein Stern-Knopf mit Auswahl, Löschen je Eintrag und „Ansicht speichern“. „Kompakte Zeilen“ wirkt jetzt auch in der Befundliste.

- **Ausfälle von Integrationen mit Schweregrad nach Dauer:** Eine nicht geladene Integration ist sofort ein Befund und wartet nicht mehr, bis die „Mindestdauer nicht verfügbar“ (Standard 7 Tage) vorbei ist. Die Dauer bestimmt die Auswirkung: unter 1 Stunde „Info“, ab 1 Stunde „Niedrig“, ab 1 Tag „Mittel“, ab der Mindestdauer „Hoch“. Neu ist die Stufe „Info“ (1 Punkt, höchstens 5); „Niedrig“ und „Mittel“ ziehen jetzt 2 und 3 Punkte statt 1 und 2 ab. Dadurch springt der Punktestand einmalig. In der Liste trägt jede Zeile ihre Auswirkung als Chip und ein „⋯“-Menü mit „Als bekannt markieren“, „Zurückstellen“, „Befund ausblenden“ (und „Löschen vorbereiten“, wo es passt); die breiten Knöpfe unter den Ausfällen und der Einzelknopf „Löschen vorbereiten“ entfallen. Im Detail stehen dieselben Aktionen jetzt auch bei Ausfällen. Die Zeile eines Ausfalls nennt nur noch, was betroffen ist und wie lange er dauert („seit 6 Std. · Mittel in 18 Std.“); Zustand und Fehlertext stehen im Detail. Jede Zeile hat zwei Chips: den Grund (grauer Umriss, zum Beispiel „Ausfall“, „Ungenutzt“) und die Auswirkung (farbig, Hoch rot bis Info grau); das Datum entfällt in der Zeile. Die Filter „Typ“ und „Auswirkung“ gelten jetzt auch für Ausfälle; neu ist der Filter „Grund“ (mit „Ausfall“ als eigener Kachel). Die Kachel „Housekeeping-Status“ der Befunde-Seite entfällt; ihr Verlauf („−27 in 2 Tagen“) steht in der Übersicht unter der Überschrift, der Link „Wie entsteht die Zahl?“ ist weg.

### Neu

- **Vollständige Prüfung nur noch als Hinweis:** Wurden alle Quellen gelesen, entfällt die Leiste „Prüfung“ in der Übersicht. Stattdessen steht „Prüfung vollständig“ in der Statusleiste unter dem Menü (ein Klick öffnet die Liste). Bei einer Lücke bleibt die gelbe Leiste.

- **Prüfung nennt nicht lesbare Dashboards:** Unter „Was zuletzt geprüft wurde“ steht bei Dashboards jetzt, welche nicht gelesen werden konnten und warum („Konfiguration ungültig“, „Konnte nicht geladen werden“). Ein Dashboard, das Home Assistant automatisch erzeugt und nie gespeichert wurde, gilt nicht mehr als Lücke. Jede gelesene Quelle nennt außerdem ihre Menge („412 Entitäten, 58 Geräte“).

- **Lücken in der Prüfung werden nachgeholt:** Konnte ein Scan eine Quelle nicht vollständig lesen (etwa Dashboards, weil Lovelace noch nicht bereit war), startet Housekeeper nach 5 Minuten einen neuen Scan, höchstens dreimal hintereinander. Die Leiste „Prüfung“ sagt dazu, dass es noch einmal versucht wird. Fehlt eine Komponente ganz, wird nicht wiederholt.

- **Vermerk für mehrere Objekte:** Die Auswahlleiste der Befunde hat den Knopf „Vermerk setzen“. Er setzt Art, Begründung und Prüffrist in einem Zug an allen angekreuzten Entitäten, Geräten, Integrationen und Apps; andere Objekte in der Auswahl (zum Beispiel Automationen) bleiben unberührt.

### Behoben

- **Backup vor dem Löschen ohne eingerichtete Backups:** Wer in Home Assistant noch keine automatischen Backups eingerichtet hat, musste dafür erst ein Backup-Ziel und einen Verschlüsselungsschlüssel anlegen. Housekeeper sichert jetzt in den lokalen Speicher von Home Assistant, ohne Passwort. Die Vorschau und der Backup-Schritt sagen, dass es lokal und unverschlüsselt liegt. Ein abgebrochener Plan nennt den Grund im roten Band („Es wurde nichts gelöscht und nichts geändert“).

- **„Szene fehlt“ bei Szenen, die eine Automation selbst anlegt:** Legt eine Automation oder ein Skript die Szene mit `scene.create` an, nennt der Befund das jetzt: Die Szene existiert erst nach dem ersten Lauf.

- **Richtlinien und andere Ansichten nach „Neu scannen“:** Die Liste der betroffenen Entitäten blieb nach einem neuen Scan auf dem alten Stand, bis man die Seite neu lud. Richtlinien, Freigaben, Automations-Qualität und Blueprints laden nach einem neuen Scan jetzt selbst neu (Issue #11).

- **Menü auf schmalen Fenstern:** Die geöffnete Menüliste ist höher als das Fenster, etwa bei großer Schrift, und scrollt jetzt, sodass auch die unteren Einträge erreichbar sind (Issue #10).

- **Sortierrichtung:** Bei gleichen Werten drehte der Pfeil „Aufsteigend/Absteigend“ die Reihenfolge nicht um; jetzt dreht er die ganze Liste.

- **Befunde:** Wer einen Status wie „Neu“ oder einen Filter wählte, sah die Ausfälle von Integrationen nicht, obwohl sie mitgezählt wurden. Sie stehen jetzt als eigene Zeilen in der Liste.

### English

#### Changed

- **Uniform expand arrows:** All collapsible sections ("How is this counted?", file groups, details) now share the same small chevron that points right and turns down when opened, instead of the coarse default triangle.

- **Calmer list bar:** The search is 200 px wide, the filter is called "Severity" (High, Medium, Low, Info, None) and the sort shows its direction in the entry ("Severity ↓"). Saved views are one star button with a pick list, delete per entry and "Save view". "Compact rows" now works in the findings list too.

- **Integration outages graded by duration:** An integration that is not loaded is a finding at once and no longer waits for “Minimum days unavailable” (default 7 days). How long it has lasted sets the impact: under 1 hour “Info”, from 1 hour “Low”, from 1 day “Medium”, from the minimum days “High”. “Info” is new (1 point, at most 5); “Low” and “Medium” now take off 2 and 3 points instead of 1 and 2, so the score jumps once. In the list every row carries its impact as a chip and a “⋯” menu with “Mark as known”, “Snooze”, “Hide finding” (and “Prepare deletion” where it fits); the wide buttons under outages and the single “Prepare deletion” button are gone. The detail page shows the same actions for outages now. The row of an outage only says what is affected and how long it has lasted (“for 6 h · Medium in 18 h”); state and error text are on the detail page. Each row has two chips: the reason (grey outline, for example “Outage”, “Unused”) and the impact (coloured, High red down to Info grey); the date is gone from the row. The filters “Type” and “Impact” now apply to outages too; there is a new filter “Reason” (with “Outage” as a tile of its own). The “Housekeeping status” tile of the Findings page is gone; its history (“−27 in 2 days”) sits under the headline of the overview, and the link “How is the number made?” is removed.

#### New

- **Gaps in the check are made up for:** If a scan could not read a source in full (dashboards, say, because Lovelace was not ready), Housekeeper starts a new scan after 5 minutes, at most three times in a row. The "Check" bar says that it will try again. A component that is missing altogether is not retried.

- **Mark for several objects:** The selection bar of the Findings page has a “Set a mark” button. It sets kind, reason and review date in one go on all ticked entities, devices, integrations and apps; other objects in the selection (for example automations) stay untouched.

#### Fixed

- **Policies and other views after “Scan now”:** The list of affected entities stayed at the old state after a new scan until the page was reloaded. Policies, exposure, automation quality and blueprints now load again by themselves after a new scan (issue #11).

- **Menu on narrow windows:** The open menu list is taller than the window, for example with large fonts, and now scrolls, so the lower entries can be reached (issue #10).

- **Sort direction:** With equal values the ascending/descending arrow did not reverse the order; it now reverses the whole list.

- **Findings:** Choosing a status such as “New” or a filter hid the outages of integrations although they were counted. They are rows of their own in the list now.

## 1.5.1 - 2026-10-12

### Geändert

- **Kompaktere Menüleiste:** Damit die Leiste oben schmaler wird und seltener in den „Menü“-Knopf wechseln muss, ist sie umgebaut: „Housekeeper“ mit dem Wort „Übersicht“ darunter ist jetzt der Weg zur Übersicht und ersetzt den Menüpunkt „Übersicht“, und die Einstellungen sind in der Leiste nur noch das Zahnrad (der Name steht als Tooltip und in der Liste des Menü-Knopfs). Das Suchfeld ist dafür etwas breiter.
- **Befunde als eine Liste:** Die Befunde-Seite hat keine getrennten Gruppen „Ausfälle“ und „Einzelne Befunde“ mehr. Jede Zeile ist ein Objekt mit seinem Typ; wer Folgen hat, trägt einen roten Zähler („12 Folgen“, darunter „erklärt 12 weitere Befunde“) und klappt seine Kette auf: App, Integration, Gerät, Entitäten, jeweils mit eigenem Zähler. Der Filter „Mit Folgen“ zeigt nur diese Einträge, „Flache Liste“ zeigt jeden Befund einzeln und nennt bei Folgen die Ursache („Folge von …“).
- **Übersicht „Was muss ich jetzt tun?“ in drei Bereichen:** **Befunde** zeigt die ersten fünf Einträge derselben Liste wie die Befunde-Seite (eine Kette als eine Zeile mit rotem Zähler, „Alle Befunde (n)“ führt zur Liste), **Zustand** Backup, Datenträger und veralteten Scan (dringende Punkte ziehen im Status ab) und **Wartung** Ziele, Erinnerungen und Quarantäne: nie dringend, eingeklappt mit Zahl, solange etwas anderes ansteht. Verfehlte Ziele stehen in Klartext („Schwache Batterien: jetzt 2 · erlaubt: keine“, Ziel verfehlt). Bereiche ohne Zeilen fehlen.
- **Reiter „Erledigt“:** „Zuletzt behoben“ heißt jetzt „Erledigt“ und zeigt Ereignisse statt Objekte, für 7, 30 oder 90 Tage: „Durch einen Plan behoben“ (mit Art der Änderung, Zahl der Objekte, Zeitpunkt und ob sie rückgängig zu machen ist) und „Von selbst beendet“. Dort stehen Befunde, die ohne Plan verschwanden: „Von selbst wieder in Ordnung“ zählt als erledigt, „Objekt entfernt“, „Quelle nicht gelesen“ und „Grund unbekannt“ nicht, denn dort ist nichts behoben. Die Zahl der Objekte eines Plans ist nicht mehr auf 300 begrenzt.
- **Status als Punktestand:** Der Housekeeping-Status ist jetzt ein Punktestand von 100. Jeder Eintrag der Befundliste nimmt je nach Auswirkung Punkte weg (hoch 5, mittel 2, niedrig 1, mit Obergrenze), dringende Zustandsthemen wie Backup oder ein fast voller Datenträger je 10; Folgen eines Ausfalls zählen nicht extra. Grün ab 90, gelb ab 70, darunter rot; ein Eintrag mit hoher Auswirkung färbt den Ring mindestens gelb. Die Zahl der Objekte mit Befund steht daneben, ein Klick auf den Ring zeigt die Rechnung. Der neue Wert ersetzt den alten ohne Übergang: Die Kurve der Übersicht macht an dieser Stelle einen Knick.
- **Speicher und Laufzeit:** Die Seite „Speicher & System“ liest die Ordnergrößen nicht mehr bei jedem Aufruf neu: ein Ergebnis wird bis zu 5 Minuten wiederverwendet, auch für mehrere Browser, und „Aktualisieren“ liest erst nach 30 Sekunden erneut. Die Seite zeigt, wann die Größen gemessen wurden. In Einstellungen, Info steht die Dauer des letzten Scans je Phase, die längste zuerst.
- **Detailseiten:** Was du über ein Objekt entschieden hast, steht jetzt in einem Band über den Reitern: ein als bekannt, zurückgestellt oder ausgeblendeter Befund mit Art, Frist und Grund (mit „Wieder aufnehmen“) und ein Vermerk (mit „Ändern“ und „Entfernen“). Die Karte „Bekannt über …“ nennt dieselbe Entscheidung statt „Der Befund ist ausgeblendet“.
- **Änderungen:** Der Verlauf der Scans zeigt zunächst nur die neuesten Zeilen, damit das Ergebnis des Vergleichs sichtbar bleibt; „Alle anzeigen“ öffnet die ganze Liste. Die Auswahl „Vergleichen mit“ sitzt im Kopf des Verlaufs, gespeicherte Scans tragen den Wochentag im Titel, und ein Satz erklärt den Balken.
- **Ende eines Befunds:** „Behobene Befunde“ zählt nur noch Befunde, deren Objekt weiter existiert. Verschwindet ein Befund, weil sein Objekt entfernt wurde, die Prüfung (zum Beispiel eines Dashboards oder der Apps) nicht lesen konnte oder sich eine Einstellung wie die Ausfalldauer geändert hat, steht er in einer eigenen Rubrik „Ohne Reparatur beendet“ mit dem Grund. Die Zahl „behoben“ kann dadurch kleiner ausfallen als bisher.
- **Kacheln der Unterseiten:** Aufräumen, Recorder und Apps & Integrationen zeigen unter der Beschreibung eine Zeile mit Hinweisen (zum Beispiel „2 mit Problem“, „9,5 GB“, „751 mit Statistik“). Die Kacheln sind dadurch gleich hoch und springen beim Laden nicht mehr; lange Beschreibungen enden mit „…“. In Aufräumen teilen sich die letzten zwei Kacheln die Zeile, und die Zahlenzeile von „Nicht verwendet“ ist in die Kachel gewandert.
- **Apps & Integrationen:** Die obere Kennzahlenreihe entfällt. Die drei Kacheln (Apps, Core, Custom) sind breiter, der Text bricht nicht mehr um, und sie tragen die Hinweise selbst: laufende Apps, belegter Platz, Updates und Integrationen mit Problem.
- **Bestand:** In der Ansicht „Nach Objekttyp“ hebt der Ring den Abschnitt hervor, über dem die Maus liegt oder dessen Tabellenzeile sie berührt; umgekehrt leuchtet die Zeile auf, wenn die Maus auf dem Ringabschnitt liegt.
- **Recorder, Datenbank:** „Fehlende Stunden in Statistiken“ ist verständlicher: ein kurzer Satz sagt, ob die Lücken alle Sensoren oder nur einzelne betreffen, darunter steht offen die Liste „Sensoren mit den meisten Lücken“ als sortierbare, durchsuchbare Tabelle wie die anderen Listen (Spalte „Gemeinsame“ nur, wenn es gemeinsame Lücken gibt).
- **Läufe:** Die Liste „Alle gezählten Läufe“ ist auf großen Bildschirmen besser lesbar: die Namensspalte ist schmaler, die Zahlen stehen näher am Namen.
- **Läufe:** Die Detailseite einer Automation oder eines Skripts zeigt den Verlauf der Läufe über 30 Tage statt 7 (die Zahlen und die Liste bleiben bei 7 Tagen).
- **Befunde:** Die Seite hat einen klareren Aufbau: ein Panel mit den Reitern Offen, Neu, Bekannt … und „Zuletzt behoben“ (statt eines Faltbereichs darüber). Suche und Filter stehen zuerst; im Reiter „Offen“ folgen zuerst die Ausfälle als aufklappbare Gruppe, dann die einzelnen Befunde. Die Auswahl-Knöpfe erscheinen erst nach dem ersten Markieren; vorher gibt es nur das Kästchen „Seite auswählen“.
- **Befunde:** Die Zahl der Befunde zählt jetzt jeden Ausfall einmal und jeden Befund ohne Ausfall dahinter („8 Ausfälle + 6 einzelne = 14“); die Folgebefunde der Ausfälle stehen als Unterzeile unter der Kachel „Alle“. Das gilt für die Zahl am Reiter, die Kachel „Offene Befunde“, den Link „Alle Befunde“ und die Befunde-Seite. Die Kacheln der Unterseiten (z. B. Komponenten) haben mehr Platz für den Text.
- **Recorder, Lauteste Entitäten:** Die Liste ist jetzt eine sortierbare Tabelle wie „Auffälligkeiten“ (Name, Einordnung, Zeilen, Zeilen pro Tag, ohne neuen Zustand, Attribute, lauteste Stunde) statt vierzeiliger Karten; auf dem Telefon wird sie zu Karten. Im Kopf der Auswahlspalte markiert ein Kästchen alle Zeilen der Seite (auch bei „Auffälligkeiten“ und in der Kostenliste).
- **Recorder:** Die Auswahlspalte der Tabellen („Auffälligkeiten“, Lauteste Entitäten) ist nur noch so breit wie das Kästchen; der Kopf zeigt ein Symbol statt des Worts „Auswahl“.
- **Übersicht:** Neue Karte „Backup-Schutz“ neben System und Datenbank: letztes Backup, letzter automatischer Lauf und Gesamtergebnis der Prüfungen, mit Link zu den Details.
- **Übersicht:** Hinweise, „Seit dem letzten Scan“ und der Inventarstatus stehen in einer dreispaltigen Zeile; darunter System und Datenbank.
- **Übersicht:** „Seit deinem letzten Besuch“ steht jetzt in der Fußzeile von „Was muss ich jetzt tun?“, rechts neben den Wartungszielen, und nicht mehr lose zwischen den Karten. Der Text hatte „vor“ doppelt („vor vor 41 Min.“).
- **Übersicht:** „Wichtigste Befunde“ ist in „Was muss ich jetzt tun?“ aufgegangen: die Zeile „Ausfälle“ klappt auf und zeigt die betroffenen Integrationen, „Einzelne Befunde“ steht als aufklappbarer Bereich unter „Bald“, und „Alle Befunde“ ist ein Link im Kopf der Karte.
- **Zugangsdaten:** Die Kachel „Felder mit Wert“ entfällt; die Zahl steht als Unterzeile unter „Integrationen mit Zugangsdaten“.
- **Recorder, Last:** Zeilen, Entitäten und Ereignisse stehen als drei beschriftete Kennzahlen statt in einem Satz; was nicht mitgezählt wird (ausgeblendet, deaktiviert, dauerhaft ausgefallen), steht als eigene Marken mit Erklärung darunter.
- **Reparieren:** Die Karte „Sensorfehler bereinigen“ hat jetzt ihren Titel wie die anderen, und die Titel der Karten tragen den Namen ihrer Kachel („Sensorfehler bereinigen“, „Zähler wechseln“).
- **Übersicht:** Drei Zonen statt zwei Spalten: oben Status und Aufgaben, in der Mitte „Wichtigste Befunde“ (höchstens fünf Zeilen) mit dem Inventarstatus darunter neben den Hinweisen, unten System, Datenbank und Vergleich als Zustandskarten. Die Karte „Nach Objekttyp“ entfällt (das Inventar zeigt die Typen). In der System-Karte steht der Wert jetzt rechts und der Balken darunter.
- **Inventar:** Statt der Kacheln zeigt ein Ring mit Tabelle die Objekttypen: die fünf größten, der Rest auf Knopfdruck. Eine Zeile filtert die Liste, ein zweiter Klick hebt den Filter auf; die Spalten „Nicht verfügbar“ und „Verwaist“ filtern nach Typ und Zustand zugleich.
- **Inventar:** Suche und die Filter Typ, Zustand und Herkunft stehen in einer Zeile; auf schmalen Bildschirmen brechen sie um.
- **Speicher:** Die Kacheln Speicher, Arbeitsspeicher, Prozessor und Swap zeigen eine Kurve der letzten Tage (ein Wert alle fünf Minuten, sieben Tage lang gehalten; beim Prozessor auch die Spitze). Eine Stunde nach der Installation erscheint die erste Kurve.
- **Speicher:** Die zwei Kacheln „Belegung“ und „Sonstiges“ sind weg; drei Chips (Nach Kategorie, Nach Ordner, Weitere) wählen die Liste, jede mit eigener Überschrift.
- **Start von Home Assistant:** Das Banner nennt den Schritt (Home Assistant lädt, Wartezeit mit Countdown, abschließender Scan mit Fortschritt) statt nur „startet noch“.
- **Blueprints und Detailseite:** Jede Blueprint-Art ist ein Bereich mit Zahl (offen nur, wenn es Funde gibt); auf der Detailseite einer Entität oder eines Geräts ist „Umbenennen und Bereich“ eingeklappt.
- **Übersicht:** „Braucht Aufmerksamkeit“ steht vor dem Zustand des Bestands.
- **Batterien in Reitern:** Die Liste steht allein, die Prognose und die Arten der Batterien sind eigene Reiter, sobald es etwas zu zeigen gibt.
- **Änderungen als Bereiche:** Jede Kategorie (Statuswechsel, neue und behobene Befunde, neue und entfernte Objekte) ist ein einklappbarer Bereich mit Zahl; die Kacheln oben öffnen genau diese Kategorie.
- **Ausfälle und Recorder-Kosten kürzer:** Bei vielen Ursachen lässt sich die Karte einklappen, und die Statistik unter den Recorder-Kosten ist ein eingeklappter Bereich mit Zahl.
- **Läufe ohne zweite Liste:** Die Befunde („nie erfolgreich“, „bricht ab“ …) stehen jetzt in der Tabelle unter dem Namen; die Kachel „Auffällig“ filtert sie. Die möglichen Konflikte stehen eingeklappt mit Zahl unter der Tabelle.
- **Kacheln erkennbar:** Eine Zahl ohne Klick ist flach, ein Filter trägt einen Trichter und ist markiert (mit Haken), solange er wirkt, ein Link auf eine andere Seite einen Pfeil. Ein zweiter Klick hebt jeden Filter wieder auf, die Liste kommt ins Bild, und über der Liste steht „Filter aktiv“ mit „Zurücksetzen“.
- **Reparieren wie Aufräumen:** Die Aufgaben stehen als kompakte Kacheln oben und bleiben beim Arbeiten stehen; ein Wechsel braucht kein „Zurück“ mehr. Der Hinweis zum bestätigten Plan sitzt auch hier hinter dem farbigen (i).
- **Kein Kopieren-Knopf mehr in den Listen:** Das Viereck beim Daraufzeigen verdeckte Namen und IDs; die ID lässt sich direkt markieren.
- **Automationen: Diagnose auf der Detailseite:** Die Spalte „Diagnose“ in der Übersicht entfällt; die Zeile öffnet die Detailseite, die einen Reiter „Diagnose“ hat (Blickwinkel, Erfolgskriterien, Verbessern, Ablaufverfolgung). Skripte zeigen dort ihre vier Blickwinkel.
- **Recorder-Kosten als Tabelle:** Die Einträge stehen in einer sortierbaren Liste mit Balken für den Anteil und Spalten für Gesamt, 24 Stunden, 7 Tage und Durchschnitt pro Tag; klickbare Kacheln (Alle, Vorschläge, Ausgeschlossen, Nicht verwendet), Filter und CSV-Export.
- **Schutzmodus startet schreibgeschützt:** Eine neue Installation beginnt im Modus „nur lesen“; Änderungen schaltest du unter Einstellungen → Sicherheit bewusst frei. Bestehende Installationen behalten „voll“.
- **Zuverlässigkeit: Setup-Fehler:** Die Integrationen-Tabelle hat eine sortierbare Spalte „Setup-Fehler“ und eine Kachel dazu; die Detailseite nennt einen möglichen Grund (Gerät offline, Zugang, zu früher Start, Neustart nötig).
- **Zuverlässigkeit als Tabellen:** Integrationen und instabile Entitäten stehen in sortierbaren Listen (Verfügbarkeit, Ausfälle, längster Ausfall, letzte Störung, Veränderung; Episoden, pro Tag, Dauer, Muster) mit klickbaren Kacheln, Filtern und CSV-Export.
- **Recorder: Auffälligkeiten als Tabelle:** Die Auffälligkeiten stehen in einer sortierbaren Liste (Zeilen pro Tag, lauteste Stunde, Anteil ohne neuen Zustand) mit klickbaren Kacheln und Filtern; ein Klick auf die Zeile öffnet die Details, mehrere Entitäten lassen sich per Checkbox für den Ausschluss auswählen.
- **Automationen: neue Übersicht:** Der Reiter „Übersicht“ (vorher „Qualität“) listet alle Automationen mit Status, Läufen, Fehlern und den sieben Blickwinkeln, auch deaktivierte und nie gelaufene. Die Liste hat Suche, Filter, Sortierung nach jeder Spalte, Seitenumbruch und CSV-Export; die Zeile öffnet die Detailseite. Die Kacheln oben sind klickbar und filtern, ebenso die Kacheln unter „Läufe“.
- **Ruhigere Seitenköpfe:** Speicher & System, Zugriffe & Datenfluss, Zugangsdaten, Zuverlässigkeit, Freigaben, Richtlinien, Läufe, Recorder und Wartung zeigen den Untertitel unter dem Titel und eine schmale Zeile mit „Stand“ und „Aktualisieren“; die Reiterkacheln sind flacher.

### Neu

- **Eigene Batterietypen:** Ein Typ, den du bei einem Sensor eintippst, bleibt gespeichert und steht bei allen Sensoren in der Auswahl. Unter der Batterieliste lassen sich eigene Typen hinzufügen, umbenennen und löschen; eingebaute und genutzte Typen bleiben. Die Einkaufsliste zählt sie wie bisher mit.
- **Ausfälle als Kette:** Eine gestoppte App, die Integration, die an ihr hängt, ein Gerät dieser Integration und dessen Entitäten bilden jetzt eine Kette: die Ursache steht oben und trägt die Folgen. Ein Gerät, dessen Entitäten alle nicht verfügbar sind (mindestens drei), ist ein eigener Befund „Gerät ganz ausgefallen“ und lässt sich wie eine Integration als bekannt, zurückgestellt oder ausgeblendet markieren. Eine fehlende Entität, ein fehlendes Gerät oder ein fehlender Bereich, auf den mindestens zwei Automationen, Skripte oder Dashboards verweisen, steht wie ein fehlender Dienst als eine Ursache.
- **Suche nach Seiten und Filtern:** Die Suche oben findet jetzt auch Seiten (auch die Reiter der Einstellungen, auf Deutsch und Englisch, mit Stichwörtern wie „Backup“ oder „dunkel“) und Filter („Befunde: Bekannt“, „Bestand: Nicht verfügbar“ mit der Zahl dahinter) vor den Objekten; Pfeiltasten und Enter gelten über alle Treffer.
- **Prüfabdeckung:** Housekeeper zeigt jetzt, welche Quellen der letzte Scan gelesen hat: eine Zeile in der Übersicht („Prüfung: 5 von 6 Quellen“, gelb mit den Namen, wenn etwas fehlt) und eine Liste in Einstellungen, Info mit Zustand und Grund je Quelle (Register, Automationen, Dashboards, Energie-Dashboard, Apps, Langzeitstatistik, Datenbank). Der Scan-Zustandssensor nennt die nicht gelesenen Quellen. Objekte einer Quelle, die ein Scan nicht lesen konnte, zählen im Vergleich weder als neu noch als entfernt; ein beendeter Befund nennt die nicht gelesene Quelle.
- **Gespeicherte Ansichten:** Auch eine reine Sortierung (Spalte oder Richtung) lässt sich jetzt als Ansicht speichern. Der Knopf erscheint, sobald sich Suche, Filter oder Sortierung von der Standardliste unterscheiden, bei gewählter Ansicht nur, wenn sich etwas gegenüber dieser Ansicht geändert hat.
- **Einstellungen, Info:** „Was Housekeeper speichert“ listet jetzt alle eigenen Dateien mit Zweck, Größe und letzter Änderung, in Gruppen und mit der Gesamtgröße. Es werden nur Art und Größe gezeigt, nie Inhalte.
- **Scan-Zustand:** Schlägt ein Scan fehl oder bleibt er lange aus, zeigt das Panel ein Band mit der Phase und dem letzten erfolgreichen Scan; die Zahlen stammen dann von einem älteren Stand. Ein neuer Diagnose-Sensor „Scan-Zustand“ (in Ordnung, veraltet, fehlgeschlagen, vorläufig) steht für Dashboards und Automationen bereit, und bei anhaltendem Problem erscheint ein Reparaturhinweis.
- **Skripte als eigener Reiter:** Unter „Automationen“ listet der Reiter „Skripte“ alle Skripte mit Läufen, Fehlern, vier Blickwinkeln und der Spalte „Aufgerufen von“ (Automationen und Skripte, die das Skript nutzen); Skripte ohne Aufrufer sind schnell zu finden.
- **Helfer im Inventar:** Der Typfilter hat die Auswahl „Helfer“ (Helfer mit Eintrag und Helfer-Entitäten) mit den Spalten „Verwendet von“ und „Zuletzt geändert“ und einer Auswahl für vermutlich ungenutzte Helfer; Schimmelindikator und Bayes-Sensor werden auf fehlende Quellen geprüft.
- **Risikostufe mit Begründung:** Bei Zugriffe & Datenfluss sagt eine Legende, was Hoch, Mittel und Niedrig bedeuten; die Stufe nennt beim Daraufzeigen den Grund, und die Detailseite einer Integration schreibt ihn aus.
- **Custom Cards mit Status:** Die Liste der Dashboard-Ressourcen zeigt, ob die Datei fehlt, ob ein Dashboard die Karte nutzt oder ob das nicht zu erkennen ist.
- **Speicher & System** (Betrieb): Belegung von Datenträger, RAM und CPU und ein Reiter „Belegung“ mit Umschalter zwischen Kategorie und Ordnern unter `/config`. Apps und Custom-Integrationen stehen unter „Apps & Integrationen“.
- **Zugriffe & Datenfluss** (Sicherheit): Systemzugriffe und Cloud-Datenfluss der Integrationen mit Risikostufe, mit Supervisor auch die Rechte der Apps.
- **Zugangsdaten** (Sicherheit): welche Integrationen Passwörter, Tokens oder Schlüssel gespeichert haben und ob ein Wert hinterlegt ist. Werte zeigt Housekeeper nie.
- **Ausfälle statt drei Listen:** Eine Integration mit Problem steht jetzt auch ohne auffällige Entitäten unter „Befunde“ (Block „Ausfälle“). Auf der Übersicht gibt es dafür eine Zeile, „Benötigt Aufmerksamkeit“ heißt „Wichtigste Befunde“ (Ausfälle zuerst), die Karte „Integrationen mit Problemen“ entfällt.
- **Menü neu geordnet:** Neue Gruppe „Sicherheit“ (Freigaben, Zugriffe & Datenfluss, Zugangsdaten). Speicher & System steht unter Betrieb. Aufräumen, Reparieren und Journal bilden die Gruppe „Bereinigen“, „Erkunden“ heißt „Bestand“ (Inventar, Abhängigkeiten, Änderungen). Die Leiste hat damit sieben Einträge.
- **Übersicht zeigt das System:** Neue Karte „System“ mit Datenträger, Speicher und Prozessor. Ab 75 % belegtem Datenträger steht eine Aufgabe in der Liste, ab 90 % eine dringende.
- **Reiter „Zugriffe & Daten“** auf der Detailseite einer Integration: Systemzugriff, Datenfluss und Zugangsdaten (nie ein Wert); bei hohem Systemzugriff eine rote Zeile in der Übersicht.
- **Apps als Objekte:** Mit Supervisor stehen installierte Apps im Inventar (Status, Version, Update) und haben eine Detailseite mit Rechten, Last und Speicher. Keine Befunde, keine Änderungen an Apps.
- **Apps und Integrationen:** Hängt eine Integration vermutlich an einer App (Hostname in der Konfiguration), zeigt die App den Reiter „Beziehungen“. Die Zuordnung ist immer „vermutet“.
- **Befund „App gestoppt“:** Ist eine App gestoppt und fällt eine Integration aus, die vermutlich daran hängt, meldet Housekeeper das.
- **Befund „Integration nicht geladen“:** Ein aktiver Eintrag, der länger als eine Stunde nicht geladen ist, steht jetzt in den Befunden, mit der Ursache von Home Assistant.
- **Vermerke für Integrationen und Apps:** „Absichtlich offline“, „Saisonal“ und „Reservegerät“ blenden die Ausfall-Befunde aus.
- **Ausfälle:** Die Karte „Ausfälle“ bietet „Bekannt“, „Zurückstellen“ und „Ausblenden“ für nicht geladene Integrationen; ein Befund steht nicht mehr doppelt in der Liste.
- **Zahlen im Menü:** Wartung (verfehlte Ziele) und Richtlinien (Verstöße) zeigen eine Zahl; Bestand nicht mehr.
- **Blockierte Automationen:** Eine Automation, deren Auslöser alle auf ausgefallene Entitäten zeigen, wird als Befund gemeldet.
- **Fehlende Dienste:** Automationen und Skripte, die einen Dienst aufrufen, den es nicht mehr gibt, werden als Befund gemeldet; rufen mehrere denselben auf, steht er als eine Ursache in den Ausfällen.
- **Fehlende Tags:** Eine Automation, die auf einen Tag (NFC/QR) wartet, den es nicht mehr gibt, wird als Befund gemeldet.
- **Richtlinien für den Zugang:** Drei neue Regeln (aus) weisen auf eine Anmeldung ohne Passwort für ein öffentliches Netz (`trusted_networks`), eine externe URL mit `http://` und vertrauenswürdige Proxys mit öffentlichem Netz hin. Normale private Netze werden nicht gemeldet.
- **Richtlinien für Benutzer:** Drei neue Regeln (aus): Benutzer, die sich lange nicht oder nie angemeldet haben, alte Langzeit-Tokens (nur das Alter, denn Home Assistant merkt sich die Nutzung nicht) und Langzeit-Tokens abgeschalteter Konten. Nie ein Token-Wert.
- **Richtlinie für Companion-App-Geräte:** Neue Regel (aus): ein Handy mit der Companion App, von dem seit mindestens 30 Tagen kein beobachteter Sensor etwas gemeldet hat, meist ein altes Handy mit stehengebliebenem Eintrag.
- **Richtlinien für HACS:** Zwei neue Regeln (aus): eine über HACS installierte Integration, deren GitHub-Repository archiviert ist, und eine mit wartendem Update, das eine neuere Home-Assistant-Version braucht. Die Integrationsseite zeigt beides am HACS-Kasten.
- **Fehler aus dem Log:** Bei einer nicht geladenen Integration und bei ausgefallenen Entitäten steht jetzt, wie oft Home Assistant für die Integration einen Fehler oder eine Warnung ins Log geschrieben hat und wann zuletzt. Nur Zahlen und Zeiten, nie der Text.
- **Verweise ersetzen prüft Automationen:** Home Assistant muss die geänderte Automation annehmen und nach dem Neuladen laden, sonst bleibt die Datei unverändert.
- **Automationen ohne Wirkung:** Befunde für Automationen und Skripte, deren Aktionen alle auf ausgefallene Entitäten zielen, und für Bedingungen, die nie wahr werden. Eine blockierte Automation lässt sich per Plan ausschalten.
- **Webhooks:** Zugriffe & Datenfluss zeigt, welche Automationen ein Webhook starten kann und ob er auch von außen erreichbar ist.
- **Vorher/nachher:** Der Reiter „Läufe“ vergleicht Fehler vor und nach einer Änderung der Konfiguration.
- **Seitenleisten-Knopf:** öffnet die Seitenleiste von Home Assistant, wenn sie ausgeblendet ist.
- **Apps & Integrationen** (Bestand): Apps (mit CPU, RAM und Daten) sowie Core- und Custom-Integrationen in eigenen Reitern, mit Version, Status, Entitäten und Geräten; der belegte Speicher der Apps und der Custom-Integrationen steht summiert in Kachel und Reiter. Im Inventar gibt es dazu einen Filter „Core / Custom“.
- **Seite einer Integration:** Core und Custom haben eine eigene Detailseite mit allen Einträgen, Entitäten und Geräten, Zuverlässigkeit sowie Zugriffen und Daten; bei Custom auch Ordner und Größe.
- **HACS-Updates:** Bei Custom-Integrationen, die HACS installiert hat, zeigen die Seite der Integration und die Liste „Apps & Integrationen“ die installierte und die neueste Version samt Hinweis auf ein Update; die Liste lässt sich danach filtern. Bei Apps zeigt die Liste die neueste Version, eine Kachel „App-Updates“ und einen Filter „Update verfügbar“.
- **Sonstiges** (Speicher & System): Custom Cards, Blueprints und die übrigen Ordner und Dateien unter `/config` stehen in einem Reiter.

### Behoben

- **Befunde:** Ausfälle (Integration, Gerät, App) lassen sich in der Liste wieder ankreuzen, um sie gesammelt auszublenden, als bekannt zu markieren oder zurückzustellen.
- **Abhängigkeiten:** Dieselbe Entität, die eine Automation an vielen Stellen nennt, steht nur noch einmal in der Liste („12 Stellen“, die Orte beim Darüberfahren). Objekte ohne eigenen Eintrag im Inventar (zum Beispiel `sun.sun`) zeigen „Nicht im Inventar“ statt „Fehlt“; „Fehlt“ steht nur noch, wo ein Befund es belegt.
- **Defekte Referenzen:** „Label ergänzen“ erscheint dort nicht mehr (Reiter „Aktionen“, Sammelleiste der Befunde). Die Ursache ist ein Satz: „Automation X verweist auf Y, das es nicht mehr gibt.“
- **Befunde:** Über dem Titel stand die Überschrift „Aktionen“, ein Rest der Menügruppe, die nur noch aus „Befunde“ besteht. Sie entfällt, ebenso als Pfad in der Suche.
- **Menüleiste:** Auf Fenstern, die für alle Menüpunkte zu schmal sind (etwa zwischen 860 und 1400 Pixeln), wurde die Leiste rechts abgeschnitten. Sie wechselt jetzt in den „Menü“-Knopf mit einer Liste darunter, sobald sie nicht passt, und zeigt wieder die volle Leiste, wenn der Platz reicht.
- **Scan-Verlauf:** „Je Tag der letzte Scan“ zählt den Tag jetzt in der Zeit von Home Assistant statt in UTC. Vorher konnten zwei Scans desselben Tages nebeneinander stehen und ein anderer Tag fehlen; bereits gespeicherte Doppel verschwinden beim Laden.
- **Sammelaktionen bei Befunden:** Scheitert eine Anfrage mitten in einer Auswahl, bleiben die fehlgeschlagenen Befunde ausgewählt und das Formular offen; die Meldung nennt „x von y erledigt“. Ein neuer Versuch sendet nur die übrigen.
- **Gespeicherte Ansichten:** Ist die Grenze von zehn Ansichten erreicht, überschreibt eine neue Ansicht nicht mehr still die letzte, sondern weist darauf hin.
- **Darstellung:** Gesperrte Knöpfe drehen ihr Symbol nur noch bei laufender Arbeit, nicht mehr bei fehlender Auswahl; Grün und Gelb folgen überall dem Theme; die Tabellen „Nach Objekttyp“ und Backups tragen auf dem Handy ihre Spaltenbezeichnungen.
- **Übersicht:** „Schwache Batterien: Ziel verfehlt“ führt jetzt zu „Pflegen → Batterien“ statt zum Inventar.
- **Recorder aufräumen:** Statistiken löschen und Verlauf kürzen laufen für jede Entität einzeln: Scheitert eine, laufen die übrigen weiter und der Grund steht bei der betroffenen. Vorher stoppte der Lauf nach dem ersten Fehler. Bei einem gemeinsamen Problem (Recorder beschäftigt oder nicht verfügbar) stoppt er weiter.
- **Verweise ersetzen, Umbenennen:** Betreffen mehrere Schritte eines Plans dieselbe Automation oder dieselbe Quelle, brach der Lauf nach dem ersten Schritt mit „Eine Konfiguration wurde nach der Vorschau geändert“ ab. Die eigenen Änderungen früherer Schritte zählen jetzt nicht mehr als fremde Änderung.
- **Kacheln der Unterseiten:** Das Symbol sitzt jetzt mittig in der Kachel und hat mehr Abstand zum Text.
- **Webhooks:** Hat eine Automation mehrere Webhook-Auslöser, gilt sie als offen, sobald einer von außen erreichbar ist (vorher zählte nur der erste). Deaktivierte Automationen sind gekennzeichnet und zählen nicht als offen.
- **Pläne:** Ein einzelner fehlgeschlagener Statusabruf beendet die Fortschrittsanzeige nicht mehr; sie versucht es erneut und weist darauf hin. Ein fehlgeschlagener Abbruch meldet das jetzt.
- **Reparaturhinweise:** Nur nicht verfügbare, verwaiste und defekte Verweise lösen noch einen Hinweis aus; andere Befunde (zum Beispiel eine nicht geladene Integration) erscheinen nicht mehr unter „nicht verfügbare Entitäten“.
- **Läufe: Klick auf „Fehler“:** Die Karte oben zeigte „Keine Treffer“, obwohl die Tabelle darunter die Automationen mit Fehlern auflistete; die leere Meldung entfällt jetzt.
- Unter einem Ausfall zeigte die Karte „Ausfälle“ höchstens 20 Folgebefunde, auch wenn die Zahl mehr nannte. Jetzt gibt es Seiten.

### English

#### Changed

- **More compact menu bar:** So the bar at the top gets narrower and has to switch to the “Menu” button less often, it was rebuilt: “Housekeeper” with the word “Overview” below it is now the way to the overview and replaces the “Overview” menu item, and Settings is only the gear in the bar (the name shows as a tooltip and in the list of the menu button). The search field is a little wider for that.
- **Findings as one list:** The Findings page no longer has the separate groups “Outages” and “Single findings”. Every row is an object with its type; one with follow-ups carries a red counter (“12 follow-ups”, below it “explains 12 more findings”) and opens its chain: app, integration, device, entities, each with its own counter. The filter “With follow-ups” shows only those entries, “Flat list” shows every finding on its own and names the cause (“Follow-up of …”).
- **Overview “What do I have to do now?” in three areas:** **Findings** shows the first five entries of the same list as the Findings page (a chain is one row with a red counter, “All findings (n)” leads to the list), **State** shows backup, disk and an outdated scan (urgent ones take points off the status) and **Maintenance** shows goals, reminders and quarantine: never urgent, folded with a count while something else needs attention. Missed goals read in plain text (“Weak batteries: now 2 · allowed: none”, goal missed). Areas without rows are left out.
- **“Done” tab:** “Fixed lately” is now “Done” and shows events instead of objects, for 7, 30 or 90 days: “Fixed by a plan” (with the kind of change, the number of objects, the time and whether it can be undone) and “Ended by itself”. The latter holds findings that vanished without a plan: “Back in order by itself” counts as done, “Object removed”, “Source not read” and “Reason unknown” do not, because nothing was fixed there. The number of objects of a plan is no longer capped at 300.
- **Status as a score:** The Housekeeping status is now a score out of 100. Every entry of the findings list takes points off by its impact (high 5, medium 2, low 1, each capped), urgent state topics such as the backup or a nearly full disk take 10 each; follow-ups of an outage do not count extra. Green from 90, yellow from 70, red below; an entry with high impact turns the ring at least yellow. The number of objects with a finding is shown beside it, and a click on the ring shows the calculation. The new value replaces the old one without a transition: the curve in the overview has a kink at this point.
- **Storage and runtime:** The "Storage & system" page no longer reads the folder sizes on every visit: a result is reused for up to 5 minutes, also across browsers, and "Refresh" reads again only after 30 seconds. The page shows when the sizes were measured. Settings, Info lists the duration of the last scan per phase, the longest first.
- **Detail pages:** What you decided about an object now shows in a band above the tabs: a finding marked as known, snoozed or hidden with kind, date and reason (with "Take back") and a mark (with "Change" and "Remove"). The card "Known about …" names the same decision instead of "The finding is hidden".
- **Changes:** The scan history first shows only the newest rows so the result of the comparison stays visible; "Show all" opens the whole list. The "Compare with" choice sits in the head of the history, stored scans carry the weekday in their title, and a sentence explains the bar.
- **End of a finding:** "Resolved findings" now counts only findings whose object still exists. A finding that disappears because its object was removed, the check (for example of a dashboard or the apps) could not read it, or a setting such as the outage duration changed is listed under "Ended without a repair" with the reason. The "resolved" number can therefore be smaller than before.
- **Recorder, load:** Rows, entities and events are three labelled figures instead of one sentence; what is not counted (hidden, disabled, down all the time) shows as marks of its own with an explanation.
- **Repair:** The “Repair sensor errors” card now has its title like the others, and the card titles carry the name of their tile (“Repair sensor errors”, “Replace a meter”).
- **Overview:** Three zones instead of two columns: status and tasks on top, “Top findings” (five rows at most) with the inventory status below it beside the notes in the middle, and system, database and comparison as state cards at the bottom. The “By object type” card is gone (the inventory shows the types). In the System card the value now sits on the right and the bar below it.
- **Inventory:** A ring with a table replaces the tiles and shows the object types: the five largest, the rest on request. A row filters the list and a second click lifts the filter; the unavailable and orphaned columns filter by type and state together.
- **Inventory:** The search and the type, state and origin filters sit in one row; on narrow screens they wrap.
- **Storage:** The disk, memory, CPU and swap tiles show a line of the last days (one value every five minutes, kept for seven days; the CPU also shows its peak). The first line appears an hour after installing.
- **Storage:** The two tiles “Usage” and “Other” are gone; three chips (By category, By folder, More) pick the list, each with its own heading.
- **Home Assistant start:** The banner names the step (Home Assistant loading, waiting time with a countdown, final scan with progress) instead of just “still starting”.
- **Blueprints and detail page:** Each blueprint kind is a section with its number (open only when there are findings); on the detail page of an entity or device "Rename and area" is folded.
- **Overview:** "Needs attention" comes before the state of the inventory.
- **Batteries in tabs:** The list stands alone; the forecast and the kinds of batteries are tabs of their own as soon as there is something to show.
- **Changes as sections:** Each category (status changes, new and resolved findings, new and removed objects) is a foldable section with its number; the tiles above open exactly that category.
- **Outages and recorder costs shorter:** With many causes the card can be folded, and the statistics under the recorder costs are a folded section with its number.
- **Runs without a second list:** The findings ("never succeeded", "fails" …) are shown in the table under the name; the "Flagged" tile filters them. The possible conflicts sit folded with their number under the table.
- **Recognisable tiles:** A number without a click is flat, a filter has a funnel and is marked (with a check) while it is on, a link to another page has an arrow. A second click lifts every filter, the list comes into view, and above the list "Filter on" with "Reset" says what is filtered.
- **Repair like cleanup:** The tasks are compact tiles on top and stay there while working; changing the task no longer needs "Back". The note about the confirmed plan sits behind the coloured (i) here too.
- **No copy button in the lists any more:** The square shown on hover covered names and IDs; the ID can be selected directly.
- **Automations: diagnosis on the detail page:** The "Diagnosis" column of the overview is gone; the row opens the detail page, which has a "Diagnosis" tab (views, success criteria, improve, trace tools). Scripts show their four views there.
- **Recorder costs as a table:** The entries are a sortable list with a bar for the share and columns for total, 24 hours, 7 days and average per day; clickable tiles (All, Suggestions, Excluded, Not used), filters and CSV export.
- **Protection mode starts read-only:** A new install begins in "read only"; you release changes on purpose under Settings → Security. Existing installs keep "full".
- **Reliability: setup failures:** The integrations table has a sortable "Setup failures" column and a tile for it; the detail page names a possible cause (device offline, access, starting too early, restart needed).
- **Reliability as tables:** Integrations and unstable entities are sortable lists (availability, outages, longest outage, last disruption, change; episodes, per day, duration, pattern) with clickable tiles, filters and CSV export.
- **Recorder: findings as a table:** The findings are a sortable list (rows per day, loudest hour, share without a new state) with clickable tiles and filters; clicking a row opens the details, and several entities can be ticked for exclusion.
- **Automations: new overview:** The "Overview" tab (formerly "Quality") lists every automation with state, runs, errors and the seven views, including disabled ones and ones that never ran. The list has search, filters, sorting by any column, paging and CSV export; a row opens the detail page. The tiles above are clickable and filter, and so are the tiles under "Runs".
- **Calmer page headers:** Storage & system, Access & data flow, Credentials, Reliability, Exposure, Policies, Runs, Recorder and Maintenance show the subtitle under the title and a slim line with "As of" and "Refresh"; the tab tiles are flatter.

#### New

- **Own battery types:** A type you enter for one sensor stays saved and is offered for every sensor. Below the battery list you can add, rename and delete own types; built-in and used types stay. The shopping list counts them as before.
- **Outages as a chain:** A stopped app, the integration that depends on it, a device of that integration and its entities now form a chain: the cause stands on top and carries the follow-ups. A device whose entities are all unavailable (at least three) is a finding of its own, “Device is down completely”, and can be marked as known, snoozed or hidden like an integration. A missing entity, device or area that at least two automations, scripts or dashboards point to stands as one cause, like a missing service. The Findings page still shows this as a flat list; the presentation follows.
- **Search for pages and filters:** The search at the top now also finds pages (including the tabs of Settings, in German and English, with keywords such as “backup” or “dark”) and filters (“Findings: Known”, “Inventory: Unavailable” with the count) ahead of the objects; arrow keys and Enter work across all hits.
- **Check coverage:** Housekeeper now shows which sources the last scan read: a line in the overview ("Check: 5 of 6 sources", yellow with the names when something is missing) and a list in Settings, Info with the state and reason per source (registry, automations, dashboards, Energy dashboard, apps, long-term statistics, database). The scan health sensor names the sources that were not read. Objects of a source a scan could not read count neither as new nor as removed in the comparison; an ended finding names the source that was not read.
- **Saved views:** A sort alone (column or direction) can now be saved as a view. The button appears as soon as the search, a filter or the sort differs from the default list, and with a view chosen only when something differs from that view.
- **Settings, Info:** "What Housekeeper stores" now lists all of its own files with purpose, size and last change, in groups and with the total size. Only kind and size are shown, never contents.
- **Scan health:** If a scan fails or does not run for a long time, the panel shows a banner with the phase and the last successful scan; the numbers then come from an older state. A new diagnostic sensor "Scan health" (OK, outdated, failed, preliminary) is available for dashboards and automations, and a lasting problem raises a repairs hint.
- **Scripts in a tab of their own:** Under "Automations" the "Scripts" tab lists every script with runs, errors, four views and a "Called by" column (the automations and scripts that use the script), so scripts nobody calls are easy to find.
- **Helpers in the inventory:** The type filter has a "Helpers" choice (helpers with a config entry and helper entities) with the columns "Used by" and "Last changed" and a choice for helpers that are probably unused; mold indicator and Bayesian sensor are checked for missing sources.
- **Risk level with a reason:** In Access & data flow a legend explains what High, Medium and Low mean; pointing at a level shows the reason, and the detail page of an integration spells it out.
- **Custom cards with a status:** The list of dashboard resources shows whether the file is missing, whether a dashboard uses the card, or that this cannot be told.
- **Storage & system** (Operation): disk, RAM and CPU use and a "Usage" tab that switches between category and folders under `/config`. Apps and custom integrations are under "Apps & integrations".
- **Access & data flow** (Security): system access and cloud data flow of the integrations with a risk level, with a Supervisor also the rights of the apps.
- **Credentials** (Security): which integrations store passwords, tokens or keys and whether a value is set. Housekeeper never shows the values.
- **Outages instead of three lists:** An integration with a problem now appears under "Findings" even when no entity is flagged (block "Outages"). The overview has one row for it, "Needs attention" is now "Most important findings" (outages first), and the card "Integrations with problems" is gone.
- **Menu reordered:** New group "Security" (Exposure, Access & data flow, Credentials). Storage & system is under Operation. Clean up, Repair and Journal form the group "Clean up", "Explore" is now "Catalog" (Inventory, Dependencies, Changes). The bar has seven entries.
- **Overview shows the system:** a new "System" card with disk, memory and processor. A task appears once the disk is 75 % full, an urgent one at 90 %.
- **Tab "Access & data"** on the detail page of an integration: system access, data flow and credentials (never a value); a red line in its overview for a high system access.
- **Apps as objects:** With a Supervisor, installed apps are in the inventory (status, version, update) and have a detail page with rights, load and storage. No findings, no changes to apps.
- **Apps and integrations:** If an integration probably depends on an app (host name in its configuration), the app shows the tab "Relations". The match is always "probable".
- **Finding "App stopped":** If an app is stopped and an integration that probably depends on it fails, Housekeeper reports it.
- **Finding "Integration not loaded":** An active entry that has not been loaded for more than an hour now appears in the findings, with the cause from Home Assistant.
- **Marks for integrations and apps:** "Offline on purpose", "Seasonal" and "Spare device" hide the outage findings.
- **Outages:** The "Outages" card offers "Mark as known", "Snooze" and "Hide" for integrations that are not loaded; a finding no longer appears twice in the list.
- **Numbers in the menu:** Maintenance (missed goals) and Policies (violations) show a number; Inventory no longer does.
- **Blocked automations:** An automation whose triggers all point to failed entities is reported as a finding.
- **Missing services:** Automations and scripts that call a service that no longer exists are reported as a finding; if several call the same one, it appears as one cause in the outages.
- **Missing tags:** An automation that waits for a tag (NFC/QR) that no longer exists is reported as a finding.
- **Access policies:** Three new rules (off) point out a login without password for a public network (`trusted_networks`), an external URL with `http://` and trusted proxies with a public network. Ordinary private networks are not reported.
- **User policies:** Three new rules (off): users who have not logged in for a long time or never, old long-lived tokens (the age only, because Home Assistant does not record their use) and long-lived tokens of switched-off accounts. Never a token value.
- **Companion app policy:** New rule (off): a phone with the companion app from which no watched sensor has reported for at least 30 days, usually an old phone with a leftover entry.
- **HACS policies:** Two new rules (off): an integration installed through HACS whose GitHub repository is archived, and one with an update waiting that needs a newer Home Assistant. The integration page shows both in the HACS box.
- **Errors from the log:** For an integration that is not loaded and for failed entities, the page now says how often Home Assistant logged an error or warning for the integration and when last. Numbers and times only, never the text.
- **Replace references checks automations:** Home Assistant has to accept the changed automation and load it after the reload, otherwise the file stays as it was.
- **Automations without effect:** Findings for automations and scripts whose actions all target failed entities, and for conditions that can never be true. A blocked automation can be switched off with a plan.
- **Webhooks:** Access & data flow shows which automations a webhook can start and whether it can also be reached from outside.
- **Before/after:** The "Runs" tab compares errors before and after a change to the configuration.
- **Sidebar button:** opens Home Assistant's sidebar when it is hidden.
- **Apps & integrations** (Inventory): apps (with CPU, RAM and data) and core and custom integrations in tabs of their own, with version, status, entities and devices; the disk space of the apps and of the custom integrations is shown as a sum in the tile and the tab. The inventory also has a "Core / Custom" filter.
- **Page of an integration:** core and custom integrations have their own detail page with all entries, entities and devices, reliability, and access and data; for custom ones also the folder and its size.
- **HACS updates:** For custom integrations installed by HACS, the integration page and the "Apps & integrations" list show the installed and the newest version with a note about an update; the list can be filtered by it. For apps the list shows the newest version, an "App updates" tile and an "Update available" filter.
- **Other** (Storage & system): custom cards, blueprints and the remaining folders and files under `/config` share one tab.

### Fixed

- **Findings:** Outages (integration, device, app) can be ticked in the list again, to hide, mark as known or snooze them together.
- **Relations:** An entity that an automation names in many places now appears once in the list ("12 places", the places on hover). Objects without an inventory entry of their own (for example `sun.sun`) show "Not in inventory" instead of "Missing"; "Missing" only appears where a finding backs it.
- **Broken references:** "Add label" no longer shows there (Actions tab, finding selection bar). The cause is one sentence: "Automation X points to Y, which no longer exists."
- **Findings:** The heading “Actions” above the title was a leftover of the menu group that now consists of “Findings” only. It is gone, also as the path in the search.
- **Menu bar:** On windows too narrow for all menu items (roughly between 860 and 1400 pixels) the bar was cut off on the right. It now changes into the "Menu" button with a list below it as soon as it does not fit, and shows the full bar again when there is room.
- **Scan history:** "the last scan of each day" now counts the day in Home Assistant's time zone instead of UTC. Before, two scans of the same day could sit side by side while another day was missing; doubles already stored disappear on load.
- **Bulk actions on findings:** If a request fails in the middle of a selection, the failed findings stay selected and the form stays open; the message says "x of y done". A retry sends only the rest.
- **Saved views:** When the limit of ten views is reached, a new view no longer silently replaces the last one, but says so.
- **Appearance:** Disabled buttons only spin their icon while work is running, no longer when a selection is missing; green and amber follow the theme everywhere; the "By type" and backup tables show their column labels on a phone.
- **Overview:** "Weak batteries: goal missed" now leads to "Maintain → Batteries" instead of the inventory.
- **Recorder cleanup:** Deleting statistics and trimming history now run per entity: if one fails, the others carry on and the reason is shown on the affected one. Before, the run stopped at the first failure. It still stops on a shared problem (recorder busy or unavailable).
- **Replace references, rename:** When several steps of a plan touched the same automation or source, the run stopped after the first step with "A configuration was changed after the preview". The changes made by earlier steps of the same run no longer count as foreign changes.
- **Sub-page tiles:** The icon is now vertically centred in the tile and has more room to the text.
- **Webhooks:** An automation with several webhook triggers now counts as open as soon as one of them is reachable from outside (before, only the first one counted). Disabled automations are marked and do not count as open.
- **Plans:** A single failed status request no longer ends the progress display; it retries and says so. A failed cancel now reports that.
- **Repairs hints:** Only unavailable, orphaned and broken-reference findings raise a hint; other findings (for example an integration that is not loaded) no longer show up as "unavailable entities".
- **Runs: click on "Errors":** The card on top said "No matches" although the table below listed the automations with errors; the empty message is gone.
- Under an outage the "Outages" card showed at most 20 follow-up findings even when the number said more. It now has pages.

## 1.5.0 - 2026-10-12

Die Änderungen stehen vollständig unter 1.5.1. / The changes are listed in full under 1.5.1.

## 1.4.0 - 2026-10-11

Defekte Referenzen in Dashboards sind jetzt lesbar und gruppiert.

### Neu

- **Defekte Dashboard-Referenzen:** Statt eines Pfads wie `views/12/sections/1/cards/0/…` stehen Tab, Abschnitt und Kartentyp da. Die Referenzen einer Karte sind eine aufklappbare Zeile, und die Diagnose hat eine Zeile je Karte.
- **Vorschläge:** Zu einer fehlenden Entität nennt Housekeeper vorhandene mit ähnlichem Namen („Vielleicht: …“), bei Dashboards, Automationen, Skripten, Szenen und Helfern.
- **Verwaiste Karten:** Ist mehr als die Hälfte der Referenzen einer Karte defekt, weist Housekeeper darauf hin, die Karte ganz zu entfernen.

### Behoben

- Lange Werte in der Diagnose werden nicht mehr mit „…“ abgeschnitten.

### English

Broken references in dashboards are now readable and grouped.

#### New

- **Broken dashboard references:** Instead of a path such as `views/12/sections/1/cards/0/…` you see the tab, section and card type. The references of one card are a single expandable row, and the diagnosis has one row per card.
- **Suggestions:** For a missing entity Housekeeper names existing ones with a similar name (“Maybe: …”), in dashboards, automations, scripts, scenes and helpers.
- **Abandoned cards:** When more than half of a card's references are broken, Housekeeper points out that the whole card can be removed.

#### Fixed

- Long values in the diagnosis are no longer cut off with “…”.

## 1.3.0 - 2026-10-11

Ein Logbuch für eigene Einträge, Objektseiten mit Reitern „Aktionen“ und „Verlauf“, Batterien mit Prognose und Knopfzellen in Volt, Richtlinien direkt am Objekt und ein überarbeiteter Recorder.

### Neu

- **Logbuch:** Die eigenen Einträge sind jetzt ein Logbuch: ein Dialog zum Schreiben, ein Reiter unter „Änderungen“, eine kompakte Karte je Objekt und ein Vorschlag nach einer Aktion. Wird ein Gerät entfernt oder vergessen, schreibt Housekeeper es ins Logbuch, und die Liste der entfernten Geräte zeigt den Eintrag. Der Reiter „Verlauf“ eines Geräts hat keine eigene Notiz mehr (alte Notizen entfallen).
- **Verlauf eines Objekts:** Objekte haben einen Reiter „Verlauf“ mit ihrem Logbuch, den Plänen, die sie nannten, und bei Geräten mit ihrem Lebenslauf; auch das, was Housekeeper bemerkt hat.
- **Scanpunkte:** Aus dem Verlauf der Scans lässt sich ein benannter Scanpunkt setzen. Er bleibt bis zum Löschen und dient als Vergleichsbasis.
- **Objektseiten:** Entität, Gerät, Integration, Automation, Skript und Szene lesen sich auf der Übersicht und ändern Dinge im Reiter „Aktionen“ (Formulare als Zeilen einer Karte, nach Zweck gruppiert). Die Karte „Bekannt“ fasst alles zusammen, mit der Quelle jeder Zeile; die technischen Daten stehen in zwei gleich breiten Spalten. Die Markierung wanderte in den Reiter „Aktionen“.
- **Verlauf kürzen** auch auf der Seite einer Entität: Zustände, Kurz- und Langzeitstatistik zum Anhaken, oder ein Stück Zustände.
- **Entfernen mit Recorder-Daten:** Beim Entfernen von Entitäten wählst du die Recorder-Daten je Entität, mit Voreinstellung, Sperre fürs Energie-Dashboard und Zusammenfassung im Plan.
- **Batterien:** eine Tabelle mit Prognose bis 90 Tage (Zeitfenster) und Bedarf der nächsten 30 Tage; jeder Sensor trägt den Namen seines Geräts. Der Typ kommt, wenn vorhanden, aus Battery Notes (dessen übrige Entitäten zählen nicht mit). Sensoren ohne Wechselbatterie werden aus den anderen Sensoren des Geräts vorgeschlagen und nicht gezählt. Knopfzellen in Volt (CR2016, CR2032, CR2450) zeigen Balken und Prozent aus einer Kurve; „Leer in“ sagt „nicht absehbar“ statt „stabil“.
- **Richtlinien:** Verstöße klappen mit einem Klick auf die Zeile auf, mit Grund und Abhilfe (Umbenennen, Bereich zuweisen, Objekt öffnen, Ausblenden). Die Sammelumbenennung entfällt. Die Übersicht eines Objekts zeigt seine Verstöße mit denselben Abhilfen. Beim Umbenennen startet das Feld leer, Vorschläge sind Knöpfe (der beste „empfohlen“, ein Klick wechselt oder leert).
- **Neue Richtlinie „Entitäts-ID mit Geräteadresse“:** meldet IDs, die aus einer Adresse bestehen (IP in privaten Bereichen, MAC, Funk- oder Zigbee-Adresse wie `eltako_gw1_ff_c2_4a_89`), weil sie nichts über das Gerät sagen und sich ändern können. Der erste Vorschlag ist der Name. Wie alle Richtlinien ist sie zunächst aus.
- **Geänderte Richtlinie „Entitäts-ID mit angehängter Zahl“:** zählt nur noch Zähler bis drei Stellen (`_2` bis `_999`) und überspringt Adress-IDs; `switch.schedule_878149` ist damit kein Fund mehr.
- **Recorder:** Reiter „Auffälligkeiten“ (eine Karte je Entität mit allen Gründen und Schwellen, Filter, Markieren zum Ausschließen) und „Ereignisse“ (Balken, Anteil, Rate pro Tag). Empfohlene Ausschlüsse sind erkennbar, „Nur Vorschläge“ blendet den Rest aus. Integrationen zeigen ihre lautesten Entitäten. Alten Verlauf kürzen sagt, was geht und was bleibt.
- **Gerät austauschen, Zähler wechseln, Verweise ersetzen:** Auswahl per Tippen statt Browser-Liste; Prüfzeilen im Formular, Zusammenfassung der Paare, Modi als Karten mit Folgen und Zeitleiste; die Vorschau zeigt jede Quelle mit alter und neuer Zeile. Reparaturen von Zählern und Zeiträumen sagen, was geprüft wurde und was sich ändert.
- **Wartung:** Erinnerungen mit Fälligkeitstag und Verlauf, als Tabelle; Erinnerungen und Logbuch-Einträge entstehen in einem Dialog. Löschen von Erinnerung, Eintrag, Plan, Ansicht oder Vorlage fragt vorher nach. Die Bestätigungen im Backup-Schutz öffnen per Knopf in der Zeile.
- **Status:** Der Ring zählt Themen; nur dringende ziehen Punkte ab, ein Klick erklärt die Zahl.
- **Übersicht und Graph:** ohne die Kachelkarte „Was möchtest du tun?“; auf dem Handy stehen die drei Kennzahlen in einer Reihe, „Neu scannen“ ist kleiner. Der Graph hat feste Höhe, einklappbare Legende, umbrechende Namen und einen Hinweis auf dem Handy.
- **Export:** zeigt, wie viele Entitäten gewählt sind, und kehrt zur Seite zurück, von der er kam.

### Behoben

- „Keine Wechselbatterie“ aktualisiert die Liste sofort, auch bei Volt-Sensoren; die Batterietabelle öffnet mit allen Batterien statt nur den niedrigen.
- Der Klick auf einen Umbenennen-Vorschlag in den Richtlinien tat nichts.
- Der Rahmen eines Dialogfelds überdeckte den Feldtitel; die Chips in den Dialogen sind gleich groß, haben einen Zeiger, und die gewählte ist erkennbar.
- Backup-Schutz: Pillen stehen in einer Linie, der Knopf unter dem Text.
- Die Automationsseite überlappt keinen Text mehr und stapelt die Laufbalken nicht.
- Die Aufräum-Hinweise der Wirkung nennen jetzt, dass beim Entfernen auch die Statistik gelöscht wird, und die nicht geprüften dynamischen Templates.
- Striche über Hinweisen im ganzen Panel entfernt.

### English

A logbook for your own entries, object pages with "Actions" and "History" tabs, batteries with a forecast and coin cells in volts, policies right at the object and a reworked recorder.

#### New

- **Logbook:** Your own entries are now a logbook: a dialog to write them, a tab under "Changes", a compact card per object and a suggestion after an action. A removed or forgotten device is written to the logbook, and the list of removed devices shows the entry. The "History" tab of a device has no note of its own (old notes are dropped).
- **History of an object:** Objects have a "History" tab with their logbook, the plans that named them and, for devices, their life; also what Housekeeper noticed.
- **Scan points:** From the history of the scans you can set a named scan point. It stays until deleted and serves as a comparison base.
- **Object pages:** Entity, device, integration, automation, script and scene read on the overview and change things in the "Actions" tab (forms as rows of one card, grouped by purpose). The "Known" card sums up everything with the source of each line; the technical data sit in two equal columns. The mark moved to the "Actions" tab.
- **Trim history** on the page of an entity too: states, short-term and long-term statistics to tick, or a stretch of states.
- **Removing with recorder data:** Removing entities chooses the recorder data per entity, with a default, a lock for the Energy dashboard and a summary in the plan.
- **Batteries:** one table with the forecast up to 90 days (windows) and the need of the next 30 days; each sensor carries the name of its device. The type comes from Battery Notes when present (its other entities are ignored). Sensors that are no replaceable battery are proposed from the device's other sensors and not counted. Coin cells in volts (CR2016, CR2032, CR2450) show a bar and a percent from a curve; "Empty in" says "no forecast" instead of "stable".
- **Policies:** violations open with a click on the row, with the reason and the fix (rename, assign an area, open object, hide). The bulk rename is gone. An object's overview shows its violations with the same fixes. Renaming starts with an empty field and suggestions as buttons (the best one "recommended", a click switches or clears).
- **New policy "Entity id with a device address":** reports ids made of an address (IP in private ranges, MAC, radio or Zigbee address such as `eltako_gw1_ff_c2_4a_89`), because they say nothing about the device and can change. The first suggestion is the name. Like all policies it is off at first.
- **Changed policy "Entity id with a trailing number":** counts only counters up to three digits (`_2` to `_999`) and skips address ids; `switch.schedule_878149` is no longer a finding.
- **Recorder:** tabs "Findings" (one card per entity with all its reasons and thresholds, filters, mark for exclusion) and "Events" (bars, share, rate per day). Recommended exclusions are easy to spot, "Suggestions only" hides the rest. Integrations show their loudest entities. Trimming old history says what goes and what stays.
- **Exchange device, change meter, replace references:** pick by typing instead of the browser list; check lines in the form, a summary of the pairs, modes as cards with their consequences and a timeline; the preview shows each source with its old and new line. Repairs of counters and ranges say what was checked and what changes.
- **Maintenance:** reminders with a due day and a history, as a table; reminders and logbook entries are made in a dialog. Deleting a reminder, entry, plan, view or template asks first. The confirmations in backup protection open from a button in the row.
- **Status:** the ring counts topics; only urgent ones take points off, a click explains the number.
- **Overview and graph:** without the tile card "What would you like to do?"; on a phone the three figures sit in one row and "Scan now" is smaller. The graph has a fixed height, a foldable legend, wrapping names and a note on a phone.
- **Export:** shows how many entities are selected and returns to the page it came from.

#### Fixed

- "No replaceable battery" updates the list at once, volt sensors included; the battery table opens with every battery instead of only the low ones.
- A click on a rename suggestion in the policies did nothing.
- The frame of a dialog field covered its title; the chips in dialogs share size and pointer, and the chosen one is visible.
- Backup protection: pills sit in one line, the button under the text.
- The automation page no longer overlaps text or stacks the run bars.
- The impact texts now say that removing also deletes the statistics, and name the dynamic templates that are not checked.
- Lines above notes across the panel removed.

## 1.2.0 - 2026-10-10

Mehr Aufräumen direkt an der Entität, ein klarerer Recorder-Ausschluss und ein Panel, das bei Fehlern nicht mehr einfriert.

### Neu

- **Umbenennen und Bereich zuweisen** auch auf der Detailseite einer Entität oder eines Geräts, je als Plan mit Vorschau und Rückgängig; in der Richtlinienliste für viele auf einmal.
- **Recorder-Ausschluss:** eine schmale Leiste statt eines großen Kastens, mit YAML zum Kopieren und den Schritten danach. „Last im Recorder“ und „Recorder-Kosten“ zeigen, was der Recorder schon ausschließt; ausgeschlossene Entitäten lassen sich zum Kürzen des alten Verlaufs wählen.
- **Sparklines** in den Kacheln der Befundliste; ein eigener Reiter für die Housekeeper-Backups in der Wartung.
- **Labels** auch für Skripte und Szenen.
- **Einstellungen:** Die Angaben für eine Fehlermeldung (Versionen, Browser oder App, letzte Fehler) lassen sich kopieren; eine Vorlage für Fehlermeldungen fragt danach.
- **Export:** alle Entitäten mit einem Klick wählen.

### Behoben

- In Safari und der Companion-App blieb das Panel auf „Scanning…“ stehen (#7).
- Ein neuer Plan aus der Befundliste oder der Detailseite öffnete die Seite nicht am Plan (#8).
- Eine Ansicht, die einen Fehler wirft, zeigt eine Meldung mit Weg zurück, statt das Panel einzufrieren; eine fehlgeschlagene Aktion ersetzt die Seite nicht mehr.
- Ein Doppelklick erzeugt keinen zweiten Plan mehr.
- Die Karte „Gerät austauschen“ zeigte den Titel der Recorder-Auswahl.
- Listen mit Entitäten zeigen überall Name, ID und Zusatzangaben gleich; Richtlinienliste, Listenwerkzeuge und Trennlinien sauber ausgerichtet.
- Die Statuskachel der Befundliste zeigt dieselbe Größe wie ihre Linie.
- Das Backup vor dem Löschen im Recorder enthält die Datenbank.

### English

More tidying right at the entity, a clearer recorder exclusion, and a panel that no longer freezes on errors.

#### New

- **Rename and assign an area** on the detail page of an entity or device too, each as a plan with preview and undo; for many at once in the policy list.
- **Recorder exclusion:** a slim bar instead of a large box, with YAML to copy and the steps afterwards. "Recorder load" and "Recorder costs" show what the recorder already excludes; excluded entities can be picked to trim their old history.
- **Sparklines** in the tiles of the findings list; its own tab for Housekeeper backups in Maintenance.
- **Labels** for scripts and scenes too.
- **Settings:** the details for a bug report (versions, browser or app, last errors) can be copied; an issue template asks for them.
- **Export:** select all entities with one click.

#### Fixed

- In Safari and the Companion app the panel stayed on "Scanning…" (#7).
- A new plan from the findings list or the detail page did not open the page at the plan (#8).
- A view that throws shows a message with a way back instead of freezing the panel; a failed action no longer replaces the page.
- A double click no longer creates a second plan.
- The "Exchange device" card showed the title of the recorder selection.
- Entity lists show name, ID and extra facts the same way everywhere; the policy list, the list tools and the separators are aligned cleanly.
- The status tile of the findings list shows the same quantity as its line.
- The backup before deleting in the recorder includes the database.

## 1.1.0 - 2026-10-10

Aufräumen wird mächtiger: Pläne als Assistent, Verlauf kürzen, Backups und Automationen löschen, Entitäten umbenennen und Bereiche zuweisen. Dazu Batterien mit Typ und Einkaufsliste.

### Neu

- **Pläne als Assistent:** Prüfen, Bestätigen, Ausführen, Ergebnis in vier Schritten; ein Plan ohne ausführbare Aktion zeigt nur den Grund.
- **Verlauf kürzen:** Gespeicherte Zustände ausgewählter Entitäten löschen, die älter als eine gewählte Zahl von Tagen sind (endgültig, mit Backup davor).
- **Housekeeper-Backups aufräumen:** Liste der eigenen Backups mit Regel „letzte N behalten und alles jünger als M Tage“; Backups beobachteter Pläne und das jüngste mit Rückgängig sind geschützt.
- **Automationen löschen:** Ungenutzte Automationen aus `automations.yaml` als Plan entfernen, mit Vorschau, Prüfung und Rückgängig.
- **Umbenennen mit Verweisen:** Neue Entitäts-ID, Verweise in Automationen, Skripten, Szenen und Dashboards ziehen mit; Rückgängig stellt Dateien und ID wieder her.
- **Bereich zuweisen:** Für Entitäten und Geräte ohne Bereich, mit Vorschlag aus Gerät oder Integration.
- **Batterien:** Batterietyp je Gerät mit Einkaufsliste für 30 Tage, erkannter Batteriewechsel zum Eintragen; Spannungsbatterien zählen in der Übersicht mit.
- **Automationsziele:** Verlauf je Automation und ein Befund, wenn ein Ziel wiederholt verfehlt wird.
- **Recorder:** Karte „Im Recorder“ je Entität und Auswahl für den Ausschluss in `configuration.yaml`.
- **Export** aus dem Inventar als CSV, Markdown oder JSON; eigene Einträge im Verlauf der Änderungen; Sparklines in den Kopfkacheln.

### Behoben

- Recorder-Löschungen warten auf jeden Block, bevor gezählt wird.
- Während ein Plan schreibt, lädt Housekeeper nicht neu; ein durch Neustart unterbrochener Lauf endet als teilweise oder abgebrochen.
- Die Statuszahl ist in jeder Ansicht gleich.
- Scheitert das kleine Backup, bietet Housekeeper ein vollständiges als neue Vorschau an, statt es von selbst zu starten.

### English

Cleanup gets more capable: plans as a guided flow, trimming history, deleting backups and automations, renaming entities and assigning areas. Plus batteries with type and a shopping list.

#### New

- **Plans as a guided flow:** check, confirm, run, result in four steps; a plan with nothing to run shows only the reason.
- **Trim history:** delete stored states of selected entities older than a chosen number of days (final, with a backup first).
- **Tidy Housekeeper backups:** list of its own backups with the rule "keep the last N and everything younger than M days"; backups of watched plans and the newest one with undo are protected.
- **Delete automations:** remove unused automations from `automations.yaml` as a plan, with preview, verification and undo.
- **Rename with references:** new entity ID, references in automations, scripts, scenes and dashboards follow; undo restores files and ID.
- **Assign an area:** for entities and devices without one, suggested from the device or the integration.
- **Batteries:** battery type per device with a 30-day shopping list, a detected battery change to log; batteries in volts count in the overview.
- **Automation goals:** history per automation and a finding when a goal is missed repeatedly.
- **Recorder:** an "In the recorder" card per entity and a selection for the exclusion in `configuration.yaml`.
- **Export** from the inventory as CSV, Markdown or JSON; own entries in the change history; sparklines in the header tiles.

#### Fixed

- Recorder deletions wait for every block before counting.
- Housekeeper does not reload while a plan writes; a run cut off by a restart ends as partial or aborted.
- The status number is the same in every view.
- If the small backup fails, Housekeeper offers a full one as a new preview instead of starting it on its own.

## 1.0.5 - 2026-10-10

Zwei Fehler behoben, die in 1.0.3 und 1.0.4 steckten, und vier neue Wartungsziele.

### Behoben

- **Scan bricht ab (Issue #5):** Mit Home Assistant 2026.10 scheiterte der erste Scan an
  Automationen mit Vorlagen („Template is not a container or iterable“). Housekeeper
  übernimmt aus Home Assistant nur noch echte IDs.
- **Zeilen anhaken ging nicht:** Das Anhaken einzelner Zeilen in Befunden, Aufräumen und
  beim Löschen von Statistiken löste einen Fehler aus.
- **Statistiken löschen:** Mehr als 200 ausgewählte Reihen liefen auf einen leeren Fehler.
  Jetzt nimmt jeder Durchgang die ersten 200, der Rest bleibt ausgewählt; der Knopf zeigt
  die Zahl, und nach „Jetzt ausführen“ springt die Seite zum Fortschritt.

### Neu

- **Wartungsziele:** Sensoren ohne neue Meldung, wiederkehrende Ausfälle, Automationen mit
  Fehlern (30 Tage) und verwaiste Statistiken.

### English

Two bugs fixed that were in 1.0.3 and 1.0.4, and four new maintenance goals.

#### Fixed

- **Scan aborts (issue #5):** with Home Assistant 2026.10 the first scan failed on
  automations with templates ("Template is not a container or iterable"). Housekeeper now
  takes only real IDs from Home Assistant.
- **Ticking rows did not work:** ticking single rows in Findings, Cleanup and when
  deleting statistics raised an error.
- **Deleting statistics:** more than 200 selected series ended in an empty error. Each
  round now takes the first 200 and the rest stays selected; the button shows the count,
  and after "Run now" the page jumps to the progress.

#### New

- **Maintenance goals:** sensors without a new report, recurring outages, automations with
  errors (30 days) and orphaned statistics.

## 1.0.4 - 2026-10-10

Neue Erkennung für Sensoren, die nichts mehr melden.

### Neu

- **„Meldet nicht mehr“:** Ein Sensor, der seinen letzten Wert behält, aber länger als das
  Limit nichts Neues meldet, erscheint als Befund. Standard 48 Stunden (Option
  `stale_hours`, 0 = aus), nur für Sensoren mit Messwerten; pro Sensor einstellbar in der
  Übersicht der Entität, auch für andere Entitäten.
- **Befunde:** In „Ausgeblendet“, „Bekannt“ und „Zurückgestellt“ gibt es „Wieder
  einblenden“.
- **Datenbank:** Die Karte zeigt den ältesten Eintrag im Recorder.

### English

New detection for sensors that stopped reporting.

#### New

- **"Stops reporting":** a sensor that keeps its last value but reports nothing new for
  longer than the limit appears as a finding. Default 48 hours (option `stale_hours`,
  0 = off), for sensors with measurements only; adjustable per sensor on the entity's
  overview, also for other entities.
- **Findings:** "Show again" in "Hidden", "Known" and "Snoozed".
- **Database:** the card shows the oldest entry in the recorder.

## 1.0.3 - 2026-10-09

Bedienung und Lesbarkeit.

### Neu

- **Klares Ergebnis nach einem Plan:** Ein Band zeigt grün, gelb oder rot, wie es ausging
  und ob Rückgängig geht. Der Plan wartet jetzt die Prüfung ab, statt auf „Ausgeführt“
  stehen zu bleiben.
- **Verwaiste Statistiken:** Spalten „Erster Eintrag“ und „Datensätze“, Checkbox im
  Listenkopf, „Nur Ausgewählte zeigen“.
- **Bestätigung:** ein Haken für alle zu prüfenden Einträge statt einem pro Zeile;
  abgebrochene Pläne lassen sich wiederholen; der Prüfbericht lässt sich einklappen.
- **Bedienung:** Shift-Klick wählt Bereiche, Kopierknopf an IDs, „Filter zurücksetzen“,
  Tasten `/` und `Esc`, Pfeiltasten in Listen, kurze Meldungen, „Seit deinem letzten
  Besuch“ auf der Übersicht, „Nur lesen“/„Kann ändern“ pro Seite.
- Knöpfe nach Wirkung abgestuft, Löschen ist rot.

### Geändert

- Schmale Bildschirme: Schrittleiste des Assistenten und Erinnerungen passen jetzt.
- Doppelte Kachelzeile bei „Verwaiste Statistiken“ entfernt.

### English

Usability and readability.

#### New

- **Clear result after a plan:** a band shows green, amber or red, how it went and
  whether undo works. The plan now waits for the check instead of staying on "Executed".
- **Orphaned statistics:** columns "First entry" and "Records", a checkbox in the list
  header, "Show selected only".
- **Confirmation:** one tick for all entries to review instead of one per row; aborted
  plans can be repeated; the audit report can be folded.
- **Handling:** Shift-click selects ranges, copy button on IDs, "Reset filters", keys `/`
  and `Esc`, arrow keys in lists, short messages, "Since your last visit" on the overview,
  "Read only"/"Can change" per page.
- Buttons weighted by effect, deleting is red.

#### Changed

- Narrow screens: the assistant's step bar and reminders now fit.
- Duplicate tile row removed from "Orphaned statistics".

## 1.0.2 - 2026-10-09

Neue Navigation mit Kacheln und einige Korrekturen.

### Neu

- **Kacheln mit Anzahlen** in Aufräumen, Zuverlässigkeit, Recorder, Richtlinien,
  Freigabe, Läufe und Wartung; die gewählte Kachel ist hervorgehoben. Quarantäne ist ein
  eigener Bereich mit Freigabe in der Liste.
- **Erinnerungen** haben eine eigene Ansicht unter „Pflegen“. Batterien stehen in einer
  Liste, auch solche in Volt; die Prognose ist in Gruppen mit Gerät, Raum und Datum
  eingeklappt.
- Abgebrochene Pläne lassen sich per „Plan wiederholen“ als neue Vorschau erneut anlegen.
  Der Prüfbericht lässt sich wieder einklappen.

### Geändert

- Scheitert das kleine Backup vor einem Plan, versucht Housekeeper das volle automatische
  Backup; der Fehlertext erscheint im Plan und im Log.
- Beim Löschen von Statistiken sind die gespeicherten Zustände standardmäßig mit dabei.
- Die Gruppe „Bald“ der Aufgabenliste ist zunächst eingeklappt.

### English

New tile navigation and some fixes.

#### New

- **Tiles with counts** in Cleanup, Reliability, Recorder, Policies, Exposure, Runs and
  Maintenance; the chosen tile is highlighted. Quarantine is its own area with release in
  the list.
- **Reminders** have their own view under "Maintain". Batteries are in one list, including
  those in volts; the forecast is folded into groups with device, room and date.
- Aborted plans can be repeated as a new preview with "Repeat plan". The audit report can
  be folded again.

#### Changed

- If the small backup before a plan fails, Housekeeper tries the full automatic backup;
  the error text shows in the plan and in the log.
- Deleting statistics also deletes the stored states by default.
- The "Soon" group of the to-do list starts folded.

## 1.0.1 - 2026-10-09

Korrekturen und eine Oberfläche, die aufgeräumter ist.

### Geändert

- **Kleineres Backup vor Plänen:** Housekeeper sichert nur Home Assistant, ohne Apps und
  Ordner, und die Datenbank nur, wenn der Plan in sie schreibt. Das Backup erscheint als
  eigenes Backup „Housekeeper …“, zählt nicht zu deiner Aufbewahrung und nicht als
  reguläres Backup. Home Assistant löscht diese Backups nicht von selbst.
- **Zählerreparatur** brach bei laufenden Zählern fast immer mit „Die Daten wurden nach
  der Vorschau geändert“ ab; das ist behoben.
- Der Hinweis „Home Assistant startet noch“ und die Meldung „Ein Plan läuft“ erklären
  sich jetzt und verschwinden von selbst.
- Prüfbericht: Namen und IDs sind standardmäßig im Klartext, mit Haken zum Teilen als
  Platzhalter.
- Oberfläche: Befundzeilen, Journal, Einstellungen, Farbschema-Auswahl und Knöpfe sind
  einheitlicher angeordnet.

### English

Fixes and a tidier interface.

#### Changed

- **Smaller backup before plans:** Housekeeper backs up Home Assistant only, without
  apps and folders, and the database only when the plan writes into it. The backup shows
  up as its own “Housekeeper …” backup, does not count towards your retention and not as
  the regular backup. Home Assistant does not delete these backups by itself.
- **Counter repair** almost always aborted on running counters with “The data changed
  after the preview”; fixed.
- The notes “Home Assistant is still starting” and “A plan is running” explain
  themselves now and go away on their own.
- Audit report: names and IDs are in plain text by default, with a tick to share it with
  placeholders.
- Interface: finding rows, journal, settings, colour scheme choice and buttons are laid
  out more consistently.

## 1.0.0 - 2026-10-09

Erste veröffentlichte Version von HA Housekeeper. Lege vor dem Aufräumen ein Home-Assistant-Backup an, es gibt
keine Gewährleistung (siehe Haftungsausschluss in der README).

### Enthalten

- Bestand und Befunde: Entitäten, Geräte, Automationen, Skripte und Szenen, verwaiste
  und lange nicht verfügbare Objekte, kaputte Verweise, Duplikate, ungenutzte
  Automationen, Batterien (Prozent und Volt) und Wartungsziele.
- Aufräumen nur nach bestätigtem Plan mit Vorschau, Quarantäne, Backup, Prüfung danach
  und Rückgängig im Journal.
- Reparieren: Zählerfehler, Sensorfehler, Zählerwechsel, Verweise ersetzen, Geräte
  austauschen.
- Wartung, Sicherheitsmodus, Befund-Status, eine Suche überall, Farbschemata und
  Deutsch und Englisch.

### English

First published version of HA Housekeeper. Make a
Home Assistant backup before cleaning up; there is no warranty (see the disclaimer
in the README).

#### Included

- Inventory and findings: entities, devices, automations, scripts and scenes, orphaned
  and long-unavailable objects, broken references, duplicates, unused automations,
  batteries (percent and volts) and maintenance goals.
- Cleanup only after a confirmed plan with preview, quarantine, backup, verification
  and undo in the journal.
- Repair: counter glitches, sensor errors, meter change, replacing references,
  exchanging devices.
- Maintenance, protection mode, finding status, one search everywhere, colour schemes
  and German and English.
