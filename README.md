# BiteLog

A cross-platform mobile calorie tracking app that helps users set daily goals, log meals,
track calories consumed, and monitor progress over time.

Monorepo layout:

- [`server/`](server) — Express + TypeScript REST API (JWT auth, SQLite via better-sqlite3).
- [`mobile/`](mobile) — Expo (SDK 54) + React Native app (expo-router) that talks to the API.

## Getting started

### 1. Run the API server

```powershell
cd server
copy .env.example .env   # already created for local dev; edit JWT_SECRET for anything beyond local use
npm install
npm run build
npm start                # or: npm run dev (tsx watch, auto-reloads on save)
npm test                 # runs the vitest API test suite
```

The server listens on `http://localhost:4000` and seeds a curated starter food database
on first run.

### 2. Run the mobile app

```powershell
cd mobile
npm install
npm start
```

Then press `i` (iOS simulator), `a` (Android emulator), or `w` (web) — or scan the QR code
with Expo Go on a physical device.

The app reads the API base URL from `mobile/.env` (`EXPO_PUBLIC_API_URL`):

- iOS simulator / web: `http://localhost:4000` (default) works as-is.
- Android emulator: use `http://10.0.2.2:4000`.
- Physical device: use your computer's LAN IP, e.g. `http://192.168.1.20:4000`.

> **Expo Go compatibility:** the mobile app targets Expo **SDK 54**. If you see
> "Project is incompatible with this version of Expo Go", update the Expo Go app on your
> device, or check which SDK your installed Expo Go supports and align this project's
> `expo` version to it (see `mobile/package.json`).

## API overview

Base routes exposed by `server/` (see `server/src/routes/`). All routes except
`/signup`, `/login`, and `/logout` require `Authorization: Bearer <token>`.

### Auth — `auth.routes.ts`
- `POST /signup`, `POST /login`, `POST /logout`

### Profile & account — `me.routes.ts`
- `GET /me`, `PUT /me`, `PUT /me/goal` — goal payload accepts `dailyCalorieGoal` (required)
  plus optional `dailyProteinGoal`/`dailyCarbsGoal`/`dailyFatGoal` (grams, nullable)
- `PUT /me/password` — change password (requires current password)
- `DELETE /me` — permanently delete the account and all associated data

### Foods — `foods.routes.ts`
- `GET /foods?query=` — search the curated + user's custom foods (includes `isFavorite`,
  `proteinG`, `carbsG`, `fatG`)
- `GET /foods/recent?limit=` — most recently logged foods, deduped
- `GET /foods/favorites` — the user's starred foods
- `POST /foods/:id/favorite`, `DELETE /foods/:id/favorite` — star/unstar a food
- `POST /foods/custom` — create a reusable custom food; accepts `proteinG`/`carbsG`/`fatG`
  (grams per serving, all optional, default `0`)

### Entries — `entries.routes.ts`
- `GET /entries?date=YYYY-MM-DD` — each entry includes `proteinG`/`carbsG`/`fatG` (scaled by
  quantity), or `null` when the entry isn't linked to a food with known macros (quick-add)
- `POST /entries` — log a food (by `foodId`, or `customFoodName`/`customCalories`)
- `PUT /entries/:id` — full edit support: `mealType`, `quantity`, `entryDate`, and
  correcting the food itself via `foodId` (switch to a catalog food) or
  `customFoodName`/`customCalories` (switch to/edit a custom entry)
- `DELETE /entries/:id`

### History — `history.routes.ts`
- `GET /history` — per-day totals include `totalProteinG`/`totalCarbsG`/`totalFatG`
- `GET /history/:date` — day detail; each entry and the day total include
  `proteinG`/`carbsG`/`fatG` (`null` per-entry when macros are unknown)

### Analytics — `events.routes.ts`
- `POST /events` — lightweight fire-and-forget product analytics (`{ name, properties }`),
  stored in the `events` table. Powers basic funnel queries (signup → onboarding → first
  log) directly against the database; no dashboard UI is built on top of it yet.

## MVP feature set implemented

- Email/password auth with persisted sessions (JWT + expo-secure-store), change password,
  and account deletion
- Onboarding that calculates a suggested daily calorie goal (Mifflin-St Jeor equation),
  editable before saving
- Dashboard with calories eaten / remaining, an animated progress ring, and a per-meal
  breakdown (breakfast, lunch, dinner, snacks)
- Food search against a curated starter database, recent foods, favorites (star/unstar),
  quick-add calories, and custom food creation
- Macro tracking: protein/carbs/fat are shown for every food (search, recent, favorites,
  logged entries, history) and summed into daily totals on the dashboard and history
  detail screens; per-user macro goals are optional alongside the required calorie goal
- Full entry editing — fix quantity, meal, date, or the logged food/calories itself,
  swap to a different catalog food, or delete (swipe or tap)
- History of past days with per-day totals, progress bars, day-over-day trend, and a
  day-detail view
- Profile screen to edit weight/goal, change password, delete account, and log out
- Basic offline tolerance: the dashboard and history list cache their last successful
  response locally and fall back to it (with a banner) if a request fails - this is
  read-only fallback, not a mutation queue (see Known limitations)
- Design system (color palette, typography scale, spacing/radius/shadow tokens) with
  toasts, skeleton loading states, and empty states throughout

## Backend hardening

- `helmet` for security headers, `express-rate-limit` on all routes (tighter limits on
  auth endpoints), `morgan` request logging (skipped in tests)
- `zod`-validated environment config (`server/src/env.ts`) — refuses to boot in
  production with the default JWT secret
- Automated tests: `server/tests/*.test.ts` (vitest + supertest) covering auth, food
  search/favorites/recent, and full entry CRUD/editing against an isolated in-memory
  SQLite database — run with `npm test` in `server/`

## Known limitations / deferred scope

- **Offline tolerance is read-only.** Cached data is shown when a fetch fails, but there
  is no queued-mutation/retry-on-reconnect system yet — logging food while offline will
  still fail.
- **No forgot/reset password or email verification** — these require an email-sending
  service that isn't wired up; change password (while logged in) and account deletion
  are implemented.
- **No external nutrition API** — food search is limited to the curated starter list plus
  user-created custom foods, not a large branded food catalog.
- **No dedicated meal-detail screen** — meal management (add/edit/delete per meal) lives
  inline in the dashboard's meal cards and the history day-detail view rather than as a
  separate drill-down screen.
- **No mobile-side automated tests yet** — only the server has a test suite so far.

