# Market Readiness Todos

Status date: 2026-09-09

## Navigation Consolidation

- [x] Replace the long flat dashboard menu with grouped sections: Workday, Clients, Listings, Deals, Marketing, and Admin.
- [x] Trim the public home sidebar to core entry points instead of pseudo-pages like Health and Security.
- [x] Add the premium app splash experience from the supplied HTML direction as app-native React/CSS.
- [x] Add a royalty-free custom Realty logo mark and use it on the public app shell and dashboard sidebar.
- [x] Rename duplicate-looking menu items so each destination has a clearer job:
  - Leads and CRM are now Leads & CRM plus Import / Export.
  - Documents and File Storage are now Forms & Flyers plus File Vault.
  - Commissions and Commission Splits are now Commission Dashboard plus Commission Splits.
  - Marketing, Email, Social, Reviews, and Business Card are grouped under Marketing.
- [x] Convert unfinished future features into Request Access links so agent clicks become measurable demand signals.

## Feature Request System

- [x] Store per-user feature interest in `feature_access_requests`.
- [x] Add a Request Access page for upcoming features.
- [x] Add a founder/admin Feature Requests page to rank demand by feature.
- [x] Capture requester notes and priority; rank urgent and important requests first.
- [x] Add review status controls scoped to admins and the broker's organization.
- [x] Migrate the authentication middleware to Next.js 16 proxy conventions.
- [x] Make request-access features consistent on direct URLs as well as sidebar clicks. Non-admin users now see demand-capture screens for SMS, Bridge, File Vault, Email Campaigns, Social Scheduler, Connected Apps, and Webhooks.
- [ ] Verify request submission and review with separate agent, broker, and admin browser sessions.
- [x] Add seven route-handler regression checks for permissions, malformed payloads, and repeat-request preservation (`node --test tests/feature-requests.test.cjs`). These use mocked authentication and database calls; live session testing remains outstanding.
- [x] Preserve saved notes, priority, and review status when repeat submissions omit those fields.

## Features Blocked By Missing Credentials

- [ ] Billing: Stripe checkout and customer portal return setup errors until `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PROFESSIONAL`, and `STRIPE_WEBHOOK_SECRET` are configured.
- [ ] Email Campaign Sending: campaigns can be drafted, but sending requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- [ ] File Vault Uploads: upload endpoints return setup errors until `BLOB_READ_WRITE_TOKEN` is configured.
- [ ] SMS Sending: Twilio SID/auth token are present, but sending still needs `TWILIO_PHONE_NUMBER` and an `AgentPhoneNumber` row for each sending user.
- [x] Lint no longer fails the release pipeline; current React 19 advisory cleanup items are warnings, while TypeScript and production build remain hard checks.

## Features Partially Wired

- [ ] Zillow / Bridge: server token is present and dataset lookup works, but `BRIDGE_DATASET_ID` is not set. Choose the MLS dataset, then complete listing detail and saved-listing review workflows.
  - [x] Property search now renders listing cards from Bridge API results.
  - [x] Bridge records can be saved into Properties from the Bridge page when the record includes address, city, state, zip, and price.
  - [x] Saved MLS IDs update the same user's saved property instead of creating duplicates.
- [ ] Connected Apps: Slack Incoming Webhook can be saved manually. DocuSign, Meta, TikTok, and LinkedIn OAuth buttons intentionally return "not yet wired" until developer apps and OAuth callback routes are implemented.
- [ ] Social Scheduler: captions and drafts work, but direct publishing is manual until Meta/TikTok/LinkedIn OAuth and publish APIs are added.
- [ ] Password Reset: local development shows signed reset links on screen. Production needs an email sender so the link is delivered privately.

## Features To Verify Before Launch

- [ ] End-to-end auth flows: register, login, forgot password, reset password, logout.
- [ ] Lead lifecycle: create, update, delete, call log, SMS thread, and portal link.
- [ ] Property lifecycle: create, edit, delete, map display, and Bridge import.
- [ ] Showing workflow: schedule, update status, generate briefing, generate follow-up.
- [ ] Transaction workflow: create deal, attach documents, generate contract, sign public contract link.
- [ ] Marketing workflow: generate listing copy, create campaign, send email, schedule social post, request review.
- [ ] Admin workflow: billing upgrade, connected app setup, webhooks, broker dashboard, team invite.

## Fastest Path To Market

- [ ] Ship a tight MVP around Leads & CRM, Properties, Showings, AI listing copy, Market Data, and basic client portal links.
- [ ] Add Stripe billing before any public premium launch.
- [ ] Complete Bridge live listings import as the first premium differentiator.
- [ ] Complete email sending next, because alerts and nurture campaigns are central to realtor value.
- [ ] Add SMS and social auto-publishing after the CRM/listings/email loop is stable.
