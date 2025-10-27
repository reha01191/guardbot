@echo off
title Discord Bot Başlatıcı
color 0a
echo.
echo ================================
echo      Discord Bot Baslatiliyor
echo ================================
echo.

:: Node kurulu mu kontrol et
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi! Lutfen https://nodejs.org adresinden yukle.
    pause
    exit /b
)

:: index.js dosyası var mı kontrol et
if not exist "index.js" (
    echo [HATA] index.js dosyasi bulunamadi!
    pause
    exit /b
)

:: Node modülleri yükle
if not exist "node_modules" (
    echo [!] Gerekli kutuphaneler yukleniyor...
    npm install
)

:: Botu başlat
echo.
echo [!] Bot baslatiliyor...
node index.js

:: Hata olursa yeniden başlatma seçeneği
echo.
echo ================================
echo Bot kapandi veya hata aldi.
echo Yeniden baslatmak icin bir tusa basin.
echo ================================
pause
goto :start
