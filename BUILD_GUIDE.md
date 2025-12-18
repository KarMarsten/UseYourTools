# iOS Build Guide for UseYourTools

## Current Situation
- ✅ You have an Apple Developer account (Team: Karen Marsten - UAHR3JWC24)
- ❌ EAS Build requires a **paid** Apple Developer Program membership ($99/year)
- ✅ You can build locally with your free account for testing

## ⚠️ Known Issue: devicectl Warning

If you see: "Unexpected devicectl JSON version output from devicectl"

This is a compatibility warning with newer Xcode versions. **Use Xcode GUI instead** (Option 2 below) - it handles this better than command line.

## Option 1: Command Line Build

### Build for Device (Install directly on connected iPhone/iPad)

**Note**: If you get devicectl warnings, use Xcode GUI (Option 2) instead.

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
npx expo run:ios --device --configuration Release
```

This will:
1. Show a list of connected devices
2. Build the app
3. Install it on your device
4. Launch it automatically

**Note**: With a free account, the app expires after 7 days. You'll need to rebuild and reinstall.

### Build for Simulator (Testing only, no expiration)

```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
npx expo run:ios
```

## Option 2: Xcode GUI Build

### Step 1: Open Xcode
```bash
cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
open ios/UseYourTools.xcworkspace
```

### Step 2: Select Device
- In Xcode, look at the top toolbar
- Click the device selector (next to the Play button)
- Choose your connected iPhone/iPad, or "Any iOS Device" for Archive

### Step 3: Configure Signing (if needed)
1. Click **UseYourTools** project in left sidebar
2. Select **UseYourTools** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team**: "Karen Marsten (UAHR3JWC24)"

### Step 4: Build Options

#### Option A: Build and Install on Device
- Press `Cmd + B` to build
- Or click the Play button ▶️
- App will install and launch on your device

#### Option B: Create Archive (for distribution)
1. Select **"Any iOS Device"** from device selector
2. Go to **Product → Archive**
3. Wait for build to complete
4. Xcode Organizer will open showing your archive

**Important**: Creating a distributable IPA file from an archive typically requires a paid Developer Program account.

## Creating a Distributable Package (IPA)

### Step 1: Create Archive in Xcode

1. **Open Xcode** (workspace should already be open)
   ```bash
   cd /Users/karmarsten/Documents/GitHub/UseYourTools/app
   open ios/UseYourTools.xcworkspace
   ```

2. **Select "Any iOS Device"** from the device selector (top toolbar)
   - This is required for Archive builds
   - Don't select a simulator or specific device

3. **Configure for Release** (if not already):
   - Click the scheme selector (next to device selector) → **Edit Scheme...**
   - Select **Run** from left sidebar
   - Set **Build Configuration** to **Release**
   - Close the scheme editor

4. **Create Archive**:
   - Go to **Product → Archive**
   - Wait for build to complete (this may take several minutes)
   - Xcode Organizer window will open automatically when done

### Step 2: Export IPA File

1. In **Xcode Organizer** (should open automatically after Archive):
   - Select your new archive (most recent one)
   - Click **Distribute App** button

2. **Choose Distribution Method**:
   - **Development**: For testing on registered devices (may work with free account)
   - **Ad Hoc**: For distribution to specific devices (requires paid account)
   - **App Store**: For App Store submission (requires paid account)
   - **Enterprise**: For enterprise distribution (requires Enterprise account)

3. **For Free Apple ID**: Try "Development" distribution
   - Select devices you want to include (you'll need device UDIDs)
   - Follow the wizard
   - Export location will be shown

4. **Export IPA**:
   - Choose export location
   - Click **Export**
   - IPA file will be created in the specified location

### Limitations with Free Apple ID

- ✅ Can create archives
- ✅ Can install on your own device
- ⚠️ Limited distribution options (Development only, and devices must be registered)
- ❌ Cannot distribute via App Store
- ❌ Cannot use TestFlight
- ❌ App expires after 7 days on devices

For full distribution capabilities, you'll need a paid Apple Developer Program membership ($99/year).

## Troubleshooting

### "No devices found"
- Make sure your iPhone/iPad is connected via USB
- Unlock your device
- Trust the computer if prompted
- Check cable connection

### Code Signing Errors
- Verify Team is selected in Signing & Capabilities
- Try cleaning build folder: `Product → Clean Build Folder` (Cmd + Shift + K)
- Make sure "Automatically manage signing" is checked

### App Expires After 7 Days
- This is normal with a free Apple ID
- Just rebuild and reinstall: `npx expo run:ios --device --configuration Release`

### Need Permanent Distribution?
- Sign up for Apple Developer Program: https://developer.apple.com/programs/
- Cost: $99/year
- Allows App Store submission, TestFlight, and permanent app distribution

