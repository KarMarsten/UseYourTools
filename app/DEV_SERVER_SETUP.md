# Development Server Setup

## Quick Start

### Option 1: Tunnel Mode (Recommended - Persistent URL)

Use tunnel mode for a stable, persistent URL that works even when your device and computer are on different networks:

```bash
npm run start:tunnel
```

**Pros:**
- ✅ Persistent URL that doesn't change
- ✅ Works even when device and computer are on different networks
- ✅ App remembers the URL after first connection
- ✅ Best for development on physical devices

**Cons:**
- ⚠️ Requires ngrok (installed automatically with Expo)
- ⚠️ Slightly slower than LAN mode
- ⚠️ Requires internet connection

### Option 2: LAN Mode (Same Network)

Use LAN mode when your device and computer are on the same Wi-Fi network:

```bash
npm run start:lan
```

**Pros:**
- ✅ Faster connection
- ✅ No internet required (once connected)
- ✅ No ngrok dependency

**Cons:**
- ⚠️ Both devices must be on the same network
- ⚠️ URL may change if your IP address changes
- ⚠️ May require entering URL manually if auto-detection fails

### Option 3: Default (Auto-detect)

```bash
npm start
```

Tries LAN first, falls back to tunnel if needed.

## First Time Connection

1. Start the development server using one of the options above
2. Open the app on your device
3. The app should automatically detect and connect to the dev server
4. If it doesn't auto-connect:
   - The app will show a screen to enter the URL
   - Look at the terminal for the connection URL (starts with `exp://`)
   - Enter that URL in the app
   - The app will remember this URL for future connections

## Troubleshooting

### App Keeps Asking for URL

1. **Make sure you're using the same start command each time**
   - If you switch between `--tunnel` and `--lan`, the URL changes
   - Stick with one mode for consistency

2. **Clear app data** (if URL persists incorrectly):
   - iOS: Delete and reinstall the app
   - The URL is stored in the app's cache

3. **Check that dev server is running**:
   - Make sure you see "Metro waiting on..." in the terminal
   - Try restarting the dev server

### URL Changes Each Time

- **Solution**: Use `--tunnel` mode for a persistent URL
- Tunnel URLs are stable across restarts

### Connection Refused Errors

- Make sure your firewall isn't blocking the connection
- Try tunnel mode if LAN mode isn't working
- Ensure both devices can reach each other on the network

## Tips

- **Use tunnel mode** for the most reliable experience
- The app remembers the last connected URL, so you usually only need to enter it once
- Keep the terminal with the dev server running while testing
- If you restart the dev server, wait a few seconds for it to fully start before reloading the app

