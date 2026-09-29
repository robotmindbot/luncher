# Luncher

An Android home screen that lists installed apps, searches app names and aliases, and can show the next calendar event.

The project is licensed under MIT; see [LICENSE](LICENSE).

## Build from source

Requirements: Node.js 20, Java 17, and Android SDK platform 35.

```sh
npm ci
npx expo prebuild --platform android --clean --no-install
sed -i '/signingConfig /d' android/app/build.gradle
cd android
./gradlew --no-daemon assembleRelease
```

The unsigned APK is written to `android/app/build/outputs/apk/release/app-release-unsigned.apk`. The generated Android project is ignored by Git; Expo prebuild recreates it from the checked-in app config and plugin. The clean prebuild replaces any local `android/` directory.

## F-Droid status

The root `.fdroid.yml` contains an initial build recipe. With `fdroidserver` installed, run `fdroid build` from the repository root to build the pinned source revision. The recipe still needs validation in the F-Droid build environment; JavaScript package sources and Gradle dependencies must be reviewed and buildable from source.

App discovery uses `QUERY_ALL_PACKAGES` because a launcher needs to list the apps installed on the device. Calendar access is optional and requested only when enabling the next appointment display. Crash reporting and analytics are not included.

Before submitting to the main F-Droid repository, declare a FLOSS license for the source and licenses for the bundled artwork, then add and validate the repository's F-Droid metadata/build recipe.
