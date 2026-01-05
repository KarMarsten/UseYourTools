# Running UseYourTools Without a Dev Server

The app is currently configured to use a development client, which requires a dev server. To run it as a standalone app without needing a dev server, you have two options:

## Option 1: Development Build (Recommended for Testing)

This builds a standalone app with all your code bundled in. It works completely offline and doesn't need a dev server.

### For iOS:
```bash
cd app
npx expo run:ios --device --configuration Release
```

This will:
- Build a standalone iOS app
- Install it on your connected iPhone/iPad
- Launch it automatically
- **No dev server needed** - everything is bundled into the app

**Note**: With a free Apple ID, the app expires after 7 days. Just rebuild and reinstall.

### For Android:
```bash
cd app
npx expo run:android --variant release
```

This will:
- Build a standalone Android APK
- Install it on your connected device or emulator
- Launch it automatically
- **No dev server needed** - everything is bundled into the app

## Option 2: Production Build (For Distribution)

For a production-ready standalone build that can be distributed:

### Using EAS Build (Cloud-based, Recommended)

```bash
cd app

# Install EAS CLI if you haven't already
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios --profile production

# Or build for Android
eas build --platform android --profile production
```

This creates a production build that:
- Is optimized and minified
- Doesn't require a dev server
- Can be distributed via TestFlight (iOS) or as APK (Android)
- Works completely standalone

### Local Production Build (Advanced)

#### iOS (Requires Xcode and paid Apple Developer account for distribution):
```bash
cd app
open ios/UseYourTools.xcworkspace
# In Xcode: Product → Archive (then distribute)
```

#### Android:
```bash
cd app/android
./gradlew assembleRelease
# APK will be in app/android/app/build/outputs/apk/release/
```

## Important Notes

1. **Development Build vs Production Build**:
   - **Development builds** (`expo run:ios/android`) are faster to build and include debugging tools, but may be slightly larger
   - **Production builds** are optimized, smaller, and ready for distribution

2. **No Dev Server Needed**: Once built with `expo run:ios` or `expo run:android`, the app runs completely standalone - no Metro bundler, no dev server, no connection needed.

3. **Rebuilding**: When you make code changes, you'll need to rebuild the app. Development builds are quicker for iteration, production builds are better for final release.

## Quick Start (No Dev Server)

**To build and run right now without a dev server:**

```bash
# iOS
cd app
npx expo run:ios --device --configuration Release

# Android  
cd app
npx expo run:android --variant release
```

That's it! The app will be installed on your device and run completely standalone.

