# The Realty App — Build Status

_Last updated: 2026-07-19_

Live at **https://the-realty-app.vercel.app**. All 6 phases of the original roadmap have real, working application code. A handful of items have a hard external dependency — a developer account you have to register yourself — and those are clearly called out below with exactly what's needed to flip them on.

## Quick start for you

1. Add environment variables in Vercel → Settings → Environment Variables (see `.env.example` for the full list with explanations). At minimum you already have `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`.
2. Log in at `/login` with **admin@realtor.com / admin123** (a real broker account with its own organization and demo data) — or register your own account at `/register`.
3. Everything below "optional" in `.env.example` is genuinely optional: the app runs and every page works without it, with a clear in-app message telling you what to add if you try to use a feature that needs it.

## What's built, by phase

### Phase 1 — MVP (complete)
All 15 original dashboard pages plus Properties (was missing — showings/open houses previously took a free-typed ID with no way to actually create a listing).

### Phase 5 — Enterprise foundation (complete, built first since everything else depends on it)
- **Real authentication.** No more hardcoded `admin@realtor.com`/`admin123` bypass — real registration with bcrypt-hashed passwords. Three signup paths: solo agent, broker starting a team, or joining via an emailed invite link.
- **Route protection.** `/dashboard` and every data API now require a valid session (previously wide open to anyone with the URL). Every `[id]` route (leads, showings, open houses, transactions, properties, contracts) checks the record actually belongs to the requesting user — previously any authenticated request could read/edit/delete any user's data by guessing an ID.
- **Organizations & Broker Dashboard.** Brokers invite agents via a shareable link; a Broker Dashboard shows team performance, org-wide leads/listings, commission tracking, and pending contract signatures.
- **Global lead intelligence.** Cross-brokerage risk scoring — flags buyers who've been contacted by many different agents/orgs, or who have a history of going quiet after contact. Surfaced live when adding a contact in the CRM.
- **Cloud AI tiering.** Every AI call tries Gemini first (lower cost), falls back to Anthropic automatically if configured and Gemini errors, and is logged to a per-user monthly token budget by AI tier (Free/Pro/Enterprise).
- **Contracts & e-signature**, fully self-hosted (no DocuSign needed for your own agreements): template library, canvas signature capture, a public unauthenticated signing link so buyers/sellers can sign without creating an account, signed-PDF export.

### Phase 2 — Agent tools (complete)
- **Email campaigns**: lead segmentation by status/priority/source, quick-start templates, send via Resend (gated — works the moment you add `RESEND_API_KEY`).
- **Social scheduler**: calendar, AI-generated captions tied to your listings, copy-to-clipboard + "open platform" for manual posting today. Data model is ready for real auto-publish once Meta/TikTok/LinkedIn are connected (see Phase 4 below).
- **Automation rules engine**: trigger on lead status change, N days of no response, showing scheduled, or an open-house visitor needing follow-up → send an email or create a task reminder. Runs daily via Vercel Cron.
- **Open house QR sign-in**: generate a QR code per open house; visitors scan and self-register on their own phone, no app or account needed.

### Phase 3 — Integration framework (complete)
- **Universal CSV import wizard**: works with any CRM export, not just our own format — upload, map your columns to ours (with auto-detection), choose skip-or-update for duplicates, import. Fully functional today, no external accounts needed.
- **Connected Apps framework**: registry of supported integrations with per-integration connect/disconnect, ready for OAuth providers to plug into.

### Phase 4 — Specific integrations (partial — see note below)
- **Slack: fully working today.** Connect via an Incoming Webhook URL (no developer account, no approval process) from Dashboard → Connected Apps. You'll get real-time notifications on new leads, scheduled showings, and fully-signed contracts.
- **DocuSign, Zillow, Meta (Facebook/Instagram), TikTok, LinkedIn: scaffolded, not live.** The connection framework, database models, and UI are all built and will light up automatically the moment you add that platform's developer credentials as environment variables (see `.env.example`) — but I cannot register these developer apps for you. Each requires you personally to create a developer account with that company, register an app, and in most cases go through their app-review process (this can take days to weeks for Meta/TikTok in particular). Until then, those integrations show "requires developer app setup" in the UI rather than pretending to work.

### Phase 6 — Polish, billing, security (complete)
- **Stripe billing**: Checkout for Pro/Professional plans, self-service billing portal, webhook that syncs subscription status and AI tier limits automatically. Gated on `STRIPE_SECRET_KEY` — pricing page and upgrade buttons work today, actual checkout activates once you add your Stripe keys and price IDs.
- **GDPR account deletion**: self-service, cascades to all owned data, blocks brokers with active team members until ownership is resolved.
- **Performance indexes** added on every foreign key used in frequent dashboard queries.

## Environment variables — what's required vs. optional

See `.env.example` for the complete, commented list. Summary:

| Required | Optional (feature-gated) |
|---|---|
| `DATABASE_URL` | `ANTHROPIC_API_KEY` — AI fallback if Gemini errors |
| `NEXTAUTH_SECRET` | `RESEND_API_KEY` — email sending |
| `NEXTAUTH_URL` | `CRON_SECRET` — protects the automation cron endpoint |
| `GEMINI_API_KEY` | `STRIPE_SECRET_KEY` + price IDs — billing |
| | `ZILLOW_*`, `DOCUSIGN_*`, `META_*`, `TIKTOK_*`, `LINKEDIN_*` — Phase 4 OAuth connectors |

## Known simplifications (documented, not hidden)

- **Vercel Cron** requires your Vercel plan to support scheduled functions (Hobby supports a couple, once/day minimum interval — the automation runner is scheduled for 13:00 UTC daily in `vercel.json`).
- **Database migrations are applied manually**, not automatically on deploy. If you or a future contributor changes `prisma/schema.prisma`, run `prisma migrate deploy` (or the equivalent) against the production database as a deliberate step — this is intentional, not an oversight, to avoid an untested schema change running unattended against live data.
- **Public signing/sign-in links** (`/sign/[id]`, `/open-house/[id]`) are protected by their unguessable ID plus, for contracts, an email match check — not full auth. This is the same security model most e-signature "magic link" tools use, but if you want stricter protection later (rate limiting, link expiry enforcement server-side beyond the 30-day default) that's a reasonable next hardening step.
- **CSV import caps at 2,000 rows per file** to stay within a serverless function's execution time. Larger migrations would need a background job queue.

## Login for testers

- **Demo broker account**: `admin@realtor.com` / `admin123` (own organization, seeded with demo leads/listings)
- Or register a new account at `/register`
