# Building UseYourTools on iOS Device

## The React Import Issue

Due to a known issue with React Native 0.81 and ExpoModulesCore, the generated Swift header file contains `@import React;` but React Native 0.81 uses `React-Core` instead. This causes build failures.

## Solution: Manual Patch Workflow

### Step-by-Step Process:

1. **Build in Xcode** - Click the Play button or press `Cmd+B`
   - The build will fail with: `Module 'React' not found`

2. **Run the fix script** - In Terminal:
   ```bash
   cd app/ios
   ./fix-react-import.sh
   ```

3. **Build again immediately** - Press `Cmd+B` again
   - The build should now succeed!

### Why This Happens

The `ExpoModulesCore-Swift.h` file is generated during the Swift compilation process itself. It gets created with `@import React;`, but React Native 0.81 actually exports the module as `React-Core`. The file is regenerated on each clean build, so you'll need to patch it each time.

### Automated Build Script (Optional)

You can also use the automated build script that patches automatically:

```bash
cd app/ios
./build-with-patch.sh
```

However, building directly in Xcode is usually faster and the manual patch workflow is more reliable.

## When Do I Need to Patch?

- After cleaning the build folder (`Cmd+Shift+K`)
- After `pod install` or `pod update`
- If you see the "Module 'React' not found" error

## Future Fix

This is a known issue that should be resolved in future versions of React Native/Expo. Until then, this workaround is necessary.

