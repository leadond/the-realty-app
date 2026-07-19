# The Realty App — Overnight Progress Handoff

_Last updated: 2026-07-19 (overnight session)_

## TL;DR — one thing you must do

The AI features need an **Anthropic API key**. Add it in Vercel and redeploy:

1. Vercel → **the-realty-app** → **Settings** → **Environment Variables**
2. Add: `ANTHROPIC_API_KEY` = your key from https://console.anthropic.com/settings/keys
   (set it for **Production**, Preview, and Development)
3. Redeploy (Deployments → latest → ⋯ → Redeploy)

Until this key is added, the AI pages show a friendly "AI is not configured" message instead of crashing. Everything else works without it.

---

## What was broken and is now fixed

### 1. AI was calling `localhost` (would never work in production)
Every AI feature called a local Ollama server (`http://localhost:11434`) **directly from the browser**. That fails on Vercel and would have leaked any API key to users.

**Fixed:** AI now goes through a secure server route at `src/app/api/ai/chat/route.ts` that calls the Anthropic Claude API with the key kept server-side. The client helper is `src/lib/ai/provider.ts` (`callAIChat`). Default model is `claude-haiku-4-5-20251001` (fast + cheap); override with the `ANTHROPIC_MODEL` env var if you want a stronger model.

Pages now working through this: Listing Generator, Marketing, Property Matchmaker, Market Research, Showing Assistant, Email Templates, Reviews.

### 2. Four navigation links went to 404 pages
The sidebar linked to pages that didn't exist. **Built all four:**
- **Property Valuation** (`/dashboard/valuation`) — AI CMA / value-range estimator
- **Reports** (`/dashboard/reports`) — AI analytics built from your **live** lead + showing data
- **Client Portal** (`/dashboard/clients`) — client directory with AI-personalized update messages
- **Documents** (`/dashboard/documents`) — real PDF generator (buyer/listing agreements, open-house sign-in sheet, property flyer) via jsPDF

### 3. Production build reliability
- Added `prisma generate` to the build + postinstall so the database client is generated on Vercel.
- Stopped tracking local SQLite files (`dev.db`); the project uses PostgreSQL (Neon).
- Added `.env.example` documenting every required variable.

---

## Current status

- **18/18 dashboard pages** exist and build cleanly (28 total routes).
- Deployment framework preset fixed earlier (Next.js) — the site serves correctly.
- Full CRUD works: Leads, Showings, CRM (import/export), Open Houses, Transactions.
- Pure-client tools work with no key needed: Mortgage Calculator.

## Environment variables (set all in Vercel)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection (already set) |
| `NEXTAUTH_SECRET` | Session signing (already set) |
| `NEXTAUTH_URL` | `https://the-realty-app.vercel.app` in production |
| `ANTHROPIC_API_KEY` | **Add this** — powers all AI features |
| `ANTHROPIC_MODEL` | Optional model override |

## Known limitations / good Phase 2 candidates
- **Auth is not enforced** on `/dashboard` yet — it uses a shared demo workspace, so all data is shared and anyone with the link can view it. Fine for a closed beta; add real per-user auth + a route guard before public launch.
- Login (`admin@realtor.com` / `admin123`) is currently cosmetic.
- No live MLS/Zillow data — AI generates realistic examples. Real MLS integration is a Phase 2 item.
- Email/social "send" actions generate copy to copy-paste; they don't send yet (needs Resend/SendGrid + social APIs).
- Stripe billing is a dependency but not wired to the freemium tiers yet.

## Login for testers
Visit `/login`, use `admin@realtor.com` / `admin123`, or go straight to `/dashboard`.
