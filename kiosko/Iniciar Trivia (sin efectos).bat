@echo off
rem Abre la Trivia REDMI SIN EFECTOS ESPECIALES (para totems que no los corran con fluidez)
rem en Microsoft Edge a pantalla completa, sin barras del navegador. Comparte el ranking con la
rem version con efectos.
rem Salir de pantalla completa: F11. Cerrar: Alt + F4.
rem No usar --kiosk: navega en InPrivate y borra el ranking al cerrar.

set "APP=%~dp0index.html"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE%" (
  echo No se encontro Microsoft Edge. Abra index.html manualmente y presione F11.
  pause
  exit /b 1
)

start "" "%EDGE%" --app="file:///%APP:\=/%?efectos=no" --start-fullscreen --no-first-run --disable-pinch --overscroll-history-navigation=0
