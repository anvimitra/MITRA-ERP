# LSK Academy Smart ERP Mobile App (ANVIMITRA-ERP)

Dedicated cross-platform mobile app for **LSK Academy** (`LSK01`), connecting directly to the ANVIMITRA-ERP Cloud Core API.

## Features
- **Branded for LSK Academy**: Royal purple colorway, official crest, contact metadata.
- **Parent Portal**:
  - Live daily attendance indicator with monthly rate.
  - Fee invoice breakdown, due reminders, and online payment receipts.
  - Multi-template report card for **SA1, SA2, SA3, Half-Yearly, Yearly, and Weekly Tests**.
  - Real-time push notifications with automatic SMS fallback notice.
- **Teacher Portal**:
  - Strict RBAC: Class teacher marks attendance for allocated Class 8-A.
  - Absent toggle triggers automated SMS fallback for unregistered/inactive app parents (e.g. Zara Shaikh).
  - Subject Marks Entry strictly locked to allocated subjects (e.g. Mathematics for Rani Dubey).
- **Principal Desk**:
  - School attendance %, staff on duty, fee collection pulse.
  - School-wide circular broadcast.

## Quick Start (Run in Browser / Phone)
Double-click `run-mobile-app.bat` or run:
```bash
npm run dev
```
Open `http://localhost:5174` in any browser or on your phone via local Wi-Fi.

## Building for Android APK
```bash
npm run build
npx cap sync android
npx cap open android
```

## Building for Apple iOS (iPhone & iPad)
```bash
npm run build
npx cap sync ios
npx cap open ios   # Opens App.xcworkspace in Xcode on macOS
```
On macOS / Xcode:
1. Open `ios/App/App.xcworkspace` in Xcode.
2. Under **Signing & Capabilities**, select your Team (a free personal Apple ID works).
3. Connect your physical iPhone/iPad via USB or select any iPhone/iPad Simulator.
4. Press **Run** (`Cmd + R`) to launch directly on your Apple device.

## Cloud CI/CD Automated Releases
- **Android**: `.github/workflows/build-apk.yml` automatically builds `MITRA-ERP.apk`.
- **Apple iOS**: `.github/workflows/build-ios.yml` runs on macOS runners and compiles:
  - `MITRA-ERP-iOS.ipa` (for physical iOS devices via AltStore, Sideloadly, or Apple Developer Program)
  - `MITRA-ERP-iOS-Simulator.zip` (for Xcode iOS Simulators)
Both assets are automatically attached to the latest GitHub Release!
