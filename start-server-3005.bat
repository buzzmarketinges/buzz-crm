@echo off
:loop
echo [Watchdog] Iniciando servidor en puerto 3005...
npx next dev -p 3005
echo [Watchdog] Servidor cerrado inesperadamente. Reiniciando en 3 segundos...
timeout /t 3 >nul
goto loop
