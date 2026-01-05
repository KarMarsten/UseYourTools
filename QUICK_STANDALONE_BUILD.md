# Quick Guide: Build Standalone App (No Dev Server)

You have two options to build a standalone app:

## Option 1: Command Line Build (Currently Running)

The build is currently running in the background. When it completes, the app will be installed on your device/simulator.

To check build status:
```bash
tail -f /tmp/build.log
```

To build again manually:
```bash
cd app
export LANG=en_US.UTF-8
npx expo run:ios --configuration Release
```

## Option 2: Xcode Build (Recommended - More Reliable)

This is often more reliable and gives you more control:

1. **Open the project in Xcode:**
   ```bash
   cd app
   open ios/UseYourTools.xcworkspace
   ```
   ⚠️ **Important**: Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

2. **Select your target device:**
   - At the top of Xcode, click the device selector (next to the Play button)
   - Choose:
     - Your connected iPhone/iPad (if you want to install on device)
     - Or a simulator (e.g., "iPhone 15 Pro") for testing

3. **Configure for Release build:**
   - Click the scheme selector (next to device selector) → **Edit Scheme...**
   - Select **Run** from left sidebar
   - Set **Build Configuration** to **Release**
   - Click **Close**

4. **Build and Run:**
   - Press `Cmd + R` or click the Play button ▶️
   - Xcode will build the app and install it on your device/simulator
   - The app will launch automatically

5. **Result:**
   - ✅ Standalone app installed on your device
   - ✅ No dev server needed
   - ✅ Works completely offline
   - ✅ All JavaScript is bundled inside the app

## What You Get

After either build method, you'll have:
- A **standalone iOS app** that runs completely offline
- No need for Metro bundler or dev server
- All your code bundled into the native app
- The app works just like any other app on your device

## Notes

- **Free Apple ID**: App expires after 7 days, then rebuild
- **Paid Developer Account ($99/year)**: App doesn't expire, can distribute via TestFlight
- **Rebuilding**: When you make code changes, rebuild the app - development builds are quick

## Troubleshooting

If you get code signing errors in Xcode:
1. Select **UseYourTools** project in left sidebar
2. Select **UseYourTools** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID)

