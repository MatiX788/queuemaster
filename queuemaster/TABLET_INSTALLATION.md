# 📱 QueueMaster Tablet-App Installation

## Schritt 1: PC und Tablet im selben WLAN

Beide Geräte müssen im gleichen WLAN-Netzwerk sein.

## Schritt 2: Server auf dem PC starten

Doppelklick auf `START.bat` — im Fenster steht oben die URL für das Tablet, z.B.:
```
http://192.168.1.100:3000/tablet.html
```
→ Diese URL merken / abschreiben.

## Schritt 3: Auf dem Tablet öffnen

**Chrome** auf dem Android-Tablet öffnen und die URL eingeben.

## Schritt 4: Als App installieren

### Auf Android (Chrome):
1. Die Seite laden — ggf. erscheint unten ein "Installieren" Banner → darauf tippen
2. Alternativ: Auf die **drei Punkte** oben rechts tippen
3. **"App installieren"** oder **"Zum Startbildschirm hinzufügen"** wählen
4. Bestätigen → Die App erscheint als Icon auf dem Home-Screen

### Auf iPad (Safari):
1. Die URL in **Safari** öffnen (nicht Chrome!)
2. Auf das **Teilen-Symbol** (▲) unten tippen
3. **"Zum Home-Bildschirm"** wählen
4. Auf **"Hinzufügen"** tippen

## Fertig! 🎉

Die App läuft jetzt wie eine normale Android/iPad-App:
- Eigenes Icon auf dem Home-Screen
- Startet ohne Browser-Leiste im Vollbild
- Funktioniert auch wenn der Browser geschlossen ist
- Behält alles im Speicher

---

## Wichtig:

- Der **PC mit dem Server muss laufen**, solange das Tablet benutzt wird
- Beide müssen im **selben WLAN** sein
- Wenn der PC eine neue IP bekommt, einfach neu öffnen und installieren

## Firewall (Windows)

Beim ersten Start fragt Windows möglicherweise nach einer Firewall-Freigabe für Node.js. Bitte **"Zugriff zulassen"** wählen, sonst kann das Tablet den Server nicht erreichen.

## Test ob's geht

Auf dem Tablet im Chrome-Browser:
- `http://[PC-IP]:3000/tablet.html` → sollte die Personal-App öffnen
- `http://[PC-IP]:3000/admin.html` → zeigt Admin (kannst du auch vom Tablet aus verwalten!)
