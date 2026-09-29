@echo off
echo 🐛 robotmind Launcher Debug Script (Windows)
echo ======================================
echo.

REM Check if adb is available
adb version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ADB not found. Please install Android SDK platform tools.
    pause
    exit /b 1
)

REM Check if device is connected
adb devices | findstr "device" >nul
if %errorlevel% neq 0 (
    echo ❌ No Android device found. Please connect your device and enable USB debugging.
    pause
    exit /b 1
)

echo ✅ Android device connected
echo.

:menu
echo Choose debugging option:
echo 1. 📱 View live app logs
echo 2. 💥 View recent crash logs
echo 3. 🔍 Search for specific error
echo 4. 📋 Save logs to file
echo 5. 🧹 Clear logs
echo 0. ❌ Exit
echo.
set /p choice=Enter choice (0-5):

if "%choice%"=="1" goto live_logs
if "%choice%"=="2" goto crash_logs
if "%choice%"=="3" goto search_logs
if "%choice%"=="4" goto save_logs
if "%choice%"=="5" goto clear_logs
if "%choice%"=="0" goto exit
echo ❌ Invalid choice. Please try again.
goto menu

:live_logs
echo 🔄 Monitoring live logs for robotmind launcher...
echo Press Ctrl+C to stop
echo ==========================================
adb logcat | findstr /R "io.robotmind.luncher ReactNativeJS System.err AndroidRuntime FATAL ERROR"
goto menu

:crash_logs
echo 💥 Searching for recent crashes...
echo =================================
adb logcat -d | findstr /R "FATAL AndroidRuntime System.err" | more
echo.
echo 🔍 Searching for React Native errors...
echo =======================================
adb logcat -d | findstr "ReactNativeJS" | more
pause
goto menu

:search_logs
set /p search_term=🔍 Enter search term:
echo Searching for: %search_term%
echo =============================
adb logcat -d | findstr /I "%search_term%" | more
pause
goto menu

:save_logs
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-3 delims=:." %%a in ('time /t') do (set mytime=%%a-%%b-%%c)
set filename=robotmind_logs_%mydate%_%mytime%.txt

echo 📋 Saving logs to %filename%...
echo === robotmind LAUNCHER DEBUG LOGS === > %filename%
echo Generated: %date% %time% >> %filename%
echo ================================= >> %filename%
echo. >> %filename%

echo === RECENT CRASH LOGS === >> %filename%
adb logcat -d | findstr /R "FATAL AndroidRuntime System.err" >> %filename%
echo. >> %filename%

echo === REACT NATIVE LOGS === >> %filename%
adb logcat -d | findstr "ReactNativeJS" >> %filename%
echo. >> %filename%

echo === robotmind APP LOGS === >> %filename%
adb logcat -d | findstr "io.robotmind.luncher" >> %filename%

echo ✅ Logs saved to %filename%
pause
goto menu

:clear_logs
echo 🧹 Clearing logs...
adb logcat -c
echo ✅ Logs cleared.
pause
goto menu

:exit
echo 👋 Goodbye!
pause