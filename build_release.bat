@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "APP_VERSION=0.1.1"
set "INSTALLER=installer\RigObserver_Setup_v%APP_VERSION%.exe"
set "PYTHON=.venv\Scripts\python.exe"
set "ISCC="

echo.
echo =============================================
echo      RigObserver v%APP_VERSION% - Release Build
echo =============================================
echo.
echo Close the RigObserver desktop app before building.
echo.

if not exist "%PYTHON%" (
    echo ERROR: Virtual environment not found.
    echo Run setup_rigobserver.bat first.
    goto :failed
)
if not exist "RigObserver.iss" (
    echo ERROR: Inno Setup script RigObserver.iss not found.
    goto :failed
)
where dotnet >nul 2>&1
if errorlevel 1 (
    echo ERROR: dotnet SDK missing. Install the .NET 10 SDK.
    goto :failed
)

REM Inno Setup can be installed per-user by winget, so Program Files
REM checks alone are not enough. Also accept registered custom locations.
if not exist "scripts\find_inno_setup.ps1" (
    echo ERROR: Inno Setup locator script is missing.
    goto :failed
)
for /f "usebackq delims=" %%F in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\find_inno_setup.ps1"`) do (
    if not defined ISCC set "ISCC=%%F"
)
if not defined ISCC (
    echo ERROR: Inno Setup compiler ISCC.exe could not be located.
    echo Check where Inno Setup is installed. You do not need to reinstall it.
    goto :failed
)
echo Inno Setup compiler: "%ISCC%"

echo [1/4] Install Python runtime and build requirements...
"%PYTHON%" -m pip install -r requirements.txt
if errorlevel 1 goto :failed
"%PYTHON%" -m pip install pyinstaller
if errorlevel 1 goto :failed

echo.
echo [2/4] Publish the self-contained Windows sensor bridge...
dotnet publish ".\sensor_bridge\sensor_bridge.csproj" -c Release -r win-x64 --self-contained true
if errorlevel 1 goto :failed
if not exist "sensor_bridge\bin\Release\net10.0\win-x64\publish\sensor_bridge.exe" (
    echo ERROR: Sensor bridge was not published.
    goto :failed
)

echo.
echo [3/4] Build RigObserver desktop executable...
"%PYTHON%" -m PyInstaller --noconfirm --clean RigObserver.spec
if errorlevel 1 goto :failed
if not exist "dist\RigObserver\RigObserver.exe" (
    echo ERROR: RigObserver.exe is missing.
    goto :failed
)

echo.
echo [4/4] Compile installer with Inno Setup...
"%ISCC%" "RigObserver.iss"
if errorlevel 1 goto :failed
if not exist "%INSTALLER%" (
    echo ERROR: Expected installer not found: %INSTALLER%
    goto :failed
)

echo.
echo =============================================
echo    BUILD SUCCEEDED - RigObserver v%APP_VERSION%
echo =============================================
echo Output: %INSTALLER%
echo.
echo IMPORTANT: Test the installer locally before
echo creating the GitHub tag and release v%APP_VERSION%.
echo.
pause
exit /b 0

:failed
echo.
echo =============================================
echo                BUILD FAILED
echo =============================================
echo Review the error above. No GitHub release was created.
pause
exit /b 1
