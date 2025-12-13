# Step-by-Step Guide: Deploying UseYourTools to Your iOS Device

## Prerequisites Checklist

- [ ] Mac computer with Xcode installed
- [ ] iPhone or iPad (iOS 15.1 or later)
- [ ] USB cable to connect device to Mac
- [ ] Apple ID (free is fine)

---

## Step 1: Connect Your Device

1. **Connect your iPhone/iPad** to your Mac using a USB cable
2. **Unlock your device** (enter passcode/Face ID)
3. If you see **"Trust This Computer?"** on your device:
   - Tap **"Trust"**
   - Enter your device passcode if prompted

**Verify**: Your device should now appear in Finder (under Locations) or in Xcode's device list.

---

## Step 2: Verify Device is Detected

Let's check if your Mac can see your device:

**Option A - Using Terminal**:
```bash
xcrun xctrace list devices
```
Look for your device name (e.g., "John's iPhone") - it should NOT say "Simulator"

**Option B - Using Xcode**:
- Open Xcode
- Go to **Window → Devices and Simulators** (or press Cmd+Shift+2)
- Your device should appear in the left sidebar under "Devices"

**If your device doesn't appear:**
- Try a different USB cable
- Try a different USB port
- Restart both devices
- Make sure device is unlocked

---

## Step 3: Configure Code Signing (First Time Only)

This is the most important step and only needs to be done once.

### 3a. Open the Project in Xcode

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
open ios/UseYourTools.xcworkspace
```

**IMPORTANT**: Open the `.xcworkspace` file, NOT `.xcodeproj`

### 3b. Select Your Device

1. At the top of Xcode, look for the device selector (next to the Play button)
2. Click the dropdown
3. Select your connected device (e.g., "John's iPhone")

**If your device doesn't appear here:**
- Make sure it's connected and unlocked
- Check that it appears in "Devices and Simulators" (Window menu)

### 3c. Configure Signing

1. In the left sidebar (Project Navigator), click on **"UseYourTools"** (blue icon at the top)
2. In the main panel, make sure **"UseYourTools"** target is selected (under TARGETS)
3. Click on the **"Signing & Capabilities"** tab
4. Check the box: **"Automatically manage signing"**
5. Under **"Team"**, click the dropdown and select your Apple ID
   - If you don't see any teams, click **"Add Account..."**
   - Sign in with your Apple ID (this is free - you don't need a paid developer account)
   - Close the accounts window and select your team from the dropdown

6. **Xcode will automatically:**
   - Generate a provisioning profile
   - Configure code signing
   - You should see a green checkmark if everything is successful

**Common Issues:**
- "No accounts found" → Add your Apple ID in Xcode → Preferences → Accounts
- "Bundle identifier already in use" → We'll need to change it (see troubleshooting)
- Red errors → Take a screenshot and we'll fix them

---

## Step 4: Build and Install

### Option A: Build from Xcode (Easiest for first time)

1. Make sure your device is selected in the device selector (top of Xcode)
2. Click the **Play button** (▶️) or press **Cmd + R**
3. Xcode will:
   - Build the app (this takes a few minutes the first time)
   - Install it on your device
   - Launch it automatically

**First build takes 5-10 minutes. Be patient!**

### Option B: Build from Terminal (After code signing is set up)

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
npx expo run:ios --device
```

Select your device from the list when prompted.

---

## Step 5: Trust Developer on Your Device (First Time Only)

After the app installs, you'll need to trust the developer:

1. **On your iPhone/iPad**, try to open the UseYourTools app
2. You'll see an error: **"Untrusted Developer"** or **"Untrusted Enterprise Developer"**
3. **Don't worry!** This is normal for the first install.
4. Go to **Settings → General → VPN & Device Management** (on older iOS: **Device Management**)
5. Tap on your Apple ID/Developer name (should say something like "Apple Development: your@email.com")
6. Tap **"Trust [Your Name]"**
7. Tap **"Trust"** again to confirm
8. Go back to your home screen and open the app - it should work now!

---

## Step 6: Success!

Your app should now be running on your device! 🎉

---

## Troubleshooting Common Issues

### Device Not Found

**Symptoms**: Device doesn't appear in Xcode's device list

**Solutions**:
1. Unlock device
2. Trust computer (tap "Trust" when prompted)
3. Try different USB cable/port
4. Restart both Mac and device
5. In Xcode: Window → Devices and Simulators → Right-click device → "Use for Development"

### Code Signing Errors

**Symptoms**: Red errors in Xcode's Signing & Capabilities

**Solutions**:
1. Make sure "Automatically manage signing" is checked
2. Select your Team (Apple ID)
3. If "Bundle identifier already in use", change it in `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.yourname.useyourtools.app"
   }
   ```
   Then run: `npx expo prebuild --clean`

### Build Errors

**Symptoms**: Build fails with compilation errors

**Solutions**:
1. Clean build: In Xcode, Product → Clean Build Folder (Cmd+Shift+K)
2. Reinstall pods:
   ```bash
   cd app/ios
   pod install
   ```
3. Full clean rebuild:
   ```bash
   cd app
   rm -rf ios/build ios/Pods ios/Podfile.lock
   cd ios && pod install && cd ..
   ```

### App Crashes on Launch

**Symptoms**: App installs but crashes immediately

**Solutions**:
1. Check device iOS version is 15.1 or later
2. Check Xcode console for error messages (Window → Devices and Simulators → Select device → View Device Logs)
3. Make sure all permissions are granted
4. Try rebuilding and reinstalling

---

## Next Steps

Once you've successfully installed the app:

- **For future updates**: Just run `npx expo run:ios --device` (much faster after first build)
- **Note**: With a free Apple ID, apps expire after 7 days. Just rebuild and reinstall to refresh.
- **For permanent installs**: Consider a paid Apple Developer account ($99/year)

---

## Need Help?

If you get stuck at any step, please share:
1. What step you're on
2. The exact error message (screenshot or copy/paste)
3. What you see in Xcode (especially the Signing & Capabilities tab)

Let's get your app on your device! 📱

