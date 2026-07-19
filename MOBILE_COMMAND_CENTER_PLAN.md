# Mobile Command Center — Build Plan

_Scoped 2026-07-19. Three modules, designed to ship in this order: PWA shell → SMS messaging → Unified activity timeline. Each is independently shippable and independently valuable — you don't have to build all three before releasing the first one._

## Why these three, and why this order

The click-to-call feature proved the pattern: meet the agent where they already work (their phone), log it automatically, no extra data entry. These three modules extend that pattern:

1. **PWA install shell** — makes the whole dashboard feel like a native app on the agent's phone. Zero backend work, no external account needed, immediate polish. Build this first because everything else benefits from it and it de-risks nothing else.
2. **SMS two-way messaging** — the single highest-value addition. Agents live in text messages with clients far more than calls or email. Same auto-logging pattern as click-to-call, but two-way (inbound texts land in the app too). This is the biggest lift (Twilio account, phone number provisioning, webhooks) and the clearest "pay for this" feature.
3. **Unified activity timeline** — ties calls, texts, showings, and notes into one scrollable history per client. Build this last because it's most valuable once there's more than one activity type to unify — building it before SMS exists would mean redoing it.

**Total estimated effort: 55–70 hours.** Suggested pricing: bundle SMS + timeline into the existing Pro tier ($99/mo) with a monthly message allowance (e.g. 500 segments), overage billed like the AI token model already built. PWA shell is free infrastructure — ship it to everyone.

---

## Module 1: PWA Install Shell

**Effort: 8–12 hours. No external account needed. No new database models.**

### What "done" looks like
Agent visits the site on their phone, browser offers "Add to Home Screen" (or you prompt them), and afterward the app opens full-screen with an icon, no browser chrome — feels native.

### Step-by-step

1. **Get app icons.** You need actual artwork — this can't be faked with code. Minimum set:
   - `icon-192.png` (192×192)
   - `icon-512.png` (512×512)
   - `icon-maskable-512.png` (512×512, with safe-zone padding for Android's adaptive icon masking)
   - `apple-touch-icon.png` (180×180, no transparency — iOS ignores alpha channels)
   
   Put them in `public/icons/`. If you don't have a logo yet, a simple monogram (e.g. "R" or a house glyph on a solid brand color) is fine as a placeholder — swap it later.

2. **Write `public/manifest.json`:**
   ```json
   {
     "name": "The Realty App",
     "short_name": "Realty",
     "description": "All-in-one workspace for real estate agents",
     "start_url": "/dashboard",
     "display": "standalone",
     "background_color": "#f7f5ef",
     "theme_color": "#17453b",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
       { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
     ]
   }
   ```

3. **Wire it into `src/app/layout.tsx`** — add to the `<head>` (or Next.js `metadata` export):
   - `<link rel="manifest" href="/manifest.json" />`
   - `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`
   - `<meta name="apple-mobile-web-app-capable" content="yes" />`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
   - `<meta name="theme-color" content="#17453b" />`

4. **Add a service worker.** Use [Serwist](https://serwist.pages.dev/) (the actively-maintained successor to `next-pwa`, works with Next.js App Router and Turbopack):
   ```
   npm install @serwist/next serwist
   ```
   Configure it to precache the app shell and serve a simple offline fallback page when the network is unreachable. Don't try to cache API responses or dashboard data offline in v1 — that's a much bigger project (needs a sync strategy for writes made while offline) and isn't what "seamless with their phone" was asking for. Scope v1 to: app loads instantly from cache, shows a friendly "you're offline" state for data-dependent pages instead of a browser error.

5. **Build an install prompt component** (`src/components/InstallPrompt.tsx`, client component):
   - **Android/desktop Chrome**: listen for the `beforeinstallprompt` event, stash it, show your own "Install App" button (in Settings or as a dismissible banner), call `.prompt()` on click.
   - **iOS Safari**: there's no programmatic install API. Detect iOS Safari (`navigator.userAgent` + `!('standalone' in navigator && navigator.standalone)`) and show a one-time instructional modal: "Tap the Share icon, then 'Add to Home Screen'." Don't nag — show once, remember dismissal in `localStorage`.

6. **Test on real devices** — this genuinely can't be verified any other way:
   - Android Chrome: confirm the install banner appears and the installed app opens standalone
   - iOS Safari: confirm "Add to Home Screen" produces a full-screen icon with no Safari chrome
   - Run a Lighthouse PWA audit (Chrome DevTools) and fix anything it flags

### Gotchas to plan for
- Vercel serves over HTTPS by default, so no extra config needed for the service worker requirement (PWAs require HTTPS).
- The service worker will aggressively cache — during active development, remember to unregister it or use DevTools' "Update on reload" to avoid fighting stale caches.

---

## Module 2: SMS Two-Way Messaging

**Effort: 30–40 hours. Requires a Twilio account (you set this up — same category as the Stripe/Resend keys, not something I can create on your behalf).**

### What "done" looks like
Agent taps a "Text" button next to a phone number (same location as the existing Call button) → opens a chat-style thread on the lead's contact page → agent types and sends → client receives a real SMS from the agent's dedicated number → client's reply lands back in that same thread automatically, with a notification.

### Step 1 — Twilio account setup (you do this)
1. Create an account at twilio.com, verify it, add a payment method.
2. Note your **Account SID** and **Auth Token** from the console dashboard.
3. Decide the number model (see "Number provisioning" below) before writing code — it changes the schema slightly.
4. Add to Vercel env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.

### Step 2 — Schema
```prisma
model SmsMessage {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  direction   String   // OUTBOUND, INBOUND
  body        String
  fromNumber  String
  toNumber    String
  status      String   @default("PENDING") // PENDING, SENT, DELIVERED, FAILED, RECEIVED
  twilioSid   String?
  createdAt   DateTime @default(now())

  @@index([leadId])
  @@index([userId])
  @@map("sms_messages")
}

model AgentPhoneNumber {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phoneNumber   String   @unique  // E.164 format, e.g. +15125550100
  twilioSid     String
  provisionedAt DateTime @default(now())

  @@map("agent_phone_numbers")
}
```
Same additive-migration process used throughout this build: `prisma migrate diff --from-url ... --to-schema-datamodel ... --script`, review the SQL, apply with `prisma db execute`, mark applied with `prisma migrate resolve --applied`.

### Step 3 — Number provisioning
**Decision to make before building:** does each agent get their own dedicated Twilio number, or does the org share one pool number?

Recommended: **each agent provisions their own number** (~$1.15/mo on Twilio). This matches how agents already think about their business line, avoids cross-contamination of conversation threads, and is simple to reason about. Build:
- `/dashboard/settings` gets a new "Text Messaging" section: agent enters a desired area code, you call Twilio's `AvailablePhoneNumbers` API to show 3–5 options, agent picks one, you call Twilio's number-purchase API and store the result in `AgentPhoneNumber`.
- At purchase time, programmatically set that number's SMS webhook URL (via Twilio's API, not just the console) to `https://<your-domain>/api/webhooks/twilio/sms` — this makes provisioning fully self-service, no manual Twilio console work per agent.

### Step 4 — Sending (outbound)
`POST /api/leads/[id]/sms` (protected route, same auth pattern as every other `/api/leads/*` route):
1. Look up the agent's `AgentPhoneNumber`. If they haven't provisioned one yet, return a clear "set up texting in Settings first" error — same graceful-gating pattern used for Resend/Stripe.
2. Call Twilio's Messages API to send.
3. Create the `SmsMessage` row immediately with `status: "PENDING"`.
4. Twilio will later POST a delivery-status callback — handle that in the same webhook route (Step 5) to update `status` to `SENT`/`DELIVERED`/`FAILED`.

### Step 5 — Receiving (inbound) + delivery status
`POST /api/webhooks/twilio/sms` — **public route, not behind session auth** (Twilio has no user session). Add it to a new middleware-exempt path, same pattern as `/api/public/*` and `/api/cron/*`.

Critical: **verify the request is actually from Twilio**, not spoofed. Twilio signs every webhook request with an `X-Twilio-Signature` header computed from your Auth Token + the full URL + POST params. Use Twilio's `validateRequest` helper (from the `twilio` npm package) — reject anything that doesn't validate. This is not optional; an unverified webhook here would let anyone inject fake "text messages" into your clients' contact records.

Logic:
1. Verify signature.
2. If it's an inbound message (`Body` + `From` present): match `From` number to a `Lead.phone` for the `AgentPhoneNumber` owner (the `To` field tells you which agent's number received it) → create `SmsMessage` with `direction: "INBOUND"`. If no matching lead exists for that phone number, you have a choice: silently drop it, or create a minimal new Lead so the agent doesn't lose the contact — recommend the latter (source: a new `LeadSource` value or reuse `OTHER`), matching the "never lose a lead" philosophy of the rest of this app.
3. If it's a delivery-status callback (`MessageStatus` present, matched by `MessageSid`): update the corresponding `SmsMessage.status`.
4. Reuse the existing `notifySlack()` helper (`src/lib/integrations/slack.ts`) to ping the agent's connected Slack on inbound texts — this infrastructure already exists from the Phase 4 work, no new code needed there.

### Step 6 — UI
Add to the lead detail page (`/dashboard/leads/[id]/page.tsx`):
- A "Text" button next to the existing `CallButton`, opening a thread panel (chat-bubble style: outbound right-aligned, inbound left-aligned, timestamps).
- Input box at the bottom, send on Enter or button tap.
- Since this is genuinely two-way and other people (the client) can send messages at any time, you need *some* way for the agent to see new inbound texts without sitting on the lead page. Cheapest viable approach for v1: poll `/api/leads/[id]/sms` every 15–30s while the thread panel is open, plus rely on the Slack notification for out-of-app awareness. True real-time (WebSocket/SSE) is a reasonable v2 upgrade, not required for launch.
- Consider surfacing a global "unread texts" indicator — the placeholder `/dashboard/inbox` page already in this repo (from earlier work-in-progress) is a natural home for "all recent texts across all your leads, unread first."

### Step 7 — Billing gate
Gate the "Text" button and send endpoint behind a paid plan check — mirror the exact pattern used for AI tiering (`user.monthlyTokenLimit` check in `/api/ai/chat`). Add a lightweight `smsMessagesUsedThisMonth` counter (or reuse a new `UsageCounter` pattern) and a per-plan monthly allowance, billed overage the same way AI usage is tracked in `AIUsage`.

---

## Module 3: Unified Activity Timeline

**Effort: 15–20 hours. No external account needed.**

### What "done" looks like
The lead detail page has one scrollable "Activity" feed instead of separate Call History / Showings sections — calls, texts, showings, and manual notes interleaved by time, each with its own icon.

### Step 1 — One new model for freeform entries
Calls, texts, and showings already have their own tables. You need one more for things that don't fit those (a note from an in-person meeting, a manual "left voicemail" entry, etc.):
```prisma
model ActivityNote {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  type      String   // NOTE, MEETING, VOICEMAIL, OTHER
  content   String
  createdAt DateTime @default(now())

  @@index([leadId])
  @@map("activity_notes")
}
```

### Step 2 — Aggregation endpoint
`GET /api/leads/[id]/timeline` — fetch `CallLog`, `SmsMessage`, `Showing`, `ActivityNote` (and `FollowUp` if you want scheduled-but-not-yet-happened items too) for the lead in parallel, normalize each into a common shape:
```ts
type TimelineEvent = {
  id: string;
  type: 'call' | 'sms' | 'showing' | 'note';
  timestamp: string;
  summary: string;   // e.g. "Called 512-555-0134" or "Text: 'Sounds great, see you at 3'"
  raw: unknown;       // original record, for click-through detail
};
```
Merge and sort descending by timestamp in the route handler (simplest — no need for a database-level union query given realistic per-lead volumes).

### Step 3 — UI
Replace the Lead Detail page's separate "Call History" and "Showings" sections with a single timeline component: icon + timestamp + summary per row, expandable for detail (e.g. tapping a call entry still lets you edit notes/duration inline, same UX already built — just now living inside the unified feed instead of its own section). Add a "+ Log Activity" button for manually adding an `ActivityNote` (meeting notes, voicemail left, etc.) — this is what makes the timeline feel complete rather than just "everything the app happened to capture automatically."

### Step 4 — Reuse across the app
Once built, the same aggregation pattern is cheap to expose org-wide: the Broker Dashboard could show "recent activity across the team" by removing the `leadId` filter and scoping to `organizationId` instead — worth a follow-up ticket once the per-lead version is solid, not part of this scope.

---

## Build order checklist

- [ ] **Module 1 — PWA Shell** (8–12h): icons → manifest → layout meta tags → service worker (Serwist) → install prompt component → device testing
- [ ] **Module 2 — SMS** (30–40h): Twilio account (you) → schema + migration → number provisioning flow → send endpoint → webhook receive + signature verification → thread UI → billing gate
- [ ] **Module 3 — Activity Timeline** (15–20h): ActivityNote model + migration → aggregation endpoint → timeline UI → "+ Log Activity" affordance

## Environment variables this adds

| Variable | Required for | Notes |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | SMS | From Twilio console |
| `TWILIO_AUTH_TOKEN` | SMS | From Twilio console — also used to verify inbound webhook signatures |

(PWA and Timeline modules need no new env vars — pure application code.)
