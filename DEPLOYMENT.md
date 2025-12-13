# Deploying to Physical iOS Device

## Prerequisites

1. **Apple Developer Account**: You can use a free Apple ID or a paid Apple Developer account
2. **Xcode**: Latest version installed on your Mac
3. **iOS Device**: iPhone or iPad connected via USB
4. **macOS**: Running on a Mac computer

## Do I Need Xcode?

**Short answer**: Xcode must be installed, but you can use it via command line after initial setup.

**What you need**:
- Xcode installed (download from App Store - it's free, but large ~12GB)
- Xcode Command Line Tools (usually installed with Xcode)
- Your Apple ID for code signing

## Deployment Options

### Option 1: Command Line (Recommended after initial setup)

This is the easiest way once code signing is configured:

```bash
cd app
npx expo run:ios --device
```

This will:
- Show you a list of connected devices
- Build the app
- Install it on your device
- Launch it

**First-time setup**: You'll need to configure code signing once (see Option 2 below), then you can use this command line method going forward.

### Option 2: Using Xcode GUI (Required for first-time code signing setup)

If you haven't set up code signing yet, you'll need to use Xcode once:

#### Step 1: Open the Project in Xcode

```bash
cd app
open ios/UseYourTools.xcworkspace
```

**Important**: Open the `.xcworkspace` file, NOT the `.xcodeproj` file (the workspace includes CocoaPods dependencies).

#### Step 2: Connect Your iOS Device

- Connect your iPhone/iPad to your Mac using a USB cable
- Unlock your device and trust the computer if prompted
- Your device should appear in Xcode's device selector

#### Step 3: Configure Code Signing (One-time setup)

1. In Xcode, select the **UseYourTools** project in the left sidebar
2. Select the **UseYourTools** target
3. Go to the **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID/Developer account)
   - If you don't see your team, click "Add Account..." and sign in with your Apple ID
6. Xcode will automatically generate a provisioning profile

**Note**: 
- With a free Apple ID, the app will expire after 7 days and you'll need to reinstall
- With a paid Developer account ($99/year), apps don't expire and you can distribute via TestFlight/App Store

#### Step 4: Build and Run (First Time)

1. Click the **Play** button (▶️) in Xcode, or press `Cmd + R`
2. Xcode will build and install the app on your device

#### Step 5: Trust the Developer on Your Device (First Time Only)

When you first install the app on your device:
1. After the app installs, try to open it
2. You'll see "Untrusted Developer" error
3. Go to **Settings > General > VPN & Device Management** (or **Device Management**)
4. Tap on your Apple ID
5. Tap **"Trust [Your Name]"**
6. Confirm by tapping **"Trust"**
7. You can now open the app

**After this initial setup**, you can use the command line method (Option 1) for future builds!

## Troubleshooting

### "No devices found"
- Make sure your device is unlocked
- Check that you've trusted the computer on your device
- Try disconnecting and reconnecting the USB cable
- Make sure your device iOS version is >= 15.1 (check in Xcode's deployment target)

### Code Signing Errors
- Make sure "Automatically manage signing" is checked
- Verify your Apple ID is added in Xcode Preferences > Accounts
- Try changing the Bundle Identifier (add something unique like `com.yourname.useyourtools.app`)

### Build Errors
- Clean the build folder: `Product > Clean Build Folder` (or `Cmd + Shift + K`)
- Delete derived data: `Product > Clean Build Folder`, then delete `~/Library/Developer/Xcode/DerivedData`
- Reinstall pods:
  ```bash
  cd app/ios
  pod deintegrate
  pod install
  ```

### App Crashes on Launch
- Check the device logs in Xcode's Console
- Make sure all permissions are granted (notifications, etc.)
- Verify the device iOS version meets requirements (15.1+)

## Bundle Identifier

Current bundle identifier: `com.useyourtools.app`

If you encounter signing conflicts, you may need to change this to something unique:
- In `app.json`, change `ios.bundleIdentifier` to something like `com.yourname.useyourtools.app`
- Then run `npx expo prebuild --clean` to regenerate native projects

## Additional Resources

- [Expo: Running on a Physical Device](https://docs.expo.dev/workflow/run-on-device/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)

