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

The project is not ready for F-Droid submission yet: neither configured Git remote is publicly accessible, and F-Droid needs a public source repository to build a pinned revision. Once a public repository URL is available, add and validate the F-Droid build metadata. JavaScript package sources and Gradle dependencies must also be reviewed and buildable from source.

App discovery uses `QUERY_ALL_PACKAGES` because a launcher needs to list the apps installed on the device. Calendar access is optional and requested only when enabling the next appointment display. Crash reporting and analytics are not included.

Before submitting to the main F-Droid repository, declare a FLOSS license for the source and licenses for the bundled artwork, then add and validate the repository's F-Droid metadata/build recipe.
