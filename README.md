# 🚀 Sternenhüpfer

**Lern-App für Kinder mit Legasthenie und Dyskalkulie, gestaltet als Galaxie.** Das Kind hüpft mit seiner Rakete von Planet zu Planet. Wer einen Planeten schafft, schaltet den nächsten frei (z. B. 1er-Reihe → 2er-Reihe → 3er-Reihe …).

Die App hat drei Teile:

| Bereich | Adresse | Für wen |
|---|---|---|
| **Freie Version** | `/` → „Losfliegen“ | alle, ohne Anmeldung; der Fortschritt bleibt nur auf dem eigenen Gerät |
| **Code-Version** | `/` → „Ich habe einen Code“ | Kinder, die zu dir ins Coaching kommen; du schaltest die Themen frei |
| **Coach-Dashboard** | `/coach` | nur du, mit Passwort geschützt |

---

## 🌌 Inhalte

**Zahlen-Galaxie (Dyskalkulie), 18 Planeten**
Punkte-Planet (Mengen auf einen Blick erfassen) → Zahlenhaus (Zerlegen) → Plus/Minus bis 10 → Plus/Minus bis 20 mit Zehnerübergang → **Einmaleins 1er- bis 10er-Reihe** → Geteilt → Einmaleins-Sonne (gemischte Abschlussprüfung)

**Buchstaben-Galaxie (Legasthenie), 7 Planeten**
Anlaute → Vokale → Silben → Reime → b/d/p/q unterscheiden → Wörter lesen → richtig schreiben

Jede Mission hat 10 Aufgaben. Bei 7 richtigen ist der Planet geschafft (1–3 Sterne). Es gibt keinen Zeitdruck. Bei einem Fehler zeigt die App immer die Lösung mit einer Hilfe-Darstellung (Zehnerfeld, Punktefeld, Silbenbögen), statt das Kind zu bestrafen.

### Barrierearm für Kinder mit LRS und Rechenschwäche
- 🔊 Jede Aufgabe kann vorgelesen werden, auch automatisch. Ein Tipp aufs Bild spricht das Wort.
- Silben sind farbig markiert (Silbenmethode, blau/rot).
- Schriftgröße, Schriftart und Buchstabenabstand lassen sich einstellen.
- Es gibt **Farbfolien** (gelb, blau, grün, rosa) wie bei Lesefolien.
- Ein ruhiger Modus schaltet Animationen ab.
- Alle Antworten sind große Tipp-Flächen, das Kind muss nichts tippen.

---

## ⭐ Dein USP: was dich von anderen abhebt

Normale Lern-Apps zeigen nur „richtig“ oder „falsch“. Sternenhüpfer zeigt dir, **warum** ein Kind falsch liegt und **wie es sich dabei fühlt**.

1. **🎯 Fehler-Radar (Förderdiagnostik zwischen den Stunden)**
   Jede falsche Antwortmöglichkeit steht für ein typisches Fehlermuster, zum Beispiel Zählfehler ±1, Zahlendreher (21↔12), Stellenwertfehler ±10, Nachbaraufgabe im 1×1, verwechselte Rechenart, b/d-Spiegelung, ähnliche Laute (d/t, g/k), Buchstabendreher oder Auslassungen.
   Im Dashboard siehst du die Muster als Balken, jeweils **mit konkretem Förderhinweis**, und dazu die Aufgaben, die immer wieder falsch gelöst werden.
2. **💛 Gefühls-Kompass (Lernangst sichtbar machen)**
   Vor und nach jeder Mission wählt das Kind ein Gefühls-Emoji. Du siehst den Verlauf und welche Themen dem Kind Bauchweh machen. So erkennst du Rechen- und Leseangst, ein Kernthema bei Dyskalkulie und LRS, das keine Standard-App erfasst.
3. **🔔 Frühwarnsystem**
   Das Dashboard meldet von selbst, wenn ein Kind an einem Planeten festhängt (3 Versuche ohne Erfolg), sich nach einer Mission schlecht fühlt, lange nicht geübt hat **oder ein Lob verdient**.
4. **📡 Funksprüche**
   Du schickst dem Kind eine persönliche Nachricht. Sie erscheint beim nächsten Start als „Funkspruch aus der Basis“ und wird vorgelesen. So wirkt die Beziehung zu dir auch zwischen den Stunden.
5. **📄 Elternbericht auf Knopfdruck**
   Der Bericht ist in verständlicher Sprache geschrieben: Fleiß, Stärken, woran ihr arbeitet, Gefühl beim Lernen und Tipps für zu Hause. Du kannst ihn drucken oder als PDF speichern.
6. **🌍 Die freie Version als Visitenkarte**
   Praxisname und Kontakt-Link erscheinen in der kostenlosen App („Für Eltern“). Wenn ein Kind sich schwertut, sehen die Eltern einen dezenten Hinweis auf deine Beratung.

**Vorschlag für deinen Werbe-Satz:**
> „Bei mir üben Kinder nicht nur in einer App: Ich sehe zwischen den Stunden, *welche* Denkfehler passieren und *wie sich Ihr Kind beim Lernen fühlt*, und kann gezielt fördern.“

---

## 🧑‍🏫 Das Coach-Dashboard

- **Übersicht:** Kennzahlen, Frühwarnsystem und alle Kinder in einer Tabelle
- **Kind anlegen:** Vorname und Avatar eingeben, ein Code wie `KOMET-4821` entsteht automatisch. Eine 🖨 **Zugangskarte** zum Mitgeben lässt sich ausdrucken.
- **Freischalten:** Hier hakst du die Planeten an, die ihr gerade durchnehmt. Optional öffnet sich der nächste Planet automatisch, wenn das Kind einen schafft.
- Für jedes Kind gibt es die Tabs Überblick, Fehler-Radar, Gefühls-Kompass, Funkspruch, **private Notizen** (das Kind sieht sie nie) und Elternbericht.
- **Verwaltung:** neuen Code erzeugen (der alte wird ungültig), Fortschritt zurücksetzen, Kind löschen
- **Einstellungen:** Praxisname, dein Name, Kontakt-Link, Begrüßungstext, Passwort ändern, **Datensicherung herunterladen**

---

## 🔗 Variante ohne Server (kostenlos als claude.ai-Web-App)

Im Ordner `lite/` liegt eine Version, die **ohne eigenen Server** läuft (`sh lite/build.sh` baut sie nach `lite/dist/`):

- **Kinder-App** (öffentlich teilbar): Kinder öffnen ihren persönlichen Link `…#k-<name>-<code>`. Darin stehen die freigeschalteten Planeten, der Avatar und optional ein Funkspruch. Alternativ geben sie den Code unter „Ich habe einen Code“ ein. Der Fortschritt bleibt auf dem Gerät des Kindes.
- **Coach-Dashboard** (privat): Kinder anlegen, freischalten, Link oder Funkspruch per Kopieren verschicken. Über 📤 in der App schicken Eltern einen **Bericht-Code** (`SH1…`), den du mit „📥 Bericht einfügen“ übernimmst. Danach sind Fehler-Radar, Gefühls-Kompass, Frühwarnsystem und Elternbericht wie in der Server-Version gefüllt.

Unterschied zur Server-Version: Ergebnisse kommen nicht automatisch an, sondern per Bericht-Code. Ein Code lässt sich nicht sperren; schalte stattdessen weniger frei und schicke einen neuen Link.

## ▶️ Starten

Du brauchst nur [Node.js](https://nodejs.org) ab Version 18. Weitere Pakete sind nicht nötig.

```bash
npm start
# → http://localhost:3000        (Kinder-App)
# → http://localhost:3000/coach  (Dashboard: beim ersten Aufruf Passwort festlegen)
```

Einstellbare Umgebungsvariablen:

| Variable | Bedeutung | Standard |
|---|---|---|
| `PORT` | Port | `3000` |
| `DATA_DIR` | Ordner für die Datenbank (`db.json`) | `./data` |
| `COACH_PASSWORD` | setzt das Coach-Passwort beim ersten Start; ohne diese Variable legst du es unter `/coach` fest | – |
| `TRUST_PROXY` | `1`, wenn die App hinter einem Hoster-Proxy läuft (Render, Railway, nginx). Sonst teilen sich alle Kinder beim Schutz gegen Code-Raten eine Adresse | – |

Tests ausführen: `npm test`

## 🌐 Online stellen

**Am einfachsten mit Render:** Im Repository liegt eine fertige `render.yaml` (Server in Frankfurt, dauerhafter Speicher, alle Einstellungen gesetzt). Im Render-Dashboard „New“ → „Blueprint“ wählen, dieses Repository und den Branch auswählen, bestätigen. Fertig.

Damit Kinder von zu Hause aus spielen können, muss die App auf einem Server laufen. Geeignet ist jeder Node.js-Hoster mit **dauerhaftem Speicher** für den `DATA_DIR`-Ordner, zum Beispiel ein kleiner VPS (Hetzner, netcup), Render oder Railway mit „Persistent Disk“ oder Fly.io mit Volume.

1. Setze direkt nach dem ersten Start das Coach-Passwort (oder vorher `COACH_PASSWORD`).
2. Nutze HTTPS. Bei den meisten Hostern ist das automatisch aktiv.
3. Lade regelmäßig unter Einstellungen → „Sicherung herunterladen“ ein Backup herunter.

## 🔒 Datenschutz (DSGVO-freundlich gebaut)

- Die freie Version speichert **nichts auf dem Server**. Der Fortschritt liegt nur im Browser des Kindes.
- Bei Code-Kindern wird nur das gespeichert, was du eingibst (Vorname oder Spitzname, Avatar), dazu Lernergebnisse und Stimmungsangaben. Es gibt keine E-Mail, keinen Nachnamen und kein Geburtsdatum.
- Die App lädt **keine externen Dienste**: keine Google Fonts, kein Tracking, keine Werbung, kein CDN. Vorgelesen wird mit der Sprachausgabe des Geräts.
- Wähle einen Hoster in der EU. Hole außerdem vor dem Einsatz die Einwilligung der Eltern ein (Lerndaten Minderjähriger) und erwähne die App in deiner Datenschutzerklärung.

## 🗂 Aufbau

```
server.js              Server und API (ohne Abhängigkeiten, Daten in data/db.json)
public/index.html      Kinder-App
public/coach.html      Coach-Dashboard
public/js/curriculum.js  Galaxien, Planeten, Fehlertypen, Freischalt-Logik (von App und Server gemeinsam genutzt)
public/js/exercises.js   Aufgaben-Generatoren mit Fehlermuster-Ablenkern
public/js/app.js         Logik der Kinder-App
public/js/coach.js       Logik des Dashboards
test/                    automatische Tests
```

**Neue Planeten hinzufügen:** Trage den Planeten in `PLANETS` (curriculum.js) ein und schreibe in `exercises.js` einen Generator mit gleicher ID. Die Wörterliste `WORDS` kannst du beliebig erweitern.
