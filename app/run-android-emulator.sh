#!/bin/bash

# Build and run Android app on emulator
# This script builds the app and installs it on a connected emulator or device

set -e  # Exit on error

echo "🚀 Building and running Android app on emulator..."
echo ""

# Navigate to app directory
cd "$(dirname "$0")"

# Set environment variables
export NODE_BINARY=/opt/homebrew/bin/node
export PATH=/opt/homebrew/bin:$PATH
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH

# Set Java home to Android Studio's bundled JDK (if Java not in PATH)
if ! command -v java &> /dev/null || ! java -version &> /dev/null 2>&1; then
    if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
        export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
        export PATH="$JAVA_HOME/bin:$PATH"
        echo "✅ Using Android Studio's bundled JDK: $JAVA_HOME"
    fi
fi

# Check for connected devices/emulators
echo "📱 Checking for connected devices/emulators..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo "⚠️  No devices or emulators found!"
    echo ""
    echo "💡 Options:"
    echo "   1. Start an emulator from Android Studio:"
    echo "      - Open Android Studio"
    echo "      - Tools → Device Manager"
    echo "      - Click ▶️ Play button next to an emulator"
    echo ""
    echo "   2. Or start emulator from command line:"
    echo "      emulator -avd YOUR_EMULATOR_NAME &"
    echo ""
    echo "   3. Or connect a physical device via USB"
    echo ""
    read -p "Press Enter after starting an emulator/device, or Ctrl+C to cancel..."
    
    # Check again
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
    if [ "$DEVICES" -eq 0 ]; then
        echo "❌ Still no devices found. Exiting."
        exit 1
    fi
fi

echo "✅ Found device(s). Building and installing..."
echo ""

# Navigate to android directory
cd android

# Make gradlew executable
chmod +x gradlew

# Build and install debug APK (faster for development)
echo "🔨 Building debug APK and installing on device..."
./gradlew installDebug

echo ""
echo "✅ App installed successfully!"
echo ""
echo "💡 The app should launch automatically on your device/emulator."
echo "   If not, find 'UseYourTools' in your app drawer and tap it."
