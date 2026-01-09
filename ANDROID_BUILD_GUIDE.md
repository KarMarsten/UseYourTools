# Android Build Guide for UseYourTools

## Prerequisites

### 1. Install Android Studio
- Download from: https://developer.android.com/studio
- Install Android SDK (API level 33+ recommended)
- Install Android SDK Build-Tools
- Install Android Emulator (optional, for testing)

### 2. Set Up Environment Variables

Add to your `~/.zshrc` (or `~/.bash_profile`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.zshrc
```

### 3. Verify Installation

```bash
# Check Java version (should be 17+)
java -version

# Check Android SDK
echo $ANDROID_HOME

# Check ADB (Android Debug Bridge)
adb version
```

## Option 1: Build APK Locally (Recommended)

### Quick Build Scripts

Use the provided helper scripts in the `app` directory:

**Debug APK (for testing):**
```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
./build-android-debug.sh
```

**Release APK (for distribution):**
```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
./build-android-release.sh
```

### Manual Build Commands

**For Development/Debug:**
```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
npm run android
# or
npx expo run:android
```

This will:
1. Build the app
2. Install on connected device/emulator
3. Launch the app automatically

**For Release APK:**
```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app/android
./gradlew assembleRelease
```

The APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

**For Debug APK:**
```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app/android
./gradlew assembleDebug
```

The APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Option 2: Build with EAS Build (Cloud)

Build in the cloud without local Android setup:

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
eas build --platform android --profile production
```

This will:
1. Upload your code to Expo's servers
2. Build the APK in the cloud
3. Provide a download link when complete

**Note:** Requires Expo account (free tier available)

## Option 3: Build with Android Studio

### Step 1: Open Project
1. Open Android Studio
2. Select **Open an Existing Project**
3. Navigate to: `/Users/karmarsten/Documents/GitHub/UseYourTools/app/android`
4. Click **OK**

### Step 2: Sync Gradle
- Android Studio will automatically sync Gradle
- Wait for "Gradle sync finished" message

### Step 3: Build APK

**For Debug:**
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Click **locate** in the notification to find the APK

**For Release:**
1. Go to **Build → Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select a keystore (see "Signing Your App" below)
4. Select release build variant
5. Click **Finish**

## Signing Your App (For Release Builds)

### Create a Keystore (One-time setup)

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore useyourtools-release-key.keystore -alias useyourtools-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Save the keystore password and alias password securely!

### Configure Gradle for Signing

Create `android/keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=useyourtools-key-alias
storeFile=app/useyourtools-release-key.keystore
```

**Note:** Add `keystore.properties` to `.gitignore` to keep passwords secure!

### Update build.gradle

The `app/build.gradle` file should already have signing config. If not, add:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... other release config
        }
    }
}
```

## Installing APK on Device

### Method 1: Via ADB (Android Debug Bridge)

```bash
# Connect device via USB
adb devices  # Verify device is connected

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Transfer and Install Manually

1. Copy APK to your Android device (via USB, email, cloud storage, etc.)
2. On device, open the APK file
3. Allow installation from unknown sources if prompted
4. Tap **Install**

## Testing on Emulator

### Create an Emulator

1. Open Android Studio
2. Go to **Tools → Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 5)
5. Select a system image (API 33+ recommended)
6. Click **Finish**

### Run on Emulator

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
npm run android
```

Or start emulator first:
```bash
emulator -avd YOUR_EMULATOR_NAME
```

## Troubleshooting

### "SDK location not found"
- Set `ANDROID_HOME` environment variable (see Prerequisites)
- Or create `android/local.properties`:
  ```
  sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
  ```

### "No devices found"
- Make sure USB debugging is enabled on your device:
  - Settings → About Phone → Tap "Build Number" 7 times
  - Settings → Developer Options → Enable "USB Debugging"
- Check connection: `adb devices`
- Try different USB cable/port

### "Gradle sync failed"
- Check internet connection (Gradle downloads dependencies)
- Try: `cd android && ./gradlew clean`
- In Android Studio: **File → Invalidate Caches / Restart**

### "Build failed: Out of memory"
- Increase Gradle memory in `android/gradle.properties`:
  ```
  org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
  ```

### "Permission denied" when running gradlew
```bash
chmod +x android/gradlew
```

### Metro bundler issues
- Stop Metro: `Ctrl+C` in terminal running Metro
- Clear cache: `npm start -- --reset-cache`
- Or: `npx expo start --clear`

## Current Android Configuration

- **Package Name:** `com.useyourtools.app`
- **Version:** 1.0.0 (versionCode: 1)
- **Min SDK:** 23 (Android 6.0)
- **Target SDK:** 34 (Android 14)
- **Permissions:**
  - Calendar (read/write)
  - Internet
  - External Storage
  - Vibration
- **Hermes Engine:** Enabled (faster JavaScript execution)

## Building Different Variants

### Debug Build (with debugging symbols)
```bash
cd android
./gradlew assembleDebug
```

### Release Build (optimized, smaller size)
```bash
cd android
./gradlew assembleRelease
```

### Bundle (AAB) for Google Play Store
```bash
cd android
./gradlew bundleRelease
```

AAB file location:
`android/app/build/outputs/bundle/release/app-release.aab`

## Distribution Options

### 1. Direct APK Distribution
- Share APK file directly
- Users install manually
- No app store required

### 2. Google Play Store
- Create developer account ($25 one-time fee)
- Build AAB: `./gradlew bundleRelease`
- Upload to Play Console
- Follow Play Store guidelines

### 3. Internal Testing
- Use EAS Build with `--profile preview`
- Share download link with testers
- No app store required

## Performance Tips

### Reduce APK Size
- Enable ProGuard/R8 (already configured)
- Use `android.enableShrinkResourcesInReleaseBuilds=true` in `gradle.properties`
- Remove unused resources

### Faster Builds
- Enable Gradle daemon (default)
- Use build cache
- Build only for target architecture:
  ```bash
  ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
  ```

## Next Steps

1. ✅ Set up Android Studio and SDK
2. ✅ Build your first APK
3. ✅ Test on device/emulator
4. ⚠️ Create release keystore (for production)
5. 📱 Distribute your app!

For questions or issues, check:
- [Expo Android Documentation](https://docs.expo.dev/build/android/)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Android Developer Guide](https://developer.android.com/studio)
