# Troubleshooting iOS Device Deployment Errors

## Quick Fixes for Common Errors

### 1. Code Signing Errors

**Error**: `No signing certificate`, `Provisioning profile`, or `Code signing is required`

**Solution**:
1. Open Xcode: `cd app && open ios/UseYourTools.xcworkspace`
2. Select project → UseYourTools target → **Signing & Capabilities** tab
3. Check **"Automatically manage signing"**
4. Select your **Team** (Apple ID)
5. If you see "No accounts found", go to **Xcode → Preferences → Accounts** and add your Apple ID

### 2. Bundle Identifier Conflicts

**Error**: `The bundle identifier "com.useyourtools.app" is already in use`

**Solution**:
Change the bundle identifier to something unique:
1. Edit `app/app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.yourname.useyourtools.app"
   }
   ```
2. Regenerate native projects:
   ```bash
   cd app
   npx expo prebuild --clean
   ```

### 3. Device Not Found

**Error**: `No devices found` or device doesn't appear in list

**Solution**:
- Unlock your device
- Trust the computer (when prompted on device)
- Try a different USB cable
- Check Settings → General → VPN & Device Management → Trust Computer
- Restart Xcode

### 4. Missing Pods/Dependencies

**Error**: `No such module` or CocoaPods errors

**Solution**:
```bash
cd app/ios
pod deintegrate
pod install
cd ..
npx expo run:ios --device
```

### 5. Build Errors

**Error**: Various compilation errors

**Solution - Clean Build**:
```bash
cd app/ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData/*
cd ..
npx expo run:ios --device
```

Or in Xcode:
- Product → Clean Build Folder (Cmd+Shift+K)
- Product → Build (Cmd+B)

### 6. "Untrusted Developer" on Device

**Error**: App installs but won't open, says "Untrusted Developer"

**Solution** (on your iPhone/iPad):
1. Go to **Settings → General → VPN & Device Management** (or **Device Management**)
2. Tap on your Apple ID/Developer name
3. Tap **"Trust [Your Name]"**
4. Confirm by tapping **"Trust"**

### 7. Permission Errors

**Error**: App crashes or requests permissions repeatedly

**Solution**:
- Make sure Info.plist includes required permission descriptions
- Check that capabilities match what the app needs
- For notifications, ensure `expo-notifications` is properly configured

### 8. Xcode Version Issues

**Error**: Incompatible SDK or deployment target errors

**Current Setup**:
- Deployment Target: iOS 15.1
- Xcode: 26.1.1 (seems unusual - verify this is correct)

**Solution**:
If you're using a beta Xcode version, consider using a stable release (Xcode 15.x or 16.x).

### 9. Metro Bundler Not Starting

**Error**: Metro bundler won't start or connection errors

**Solution**:
```bash
cd app
npm start -- --reset-cache
```

Then in another terminal:
```bash
cd app
npx expo run:ios --device
```

### 10. Provisioning Profile Expired

**Error**: Provisioning profile expired (free Apple ID - 7 days)

**Solution**:
- Free Apple IDs: Apps expire after 7 days. Just rebuild and reinstall.
- Paid Developer Account: Profiles last 1 year.

## Step-by-Step Clean Rebuild

If nothing works, try a complete clean rebuild:

```bash
cd app

# Clean everything
rm -rf node_modules
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstall dependencies
npm install

# Reinstall pods
cd ios
pod install
cd ..

# Try building
npx expo run:ios --device
```

## Getting Detailed Error Messages

To see more detailed errors:

**From Command Line**:
```bash
cd app
npx expo run:ios --device --verbose
```

**From Xcode**:
1. Open Xcode
2. Product → Build (Cmd+B)
3. Check the **Report Navigator** (left sidebar, icon looks like speech bubble)
4. Click on the latest build to see all errors and warnings

## Need More Help?

Please share:
1. The exact command you ran
2. The full error output (copy/paste the entire error message)
3. What step you were on (opening Xcode, building, installing, etc.)

