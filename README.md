# BiteLog

<img src="mobile/assets/images/bitelog-logo-full.png" alt="BiteLog" height="64" />

A cross-platform mobile calorie tracking app that helps users set daily goals, log meals,
track calories consumed, and monitor progress over time.

Monorepo layout:

- [`server/`](server) — Express + TypeScript REST API (JWT auth, SQLite via better-sqlite3).
- [`mobile/`](mobile) — Expo (SDK 54) + React Native app (expo-router) that talks to the API.
- [`website/`](website) — Standalone Next.js marketing site (home, support/contact, terms,
  privacy) — see [`website/README.md`](website/README.md) for setup.

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

### Food provider config

`GET /foods/search` merges local foods with live results from an external provider,
selected via `server/.env`:

```
FOOD_PROVIDER=usda        # usda (free, default) | edamam (paid)
USDA_API_KEY=             # optional — free, instant signup at fdc.nal.usda.gov/api-key-signup
                          # falls back to the public DEMO_KEY (30 req/hour) if unset
EDAMAM_APP_ID=            # only used when FOOD_PROVIDER=edamam
EDAMAM_APP_KEY=
```

USDA FoodData Central works out of the box with zero signup via the public `DEMO_KEY`;
add your own free key to raise the rate limit to 1000 req/hour. Edamam is kept as an
alternate provider (better branded/regional coverage, but paid) — switch to it by setting
`FOOD_PROVIDER=edamam` and filling in `EDAMAM_APP_ID`/`EDAMAM_APP_KEY`. Adding a new
provider later just means implementing the `FoodProviderClient` interface in
`server/src/services/` and registering it in `server/src/services/foodProvider.ts`.

## Email delivery config

`POST /forgot-password` and `POST /signup` (email verification) send their codes via
[Resend](https://resend.com):

```
RESEND_API_KEY=            # optional - without it, the code is just logged server-side
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Without `RESEND_API_KEY` set, nothing is actually emailed — the reset code is printed to
the server console instead, so the full flow is still testable locally. With a real key
but the default `onboarding@resend.dev` sender (no domain verification), Resend only
delivers to the email address you signed up to Resend with — **not arbitrary recipients**
like a temp-mail.org inbox. To send to real/arbitrary users, verify a domain in Resend
and set `RESEND_FROM_EMAIL` to an address on it.

## Deploying the server

The API is a stateless Express process backed by a single SQLite file (via
`better-sqlite3`), so it needs a host with a **persistent disk/volume** — the DB file
must survive restarts and redeploys, not live on ephemeral/container-local storage.
[`render.yaml`](render.yaml) (Render Blueprint) and [`server/railway.json`](server/railway.json)
are both included so either host can be set up from this repo with minimal manual config.

### Option A — Render (Blueprint, recommended: simplest)
1. Push this repo to GitHub, then in the Render dashboard: **New > Blueprint**, pick this
   repo. Render reads [`render.yaml`](render.yaml) and creates a `bitelog-api` web service
   (root dir `server/`) with a 1GB persistent disk mounted at `/var/data`.
2. Render prompts for the `sync: false` env vars during setup — set `JWT_SECRET` to a
   long random string (e.g. `openssl rand -hex 32`), and `USDA_API_KEY` (optional — falls
   back to the public `DEMO_KEY` if left blank).
3. Deploy. Render builds with `npm install && npm run build` and runs `npm start`, health
   checked via `GET /health`. Your public URL is `https://<service-name>.onrender.com`.

### Option B — Railway
1. In the Railway dashboard: **New Project > Deploy from GitHub repo**, pick this repo,
   and set the service's **Root Directory** to `server`. Railway auto-detects Node via
   Nixpacks and reads [`server/railway.json`](server/railway.json) for the build/start
   commands and health check.
2. Add a **volume** to the service (Railway dashboard > service > Volumes) mounted at
   e.g. `/data`, then set `DATABASE_PATH=/data/calorie-tracker.db` in the service's
   variables — without this step Railway's default filesystem is ephemeral and the DB
   is lost on every redeploy.
3. Set the same env vars as above (`NODE_ENV=production`, `JWT_SECRET`, `USDA_API_KEY`,
   etc.) in the service's Variables tab. Railway gives you a public
   `https://<service-name>.up.railway.app` URL (or generate one under Settings > Networking).

### Required/recommended env vars in production
| Var | Required | Notes |
|---|---|---|
| `NODE_ENV=production` | yes | server refuses to boot with the default `JWT_SECRET` otherwise |
| `JWT_SECRET` | yes | long random string — never reuse the local dev value |
| `DATABASE_PATH` | yes | must point inside the host's persistent disk/volume mount |
| `JWT_EXPIRES_IN` | no | defaults to `30d` |
| `FOOD_PROVIDER` | no | defaults to `usda` |
| `USDA_API_KEY` | no | falls back to the shared `DEMO_KEY` (30 req/hour) if unset |
| `EDAMAM_APP_ID`/`EDAMAM_APP_KEY` | no | only used if `FOOD_PROVIDER=edamam` |

### Post-deploy verification checklist
- `GET /health` returns `{ "status": "ok" }`
- Sign up, log in, and confirm the token persists across requests (`GET /me`)
- `GET /foods/search?query=chicken` returns results (confirms USDA/Edamam reachability)
- Log an entry, edit it, delete it (`POST`/`PUT`/`DELETE /entries`)
- **Restart durability**: redeploy (or restart) the service, then confirm a previously
  created user/entry still exists — this is the most important SQLite-on-a-host check;
  if data disappears after a restart, the disk isn't actually mounted at `DATABASE_PATH`.
- Point the mobile app at the deployed URL: set `EXPO_PUBLIC_API_URL` in `mobile/.env` to
  the public HTTPS URL and reload the Expo app — the rest of the app (including the
  offline sync queue) works unchanged against a hosted backend, since it only depends on
  `EXPO_PUBLIC_API_URL`.

### Out of scope for this deployment MVP
No CI/CD pipeline, no EAS build/app-store distribution, no autoscaling, no migration off
SQLite, and no monitoring/alerting stack — the goal here is only "always-on, reachable,
durable" so local `npm run dev` is no longer required to use the API.

## API overview

Base routes exposed by `server/` (see `server/src/routes/`). All routes except
`/signup`, `/login`, and `/logout` require `Authorization: Bearer <token>`.

### Auth — `auth.routes.ts`
- `POST /signup`, `POST /login`, `POST /logout`
- `POST /forgot-password` — `{ email }`, always returns the same generic message
  regardless of whether the email is registered. When it is, emails a single-use,
  1-hour reset code via Resend (see [Email delivery config](#email-delivery-config)) -
  without `RESEND_API_KEY` configured, the code is logged to the server console instead
  so the flow is fully testable locally without a real email provider.
- `POST /reset-password` — `{ code, newPassword }`, validates the code (hashed lookup,
  unused, unexpired) and updates the password; the code is single-use and any older
  unused codes for that account are invalidated the moment a new one is requested.

### Email verification — `emailVerification.routes.ts`
- `POST /verify-email/resend` — requires auth. Issues a fresh single-use, 1-hour
  verification code (invalidating any previous unused code) and emails it via Resend;
  a no-op returning a generic "already verified" message if the account is already
  verified, so it never sends a duplicate email.
- `POST /verify-email/confirm` — `{ code }`, public (no auth — the code itself proves
  ownership). Marks the account's email verified on a valid, unused, unexpired code;
  otherwise returns a generic "invalid or expired" error. Signup automatically issues
  and emails the first verification code; per policy, **login is never blocked** on an
  unverified email — the mobile app instead shows a dismissible "Verify your email"
  banner with a resend action until the user completes verification.

### Profile & account — `me.routes.ts`
- `GET /me`, `PUT /me`, `PUT /me/goal` — goal payload accepts `dailyCalorieGoal` (required)
  plus optional `dailyProteinGoal`/`dailyCarbsGoal`/`dailyFatGoal` (grams, nullable)
- `PUT /me/password` — change password (requires current password)
- `DELETE /me` — permanently delete the account and all associated data

### Foods — `foods.routes.ts`
- `GET /foods?query=` — search the curated + user's custom foods (includes `isFavorite`,
  `proteinG`, `carbsG`, `fatG`)
- `GET /foods/search?query=` — unified search: local foods (curated/custom/already-
  imported provider foods) plus live results from the active external provider (`usda`
  by default, `edamam` optional — see [Food provider config](#food-provider-config)).
  Not-yet-imported provider results carry a synthetic id (`provider:<provider>:<id>`)
  until first logged/favorited. Returns `{ foods, providerError }` — `providerError` is
  `true` if the provider call failed for any reason, but local results are still
  returned so the endpoint never hard-fails.
- `GET /foods/recent?limit=` — most recently logged foods, deduped
- `GET /foods/favorites` — the user's starred foods
- `POST /foods/:id/favorite`, `DELETE /foods/:id/favorite` — star/unstar a food. When
  `:id` is a not-yet-imported provider food, the request body must include the full
  provider food snapshot; the server imports it into the local DB (so it has a stable
  id for history/recents/favorites going forward) and then favorites it.
- `POST /foods/custom` — create a reusable custom food; accepts `proteinG`/`carbsG`/`fatG`
  (grams per serving, all optional, default `0`)

### Entries — `entries.routes.ts`
- `GET /entries?date=YYYY-MM-DD` — each entry includes `proteinG`/`carbsG`/`fatG` (scaled by
  quantity), or `null` when the entry isn't linked to a food with known macros (quick-add)
- `POST /entries` — log a food by `foodId`, `customFoodName`/`customCalories`, or a
  `providerFood` snapshot (for a not-yet-imported provider result) — the server imports
  the provider food into the local DB on first use and reuses the same row afterward
- `PUT /entries/:id` — full edit support: `mealType`, `quantity`, `entryDate`, and
  correcting the food itself via `foodId` (switch to a catalog food), `providerFood`
  (switch to a provider-backed food), or `customFoodName`/`customCalories` (switch
  to/edit a custom entry)
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
  forgot/reset password by emailed code, email verification (code emailed on signup,
  resendable, non-blocking — see [Email verification](#email-verification--emailverificationroutests)),
  and account deletion
- Onboarding that calculates a suggested daily calorie goal (Mifflin-St Jeor equation),
  editable before saving
- Dashboard with calories eaten / remaining, an animated progress ring, and a per-meal
  breakdown (breakfast, lunch, dinner, snacks)
- Food search against the local curated/custom database plus an external
  provider-backed catalog (`USDA FoodData Central` by default, with pluggable provider
  support — see [Food provider config](#food-provider-config)), recent foods, favorites
  (star/unstar), quick-add calories, and custom food creation
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

## Mobile testing

`npm test` in `mobile/` runs the Jest suite (`jest-expo` + `@testing-library/react-native`),
covering the app's most fragile logic:

- Pure utilities (`src/lib/__tests__/`): the offline-queue overlay (`applyQueueToEntries`),
  quantity/custom-calories macro recompute (`entryDisplay`), calorie/macro totals
  (`entryTotals`), email/reset-password form validation (`validation`), the API client
  (`api` - auth header handling, JSON parsing, `ApiError` construction), and date helpers
- Auth and the offline sync queue (`src/context/__tests__/`): `AuthContext` (session
  load/signup/login/logout/refresh) and `SyncContext` - optimistic create with a local id,
  coalescing an edit/delete into a still-unsynced create, marking a genuine `ApiError`
  failed vs. reverting a network-level failure to pending, and `retryFailed()`
- Component rendering (`src/components/__tests__/`): `SyncBanner`'s offline/syncing/
  failed-with-retry states and `EntryRow`'s per-entry pending/failed badges
- Auth/recovery screen smoke tests (`src/app/__tests__/`): login validation + submit +
  error handling, the full forgot-password/reset-password flows (validation, the
  generic "check your email" state, success/failure navigation), and the verify-email
  code-entry screen (validation, resend, success/failure)

Note: `@testing-library/react-native` is pinned to `12.9.0` and `react-test-renderer` to
an exact `19.1.0` (matching Expo SDK 54's React version) — newer major versions of
testing-library bundle their own test renderer that requires a newer React than this SDK
ships, which breaks `renderHook`/`render` in a confusing way (silently undefined results).

## Known limitations / deferred scope

- **Offline tolerance covers reads AND entry create/edit/delete.** Dashboard/history
  reads fall back to cached data on failure; logging/editing/deleting a food entry
  while offline queues the change locally and syncs automatically on reconnect (see the
  Offline Actions MVP notes) - other mutations (favorites, custom food creation,
  profile/account changes) still require a live connection.
- **External provider coverage varies** — the default provider (USDA FoodData Central)
  is free and has broad U.S. coverage, but branded/regional/Indian foods are less
  complete than a commercial nutrition API like Edamam (also supported, but paid —
  see [Food provider config](#food-provider-config)).
- **No dedicated meal-detail screen** — meal management (add/edit/delete per meal) lives
  inline in the dashboard's meal cards and the history day-detail view rather than as a
  separate drill-down screen.

