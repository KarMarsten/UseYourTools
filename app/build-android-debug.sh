#!/bin/bash

# Build Android Debug APK
# This script builds a debug APK for testing purposes

set -e  # Exit on error

echo "🔨 Building Android Debug APK..."
echo ""

# Navigate to app directory
cd "$(dirname "$0")"

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

# Set Java home to Android Studio's bundled JDK (if Java not in PATH)
if ! command -v java &> /dev/null || ! java -version &> /dev/null; then
    if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
        export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
        export PATH="$JAVA_HOME/bin:$PATH"
        echo "✅ Using Android Studio's bundled JDK: $JAVA_HOME"
    else
        echo "❌ Error: Java not found and Android Studio JDK not available!"
        echo "   Please install Java 17+ or ensure Android Studio is installed."
        exit 1
    fi
fi

# Navigate to android directory
cd android

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🔨 Building Debug APK..."
./gradlew assembleDebug

echo ""
echo "✅ Build complete!"
echo ""
echo "📱 APK location:"
echo "   $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 To install on connected device:"
echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 Or run: npm run android"
echo "   (This will build, install, and launch automatically)"
