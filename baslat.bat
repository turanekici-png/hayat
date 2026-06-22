@echo off
chcp 65001 >nul
cd /d %~dp0

if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo =============================================
echo   HayatDer Web Platformu Baslatiliyor
echo =============================================

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do (
  echo.
  echo Uygulama zaten calisiyor: http://localhost:3000
  echo Yeniden baslatmak icin once mevcut pencereyi kapatin.
  pause
  exit /b 0
)

echo.
echo Next.js gecici derleme onbellegi temizleniyor...
if exist .next (
  rmdir /s /q .next
)

echo Paketler kontrol ediliyor...
if not exist node_modules (
  echo node_modules yok, npm install calistiriliyor...
  call npm install
  if errorlevel 1 (
    echo HATA: npm install basarisiz oldu.
    pause
    exit /b 1
  )
)

echo.
echo Prisma hazirlaniyor...
if exist node_modules\.prisma\client (
  del /q node_modules\.prisma\client\query_engine-windows.dll.node.tmp* 2>nul
)
call npx.cmd prisma generate
if errorlevel 1 (
  echo HATA: Prisma generate basarisiz oldu.
  echo Uygulama baska bir pencerede aciksa kapatip tekrar deneyin.
  pause
  exit /b 1
)

echo.
echo Veritabani gocleri uygulaniyor...
call npx.cmd prisma migrate deploy
if errorlevel 1 (
  echo HATA: Veritabani baglantisi basarisiz oldu.
  echo .env icindeki DATABASE_URL satirini kontrol edin.
  pause
  exit /b 1
)

echo.
echo Uygulama baslatiliyor...
echo Bu bilgisayardan: http://localhost:3000
echo Ayni agdaki bilgisayarlardan: http://BILGISAYAR-IP:3000
echo Yonetim paneli: http://localhost:3000/admin
echo.
call npm run dev
pause
