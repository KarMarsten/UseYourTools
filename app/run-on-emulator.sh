#!/bin/bash

# Run Android app on emulator (without Android Studio)
# This script starts the emulator, installs the release APK, and launches the app

set -e

echo "🚀 Starting Android emulator and installing app..."
echo ""

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH

# Navigate to app directory
cd "$(dirname "$0")"

# Check if emulator is already running
if adb devices | grep -q "emulator.*device"; then
    echo "✅ Emulator is already running"
else
    echo "📱 Starting emulator..."
    emulator -avd Medium_Phone_API_36.1 > /dev/null 2>&1 &
    
    echo "⏳ Waiting for emulator to boot (this may take 30-60 seconds)..."
    adb wait-for-device
    
    # Wait for emulator to be fully ready
    echo "⏳ Waiting for emulator to be fully ready..."
    while ! adb shell getprop sys.boot_completed | grep -q "1"; do
        sleep 2
    done
    echo "✅ Emulator is ready!"
fi

echo ""
echo "📦 Installing release APK..."

# Check if APK exists
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
    echo "❌ Release APK not found. Building it now..."
    ./build-android-standalone.sh
fi

# Install APK
adb install -r "$APK_PATH"

echo ""
echo "🚀 Launching app..."
adb shell am start -n com.useyourtools.app/.MainActivity

echo ""
echo "✅ App launched on emulator!"
echo "   The app should now be visible on your emulator screen."
echo ""
echo "💡 This is a standalone build - no dev server needed!"
