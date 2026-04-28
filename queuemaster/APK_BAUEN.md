# 📱 APK automatisch bauen mit GitHub Actions

Die APK wird automatisch in der Cloud von GitHub gebaut — **kein Android Studio nötig!**
Kostenlos für öffentliche Repositories.

---

## Schritt 1: GitHub-Account anlegen (einmalig, 2 Min)

Wenn du noch keinen hast:
1. Gehe zu https://github.com/signup
2. E-Mail, Passwort, Username wählen
3. E-Mail bestätigen

## Schritt 2: Repository erstellen (3 Min)

1. Auf GitHub oben rechts auf **"+"** → **"New repository"**
2. Name: `queuemaster` (oder beliebig)
3. Visibility: **Public** (für kostenlose Builds) oder **Private** (kostenlose Builds limitiert)
4. **"Create repository"** klicken

## Schritt 3: Code hochladen (3 Min)

Es gibt zwei einfache Wege:

### Variante A: Direkt im Browser (am einfachsten)

1. Im neuen Repository: **"uploading an existing file"** klicken
2. Den **kompletten `queuemaster`-Ordner** per Drag & Drop reinziehen
3. Unten **"Commit changes"** klicken
4. Warten bis Upload fertig ist

### Variante B: GitHub Desktop (empfohlen für regelmäßige Updates)

1. GitHub Desktop herunterladen: https://desktop.github.com
2. Installieren und anmelden
3. **"Clone repository"** → dein neues Repo wählen → lokalen Ordner wählen
4. Alle Projektdateien in diesen Ordner kopieren
5. In GitHub Desktop: **"Commit to main"** → **"Push origin"**

## Schritt 4: APK wird automatisch gebaut! 🎉

Sobald du Code hochgeladen hast, startet GitHub automatisch den Build:

1. Im Repository auf **"Actions"** klicken (oben in der Leiste)
2. Du siehst einen laufenden Build mit gelbem Punkt
3. **3-5 Minuten warten** — wird grün ✓
4. Auf den Build klicken → unten bei **"Artifacts"** → `QueueMaster-APK` herunterladen
5. ZIP entpacken → drin ist die `QueueMaster.apk`

Alternativ erscheint die APK auch unter **"Releases"** (rechte Seite) zum direkten Download.

## Schritt 5: APK in den Server einbauen

1. Die `QueueMaster.apk` kopieren in:
   ```
   local-server/public/downloads/QueueMaster.apk
   ```
2. Server neu starten (`START.bat`)
3. Im Admin unter **„Tablet-App"** ist sie jetzt verfügbar!

## Schritt 6: Auf dem Tablet installieren

1. Am Tablet im Chrome-Browser: `http://[PC-IP]:3000/app.html` öffnen
   (die IP aus dem Server-Fenster)
2. **„APK herunterladen"** antippen
3. In der Benachrichtigungsleiste auf die Datei tippen
4. Bei der Warnung: **„Unbekannte Apps zulassen"** → erlauben
5. **„Installieren"** → fertig!
6. App öffnen → Server-IP eingeben → läuft!

---

## 🔄 APK aktualisieren

Wenn du etwas an der Android-App änderst:

1. Dateien in GitHub aktualisieren (neue Datei hochladen oder via GitHub Desktop „Push")
2. Automatisch wird ein neuer Build gestartet
3. Nach 3-5 Min neue APK runterladen
4. In `local-server/public/downloads/` ersetzen

---

## ❓ FAQ

**"Woher weiß ich dass der Build funktioniert hat?"**
→ Im Repository unter **Actions** siehst du alle Builds. Grüner Haken = OK, roter X = Fehler.

**"Kann ich privat machen, damit niemand meinen Code sieht?"**
→ Ja, Repo auf "Private" stellen. GitHub gibt kostenlos 2000 Build-Minuten pro Monat (reicht für ~200 Builds).

**"Muss ich jedes Mal Android Studio öffnen?"**
→ **Nein!** GitHub macht alles automatisch. Nur Änderungen hochladen — Rest läuft automatisch.

**"Kann der Kunde die APK selbst anpassen?"**
→ Mit deinem Code im Privat-Repo: Nein. Der Kunde bekommt nur die fertige APK und die IP-Adresse.
