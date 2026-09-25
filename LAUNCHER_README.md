# Luncher

Luncher is a minimal Android home-screen launcher built with Expo and React Native.

## What it does

- Shows launchable installed apps in an alphabetized drawer.
- Filters the drawer as you type. A unique result opens automatically; otherwise tap an app to open it.
- Lets you configure up to ten home-screen shortcuts, optional shortcut names, and apps assigned to left and right swipes.
- Saves launcher settings and the app list cache on the device.

The home screen is intentionally plain. Tap it or swipe up to open the drawer. Long-press it to open settings. In settings, use **Home Apps** to choose how many shortcut slots to show; tap an empty slot to select an app. Settings also controls text size and swipe actions.

## Build and install

Requirements: Node.js, Android SDK/Gradle, and an Android device or emulator authorized for ADB.

```sh
npm install
scripts/rebuild_and_redeploy.sh debug
```

Pass `release` instead of `debug` to build and install the release variant:

```sh
scripts/rebuild_and_redeploy.sh release
```

The script regenerates the ignored `android/` project, builds the selected variant, then installs it on the connected device. Set Luncher as the default home app in Android's **Settings → Apps → Default apps → Home app**.

## Implementation

The React Native screens live in `app/` and `components/`. The local Expo module in `modules/app-launcher/` uses Android's `PackageManager` to find launchable apps and open them. The module requires `QUERY_ALL_PACKAGES`, declared in `app.json`.
