# Troubleshooting "Error Loading App"

## Quick Fix Steps

### 1. Clear the App's Stored URL

The app may have a stale/cached URL. To fix:

**On iOS:**
- Delete the app from your device
- Reinstall it (rebuild with Xcode or install the .ipa file)
- The app will prompt for a fresh URL

**Or manually clear:**
- Close the app completely (swipe up and swipe away)
- Reopen it
- If it still shows an error, shake the device → "Enter URL manually"

### 2. Get the Current Dev Server URL

Make sure your dev server is running:
```bash
cd app
npm run start:tunnel
```

Wait for the output showing:
- "Tunnel connected"
- A URL like `exp://xxxx-xxxx-xxxx.exp.direct:80`

### 3. Enter the URL Manually

1. Open the app on your device
2. If you see "Error loading app" or a connection screen:
   - Shake the device (or long-press with 3 fingers on simulator)
   - Select "Enter URL manually" or "Configure Bundler"
   - Enter the `exp://` URL from your terminal

### 4. Verify Server is Running

Check if Metro bundler is running:
```bash
curl http://localhost:8081/status
```

Should return: `packager-status:running`

### 5. Restart Everything (Nuclear Option)

```bash
# Stop all Expo processes
pkill -f "expo start"

# Clear all caches
cd app
rm -rf .expo node_modules/.cache .metro

# Restart with tunnel
npm run start:tunnel
```

Then:
- Delete and reinstall the app on your device
- Enter the new URL when prompted

## Common Causes

1. **Stale URL in app cache** - Most common. Clear app data or reinstall.
2. **Dev server stopped** - Make sure `npm run start:tunnel` is still running
3. **Network/firewall blocking** - Try tunnel mode (which we're using)
4. **Bundle compilation errors** - Check terminal for Metro bundler errors

## Still Not Working?

Check the terminal where `npm run start:tunnel` is running for any error messages. The Metro bundler output will show what's happening.

