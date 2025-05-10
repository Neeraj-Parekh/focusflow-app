# FocusFlow Pomodoro - Web App (PWA)

This is a Progressive Web App version of FocusFlow Pomodoro Timer that can be installed on Android devices.

## Features

- 🕒 Pomodoro timer with customizable durations
- ☕ Short and long breaks
- 🔊 Ambient sounds (rain, cafe, forest, fire, white noise)
- 📊 Cycle tracking
- 📱 Works offline (PWA capabilities)
- 📲 Can be installed on Android devices from the browser
- 🚀 No app store required

## Live Version

Access the live version at: [https://focusflow-app.io](https://focusflow-app.io)

## How to Use

1. Visit [https://focusflow-app.io](https://focusflow-app.io) on your device
2. On Android, you'll see a prompt asking if you'd like to install the app
3. Alternatively, use the browser menu and select "Add to Home Screen"
4. Once installed, the app will work even when you're offline!

## Testing on Android

For detailed instructions on installing and testing on Android devices, see:
[Android Installation Guide](ANDROID_INSTALL.md)

## Testing Locally

You can test the app locally using a simple HTTP server:

```bash
cd WebApp
python -m http.server 8000
```

Then navigate to `http://localhost:8000` in your browser.

For proper testing of PWA features (including service worker), use a tool like:

```bash
npx serve
```

## Mobile Testing Considerations

When testing on mobile:
1. Some browsers restrict autoplay of audio until user interaction
2. Allow notifications when prompted for timer completion alerts
3. Test the offline functionality by enabling airplane mode after loading the app

## Folder Structure

```
WebApp/
├── index.html         # Main HTML file
├── style.css          # CSS styles
├── app.js             # Application logic
├── manifest.json      # Web App Manifest for PWA
├── service-worker.js  # Service Worker for offline functionality
├── images/            # App icons in different sizes
└── sounds/            # Sound files for timer and ambient sounds
```

## Android Install Instructions

1. Open the website in Chrome on your Android device
2. Tap the menu button (three dots) in the top right
3. Tap "Add to Home Screen"
4. Give the app a name (or keep the default)
5. Tap "Add"

The app will now appear on your home screen and will function like a native app!

## Missing Resources

Before deploying, make sure to create the following:

1. App icons in different sizes (in the images/ folder)
2. Sound files for the timer and ambient sounds (in the sounds/ folder)

You can convert your existing assets from the desktop version to use in this PWA.
