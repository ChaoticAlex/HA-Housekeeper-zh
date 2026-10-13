# Vorschlag: Hausmonitor

Stand: 13. Oktober 2026 · als erste Version umgesetzt (siehe Changelog)

## Ziel

Eine selbst definierte Funktion wie „Wasseralarm“ bündelt wenige direkt zugeordnete Entitäten, Geräte, Automationen und Integrationen. Housekeeper beantwortet damit: **Was ist betroffen, woran ist das erkennbar und wann wurde es zuletzt geprüft?** Die Ansicht ist lesend. Sie testet keinen Alarm und schaltet keine Geräte.

## Bedienung

1. Neue Seite **Hausmonitor** im Bereich „Betrieb“: Eine Zeile pro überwachter Funktion mit Zustand, kurzem Grund und Scanzeit. Reihenfolge: beeinträchtigt, unbekannt, unauffällig. Auf der Housekeeper-Übersicht steht bei mindestens einer beeinträchtigten Funktion eine rote, anklickbare Zeile als erstes Thema in „Was jetzt zu tun ist“; Prüflücken erscheinen dort getrennt und weniger dringlich als „Prüfung unvollständig“. Ohne Problem gibt es dort keinen Hausmonitor-Eintrag; die Seite bleibt über die Navigation erreichbar.
2. **Detail einer Funktion**: Direkt zugeordnete Objekte, ihr jeweiliger Zustand, der konkrete Befund und Links zur vorhandenen Objektseite. „Was Housekeeper nicht prüfen konnte“ steht neben dem Ergebnis, nicht versteckt in einem Tooltip.
3. **Funktion hinzufügen/bearbeiten**: Name und optionale Beschreibung, Objekte über die vorhandene Objektsuche hinzufügen. Jedes Objekt ist entweder **erforderlich** oder **zusätzlich**. Erforderliche Objekte bestimmen den Gesamtzustand; zusätzliche Objekte erscheinen als Hinweis. Eine sichtbare Option „Dauerhafte HA-Mitteilung bei Problemen“ ist für neu angelegte Funktionen aktiviert. Vor dem Speichern steht eine Zusammenfassung. Löschen erhält den vorhandenen Bestätigungsdialog.

Die Mockups verwenden Beispieldaten: „Wasseralarm Keller“, „Türklingel“ und „Heizung“. Die gezeigten Zustände sind keine Messwerte einer realen Installation.

## Zustandsregel

Für jedes erforderliche Objekt wird nur belegte Information aus dem letzten vollständigen oder teilweise lesbaren Scan verwendet. Ein vorhandener, sicher zugeordneter Defekt oder ein ausdrücklich benötigtes, aber verschwundenes Objekt ergibt **beeinträchtigt**. Eine nicht gelesene Quelle, ein fehlender Laufzeitstatus oder ein veralteter Scan ergibt **unbekannt**. Nur wenn alle erforderlichen Objekte prüfbar und ohne bekannten Defekt sind, ergibt sich **unauffällig**. Bei gemischten Ergebnissen hat ein belegter Defekt Vorrang vor „unbekannt“; beides wird im Detail genannt. Eine Funktion ohne erforderliche Objekte bleibt „unbekannt“.

Ein normaler Entitätszustand wie `off`, `closed` oder `idle` ist für sich kein Fehler. Housekeeper prüft im ersten Schritt Erreichbarkeit, Deaktivierung, Integrationszustand und sicher zugeordnete Befunde, nicht die beabsichtigte Funktion oder einen Schwellwert. „Unauffällig“ bedeutet **kein bekannter Defekt nach dem letzten Scan**, nicht „Alarm erfolgreich getestet“. Liste, Detail und Übersicht unterscheiden bei Bedarf den Zeitpunkt des letzten Scans von der **letzten vollständigen Prüfung aller erforderlichen Objekte**. Es wird kein Livezustand behauptet.

Zusätzliche Objekte ändern den Gesamtzustand nicht, können aber einen sichtbaren Hinweis erzeugen. Der Zustand wird zusammen mit `scanned_at`, verwendeter Prüfabdeckung und Gründen geliefert. Ein neuer Scan berechnet ihn neu. Ausgeblendete Befunde bleiben als bekannte Abweichung sichtbar und werden als solche bezeichnet; sie verschwinden nicht still aus einer überwachten Funktion.

## Wenn etwas nicht stimmt

1. Nach einem Scan wird die betroffene Funktion **beeinträchtigt** oder **unbekannt**. Übersicht und Hausmonitor nennen den konkreten Grund und den Zeitpunkt der letzten erfolgreichen Prüfung. Die Detailseite führt zum betroffenen Objekt, seinem Befund und der vorhandenen Diagnose. Ein nachgewiesener Defekt und eine Prüflücke können zugleich sichtbar sein.
2. Wird eine Funktion nach der ersten Vergleichsbasis neu **beeinträchtigt** – auch nach einem zuvor unbekannten Zustand –, erstellt Housekeeper **einmalig eine dauerhafte Home-Assistant-Mitteilung** mit Funktionsname, Grund und Link zum Detail. Gleichbleibende Scanergebnisse erzeugen keine neuen Mitteilungen. Eine beim Anlegen bereits beeinträchtigte Funktion wird im Formular, im Hausmonitor und auf der Übersicht angezeigt, aber nicht überraschend als neuer Ausfall gemeldet.
3. **Unbekannt** durch eine einzelne Prüflücke erscheint sofort auf der Seite. Eine Home-Assistant-Mitteilung folgt erst, wenn die Prüflücke bei einem weiteren Scan besteht oder der Scan nach der bestehenden Gesundheitsregel veraltet ist. Der Text sagt „Prüfung unvollständig“, nicht „Funktion ausgefallen“.
4. Wird die Funktion wieder **unauffällig**, verschwindet die zugehörige dauerhafte Mitteilung; der Zustandswechsel bleibt im Hausmonitor nachvollziehbar. Housekeeper schaltet, repariert oder quittiert nichts automatisch. Eine mobile Push-Nachricht ist nicht Bestandteil der ersten Version.

Die Mitteilungsoption gilt pro Funktion und ist jederzeit änderbar. Die Auswertung muss den letzten gemeldeten Zustand über Neustarts erhalten, damit ein Neustart keine neue Meldung für denselben Ausfall erzeugt. Wiederholte Änderungen desselben Grundes können die bestehende Mitteilung aktualisieren, ohne eine zweite anzulegen.

## In Home Assistant und auf der Übersicht

- **Housekeeper-Übersicht:** In der bestehenden Karte „Was jetzt zu tun ist“ steht eine rote Hausmonitor-Zeile vor den normalen Befunden: „1 wichtige Funktion beeinträchtigt“ und darunter „Wasseralarm Keller · Automation deaktiviert · Befund 14:02“. Bei mehreren Funktionen nennt sie die Anzahl und den jüngsten oder wichtigsten Grund. Ein Klick führt zum nach Zustand gefilterten Hausmonitor, wo alle betroffenen Funktionen stehen. Die Zeile bleibt bis zur belegten Erholung sichtbar; bei zwischenzeitlicher Prüflücke nennt sie den letzten belegten Defekt ausdrücklich „ungeklärt“. Sie ist eine Zustandsanzeige, keine zweite Benachrichtigung. „Unbekannt“ ohne offenen Alarmfall erhält eine eigene gelbe Zeile im Bereich „Zustand“ mit „letzte vollständige Prüfung“ oder „noch nie vollständig geprüft“, nicht im Alarmzähler. Nach der Behebung verschwinden die Zeilen automatisch. Farbe allein trägt die Bedeutung nicht.
- **Statuskopf:** Der Hausmonitor-Ausfall zählt als dringendes Thema in der Überschrift. Der bestehende Gesundheitswert darf denselben zugrunde liegenden Befund nicht nochmals mit Punkten belasten; die Berechnung braucht eine explizite Regel gegen Doppelzählung. Wenn noch kein Hausmonitor eingerichtet ist oder alle Funktionen unauffällig sind, wächst die Übersicht nicht um eine zusätzliche Karte.
- **Home Assistant:** Die dauerhafte Mitteilung macht den neuen Ausfall im Mitteilungsbereich sichtbar. Ergänzend veröffentlicht Housekeeper einen sparsamen Zustandswechsel als bestehendes Bus-Ereignis und über eine neue **Event-Entität „Hausmonitor“** gemäß Review-Punkt 3. Ereignistypen: `beeintraechtigt`, `pruefung_unvollstaendig`, `pruefung_wieder_moeglich`, `wieder_unauffaellig`; Attribute: stabile Funktions-ID, Name, Zeitpunkt und knapper Grundcode. Keine sensiblen Rohdaten oder langen Objektlisten. So können Nutzer eigene Home-Assistant-Automationen und mobile Benachrichtigungen auf diese Ereignisse aufbauen. Die Event-Entität zeigt das letzte Ereignis.
- **Aktueller Zustand in Home Assistant:** Jede angelegte Funktion bekommt zusätzlich einen Sensor mit stabilem Entity-ID-Bezug zur Funktions-ID. Seine Zustände sind `ok`, `problem` und `unverified` (in der Oberfläche „Unauffällig“, „Beeinträchtigt“ und „Unbekannt“). Knappe Attribute nennen letzten Scan, letzte vollständige Prüfung und Grundcode. Ein veralteter oder unvollständiger Scan setzt den Sensor auf `unverified`, statt einen alten `ok`-Zustand stehen zu lassen; ein im aktuellen Scan sicher belegter Defekt behält Vorrang. Der Sensor zeigt die aktuelle Bewertung im HA-Dashboard; die Event-Entität meldet bestätigte, entprellte Übergänge.
- **Keine Meldungsflut:** Ereignisse entstehen nur bei einem echten Zustandswechsel beziehungsweise bei der bestätigten anhaltenden Prüflücke, nicht nach jedem Scan. Die dauerhafte Mitteilung wird bei Erholung entfernt; das Wiederherstellungsereignis bleibt für Automationen verfügbar. Die Meldeoption pro Funktion steuert nur die dauerhafte Mitteilung. HA-Ereignisse und die Housekeeper-Anzeige bleiben davon unabhängig. Der optionale Scan-Knopf aus Review-Punkt 3 ist eine getrennte Erweiterung und ändert diese Alarmregeln nicht.

## Technischer Zuschnitt

- Eigener Home-Assistant-`Store` für Definitionen: `id`, `name`, `description`, `notify`, `members: [{object_key, required}]`, Erstell- und Änderungszeit. Zuletzt gemeldeten Zustand und `last_verified_at` getrennt und sparsam speichern; keine Inventar-Zustandskopien anlegen. Stabile `object_type:object_id`-Schlüssel verwenden. Serverseitig Namen, Typen, eindeutige Mitglieder und eine kleine Obergrenze validieren. Entfernte Objekte als fehlend zeigen, nicht automatisch aus der Definition löschen.
- Eigene Administrator-WebSocket-Befehle zum Listen, Speichern und Löschen. Die Auswertung erfolgt serverseitig aus Inventar, Befunden und `meta.coverage`; der Browser bekommt Ergebnis, `scanned_at`, `last_verified_at` und begründende Objektschlüssel. `last_verified_at` wird nur nach einem Scan aktualisiert, der alle erforderlichen Objekte bewerten konnte. Keine neuen Schreibrechte auf Home-Assistant-Objekte.
- Die erste Version verfolgt **nur ausdrücklich gewählte direkte Mitglieder**. Vorhandene Kanten des Abhängigkeitsgraphen können im Detail als Kontext erscheinen, verändern den Gesamtzustand aber nicht automatisch. So führt eine unvollständige oder nur vermutete Kante nicht zu einer falschen Bereitschaftsaussage.
- Der Store gehört zur bestehenden Integration und folgt ihrem Setup/Unload. Definitionen überstehen Neustarts; Ergebnisse werden nach Scan oder geänderter Definition neu berechnet. Bis nach dem Neustart ein belastbarer Scan vorliegt, zeigt der HA-Sensor keinen scheinbar aktuellen grünen Zustand. Beim Laden aus dem Speicher ungültige oder alte Einträge defensiv behandeln.

## Empfohlene Festlegungen für Version 1

| Erforderliches Objekt | Beeinträchtigt | Unbekannt | Unauffällig |
| --- | --- | --- | --- |
| Entität | `disabled`, `orphaned`, `unavailable` oder ausdrücklich ausgewählt und nach vollständig gelesener Quelle verschwunden | `unknown`, Quelle nicht gelesen, vorläufiger Scan | `active` ohne zugeordneten belegten Defekt |
| Gerät | `disabled` oder nach vollständig gelesener Quelle verschwunden | `empty`, Quelle nicht gelesen, vorläufiger Scan | `active`; das sagt nichts über seine physische Funktion aus |
| Automation | `disabled`, `unavailable`, verschwunden oder ein sicher zugeordneter Befund `broken_reference`, `automation.blocked`, `automation.dead_actions` oder `automation.dead_condition` | Laufzeitstatus oder Konfiguration nicht lesbar, vorläufiger Scan | `active` ohne die genannten Befunde |
| Integration (`config_entry`) | `disabled`, `problem` oder nach vollständig gelesener Quelle verschwunden | Quelle nicht gelesen, vorläufiger Scan; ignorierte Discovery ist nicht auswählbar | `active` beziehungsweise geladen |

Andere Befunde wie „ungenutzt“, mögliche Duplikate oder niedriger Batteriestand bleiben zunächst Hinweise im Detail. Fehlende Objekte zählen nur dann als Defekt, wenn die zugehörige Quelle tatsächlich gelesen wurde. Ein belegter Defekt im **aktuellen** teilweise lesbaren Scan hat Vorrang vor weiteren unbekannten Mitgliedern. Alte Befunde allein dürfen nach einem ausgefallenen Scan nicht als aktueller Beweis dienen.

- **Übergänge und Alarmfall:** Die erste Bewertung einer neuen Funktion setzt nur die Vergleichsbasis. Danach eröffnet jeder neue Übergang nach `problem` aus `ok` oder `unverified` einen Alarmfall mit einmaliger Mitteilung und HA-Ereignis. `problem → unverified` bedeutet keine Entwarnung: Der Sensor zeigt `unverified`, die Übersicht nennt den zuletzt belegten Defekt als **ungeklärt**, und die vorhandene Mitteilung bleibt mit diesem Hinweis stehen. Kehrt derselbe Defekt zurück, entsteht kein zweiter Alarmfall. Erst ein vollständig belegtes `ok` schließt ihn, entfernt die Mitteilung und erzeugt ein Wiederherstellungsereignis. Eine Änderung erforderlicher Mitglieder setzt eine neue Vergleichsbasis, zeigt den neuen Zustand sofort und erzeugt für diese Änderung keine Ausfall- oder Erholungsmeldung; eine nicht mehr passende alte Mitteilung wird dabei entfernt.
- **Prüflücken:** Der Sensor und die Housekeeper-Seite zeigen `unverified` sofort. Eine HA-Mitteilung und ein Ereignis „Prüfung unvollständig“ folgen erst nach zwei aufeinanderfolgenden betroffenen Scans oder nach Überschreiten der Scan-Gesundheitsgrenze. Bei offenem Alarmfall wird dessen vorhandene Mitteilung aktualisiert statt eine zweite anzulegen. Für automatische Scans gilt die vorhandene Grenze (dreifaches Scanintervall, mindestens sechs Stunden); bei rein manuellen Scans gilt eine Woche. Der stündliche Gesundheitscheck aktualisiert den Zustand auch ohne neuen Scan. Ein späteres `ok` erzeugt ein Ereignis „Prüfung wieder möglich“, sofern kein offener Alarmfall zu schließen ist.
- **Lebenszyklus in Home Assistant:** Umbenennen ändert die sichtbare Bezeichnung, aber nicht die stabile Funktions- und Sensor-ID. Löschen entfernt die zugehörige Sensor-Entität und dauerhafte Mitteilung nach Bestätigung. Nach einem Neustart bleiben Definition, Alarmfall und letzte vollständige Prüfung erhalten; bis ein belastbarer Scan vorliegt, ist der Sensor `unverified`. Weder Neustart noch eine geänderte Definition erzeugen rückwirkend ein neues Ausfallereignis.
- **Übersicht und Gesundheitswert:** Beeinträchtigte Funktionen werden nach belegter Schwere und dann nach Zeitpunkt des neuen Alarmfalls sortiert. Die erste Zeile nennt Anzahl und den ersten Grund, der Hausmonitor zeigt alle. Eine unbekannte Funktion ohne offenen Alarmfall zählt nicht als bestätigter Ausfall. Der Gesundheitswert zählt je verursachendem Objektschlüssel höchstens einmal und nur dann zusätzlich, wenn kein bereits gewerteter Befund mit diesem Schlüssel vorhanden ist; dieselbe Ursache wird weder durch mehrere Funktionen noch durch einen vorhandenen Befund doppelt abgezogen.

## Umsetzung in drei Schritten

1. **Modell und Regeln:** Store, Validierung, Auswertung und Tests für unauffällig/beeinträchtigt/unbekannt, fehlende Objekte, unvollständige Quelle, alte Scans und ausgeblendete Befunde. Letzte vollständige Prüfung, Zustandswechsel, einmalige Home-Assistant-Mitteilungen und HA-Ereignisse über Neustarts prüfen.
2. **Seite und Editor:** Navigation, Liste, Detail, Objektsuche, Speichern/Löschen, leere Ansicht, mobile Darstellung, Tastatur und Screenreader. Links führen zu den vorhandenen Objektseiten.
3. **Übersicht und Feinschliff:** Hausmonitor-Zeile in „Was jetzt zu tun ist“, getrennte Prüflücke mit letzter vollständiger Prüfung, Statuskopf ohne Doppelzählung, erneute Berechnung nach Scan, Event-Entität und Zustandssensoren, deutsche und englische Texte, Changelogs sowie Browserprüfung in hell/dunkel und mobil.

## Abnahmebeispiele

- „Wasseralarm“ mit erreichbarem Sensor und aktivierter Automation ist unauffällig; `off` beim Sensor allein ändert daran nichts.
- Ist die erforderliche Automation deaktiviert, heißt die Funktion beeinträchtigt und nennt sie als Grund.
- Konnte die Quelle des Sensors nicht gelesen werden, heißt er unbekannt; ein anderer belegter Defekt bleibt trotzdem sichtbar.
- Verschwindet ein ausdrücklich ausgewähltes Objekt, bleibt es in der Definition und erscheint als fehlend.
- Ein defektes zusätzliches Objekt erzeugt einen Hinweis, ändert aber nicht den Zustand erforderlicher Mitglieder.
- Ein veralteter Scan erzeugt keine neue Behauptung „unauffällig“; Zeit und Prüflücke sind sichtbar.
- Bei einer Prüflücke zeigt der HA-Sensor `unverified` und die Übersicht die letzte vollständige Prüfung; ein früherer `ok`-Zustand bleibt nicht scheinbar aktuell.
- Ein neues, belegtes Problem meldet sich einmal in Home Assistant; weitere gleiche Scans erzeugen keine zweite Mitteilung.
- Derselbe Zustandswechsel erscheint einmal als HA-Ereignis und dauerhaft als erste rote Zeile in „Was jetzt zu tun ist“. Ein HA-Automationsauslöser kann auf das Ereignis reagieren.
- Nach belegter Erholung verschwindet die Hausmonitor-Zeile, die dauerhafte HA-Mitteilung wird entfernt und ein Wiederherstellungsereignis erscheint.
- Ein einzelner nicht lesbarer Scan zeigt „unbekannt“ auf der Seite, aber keinen behaupteten Ausfall. Nach anhaltender Prüflücke kommt höchstens eine gesonderte Mitteilung.

## Später, getrennt entscheiden

Schwellwerte für fachliche Zustände, aktive Funktionstests, automatisch verfolgte indirekte Abhängigkeiten, mobile Push-Nachrichten und eine Ansicht für Nicht-Administratoren. Diese Erweiterungen benötigen jeweils eigene Daten- und Sicherheitsregeln.
