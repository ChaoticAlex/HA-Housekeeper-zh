# Changelog

## Unreleased

### Neu

- **Automationen: Diagnose auf der Detailseite:** Die Spalte „Diagnose“ in der Übersicht entfällt; die Zeile öffnet die Detailseite, die einen Reiter „Diagnose“ hat (Blickwinkel, Erfolgskriterien, Verbessern, Ablaufverfolgung). Skripte zeigen dort ihre vier Blickwinkel.
- **Recorder-Kosten als Tabelle:** Die Einträge stehen in einer sortierbaren Liste mit Balken für den Anteil und Spalten für Gesamt, 24 Stunden, 7 Tage und Durchschnitt pro Tag; klickbare Kacheln (Alle, Vorschläge, Ausgeschlossen, Nicht verwendet), Filter und CSV-Export.
- **Schutzmodus startet schreibgeschützt:** Eine neue Installation beginnt im Modus „nur lesen“; Änderungen schaltest du unter Einstellungen → Sicherheit bewusst frei. Bestehende Installationen behalten „voll“.
- **Zuverlässigkeit: Setup-Fehler:** Die Integrationen-Tabelle hat eine sortierbare Spalte „Setup-Fehler“ und eine Kachel dazu; die Detailseite nennt einen möglichen Grund (Gerät offline, Zugang, zu früher Start, Neustart nötig).
- **Zuverlässigkeit als Tabellen:** Integrationen und instabile Entitäten stehen in sortierbaren Listen (Verfügbarkeit, Ausfälle, längster Ausfall, letzte Störung, Veränderung; Episoden, pro Tag, Dauer, Muster) mit klickbaren Kacheln, Filtern und CSV-Export.
- **Recorder: Auffälligkeiten als Tabelle:** Die Auffälligkeiten stehen in einer sortierbaren Liste (Zeilen pro Tag, lauteste Stunde, Anteil ohne neuen Zustand) mit klickbaren Kacheln und Filtern; ein Klick auf die Zeile öffnet die Details, mehrere Entitäten lassen sich per Checkbox für den Ausschluss auswählen.
- **Skripte als eigener Reiter:** Unter „Automationen“ listet der Reiter „Skripte“ alle Skripte mit Läufen, Fehlern, vier Blickwinkeln und der Spalte „Aufgerufen von“ (Automationen und Skripte, die das Skript nutzen); Skripte ohne Aufrufer sind schnell zu finden.
- **Automationen: neue Übersicht:** Der Reiter „Übersicht“ (vorher „Qualität“) listet alle Automationen mit Status, Läufen, Fehlern und den sieben Blickwinkeln, auch deaktivierte und nie gelaufene. Die Liste hat Suche, Filter, Sortierung nach jeder Spalte, Seitenumbruch und CSV-Export; die Zeile öffnet die Detailseite. Die Kacheln oben sind klickbar und filtern, ebenso die Kacheln unter „Läufe“.
- **Helfer im Inventar:** Der Typfilter hat die Auswahl „Helfer“ (Helfer mit Eintrag und Helfer-Entitäten) mit den Spalten „Verwendet von“ und „Zuletzt geändert“ und einer Auswahl für vermutlich ungenutzte Helfer; Schimmelindikator und Bayes-Sensor werden auf fehlende Quellen geprüft.
- **Risikostufe mit Begründung:** Bei Zugriffe & Datenfluss sagt eine Legende, was Hoch, Mittel und Niedrig bedeuten; die Stufe nennt beim Daraufzeigen den Grund, und die Detailseite einer Integration schreibt ihn aus.
- **Ruhigere Seitenköpfe:** Speicher & System, Zugriffe & Datenfluss, Zugangsdaten, Zuverlässigkeit, Freigaben, Richtlinien, Läufe, Recorder und Wartung zeigen den Untertitel unter dem Titel und eine schmale Zeile mit „Stand“ und „Aktualisieren“; die Reiterkacheln sind flacher.
- **Custom Cards mit Status:** Die Liste der Dashboard-Ressourcen zeigt, ob die Datei fehlt, ob ein Dashboard die Karte nutzt oder ob das nicht zu erkennen ist.
- **Speicher & System** (Betrieb): Belegung von Datenträger, RAM und CPU und ein Reiter „Belegung“ mit Umschalter zwischen Kategorie und Ordnern unter `/config`. Apps und Custom-Integrationen stehen unter „Apps & Integrationen“.
- **Zugriffe & Datenfluss** (Sicherheit): Systemzugriffe und Cloud-Datenfluss der Integrationen mit Risikostufe, mit Supervisor auch die Rechte der Apps.
- **Zugangsdaten** (Sicherheit): welche Integrationen Passwörter, Tokens oder Schlüssel gespeichert haben und ob ein Wert hinterlegt ist. Werte zeigt Housekeeper nie.
- **Ausfälle statt drei Listen:** Eine Integration mit Problem steht jetzt auch ohne auffällige Entitäten unter „Befunde“ (Block „Ausfälle“). Auf der Übersicht gibt es dafür eine Zeile, „Benötigt Aufmerksamkeit“ heißt „Wichtigste Befunde“ (Ausfälle zuerst), die Karte „Integrationen mit Problemen“ entfällt.
- **Menü neu geordnet:** Neue Gruppe „Sicherheit“ (Freigaben, Zugriffe & Datenfluss, Zugangsdaten). Speicher & System steht unter Betrieb. Aufräumen, Reparieren und Journal bilden die Gruppe „Bereinigen“, „Erkunden“ heißt „Bestand“ (Inventar, Abhängigkeiten, Änderungen). Die Leiste hat damit sieben Einträge.
- **Übersicht zeigt das System:** Neue Karte „System“ mit Datenträger, Speicher und Prozessor. Ab 85 % belegtem Datenträger steht eine Aufgabe in der Liste, ab 95 % eine dringende.
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

### English

- **Automations: diagnosis on the detail page:** The "Diagnosis" column of the overview is gone; the row opens the detail page, which has a "Diagnosis" tab (views, success criteria, improve, trace tools). Scripts show their four views there.
- **Recorder costs as a table:** The entries are a sortable list with a bar for the share and columns for total, 24 hours, 7 days and average per day; clickable tiles (All, Suggestions, Excluded, Not used), filters and CSV export.
- **Protection mode starts read-only:** A new install begins in "read only"; you release changes on purpose under Settings → Security. Existing installs keep "full".
- **Reliability: setup failures:** The integrations table has a sortable "Setup failures" column and a tile for it; the detail page names a possible cause (device offline, access, starting too early, restart needed).
- **Reliability as tables:** Integrations and unstable entities are sortable lists (availability, outages, longest outage, last disruption, change; episodes, per day, duration, pattern) with clickable tiles, filters and CSV export.
- **Recorder: findings as a table:** The findings are a sortable list (rows per day, loudest hour, share without a new state) with clickable tiles and filters; clicking a row opens the details, and several entities can be ticked for exclusion.
- **Scripts in a tab of their own:** Under "Automations" the "Scripts" tab lists every script with runs, errors, four views and a "Called by" column (the automations and scripts that use the script), so scripts nobody calls are easy to find.
- **Automations: new overview:** The "Overview" tab (formerly "Quality") lists every automation with state, runs, errors and the seven views, including disabled ones and ones that never ran. The list has search, filters, sorting by any column, paging and CSV export; a row opens the detail page. The tiles above are clickable and filter, and so are the tiles under "Runs".
- **Helpers in the inventory:** The type filter has a "Helpers" choice (helpers with a config entry and helper entities) with the columns "Used by" and "Last changed" and a choice for helpers that are probably unused; mold indicator and Bayesian sensor are checked for missing sources.
- **Risk level with a reason:** In Access & data flow a legend explains what High, Medium and Low mean; pointing at a level shows the reason, and the detail page of an integration spells it out.
- **Calmer page headers:** Storage & system, Access & data flow, Credentials, Reliability, Exposure, Policies, Runs, Recorder and Maintenance show the subtitle under the title and a slim line with "As of" and "Refresh"; the tab tiles are flatter.
- **Custom cards with a status:** The list of dashboard resources shows whether the file is missing, whether a dashboard uses the card, or that this cannot be told.
- **Storage & system** (Operation): disk, RAM and CPU use and a "Usage" tab that switches between category and folders under `/config`. Apps and custom integrations are under "Apps & integrations".
- **Access & data flow** (Security): system access and cloud data flow of the integrations with a risk level, with a Supervisor also the rights of the apps.
- **Credentials** (Security): which integrations store passwords, tokens or keys and whether a value is set. Housekeeper never shows the values.
- **Outages instead of three lists:** An integration with a problem now appears under "Findings" even when no entity is flagged (block "Outages"). The overview has one row for it, "Needs attention" is now "Most important findings" (outages first), and the card "Integrations with problems" is gone.
- **Menu reordered:** New group "Security" (Exposure, Access & data flow, Credentials). Storage & system is under Operation. Clean up, Repair and Journal form the group "Clean up", "Explore" is now "Catalog" (Inventory, Dependencies, Changes). The bar has seven entries.
- **Overview shows the system:** a new "System" card with disk, memory and processor. A task appears once the disk is 85 % full, an urgent one at 95 %.
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
