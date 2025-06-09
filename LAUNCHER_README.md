# Waza Android Launcher

A React Native Android launcher built with Expo that provides a clean, modern interface for launching applications on Android devices.

## Features

- **App Discovery**: Automatically lists all installed applications using Android's PackageManager
- **Search**: Real-time search through installed applications
- **Modern UI**: Clean dark theme with blur effects and responsive grid layout
- **App Icons**: Displays app icons with fallback to initials for apps without icons
- **Launcher Integration**: Properly configured as an Android HOME application

## Architecture

The launcher follows the architecture described in [this Medium article](https://medium.com/paradox-cat-tech-hub/custom-android-launcher-why-and-how-do-i-build-one-6a1b3af89d43), implementing:

1. **AndroidManifest Configuration**: Declares the app as a HOME launcher with proper intent filters
2. **Native Module**: Custom Expo module that interfaces with Android's PackageManager API
3. **React Native UI**: Modern interface with search, grid layout, and app launching

## Setup Instructions

### Prerequisites

- Node.js 18+
- Expo CLI
- Android Studio with Android SDK
- Android device or emulator

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure for Android development**:
   ```bash
   npx expo install --fix
   ```

3. **Build the native module**:
   ```bash
   npx expo run:android
   ```

### Building for Production

1. **Create development build**:
   ```bash
   npx expo run:android --variant debug
   ```

2. **Create production build**:
   ```bash
   npx expo build:android --type apk
   ```

### Setting as Default Launcher

1. Install the APK on your Android device
2. Press the home button or navigate to Settings → Apps → Default Apps
3. Select "Home app" and choose "Waza" from the list
4. The launcher will now be your default home screen

## Project Structure

```
├── app/
│   └── index.tsx              # Main launcher UI component
├── modules/
│   └── app-launcher/
│       ├── index.ts           # Native module interface
│       ├── expo-module.config.json
│       └── android/
│           └── src/main/java/expo/modules/applauncher/
│               └── AppLauncherModule.kt  # Android native implementation
├── app.json                   # Expo configuration with launcher intent filters
└── package.json              # Dependencies including expo-modules-core
```

## Key Components

### Native Module (AppLauncherModule.kt)

- **getInstalledApps()**: Queries PackageManager for all launchable applications
- **launchApp(packageName)**: Launches an application by package name
- **Icon Handling**: Converts Android Drawable icons to Base64 for React Native

### UI Components (index.tsx)

- **App Grid**: 4-column responsive grid layout
- **Search Bar**: Real-time filtering with blur effect
- **App Items**: Touch-responsive items with icons and names
- **Loading States**: Proper loading and error handling

## Android Permissions

The launcher requires the `QUERY_ALL_PACKAGES` permission to list all installed applications, which is automatically configured in the `app.json`.

## Development Notes

- The native module includes fallback mock data for development
- Icons are converted to Base64 for cross-platform compatibility
- The UI is optimized for touch interaction with proper press states
- Search is case-insensitive and updates in real-time

## Troubleshooting

### Native Module Issues
- Ensure Android development environment is properly set up
- Check that `expo-modules-core` is installed
- Verify the native module is properly registered

### Launcher Not Appearing in Settings
- Check that intent filters are properly configured in `app.json`
- Ensure the app has been built and installed (not just running in Expo Go)
- Verify `QUERY_ALL_PACKAGES` permission is granted

### Performance Issues
- Icons are cached automatically by React Native's Image component
- App list is sorted alphabetically on load
- Search filtering happens in memory for optimal performance

## Contributing

To extend the launcher:

1. **Add new features** to the React Native UI in `app/index.tsx`
2. **Extend native functionality** in `AppLauncherModule.kt`
3. **Update TypeScript interfaces** in `modules/app-launcher/index.ts`

## License

This project is built following the open-source Android launcher architecture patterns.