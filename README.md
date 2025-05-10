# FocusFlow Pomodoro - Web App (PWA)

This is a Progressive Web App version of FocusFlow Pomodoro Timer that can be installed on Android devices.

## Features

- Pomodoro timer with customizable durations
- Short and long breaks
- Ambient sounds
- Cycle tracking
- Works offline (PWA)
- Can be installed on Android devices from the browser
- No app store required

## How to Use

1. Host these files on a web server or use a local development server
2. Access the website from an Android device using Chrome
3. You'll see a prompt asking if you'd like to install the app
4. Alternatively, use the browser menu and select "Add to Home Screen"

## Testing Locally

You can test the app locally using a simple HTTP server:

```bash
cd WebApp
python -m http.server 8000
```

Then navigate to `http://localhost:8000` in your browser.

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
