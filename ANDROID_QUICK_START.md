# Android Build Quick Start

## 🚀 Fastest Way to Build

### Option 1: Using Helper Scripts (Easiest)

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app

# Check your setup first
./check-android-setup.sh

# Build debug APK
./build-android-debug.sh

# Build release APK
./build-android-release.sh
```

### Option 2: Using npm/Expo Commands

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app

# Build and run on connected device/emulator
npm run android
```

### Option 3: Using Gradle Directly

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app/android

# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease
```

## 📱 APK Locations

After building:
- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`

## 🔧 Prerequisites Checklist

- [ ] Android Studio installed
- [ ] Android SDK installed (API 33+)
- [ ] `ANDROID_HOME` environment variable set
- [ ] Java 17+ installed
- [ ] USB debugging enabled (for physical device)
- [ ] Device connected OR emulator running

## 🆘 Quick Troubleshooting

**"SDK location not found"**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

**"No devices found"**
```bash
adb devices  # Check connected devices
```

**"Permission denied"**
```bash
chmod +x android/gradlew
```

**"Gradle sync failed"**
```bash
cd android && ./gradlew clean
```

## 📚 More Information

- **Full Guide:** See `ANDROID_BUILD_GUIDE.md`
- **Setup Check:** Run `./check-android-setup.sh`
- **Expo Docs:** https://docs.expo.dev/build/android/
