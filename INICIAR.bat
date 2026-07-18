@echo off
setlocal

echo ================================================
echo   Sistema de Ventas Interno - Setup y Arranque
echo ================================================
echo.

:: Carpeta fuente (donde esta el script)
set "SRC_DIR=%~dp0"
if "%SRC_DIR:~-1%"=="\" set "SRC_DIR=%SRC_DIR:~0,-1%"

:: Carpeta de trabajo LOCAL (en disco C: local para evitar errores de Google Drive)
set "WORK_DIR=%USERPROFILE%\ventas-app\ventas-interno"

echo [INFO] Carpeta de Google Drive (Fuente): %SRC_DIR%
echo [INFO] Carpeta de Disco Local (Trabajo) : %WORK_DIR%
echo.

:: 1. Crear carpeta local y copiar archivos del proyecto (excluyendo node_modules y .next)
echo [1/4] Copiando proyecto al disco local C:...
if not exist "%WORK_DIR%" mkdir "%WORK_DIR%"
robocopy "%SRC_DIR%" "%WORK_DIR%" /E /XD node_modules .next .git /IS /IT /NFL /NDL /NJH /NJS /NC /NS
echo [OK] Archivos copiados a %WORK_DIR%.
echo.

cd /d "%WORK_DIR%"

:: 2. Instalar o actualizar dependencias
echo [2/4] Verificando dependencias locales (npm install)...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al instalar las dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias verificadas.
echo.

:: 3. Aplicar el patch de Node.js
echo [3/4] Aplicando patch de compatibilidad Node.js...
node bypass-node-check.js
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo aplicar el patch.
    pause
    exit /b 1
)
echo [OK] Patch aplicado.
echo.

:: 4. Generar el cliente de Prisma
echo [4/4] Generando cliente de Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo generar el cliente de Prisma.
    pause
    exit /b 1
)
echo [OK] Cliente de Prisma generado.
echo.

:: 5. Iniciar servidor
echo ================================================
echo   Servidor iniciado localmente en http://localhost:3000
echo   Login: admin@ventas.com / admin123
echo   Presiona Ctrl+C para detener el servidor.
echo ================================================
echo.
call npm run dev

endlocal
pause
