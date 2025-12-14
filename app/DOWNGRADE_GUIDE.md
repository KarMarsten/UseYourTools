# Downgrading to Fix React Import Issue

## Current Issue
You're on Expo SDK 54 with React Native 0.81.5, which has a known bug where ExpoModulesCore's generated Swift header uses `@import React;` but React Native 0.81 changed to `React-Core`.

## Solution: Downgrade to Expo SDK 53

Expo SDK 53 uses React Native 0.80, which doesn't have this issue.

### Steps to Downgrade:

1. **Backup your project** (create a git commit or backup)

2. **Update package.json dependencies:**
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
     "react-native-webview": "^13.12.2"
   }
   ```

3. **Delete node_modules and reinstall:**
   ```bash
   cd app
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Clean iOS build:**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   ```

5. **Clean Xcode build:**
   - In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
   - Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/UseYourTools-*`

6. **Test the build**

### Alternative: Try Expo SDK 55 (Canary)

Expo SDK 55 is in canary and might have a fix. However, canary versions are unstable.

### Risks of Downgrading

- May lose some newer features
- Need to test all functionality
- Some dependencies might need version adjustments

### Recommendation

Given the severity of the build issue, downgrading to SDK 53 is a reasonable solution. React Native 0.80 is stable and widely used.

