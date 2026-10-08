@echo off
REM HEHKU - Garden of Silence :: production build + preview launcher
REM Kaksoisklikkaa -> rakentaa tuotantoversion (dist) ja tarjoilee sen paikallisesti.
setlocal
cd /d "%~dp0"
title HEHKU - preview (production build)

where node >nul 2>nul
if errorlevel 1 (
  echo [HEHKU] Node.js ei loytynyt. Asenna Node 20.19+ tai 22.12+ LTS: https://nodejs.org/
  pause
  exit /b 1
)

node scripts/check-node.mjs
if errorlevel 1 (
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [HEHKU] Asennetaan riippuvuudet ensimmaista kertaa, odota hetki...
  call npm ci
  if errorlevel 1 (
    echo [HEHKU] npm install epaonnistui. Tarkista nettiyhteys ja yrita uudelleen.
    pause
    exit /b 1
  )
)

echo [HEHKU] Rakennetaan tuotantoversio...
echo [HEHKU] Building production bundle...
call npm run build
if errorlevel 1 (
  echo [HEHKU] Build epaonnistui, katso virheet ylaltaa.
  pause
  exit /b 1
)

echo [HEHKU] Avataan esikatselu osoitteessa http://localhost:4173 ...
call npm run preview -- --open --port 4173 --strictPort
pause
