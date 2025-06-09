# Android Launcher Permissions Guide

This document explains all the permissions required for the Waza Android launcher to function properly.

## Required Permissions

### 🔍 **QUERY_ALL_PACKAGES**
```xml
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
```
- **Purpose**: Allows the launcher to see and query all installed applications on the device
- **Required**: YES - Without this, the launcher cannot list installed apps
- **Android 11+ Requirement**: Essential for app discovery on modern Android versions
- **User Action**: Must be granted manually in device settings

### 📱 **RECEIVE_BOOT_COMPLETED**
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```
- **Purpose**: Allows the launcher to start automatically when the device boots
- **Required**: RECOMMENDED - Ensures launcher is ready after device restart
- **User Action**: Automatically granted

### 💾 **WRITE_EXTERNAL_STORAGE**
```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```
- **Purpose**: Allows the launcher to save app icons and cached data
- **Required**: OPTIONAL - Improves performance by caching app icons
- **User Action**: May require manual permission on Android 6+

### 📖 **READ_EXTERNAL_STORAGE**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```
- **Purpose**: Allows the launcher to read cached app icons and data
- **Required**: OPTIONAL - Works with WRITE_EXTERNAL_STORAGE for caching
- **User Action**: May require manual permission on Android 6+

## Intent Filters

### 🏠 **HOME Category**
```xml
<category android:name="android.intent.category.HOME" />
<category android:name="android.intent.category.DEFAULT" />
<category android:name="android.intent.category.LAUNCHER" />
```
- **Purpose**: Declares this app as a potential home/launcher application
- **Required**: YES - Without this, the app won't appear in launcher selection
- **Effect**: Makes the app available in Settings → Apps → Default Apps → Home app

## Special Android 11+ Requirements

### 📋 **Queries Declaration**
```xml
<queries>
    <intent>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent>
</queries>
```
- **Purpose**: Declares intent to query for launchable apps
- **Android Version**: Required for Android 11 (API 30) and above
- **Automatic**: Handled by our custom Expo plugin

## Activity Launch Modes

### ⚙️ **Single Task Mode**
```xml
android:launchMode="singleTask"
android:clearTaskOnLaunch="true"
android:stateNotNeeded="true"
```
- **Purpose**: Ensures proper launcher behavior
- **Effect**: Only one instance of launcher runs at a time
- **Automatic**: Configured by our custom plugin

## Permission Setup Instructions

### 1. **Automatic Setup** ✅
Most permissions are automatically requested during app installation:
```bash
npx expo run:android
```

### 2. **Manual QUERY_ALL_PACKAGES Setup** ⚠️
This critical permission requires manual activation:

1. **Install the app**
2. **Go to**: Settings → Apps → Waza → Permissions
3. **Find**: "Display over other apps" or "Special app access"
4. **Enable**: "Query all packages" or similar option
5. **Alternative path**: Settings → Apps → Special access → Query all packages → Waza → Allow

### 3. **Set as Default Launcher** 🏠
After granting permissions:
1. **Press the Home button** or go to Settings → Apps → Default Apps
2. **Select**: "Home app"
3. **Choose**: "Waza" from the list
4. **Test**: Press Home button - should open Waza launcher

## Troubleshooting Permissions

### ❌ **No Apps Showing**
- **Problem**: QUERY_ALL_PACKAGES not granted
- **Solution**: Manually enable in Settings → Apps → Waza → Permissions

### ❌ **Launcher Not Available**
- **Problem**: Intent filters not configured
- **Solution**: Rebuild app with `npx expo run:android`

### ❌ **App Won't Stay as Default**
- **Problem**: Launch mode not configured properly
- **Solution**: Custom plugin handles this automatically

### ❌ **Permission Denied Errors**
- **Problem**: Runtime permissions not granted
- **Solution**: Check app permissions in device settings

## Testing Permission Status

You can test if permissions are working by:

1. **Check app count**: Launcher should show real installed apps, not just mock data
2. **Launch apps**: Tapping an app should actually open it
3. **Home button**: Should return to your launcher
4. **Settings check**: Your launcher should appear in default apps

## Development vs Production

### 🧪 **Development Mode**
- Uses mock data if permissions fail
- Shows warnings in console
- Graceful fallbacks for testing

### 🚀 **Production Mode**
- Requires all permissions to function
- Real app discovery and launching
- Must be set as default launcher

## Security Considerations

### 🔒 **QUERY_ALL_PACKAGES**
- **High-privilege permission**: Google Play requires justification
- **Privacy implications**: Can see all installed apps
- **Legitimate use**: Required for launcher functionality

### 🔒 **Storage Permissions**
- **Optional but recommended**: Improves performance
- **Alternative**: Use app-specific storage without permissions
- **Graceful degradation**: App works without storage access