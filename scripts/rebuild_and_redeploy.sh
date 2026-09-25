#!/usr/bin/env bash
set -e

case "${1:-}" in
  debug) variant=Debug; apk=app/build/outputs/apk/debug/app-debug.apk ;;
  release) variant=Release; apk=app/build/outputs/apk/release/app-release.apk ;;
  *) echo "Usage: $0 debug|release" >&2; exit 2 ;;
esac

rm -rf android
npx expo prebuild --platform android
cd android
./gradlew "assemble$variant"
adb install -r "$apk"
