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
npx cap add android
npx cap open android
```
