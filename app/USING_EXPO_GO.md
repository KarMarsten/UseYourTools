# Using Expo Go for Development

Expo Go allows you to test your app on a physical device without building native code! This avoids all the React Native module import issues.

## Setup Steps

### 1. Install Expo Go on Your iPhone

- Go to the App Store
- Search for "Expo Go"
- Install it

### 2. Start the Development Server

From the `app` directory, run:

```bash
cd app
npm start
```

Or:

```bash
npx expo start
```

### 3. Connect Your Phone

**Option A: Same Wi-Fi Network (Recommended)**
- Make sure your iPhone and Mac are on the same Wi-Fi network
- When Expo starts, it will show a QR code
- Open the Camera app on your iPhone
- Point it at the QR code
- Tap the notification to open in Expo Go

**Option B: Use Tunnel (If Wi-Fi doesn't work)**
```bash
npx expo start --tunnel
```
This uses Expo's servers to connect, so it works even if devices are on different networks.

### 4. Development

- Any changes you make will hot-reload automatically
- You can shake your device (or swipe down with 3 fingers) to open the dev menu
- Press `r` in the terminal to reload
- Press `m` to toggle menu

## Limitations

- Expo Go only supports Expo SDK APIs
- Custom native modules won't work (but most Expo APIs work fine)
- You can't test custom native code changes
- Some advanced native features may not be available

For your UseYourTools app, Expo Go should work great for most development!

## Troubleshooting

**Can't connect?**
- Try `npx expo start --tunnel`
- Make sure both devices are on the same network
- Check firewall settings

**App crashes?**
- Check the terminal for errors
- Try clearing cache: `npx expo start -c`

**QR code doesn't work?**
- Try the "Send link via email/SMS" option in Expo
- Or type the URL manually into Expo Go

