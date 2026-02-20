@echo off
title HoutVeilig - Meldingsapp Server
color 0A

echo.
echo  ========================================
echo   🌲 HoutVeilig - Meldingsapp Starten
echo  ========================================
echo.

:: Start de Python webserver op de achtergrond
echo  [1/2] Webserver starten op poort 8080...
start /B python server.py

:: Wacht even tot de server opstart
timeout /t 2 /nobreak >nul

:: Start cloudflared tunnel
echo  [2/2] Publieke tunnel starten...
echo.
echo  ════════════════════════════════════════
echo   Wacht op de publieke URL hieronder...
echo   (Dit kan een paar seconden duren)
echo  ════════════════════════════════════════
echo.

cloudflared.exe tunnel --url http://localhost:8080

pause
