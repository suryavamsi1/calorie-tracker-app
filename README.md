# calorie-tracker-app

A cross-platform mobile calorie tracking app that helps users set daily goals, log meals,
track calories consumed, and monitor progress over time.

Monorepo layout:

- [`server/`](server) — Express + TypeScript REST API (JWT auth, SQLite via better-sqlite3).
- [`mobile/`](mobile) — Expo + React Native app (expo-router) that talks to the API.

## Getting started

### 1. Run the API server

```powershell
cd server
copy .env.example .env   # already created for local dev; edit JWT_SECRET for anything beyond local use
npm install
npm run build
npm start                # or: npm run dev (tsx watch, auto-reloads on save)
```

The server listens on `http://localhost:4000` and seeds a curated starter food database
on first run. See [server/README.md-equivalent info below](#api-overview).

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

> **Node version note:** this project was scaffolded with Expo SDK 57 / React Native 0.86,
> which prefer Node `>=20.19`. If `npm start` in `mobile/` fails to bundle, upgrade Node.js.

## API overview

Base routes exposed by `server/` (see `server/src/routes/`):

- `POST /signup`, `POST /login`, `POST /logout`
- `GET /me`, `PUT /me`, `PUT /me/goal`
- `GET /foods?query=`, `POST /foods/custom`
- `GET /entries?date=YYYY-MM-DD`, `POST /entries`, `PUT /entries/:id`, `DELETE /entries/:id`
- `GET /history`, `GET /history/:date`

All routes except `/signup`, `/login`, `/logout` require `Authorization: Bearer <token>`.

## MVP feature set implemented

- Email/password auth with persisted sessions (JWT + expo-secure-store)
- Onboarding that calculates a suggested daily calorie goal (Mifflin-St Jeor equation),
  editable before saving
- Dashboard with calories eaten / remaining and a per-meal breakdown (breakfast, lunch,
  dinner, snacks)
- Food search against a curated starter database, quick-add calories, and custom food
  creation
- Edit/delete logged entries
- History of past days with per-day totals and a day-detail view
- Profile screen to edit weight/goal and log out

