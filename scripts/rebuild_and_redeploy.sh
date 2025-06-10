#!/bin/bash

rm -r android
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
