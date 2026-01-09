#!/bin/bash

# Check Android Build Environment Setup
# This script verifies that all prerequisites are installed for Android builds

echo "🔍 Checking Android Build Environment..."
echo ""

ERRORS=0
WARNINGS=0

# Check Java
echo "☕ Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "   ✅ Java found: $JAVA_VERSION"
    
    # Check if Java version is 17+
    JAVA_MAJOR=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | awk -F '.' '{print $1}')
    if [ "$JAVA_MAJOR" -ge 17 ]; then
        echo "   ✅ Java version is 17+ (recommended)"
    else
        echo "   ⚠️  Java version may be too old (17+ recommended)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ❌ Java not found!"
    echo "      Install Java 17+ from: https://adoptium.net/"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check Android SDK
echo "📱 Checking Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    # Try common locations
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        echo "   ⚠️  ANDROID_HOME not set, but found SDK at: $ANDROID_HOME"
        echo "      Add to ~/.zshrc: export ANDROID_HOME=\$HOME/Library/Android/sdk"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ❌ ANDROID_HOME not set and SDK not found!"
        echo "      Install Android Studio from: https://developer.android.com/studio"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✅ ANDROID_HOME: $ANDROID_HOME"
    if [ -d "$ANDROID_HOME" ]; then
        echo "   ✅ Android SDK directory exists"
    else
        echo "   ❌ Android SDK directory not found at: $ANDROID_HOME"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# Check ADB
echo "🔌 Checking ADB (Android Debug Bridge)..."
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb version | head -n 1)
    echo "   ✅ ADB found: $ADB_VERSION"
    
    # Check for connected devices
    DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
    if [ "$DEVICES" -gt 0 ]; then
        echo "   ✅ $DEVICES device(s) connected"
    else
        echo "   ℹ️  No devices connected (this is OK if using emulator)"
    fi
else
    echo "   ⚠️  ADB not found in PATH"
    echo "      Add to ~/.zshrc: export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check Android Emulator
echo "📱 Checking Android Emulator..."
if command -v emulator &> /dev/null; then
    echo "   ✅ Emulator command found"
else
    echo "   ℹ️  Emulator not in PATH (optional, only needed for emulator testing)"
    echo "      Add to ~/.zshrc: export PATH=\$PATH:\$ANDROID_HOME/emulator"
fi

echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js found: $NODE_VERSION"
else
    echo "   ❌ Node.js not found!"
    echo "      Install from: https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   ✅ npm found: $NPM_VERSION"
else
    echo "   ❌ npm not found!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check Expo CLI
echo "🚀 Checking Expo CLI..."
if command -v expo &> /dev/null || command -v npx &> /dev/null; then
    echo "   ✅ Expo CLI available (via npx)"
else
    echo "   ⚠️  Expo CLI not found globally (will use npx)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check Android project files
echo "📁 Checking Android project..."
cd "$(dirname "$0")"
if [ -d "android" ]; then
    echo "   ✅ android directory exists"
    
    if [ -f "android/gradlew" ]; then
        echo "   ✅ gradlew found"
    else
        echo "   ⚠️  gradlew not found (may need to initialize)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [ -f "android/app/build.gradle" ]; then
        echo "   ✅ build.gradle found"
    else
        echo "   ⚠️  build.gradle not found"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⚠️  android directory not found"
    echo "      Run: npx expo prebuild --platform android"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! You're ready to build Android apps."
    echo ""
    echo "🚀 Quick start:"
    echo "   ./build-android-debug.sh    # Build debug APK"
    echo "   npm run android             # Build and run on device/emulator"
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup complete with $WARNINGS warning(s)"
    echo "   Review warnings above, but you can still build."
    echo ""
    echo "🚀 Quick start:"
    echo "   ./build-android-debug.sh    # Build debug APK"
    echo "   npm run android             # Build and run on device/emulator"
else
    echo "❌ Found $ERRORS error(s) and $WARNINGS warning(s)"
    echo "   Please fix the errors above before building."
    echo ""
    echo "📖 See ANDROID_BUILD_GUIDE.md for detailed setup instructions"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ERRORS
