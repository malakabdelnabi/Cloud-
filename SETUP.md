# CampusCare — Setup & Installation Guide

CampusCare is a campus facility-management app used by community members, workers, facility managers, and admins to report and resolve issues. The project is split into two runnable parts:

- **Backend** — Node.js + Express REST API backed by Supabase (PostgreSQL + Storage).
- **Mobile** — Expo / React Native client (iOS, Android, and web via Expo).

This guide walks through getting both running on a developer machine.

> For a tour of the codebase layout — what each folder and key file does — see [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

---

## 1. Prerequisites

Install the following before continuing:

| Tool | Recommended Version | Notes |
|------|---------------------|-------|
| Node.js | **v20.x LTS** (>= 18.x) | Required by Expo SDK 54 and the backend. |
| npm | v10+ (ships with Node 20) | Or use `yarn` / `pnpm` if you prefer. |
| Git | any recent version | To clone the repository. |
| Expo CLI | bundled (`npx expo`) | No global install needed — `npx expo` is invoked via the `mobile` scripts. |
| A Supabase project | free tier is fine | Used for PostgreSQL **and** Storage (image uploads). |
| Expo Go app | latest from App Store / Play Store | To run the mobile app on a physical phone. Alternatively, an Android emulator (Android Studio) or iOS Simulator (Xcode, macOS only). |

Optional but useful:
- **PowerShell 7+** on Windows, or any POSIX shell on macOS / Linux.
- **Postman / Thunder Client** for hitting the backend manually.

> Note: PostgreSQL does **not** need to be installed locally — the database lives in Supabase, which provides a hosted Postgres instance.

---

## 2. Clone the repository

```bash
git clone https://github.com/malakabdelnabi/Cloud-.git CampusCare
cd CampusCare/Authentication
```

The two top-level folders under `Authentication/` are:

- `Backend/` — Express API
- `mobile/` — Expo app

---

## 3. Supabase setup (third-party service)

The backend needs a Supabase project for its database and file storage.

1. Go to <https://supabase.com> and create a new project. Choose any region close to your users; pick a strong database password and save it.
2. Once the project is provisioned, open **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` key** → `SUPABASE_SERVICE_ROLE_KEY` (server-side only, keep secret)
   - **`anon` public key** → `SUPABASE_ANON_KEY`
3. Open the **SQL Editor**, paste the contents of `Backend/migrations/001_initial_schema.sql`, and run it. This creates the three tables used by the app:
   - `users` — accounts with roles (`Community Member`, `Facility Manager`, `Worker`, `Admin`).
   - `tickets` — reported issues with status, priority, photo, and assignment.
   - `ticket_comments` — comments threaded onto a ticket.
4. Open **Storage** and create the buckets the app uploads to. Make them **public** (or configure signed-URL policies if you prefer):
   - `ticket-photos` — photos attached when a ticket is opened.
   - `completion-photos` — photos uploaded by workers when resolving a ticket.

That covers all third-party infrastructure for the core app. Email (password-reset) uses Gmail SMTP and is described in section 4.

---

## 4. Backend setup

### 4.1 Install dependencies

```bash
cd Backend
npm install
```

### 4.2 Configure environment variables

Copy the example file and fill in your own values:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `Backend/.env` and set:

```env
# --- Supabase ---
SUPABASE_URL=<your project URL>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
SUPABASE_ANON_KEY=<anon public key>

# --- Auth ---
JWT_SECRET=<any long random string>

# --- Server ---
PORT=3000

# --- Email (password reset) ---
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<gmail address used to send reset emails>
EMAIL_PASS=<gmail app password, NOT your normal password>
FRONTEND_URL=http://localhost:19006
```

**Generating a Gmail app password** (only needed if you want password-reset emails to work):
1. Enable 2-Step Verification on the Gmail account.
2. Visit <https://myaccount.google.com/apppasswords>, generate a 16-character app password, and paste it into `EMAIL_PASS`.

### 4.3 Run the backend

```bash
npm run dev    # auto-restarts on file changes (uses node --watch)
# or
npm start      # plain node, no watcher
```

You should see:

```
Server running on http://0.0.0.0:3000
```

Sanity-check it from another terminal:

```bash
curl http://localhost:3000/
# → {"message":"GIU Facility Management API is running"}
```

The API exposes these route groups:
- `POST /api/auth/*` — register, login, logout, forgot/reset password
- `/api/tickets/*` — create/list/update tickets
- `/api/admin/*`, `/api/manager/*`, `/api/worker/*` — role-scoped endpoints

---

## 5. Mobile (Expo) setup

### 5.1 Install dependencies

Open a **new terminal** (leave the backend running) and:

```bash
cd Authentication/mobile
npm install
```

### 5.2 Configuration

The mobile app does **not** need a `.env` file. It auto-discovers the backend URL: when you run `expo start`, Expo reports the dev machine's LAN IP, and `services/authService.ts` builds `http://<that-ip>:3000/api/auth` from it. As long as the backend's `PORT` is `3000`, no edits are needed.

If you change the backend port, update the port literal in `mobile/services/authService.ts` (and the other service files in `mobile/services/`).

### 5.3 Run the app

```bash
npm start
# or target a specific platform:
npm run android
npm run ios       # macOS only
npm run web
```

`npm start` opens the Expo dev tools. From there:

- **Phone (recommended)** — open the **Expo Go** app and scan the QR code shown in the terminal. The phone must be on the **same Wi-Fi network** as the dev machine so it can reach `http://<dev-ip>:3000`.
- **Android emulator** — press `a` in the Expo CLI.
- **iOS simulator** — press `i` (macOS only).
- **Web** — press `w`.

### 5.4 First login

There are no seeded users. Register one of each role from the **Register** screen to exercise the full app. Roles available: *Community Member*, *Facility Manager*, *Worker*, *Admin*.

---

## 6. Common issues

| Symptom | Likely cause / fix |
|---|---|
| `Supabase credentials are missing from .env file` on backend boot | `Backend/.env` not created or values blank. Re-do section 4.2. |
| Mobile app shows network errors after login | Phone and dev machine are on different networks, **or** the backend isn't running, **or** Windows Firewall is blocking inbound port 3000. Allow Node through the firewall for *Private* networks. |
| Password-reset email never arrives | `EMAIL_PASS` is your real Gmail password instead of an **app password**, or 2-Step Verification isn't enabled on that Gmail account. |
| Image upload fails with a 4xx | The `ticket-photos` / `completion-photos` storage buckets don't exist or aren't public. Re-check section 3 step 4. |
| `expo start` complains about Node version | Upgrade to Node 20 LTS. |

---

## 7. Quick start (TL;DR)

```bash
# one-time
git clone <repo-url> CampusCare
cd CampusCare/Authentication
# fill Supabase creds + run migrations/001_initial_schema.sql in Supabase SQL editor
# create ticket-photos and completion-photos buckets

# backend
cd Backend
npm install
cp .env.example .env   # then edit
npm run dev

# mobile (new terminal)
cd ../mobile
npm install
npm start              # scan QR with Expo Go
```

---

## 8. Project structure

See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for an annotated map of the `Backend/` and `mobile/` folders, the routing conventions used by Expo Router, and a quick-reference table for where to make common changes.
