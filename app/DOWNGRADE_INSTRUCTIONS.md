# Downgrading to Expo SDK 53 to Fix React Import Issue

## Why This Will Work
Expo SDK 53 uses React Native 0.80, which doesn't have the `Module 'React' not found` issue that affects React Native 0.81.

## Steps to Downgrade

### 1. Backup First
Make sure you have a git commit or backup of your current state.

### 2. Update package.json

Change these versions:

```json
{
  "expo": "~53.0.0",
  "react": "18.3.1",
  "react-native": "0.80.5",
  "expo-notifications": "~0.29.18",
  "expo-file-system": "~18.0.4",
  "expo-clipboard": "~7.0.8",
  "expo-print": "~14.0.4",
  "expo-sharing": "~13.0.4",
  "expo-status-bar": "~2.0.0",
  "@react-native-async-storage/async-storage": "2.1.0",
  "react-native-safe-area-context": "~5.0.1",
  "react-native-webview": "^13.12.2",
  "babel-preset-expo": "~53.0.0"
}
```

### 3. Clean and Reinstall

```bash
cd app
rm -rf node_modules package-lock.json
npm install
```

### 4. Clean iOS Build

```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
```

### 5. Clean Xcode

- In Xcode: `Product → Clean Build Folder` (Cmd+Shift+K)
- Delete DerivedData:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/UseYourTools-*
```

### 6. Rebuild

Build in Xcode - it should work without the React import error!

## Alternative: Try Expo SDK 55 (Canary)

Expo SDK 55 might have a fix, but it's unstable. Only try if you're comfortable with canary versions.

