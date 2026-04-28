# 📱 QueueMaster Android App — APK bauen

Eine **echte Android-App**, die den QueueMaster lädt. Keine Browser-Leiste, eigenes Icon im App-Menü.

---

## Schritt 1: Android Studio installieren (einmalig)

1. Android Studio herunterladen: https://developer.android.com/studio
2. Installieren mit Standardeinstellungen (dauert ca. 15 Minuten — ~5 GB)
3. Beim ersten Start: Alle empfohlenen Komponenten installieren lassen

---

## Schritt 2: Projekt öffnen

1. Android Studio starten
2. **"Open"** (nicht "New Project"!) klicken
3. Den Ordner `android-app` auswählen (den aus dem ZIP)
4. Auf **OK** klicken
5. Android Studio lädt jetzt automatisch alle benötigten Dateien (unten rechts "Gradle sync")
   → Das dauert beim **ersten Mal 5-15 Minuten** (je nach Internet)
   → Warten bis "Gradle sync finished" unten erscheint

Falls eine Fehlermeldung kommt wie „Android SDK not found":
- Im Fehler-Popup auf den Link klicken oder: **File → Project Structure → SDK Location** → Pfad zum Android SDK wählen (Android Studio hat's meistens schon)

---

## Schritt 3: Handy/Tablet zum Testen vorbereiten

### Variante A: Eigenes Android-Tablet/Handy per USB

1. Am Tablet: **Einstellungen → Über das Telefon → Build-Nummer 7× antippen**
   → "Entwickleroptionen" sind jetzt aktiviert
2. **Einstellungen → Entwickleroptionen → USB-Debugging** einschalten
3. Tablet per **USB-Kabel** an PC anschließen
4. Am Tablet bei der Popup-Frage "USB-Debugging erlauben?" → **Ja / Immer zulassen**
5. In Android Studio oben in der Leiste sollte dein Gerät jetzt erscheinen

### Variante B: Emulator (falls kein echtes Gerät)

1. In Android Studio: **Tools → Device Manager**
2. **"+ Create Device"** → "Pixel Tablet" oder beliebiges Tablet wählen → Next
3. Ein System-Image auswählen (empfohlen: API 34) → Download klicken → Next → Finish
4. Den Emulator starten (▶-Icon)

---

## Schritt 4: App starten

1. Oben in Android Studio sicherstellen dass dein Gerät ausgewählt ist
2. Den **grünen ▶ Play-Button** klicken (oder `Shift+F10`)
3. Beim ersten Build dauert das **2-5 Minuten**
4. Die App startet automatisch auf dem Gerät/Emulator

---

## Schritt 5: Server-URL eingeben

Beim ersten Start fragt die App nach der Server-Adresse:

```
http://192.168.1.100:3000
```
(deine PC-IP aus der `START.bat`-Ausgabe, ohne `/tablet.html`)

Dann **"Verbinden"** klicken → fertig! Die Tablet-App läuft jetzt als echte App!

Du kannst auch wählen:
- **"Verbinden"** → Tablet-Seite (Personal)
- **"Display öffnen"** → Display-Seite (für den Kunden-Monitor)
- **"Admin öffnen"** → Admin-Verwaltung

---

## Schritt 6: Fertige APK bauen (zum Verteilen)

Wenn die App funktioniert und du eine installierbare APK haben willst:

1. In Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**
2. Warten bis "Build Completed" unten erscheint
3. Auf den **"locate"** Link klicken → Der Ordner öffnet sich
4. Datei: `app/build/outputs/apk/debug/app-debug.apk`

Diese `.apk` Datei kannst du jetzt:
- Per USB / E-Mail / Cloud auf jedes Android-Tablet kopieren
- Dort antippen → "Installieren" → fertig
- Eventuell muss "Installation aus unbekannten Quellen" erlaubt werden

---

## Einstellungen ändern (Server-URL später wechseln)

**Lang auf den Menu-Button (☰) drücken** in der App → Einstellungsdialog öffnet sich

Oder: App deinstallieren & neu installieren → fragt wieder nach URL

---

## Wichtig für Produktivbetrieb

- **PC-Server muss laufen** wenn das Tablet benutzt wird
- Beide im **selben WLAN** — keine VPNs aktiv!
- **Windows-Firewall** beim ersten Start fragen → **Zulassen** wählen
- Wenn der PC eine neue IP bekommt → App öffnen → Einstellungen → neue IP eintragen

---

## Troubleshooting

**"Server nicht erreichbar"**
→ Ist der PC-Server gestartet? (`START.bat` doppelklicken)
→ Richtige IP eingetragen? (die `[OK]`-IP aus dem Server-Fenster)
→ Handy/Tablet im gleichen WLAN?
→ Windows-Firewall hat Node.js geblockt → Zulassen

**"Gradle Sync Failed"**
→ Internet prüfen
→ In Android Studio: **File → Invalidate Caches → Invalidate and Restart**

**App stürzt ab / zeigt weiße Seite**
→ Server-URL falsch — im Einstellungsdialog neu eingeben
