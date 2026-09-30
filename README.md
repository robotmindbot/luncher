# Luncher

An Android home screen that lists installed apps, searches app names and aliases, and can show the next calendar event.

The project source and bundled artwork are licensed under MIT; see [LICENSE](LICENSE).

## Build from source

Requirements: Node.js 20 or newer, Java 21, and Android SDK platform 35.

```sh
npm ci
npx expo prebuild --platform android --clean --no-install
sed -i '/signingConfig /d' android/app/build.gradle
cd android
./gradlew --no-daemon assembleRelease
```

The unsigned APK is written to `android/app/build/outputs/apk/release/app-release-unsigned.apk`. The generated Android project is ignored by Git; Expo prebuild recreates it from the checked-in app config and plugin. The clean prebuild replaces any local `android/` directory.

## F-Droid

F-Droid metadata and the source build recipe are in `.fdroid.yml`. The Android
launcher is generated from the checked-in Expo configuration during the build;
the release is assembled unsigned from source. The public source is at
<https://github.com/robotmindbot/luncher>.

App discovery uses `QUERY_ALL_PACKAGES` because a launcher needs to list the
apps installed on the device. Calendar access is optional and requested only
when enabling the next appointment display. Crash reporting and analytics are
not included.
