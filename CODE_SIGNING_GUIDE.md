# Code Signing Setup Guide

## Quick Steps

1. **In Xcode**, click the **blue "UseYourTools" project** icon in the left sidebar
2. Select **"UseYourTools"** under TARGETS (in the main panel)
3. Click the **"Signing & Capabilities"** tab
4. Check **"Automatically manage signing"**
5. Under **"Team"**, click the dropdown and select your Apple ID
   - If you don't see your Apple ID, click **"Add Account..."** and sign in
6. Xcode will automatically configure everything

## Screenshot Locations

- **Project Icon**: Top of the left sidebar (blue folder icon)
- **TARGETS**: Left side of the main panel (should show "UseYourTools" with a checkbox)
- **Signing & Capabilities**: Tabs at the top of the main panel (next to "General", "Build Settings", etc.)
- **Team Dropdown**: In the "Signing" section, under "Automatically manage signing"

## Common Issues

### "No accounts found"
- Go to **Xcode → Preferences → Accounts** (or **Settings → Accounts** in newer Xcode)
- Click the **+** button and add your Apple ID
- Return to Signing & Capabilities and select your team

### "Bundle identifier already in use"
- Xcode will automatically append something to make it unique (like adding your name)
- Or manually change it to something unique like: `com.yourname.useyourtools.app`

### Red errors in Signing section
- Make sure your device is connected and unlocked
- Try disconnecting and reconnecting your device
- Check that "Automatically manage signing" is checked

Once you see a green checkmark, you're ready to build! ✅

