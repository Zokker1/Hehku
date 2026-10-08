@echo off
REM HEHKU - Garden of Silence :: dev server launcher (FI/EN below)
REM Kaksoisklikkaa -> asentaa riippuvuudet tarvittaessa, kaynnistaa dev-serverin ja avaa selaimen.
setlocal
cd /d "%~dp0"
title HEHKU - dev server

where node >nul 2>nul
if errorlevel 1 (
  echo [HEHKU] Node.js ei loytynyt. Asenna Node 20.19+ tai 22.12+ LTS: https://nodejs.org/
  echo [HEHKU] Node.js not found. Install Node 20.19+ or 22.12+ LTS: https://nodejs.org/
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
  echo [HEHKU] Installing dependencies for the first time, please wait...
  call npm ci
  if errorlevel 1 (
    echo [HEHKU] npm install epaonnistui. Tarkista nettiyhteys ja yrita uudelleen.
    pause
    exit /b 1
  )
)

echo [HEHKU] Kaynnistetaan dev-serveri... selain avautuu osoitteeseen http://localhost:5173
echo [HEHKU] Starting dev server... browser will open at http://localhost:5173
call npm run dev -- --open --port 5173 --strictPort
pause
