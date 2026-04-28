#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "=========================================="
echo "  QueueMaster - Lokaler Server"
echo "=========================================="
echo ""

# Node.js prüfen
if ! command -v node &> /dev/null; then
  echo "[FEHLER] Node.js ist nicht installiert!"
  echo "Bitte von https://nodejs.org herunterladen."
  exit 1
fi

# npm install wenn nötig
if [ ! -d "node_modules" ]; then
  echo "Installiere Abhängigkeiten..."
  npm install
fi

echo "Server startet auf http://localhost:3000"
echo ""
echo "  Display:  http://localhost:3000/display.html"
echo "  Tablet:   http://localhost:3000/tablet.html"
echo "  Admin:    http://localhost:3000/admin.html"
echo ""

# Browser öffnen
sleep 2
if command -v open &> /dev/null; then
  open "http://localhost:3000/display.html"
  open "http://localhost:3000/tablet.html"
  open "http://localhost:3000/admin.html"
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:3000/display.html"
  xdg-open "http://localhost:3000/tablet.html"
  xdg-open "http://localhost:3000/admin.html"
fi

node server.js
