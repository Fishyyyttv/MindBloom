# MindBloom

MindBloom is a subscription-based mental wellness app built with Next.js 14, Clerk, Stripe, Supabase, and Groq.

It includes:
- AI companion chat with crisis keyword handling
- mood check-ins
- private diary entries
- coping tools, breathing, grounding, anger support, worksheets, and skills
- bug reporting and admin triage
- GDPR/CCPA-style account data deletion flow
- web push notifications (daily + weekly reminder pipeline)

Important: MindBloom is not a licensed therapy service.

## Stack

- Next.js 14 (App Router) + TypeScript
- Clerk authentication
- Stripe subscriptions + billing portal + webhooks
- Supabase (Postgres, app data, admin analytics data source)
- Groq SDK for chat completions
- Tailwind CSS + Framer Motion
- Vercel deployment + Vercel Cron

## Main Routes

Public:
- `/`
- `/sign-in`
- `/sign-up`
- `/subscribe`
- `/privacy`
- `/terms`

Authenticated app:
- `/app`
- `/app/chat`
- `/app/mood`
- `/app/diary`
- `/app/breathe`
- `/app/grounding`
- `/app/anger`
- `/app/coping`
- `/app/worksheets`
- `/app/skills`
- `/app/account`
- `/app/report-bug`

Admin:
- `/app/admin`
- `/app/admin/bugs`

API:
- `/api/chat`
- `/api/mood`
- `/api/diary`
- `/api/worksheets`
- `/api/skills/session`
- `/api/bug-reports`
- `/api/account/delete-data`
- `/api/admin/stats`
- `/api/admin/bug-reports`
- `/api/admin/bug-reports/[id]`
- `/api/notifications/preferences`
- `/api/notifications/subscribe`
- `/api/notifications/test`
- `/api/notifications/dispatch`
- `/api/stripe/create-checkout`
- `/api/stripe/portal`
- `/api/stripe/sync`
- `/api/webhooks/clerk`
- `/api/webhooks/stripe`

## Security Model

- Clerk middleware protects authenticated routes.
- `/app/admin/*` and `/api/admin/*` are admin-gated.
- Write APIs use request origin validation (`Origin`/`Referer` + `sec-fetch-site`) to reduce CSRF risk.
- Sensitive APIs use in-memory rate limiting.
- Security headers are set in `next.config.mjs`.
- Server-side event logging is centralized via `src/lib/monitoring.ts` and can persist into `public.security_events`.

## Environment Variables

Create `.env.local` in the project root and set:

### Core
- `NEXT_PUBLIC_APP_URL` - App base URL (for redirects, Stripe return URLs).
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Auth (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET` (required if using `/api/webhooks/clerk`)

### Billing (Stripe)
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET` (required for `/api/webhooks/stripe`)

### AI
- `GROQ_API_KEY`

### Push Notifications
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:you@yourdomain.com`)

### Admin
- `ADMIN_USER_IDS` (comma-separated Clerk user IDs, recommended)
- `ADMIN_USER_ID` (single-ID fallback)

### Cron/Auth for Dispatch Endpoint
- `NOTIFICATIONS_CRON_SECRET` (recommended if not relying on Vercel Cron header)

Do not commit `.env.local`.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add `.env.local` with all required values.

3. Set up Supabase schema:

- Open Supabase SQL editor.
- Run `supabase-schema.sql`.

Note: `supabase-schema.sql` contains plain `create trigger ...` statements near the end. If triggers already exist, create only missing objects manually instead of rerunning the full file.

4. Start dev server:

```bash
npm run dev
```

5. Open:
- `http://localhost:3000`

## Build and Run

Build:

```bash
npm run build
```

Production server:

```bash
npm run start
```

## Database Notes

Current schema includes:
- `users`
- `chat_sessions`
- `messages`
- `diary_entries`
- `mood_logs`
- `bug_reports`
- `worksheet_completions`
- `skill_sessions`
- `push_subscriptions`
- `notification_preferences`
- `data_deletion_requests`
- `security_events`

## Webhooks

Configure webhook endpoints:

- Clerk -> `POST /api/webhooks/clerk`
- Stripe -> `POST /api/webhooks/stripe`

Both endpoints verify signature secrets from env vars.

## Push Notifications

Flow:
- User enables notification preferences in `/app/account`.
- Client registers `public/sw.js`.
- Subscription is stored in `push_subscriptions`.
- Daily/weekly dispatch jobs send notifications via web-push.

`vercel.json` currently schedules:
- daily dispatch: `0 17 * * *`
- weekly dispatch: `0 17 * * 1`

These are UTC cron schedules.

## Admin Features

- Dashboard stats (`/app/admin`)
- Bug report list with pagination/filtering/sorting (`/app/admin/bugs`)
- Click-through bug detail modal + status updates
- Admin APIs protected in middleware and server-side auth checks

## AI Customization

Users can customize AI behavior from account settings:
- companion name
- tone
- response depth
- focus areas
- custom instructions

These settings are stored client-side (`localStorage`) and passed to `/api/chat` for runtime prompt customization.

## Production Checklist

- Set all environment variables in your hosting provider.
- Configure Clerk + Stripe webhooks to production URLs.
- Confirm `ADMIN_USER_IDS` is set for real admin accounts.
- Run the latest SQL schema/migrations in Supabase.
- Verify push notifications in a real HTTPS environment.
- Verify Stripe checkout, billing portal, and cancellation sync.
- Verify cron dispatch endpoint auth (`x-vercel-cron` or `NOTIFICATIONS_CRON_SECRET`).

## Troubleshooting

### CSS/chunk 404s in dev (`/_next/static/... 404`)

This project uses separate build dirs for dev vs prod:
- dev: `.next-dev`
- prod build: `.next`

If chunks get out of sync, stop the server and clear both:

PowerShell:

```powershell
Remove-Item -Recurse -Force .next, .next-dev
```

Then run:

```bash
npm run dev
```

### Push says "not configured"

Set:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

And ensure the browser granted notification permission.

### Admin stats references missing table

Run schema updates so required tables exist, especially:
- `data_deletion_requests`
- `security_events` (optional but recommended for persisted monitoring logs)

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
