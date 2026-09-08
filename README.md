# ANVIMITRA-ERP: Enterprise Multi-Tenant School Management Platform

**ANVIMITRA-ERP** is an advanced, production-ready Multi-Tenant School ERP engineered to run on **Cloudflare Workers / Pages** at the edge, featuring:
1. **Multi-Tenant Data Isolation**: Multiple schools operate on independent branding (logo, primary theme colors, school name, custom subdomains).
2. **Unified Single-App Multi-Role Architecture**: Dedicated, security-restricted interfaces for **Super Admin**, **Principal**, **Teacher**, **Accountant / Staff**, and **Parents**.
3. **Strict RBAC Enforcement**:
   - Only the designated **Class Teacher** can mark attendance for that class and section.
   - Teachers can only enter marks and create assignments for **classes and subjects officially allocated** to them.
4. **Automated Parent Alerts & SMS Fallback Engine**:
   - Parents with the mobile app receive instant push notifications for attendance and fee notices.
   - Parents who do **not** have the mobile app installed or are inactive automatically receive an **instant Text SMS** via SMS Gateway!
5. **Secondary Database Windows PC Sync Agent (.EXE)**:
   - A dedicated Windows desktop application (`packages/desktop-sync-agent`) that connects to the Cloud ERP via School API Secret Key, replicates cloud records into local SQLite storage on the school's PC, and provides offline access and instant backup export (`.sqlite`, `.json`).
6. **Attractive Exam & Report Card Engine**:
   - Full support for **SA1, SA2, SA3, Half Yearly, Yearly / Final Board, and Weekly Tests**.
   - **4 Beautiful Printable Templates**:
     - *Template 1: Modern Digital Gradient*
     - *Template 2: Official CBSE Standard*
     - *Template 3: Executive Minimal Clean*
     - *Template 4: Junior / Kindergarten Vibrant*
   - Real-time CBSE 9-point scale grade calculation (A1, A2, B1, B2, C1, C2, D, E), division computation, and 1-click Print/PDF save.

---

## 🏗️ System Architecture

```
anvimitra-erp/
├── packages/
│   ├── backend/               # Cloudflare Workers / Hono.js API backend (port 4000)
│   ├── frontend/              # Unified Web ERP Portal (React + Vite + Tailwind, port 5173)
│   ├── mobile-app/            # Dedicated All-in-One Mobile App for LSK Academy (port 5174)
│   │   ├── src/               # Parent, Teacher, Principal views, PWA & Android/iOS ready
│   │   └── run-mobile-app.bat # 1-click mobile launcher
│   └── desktop-sync-agent/    # Secondary Database Windows PC Sync Agent (.EXE)
│       ├── bin/
│       │   ├── LSK-Academy-Sync-Agent.exe  # Standalone Windows Executable for LSK Academy
│       │   └── ANVIMITRA-Sync-Agent.exe    # Standalone Windows Executable
│       ├── src/               # Sync client, local SQLite & Express dashboard (port 5432)
│       └── local-storage/     # Local PC secondary storage engine
├── run-all-services.bat       # 1-Click launcher for Backend + Web ERP + Mobile App
└── launch-desktop-sync-exe.bat# 1-Click launcher for LSK Secondary Sync Agent .EXE
```

---

## 🚀 Quick Start Guide
 
### Quickest: 1-Click Launch (All Services)
Double-click **`run-all-services.bat`** in the project root. It will automatically start:
- Backend Cloud API on `http://localhost:4000`
- Web ERP Portal on `http://localhost:5173`
- LSK Academy Mobile App on `http://localhost:5174`

### Launch Secondary Database Windows .EXE Sync Agent
Double-click **`launch-desktop-sync-exe.bat`** or directly run:
`packages/desktop-sync-agent/bin/LSK-Academy-Sync-Agent.exe`

---

## 🔑 Demo Personas & Credentials (LSK Academy & DPS)

### 🏫 LSK Academy (`LSK01`)
| Role | Name & Email | Password | Features & Access |
| :--- | :--- | :--- | :--- |
| **Principal** | `principal@lskacademy.edu` | `principal123` | Full School Administration, Broadcast Circulars |
| **Class Teacher** | `rani@lskacademy.edu` | `teacher123` | Class Teacher of 8-A (Attendance) & Math Faculty |
| **Science Teacher**| `kiran@lskacademy.edu`| `teacher123` | Science Faculty (Class 8-A Marks only) |
| **Accountant** | `accounts@lskacademy.edu` | `staff123` | Fee Counter collection & Receipts |
| **Parent (App Active)** | `parent.aryan@gmail.com` | `parent123` | Aryan's Father (Receives Mobile Push Alerts) |
| **Parent (SMS Target)** | `parent.zara@gmail.com` | `parent123` | Zara's Mother (App Inactive $\rightarrow$ Receives Automated Text SMS) |

### 🏫 Delhi Public Global Academy (`DPS01`)
| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@anvimitra.com` | `admin123` | Global schools management, SMS gateway & telemetry |
| **Principal** | `principal@dps.edu` | `principal123` | School administration, assigning Class Teachers & Subjects |
| **Class Teacher** | `sharma@dps.edu` | `teacher123` | Class Teacher of 10-A (Attendance) & Math Faculty (Marks) |
| **Parent (App Active)** | `parent.rahul@gmail.com` | `parent123` | Rahul's Father (Receives Mobile App Push Alerts) |
| **Parent (SMS Fallback)** | `parent.priya@gmail.com` | `parent123` | Priya's Father (Receives Automated Text SMS Fallback) |

---

## ☁️ Cloudflare Deployment

To deploy the backend to **Cloudflare Workers**:
```bash
cd packages/backend
npx wrangler d1 create anvimitra_production_d1
npx wrangler deploy
```
To deploy the frontend to **Cloudflare Pages**:
```bash
cd packages/frontend
npm run build
npx wrangler pages deploy dist --project-name anvimitra-erp
```
