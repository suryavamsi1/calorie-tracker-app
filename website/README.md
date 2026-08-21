# BiteLog Marketing Website

<img src="../mobile/assets/images/bitelog-logo-full.png" alt="BiteLog" height="64" />

A standalone Next.js (App Router, TypeScript, Tailwind CSS v4) marketing site for BiteLog —
separate from the `mobile/` app and `server/` API. Built from the Figma/Stitch designs in
[`../website design/`](../website%20design/).

## Pages

- **`/`** — Home: hero, features, social proof, "coming soon" mobile app section, waitlist CTA
- **`/support`** — FAQ accordion + contact form
- **`/terms`** — Terms of Service
- **`/privacy`** — Privacy Policy (content authored to match BiteLog's actual data practices;
  no dedicated mockup was provided for this page, so it reuses the Terms of Service layout)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Email config (waitlist + contact form)

Copy `.env.example` to `.env.local` and fill in as needed:

```
RESEND_API_KEY=            # optional — without it, submissions are logged to the console instead
RESEND_FROM_EMAIL=onboarding@resend.dev
CONTACT_TO_EMAIL=support@bitelog.app
WAITLIST_TO_EMAIL=
```

This mirrors the fallback-logging pattern used in `server/src/services/emailClient.ts` — the
site is fully testable locally with zero external config.

## Design system

Design tokens (colors, typography scale, spacing, radii) live in `src/app/globals.css` under
the Tailwind v4 `@theme` block, ported from
[`../website design/vitality_marketing_core/DESIGN.md`](../website%20design/vitality_marketing_core/DESIGN.md).
Utility class names (`text-display-hero`, `bg-primary`, `px-grid-gutter`, etc.) intentionally
match the original Tailwind Play CDN mockups for easy comparison.

## Known limitations

- Hero/testimonial/mockup photography is hotlinked from the original design tool's preview CDN
  (`lh3.googleusercontent.com`). This is fine for an MVP/demo but should be replaced with
  self-hosted or licensed imagery before a real production launch — the preview URLs are not
  guaranteed to stay available long-term.
- The waitlist and contact forms send a notification email but do not persist submissions to a
  database — there's no admin view of past submissions (out of scope for this MVP).
- No analytics/SEO tooling (sitemap.xml, robots.txt, structured data) beyond basic `<meta>` tags.

