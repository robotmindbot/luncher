# 🐛 robotmind Launcher Crash Debugging Guide

This guide will help you diagnose and fix crashes in the robotmind Android launcher.

## 🚀 Quick Start Debugging

### 1. **Use the Debug Scripts**

**Linux/macOS:**
```bash
./debug-crash.sh
```

**Windows:**
```cmd
debug-crash.bat
```

These scripts will help you monitor logs in real-time and save crash information.

### 2. **Manual Debugging with ADB**

If you prefer manual debugging:

```bash
# View live logs
adb logcat | grep -E "(baby.robotmind.luncher|ReactNativeJS|FATAL|ERROR)"

# View recent crashes only
adb logcat -d | grep -E "(FATAL|AndroidRuntime)" | tail -20

# Clear logs and start fresh
adb logcat -c
```

## 🔍 What the Enhanced App Now Provides

The updated app now includes:

### **1. Error Boundary**
- **Catches React component crashes** before they crash the entire app
- **Shows detailed error messages** with stack traces
- **Provides retry button** to recover from errors
- **Logs all errors** to console for debugging

### **2. Comprehensive Logging**
Every major operation now logs to console:
- ✅ Component mounting/unmounting
- ✅ App loading process
- ✅ Search filtering
- ✅ App launching attempts
- ✅ Error occurrences

### **3. Graceful Error States**
- **Loading errors** → Shows error message with retry
- **Render errors** → Shows error boundary
- **App launch errors** → Shows alert with details
- **Search errors** → Continues working with error log

### **4. Debug Information**
- **Yellow debug bar** shows number of apps loaded
- **Console logs** for every operation
- **Detailed error messages** in UI
- **Stack traces** for crashes

## 📱 Step-by-Step Debugging Process

### **Step 1: Enable Developer Options**
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings → Developer Options**
4. Enable **USB Debugging**

### **Step 2: Connect Device and Monitor**
1. **Connect device** via USB
2. **Trust the computer** when prompted
3. **Run debug script**: `./debug-crash.sh` (Linux/Mac) or `debug-crash.bat` (Windows)
4. **Choose option 1** to monitor live logs

### **Step 3: Reproduce the Crash**
1. **Start the app** on your device
2. **Keep the debug script running** in terminal
3. **Interact with the app** until it crashes
4. **Watch the logs** for error messages

### **Step 4: Analyze the Error**

Look for these key error types:

#### **React Native JavaScript Errors**
```
ReactNativeJS: Error: Cannot read property 'map' of undefined
ReactNativeJS: TypeError: undefined is not a function
```

#### **Android Native Crashes**
```
FATAL EXCEPTION: main
java.lang.RuntimeException: Unable to start activity
AndroidRuntime: FATAL EXCEPTION: main
```

#### **Permission Errors**
```
Permission denied: QUERY_ALL_PACKAGES
SecurityException: Permission denied
```

#### **Memory Errors**
```
OutOfMemoryError: Java heap space
Native crash: signal 11 (SIGSEGV)
```

## 🔧 Common Crash Causes & Solutions

### **1. Permission Issues** ⚠️
**Symptoms:** App crashes on startup, "keeps stopping" immediately

**Solution:**
```bash
# Check if app has QUERY_ALL_PACKAGES permission
adb shell dumpsys package baby.robotmind.luncher | grep -A5 "declared permissions"
```

**Fix:** Manually enable in Settings → Apps → robotmind → Permissions

### **2. Native Module Issues** 📱
**Symptoms:** Crashes when trying to list apps, "module not found" errors

**Solution:**
- App should gracefully fall back to mock data
- Check logs for native module loading errors
- Verify Expo module configuration

### **3. Memory Issues** 💾
**Symptoms:** App crashes after running for a while, OutOfMemoryError

**Solution:**
```bash
# Monitor memory usage
./debug-crash.sh
# Choose option 4 to monitor memory
```

### **4. UI Rendering Issues** 🎨
**Symptoms:** Blank screens, layout crashes, FlatList errors

**Solution:**
- Check for undefined data in FlatList
- Verify all required props are provided
- Look for styling conflicts

## 📊 Interpreting the Debug Output

### **Normal Startup Logs**
```
ReactNativeJS: LauncherHome component mounted
ReactNativeJS: Starting to load apps...
ReactNativeJS: Mock apps loaded: 10
ReactNativeJS: Apps set successfully
ReactNativeJS: Loading complete
```

### **Error Logs to Watch For**
```
ReactNativeJS: Error in search filter: TypeError...
ReactNativeJS: ErrorBoundary caught error: ...
AndroidRuntime: FATAL EXCEPTION: main
System.err: java.lang.SecurityException...
```

### **Permission Denied Logs**
```
ReactNativeJS: AppLauncher native module not available, using mock data
System.err: SecurityException: Permission denied: QUERY_ALL_PACKAGES
```

## 🛠️ Advanced Debugging Techniques

### **1. Enable Verbose Logging**
```bash
# Enable verbose React Native logging
adb shell setprop log.tag.ReactNativeJS VERBOSE
```

### **2. Check App Package Info**
```bash
# Verify app is installed correctly
adb shell pm list packages | grep robotmind
adb shell dumpsys package baby.robotmind.luncher
```

### **3. Monitor Native Crashes**
```bash
# Monitor for native crashes specifically
adb logcat -s AndroidRuntime:E ReactNativeJS:V System.err:W
```

### **4. Check Intent Filters**
```bash
# Verify launcher intent filters are registered
adb shell dumpsys package baby.robotmind.luncher | grep -A10 "Activity Resolver Table"
```

## 📝 Creating Bug Reports

When reporting crashes, include:

1. **Device Information:**
   - Android version
   - Device model
   - Available RAM

2. **Crash Logs:**
   - Full logcat output from debug script
   - React Native console errors
   - Native Android errors

3. **Steps to Reproduce:**
   - Exact sequence of actions
   - When the crash occurs
   - How consistently it happens

4. **App State:**
   - Permissions granted
   - Set as default launcher?
   - First install vs. update

## 🎯 Quick Fixes for Common Issues

### **Immediate Crash on Startup**
```bash
# Check if it's a permission issue
adb shell am start -n baby.robotmind.luncher/.MainActivity
# Look for permission denied errors
```

### **App Loads but Shows No Apps**
- **Issue:** QUERY_ALL_PACKAGES permission not granted
- **Fix:** Manually enable in device settings
- **Verify:** App should show mock data if permission denied

### **Crashes When Tapping Apps**
- **Issue:** Intent resolution errors
- **Check:** Look for SecurityException in logs
- **Fix:** Verify launcher intent filters

### **Memory Crashes**
- **Issue:** Too many apps or large icons
- **Monitor:** Use memory monitoring in debug script
- **Fix:** Implement icon caching and lazy loading

## 🚨 Emergency Recovery

If the app completely breaks your device's launcher:

1. **Install another launcher:**
   ```bash
   adb install path/to/backup-launcher.apk
   ```

2. **Reset default launcher:**
   ```bash
   adb shell pm clear-default-apps
   ```

3. **Force stop robotmind:**
   ```bash
   adb shell am force-stop baby.robotmind.luncher
   ```

4. **Uninstall if necessary:**
   ```bash
   adb uninstall baby.robotmind.luncher
   ```

Remember: The enhanced error handling in the app should prevent most crashes and provide detailed information about what went wrong!