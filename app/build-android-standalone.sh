#!/bin/bash

# Build Standalone Android APK
# This creates a completely standalone app that runs without any dev server
# All JavaScript code is bundled into the APK

set -e  # Exit on error

echo "🔨 Building Standalone Android APK..."
echo "   This APK will run completely independently - no dev server needed!"
echo ""

# Navigate to app directory
cd "$(dirname "$0")"

# Set environment variables for Node.js and Java
export NODE_BINARY=/opt/homebrew/bin/node
export PATH=/opt/homebrew/bin:$PATH

# Set Java home to Android Studio's bundled JDK (if Java not in PATH)
if ! command -v java &> /dev/null || ! java -version &> /dev/null 2>&1; then
    if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
        export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
        export PATH="$JAVA_HOME/bin:$PATH"
        echo "✅ Using Android Studio's bundled JDK: $JAVA_HOME"
    else
        echo "❌ Error: Java not found and Android Studio JDK not available!"
        echo "   Please install Java 17+ or ensure Android Studio is installed."
        echo "   Download from: https://adoptium.net/"
        exit 1
    fi
fi

# Check if Android directory exists
if [ ! -d "android" ]; then
    echo "❌ Error: android directory not found!"
    echo "   Make sure you're running this from the app directory."
    exit 1
fi

# Check if gradlew exists
if [ ! -f "android/gradlew" ]; then
    echo "❌ Error: gradlew not found!"
    echo "   Android project may not be initialized."
    exit 1
fi

# Make gradlew executable
chmod +x android/gradlew

# Navigate to android directory
cd android

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🔨 Building Release APK (standalone, all code bundled)..."
echo "   ⚠️  Note: Using debug keystore for now."
echo "   For production distribution, set up proper signing (see ANDROID_BUILD_GUIDE.md)"
echo ""

# Build release APK - this bundles all JavaScript code into the APK
./gradlew assembleRelease

echo ""
echo "✅ Standalone APK build complete!"
echo ""
echo "📱 Your standalone APK is located at:"
APK_PATH="$(pwd)/app/build/outputs/apk/release/app-release.apk"
echo "   $APK_PATH"
echo ""
echo "📊 APK Details:"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "   Size: $APK_SIZE"
    echo "   This APK contains all code and runs independently!"
fi
echo ""
echo "💡 To install on connected device:"
echo "   adb install $APK_PATH"
echo ""
echo "💡 Or transfer the APK to your device and install manually:"
echo "   1. Copy the APK file to your Android device"
echo "   2. Open the APK file on your device"
echo "   3. Allow installation from 'Unknown Sources' if prompted"
echo "   4. Tap 'Install'"
echo ""
echo "🎉 Your app is now standalone and ready to distribute!"
