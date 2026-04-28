@echo off
title QueueMaster - Server
color 0A
setlocal enabledelayedexpansion

echo.
echo  ==========================================
echo    QueueMaster - Lokaler Server
echo  ==========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  color 0C
  echo  [FEHLER] Node.js ist nicht installiert!
  echo  Bitte von https://nodejs.org herunterladen und installieren.
  echo.
  pause
  exit /b
)

cd /d "%~dp0"

if not exist "node_modules" (
  echo  Installiere Abhaengigkeiten, bitte warten...
  echo.
  call npm install
  echo.
)

:: Alle IPv4-Adressen anzeigen, aber VPN/CGNAT Adressen markieren
echo  ==========================================
echo    SERVER LAEUFT
echo  ==========================================
echo.
echo   Auf diesem PC:
echo    Display: http://localhost:3000/display.html
echo    Admin:   http://localhost:3000/admin.html
echo.
echo   Fuer das Tablet/Handy im WLAN - moegliche URLs:
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set "IP=%%a"
  set "IP=!IP: =!"

  :: VPN-Bereiche erkennen (100.x = CGNAT/Tailscale, 25.x = Hamachi)
  echo !IP! | findstr /b "100." >nul
  if !errorlevel!==0 (
    echo    [VPN - funktioniert NICHT fuer Tablet]   http://!IP!:3000/tablet.html
  ) else (
    echo !IP! | findstr /b "25." >nul
    if !errorlevel!==0 (
      echo    [VPN Hamachi - funktioniert NICHT]        http://!IP!:3000/tablet.html
    ) else (
      echo    [OK - diese URL im WLAN verwenden]  http://!IP!:3000/tablet.html
    )
  )
)

echo.
echo  ^>^> Oeffne eine URL mit [OK] auf dem Handy/Tablet in Chrome
echo  ^>^> Dann "Zum Home-Bildschirm hinzufuegen" anklicken
echo.
echo  Tipp: Handy und PC muessen im SELBEN WLAN sein!
echo.
echo  ==========================================
echo  Zum Beenden: STRG+C druecken
echo  ==========================================
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/display.html"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/admin.html"

node server.js

pause
