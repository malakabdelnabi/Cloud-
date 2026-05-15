# CampusCare — Project Structure Overview

A high-level map of the repo. Only the directories and files you'll actually touch are listed; generated folders (`node_modules/`) and local-only files (`.env`) are intentionally omitted.

```
CampusCare/
└── Authentication/
    ├── Backend/                  # Express + Supabase REST API
    │   ├── server.js             # Entry point — boots Express on PORT
    │   ├── package.json          # Backend deps + npm scripts (dev, start)
    │   ├── tsconfig.json         # Type-check config (project is JS, TS used for editor support)
    │   ├── migrations/
    │   │   ├── 001_initial_schema.sql   # Run once in Supabase SQL editor — creates users, tickets, ticket_comments
    │   │   └── READ.ME                  # Notes on applying migrations
    │   └── src/
    │       ├── app.js            # Express app: middleware + route mounting
    │       ├── config/
    │       │   ├── supabase.js   # Supabase client (uses SUPABASE_URL + SERVICE_ROLE_KEY)
    │       │   └── JWT.js        # JWT sign/verify helpers (uses JWT_SECRET)
    │       ├── routes/           # Thin route definitions, one file per domain
    │       │   ├── auth.js       # /api/auth/*    — register, login, logout, password reset
    │       │   ├── tickets.js    # /api/tickets/* — CRUD + comments
    │       │   ├── admin.js      # /api/admin/*   — admin-only endpoints
    │       │   ├── manager.js    # /api/manager/* — facility-manager endpoints
    │       │   └── worker.js     # /api/worker/*  — worker endpoints
    │       ├── controllers/      # Business logic invoked by routes
    │       │   ├── authController.js
    │       │   ├── ticketController.js
    │       │   ├── adminController.js
    │       │   ├── managerController.js
    │       │   └── workerController.js
    │       └── middleware/
    │           ├── requireAuth.js     # Verifies JWT, attaches req.user
    │           └── roleMiddleware.js  # Restricts a route to one or more roles
    │
    └── mobile/                   # Expo / React Native client (file-based routing)
        ├── app.json              # Expo config (name, slug, icons, splash)
        ├── package.json          # Mobile deps + scripts (start, android, ios, web)
        ├── tsconfig.json         # TypeScript config for the app
        ├── eslint.config.js      # Lint rules
        ├── expo-env.d.ts         # Expo-injected type declarations
        ├── assets/
        │   └── images/           # Logo, banner, icons used by the UI
        ├── context/
        │   └── AuthContext.tsx   # Global auth state (current user, token, login/logout)
        ├── services/             # Thin wrappers around the backend REST API
        │   ├── authService.ts        # Auth endpoints + auto-discovers backend LAN IP
        │   ├── ticketService.ts      # Ticket CRUD + photo upload
        │   ├── adminService.ts       # Admin-only calls
        │   ├── managerService.ts     # Manager calls (assign workers, etc.)
        │   └── workerService.ts      # Worker calls (claim, complete tickets)
        ├── scripts/
        │   └── reset-project.js  # Helper to reset the Expo project scaffold
        └── app/                  # Expo Router screens — folder structure = URL structure
            ├── _layout.tsx       # Root layout — wraps the whole app in AuthContext
            ├── (auth)/           # Public auth flow (route group, not part of URL)
            │   ├── _layout.tsx
            │   ├── index.tsx             # Login
            │   ├── register.tsx          # Register (pick a role)
            │   ├── forgot-password.tsx   # Request reset email
            │   └── reset-password.tsx    # Set a new password
            ├── community/        # Community Member screens
            │   ├── _layout.tsx
            │   ├── submit.tsx            # File a new ticket
            │   ├── my-issues.tsx         # List own tickets
            │   ├── issue/[id].tsx        # Ticket detail
            │   └── logout.tsx
            ├── worker/           # Worker screens
            │   ├── _layout.tsx
            │   ├── index.tsx             # Assigned tickets dashboard
            │   ├── issue/[id].tsx        # Work on a ticket (upload completion photo)
            │   └── logout.tsx
            ├── manager/          # Facility Manager screens
            │   ├── _layout.tsx
            │   ├── index.tsx             # Tickets overview
            │   ├── workers.tsx           # Manage worker accounts
            │   ├── issue/[id].tsx        # Ticket detail (assign, set priority)
            │   ├── manage/[id].tsx       # Manage a specific worker
            │   └── logout.tsx
            └── admin/            # Admin screens
                ├── _layout.tsx
                ├── index.tsx             # Admin dashboard
                └── logout.tsx
```

---

## Backend at a glance

The backend is a small Express app organized in a `routes → controllers → config` flow.

| Folder | Purpose |
|---|---|
| `server.js` | Bootstraps the HTTP server, loads `.env`, and mounts the Express app from `src/app.js`. |
| `src/app.js` | Configures global middleware (CORS, JSON parsing) and mounts each route module under `/api/*`. |
| `src/config/` | Shared clients and helpers. `supabase.js` exposes the service-role Supabase client; `JWT.js` signs and verifies auth tokens. |
| `src/routes/` | One file per domain (`auth`, `tickets`, `admin`, `manager`, `worker`). Routes only declare the HTTP surface and attach middleware — they delegate to controllers. |
| `src/controllers/` | The actual business logic: validating input, querying Supabase, returning JSON responses. |
| `src/middleware/` | `requireAuth.js` checks the JWT on every protected request; `roleMiddleware.js` restricts a route to specific user roles. |
| `migrations/001_initial_schema.sql` | The only DB migration — creates `users`, `tickets`, and `ticket_comments`. Run it once in the Supabase SQL editor. |

---

## Mobile at a glance

The mobile app uses **Expo Router**, where the folder layout under `app/` mirrors the URL structure. Each role lives in its own folder so navigation and access control are obvious from the file tree.

| Folder | Purpose |
|---|---|
| `app/_layout.tsx` | Root layout. Wraps the whole tree in `AuthContext` so any screen can read the current user. |
| `app/(auth)/` | Public auth screens (login, register, forgot/reset password). The parentheses make it a *route group* — its name doesn't appear in the URL. |
| `app/community/` | Screens for **Community Members**: submit a ticket, list their tickets, view ticket details. |
| `app/worker/` | Screens for **Workers**: see assigned tickets and resolve them (upload a completion photo). |
| `app/manager/` | Screens for **Facility Managers**: triage tickets, assign workers, manage the worker roster. |
| `app/admin/` | Screens for **Admins**: top-level dashboard. |
| `context/AuthContext.tsx` | Holds the logged-in user and JWT in React context; exposes `login`, `logout`, and `register`. |
| `services/` | The only layer that calls the backend. Each service file (`authService`, `ticketService`, etc.) wraps a slice of the REST API so screens never `fetch` directly. |
| `assets/images/` | Logos, banners, and icons referenced by the UI. |
| `app.json` | Expo configuration: app name, slug, icon, splash screen, platform settings. |

### Routing conventions to remember

- A folder under `app/` becomes a URL segment (`app/worker/index.tsx` → `/worker`).
- `_layout.tsx` wraps every sibling screen in that folder (used for headers, tab bars, auth guards).
- `index.tsx` is the folder's default route.
- `[id].tsx` is a **dynamic segment** — `app/worker/issue/[id].tsx` matches `/worker/issue/42`, with `id` available via `useLocalSearchParams()`.
- A folder wrapped in parentheses like `(auth)` is a **route group**: it shares a layout but its name is omitted from the URL.

### Where to make common changes

| You want to… | Edit here |
|---|---|
| Add a new API endpoint | `Backend/src/routes/<domain>.js` + a handler in `Backend/src/controllers/<domain>Controller.js` |
| Change DB schema | Add a new file to `Backend/migrations/` and run it in Supabase |
| Restrict an endpoint to a role | Apply `roleMiddleware` in the relevant `routes/` file |
| Add a new screen for a role | Create a `.tsx` file inside the matching `app/<role>/` folder |
| Call a new endpoint from the app | Add a function to the matching file in `mobile/services/` |
| Change the auth flow | `mobile/context/AuthContext.tsx` (client) and `Backend/src/controllers/authController.js` (server) |
