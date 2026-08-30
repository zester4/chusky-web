# Chusky Frontend

## Overview

The frontend is a Next.js application in `chusky-web/`. It contains the public
Chusky marketing site and a product dashboard prototype for managing the Chusky
agent.

The frontend was pushed separately from the parent agent repository:

- Remote: `https://github.com/zester4/chusky-web.git`
- Branch: `codex/chusky-web`
- Commit: `dcf35df` (`Build Chusky product frontend`)

The parent `tg-agent` repository changes were not included in that push.

## Latest implementation update — live dashboard and verified chat uploads

The dashboard is no longer a local-data prototype. Its existing sidebar pages
load authenticated, account-scoped data from Chusky's `/v1` API and use clear
loading, offline, and empty states when a resource has no saved data.

### Live sidebar and dashboard data

- `components/app/app-shell.tsx` now shows the signed-in user, live health,
  Redis persistence status, verified channel count, and the real number of
  pending approvals. The **New conversation** control opens `/app/chat`.
- `components/app/account-pages.tsx` powers Approvals, Channels, Reminders,
  Jobs, Memory, Scratchpad, Triggers, Workspace, Devices, and Settings from
  `GET /v1/account/overview`.
- `components/app/backend-pages.tsx` powers Overview, Conversations, and Tasks
  from the authenticated threads, usage, and task APIs.
- `components/app/operations-dashboard.tsx` powers Operations and Delivery
  from live health, failure counters, enabled-channel state, and recent
  delivery records.
- The chat context intentionally shows only channels that Chusky has actually
  verified. It does not invent Composio OAuth connections such as GitHub or
  Gmail when the backend has not exposed them.

### Chat design and attachments

- `components/app/chat-page.tsx` has bordered, rounded message bubbles, a
  rounded composer, and an upward-arrow send button.
- The attachment button supports JPEG, PNG, WebP, PDF, plain text, MP3, OGG,
  WAV, and MP4 files up to 25 MB each, with progress, remove, success, and
  failure states. A run can include up to five verified attachments.
- `lib/chusky-api.ts` implements the browser flow: create an authenticated file
  intent, PUT to its temporary R2 upload URL, call the completion endpoint, and
  pass only resulting file IDs to the stream endpoint. The browser never sees
  an R2 object key.
- The parent backend changes in `src/sdkApi.ts`, `src/store.ts`, and
  `src/lib/storage/r2.ts` validate account ownership and R2 verification before
  reading an attachment. Images are supplied as image input, audio is
  transcribed, documents are supplied as files, and MP4s are supplied through a
  short-lived signed URL. Attachment names—not raw content—are retained in
  thread history.

### Required production configuration

- Vercel needs `CHUSKY_API_ORIGIN=https://chusky.selithub.shop` so its same-
  origin `/api/auth/*` and `/v1/*` rewrites reach the Oracle backend.
- The Cloudflare R2 bucket needs a CORS rule permitting `PUT` with the
  `Content-Type` header from `https://chusky-web.vercel.app` and, once DNS is
  live, `https://agent.selithub.shop`. Add `http://localhost:3000` only for
  local development.
- The dashboard is a Better Auth account; Telegram is a separate channel
  identity today. A one-time dashboard-to-Telegram account-link flow must be
  implemented before a web login should be expected to show the same Telegram
  history, memory, reminders, or channels.

### Verification for this update

- `npm.cmd run typecheck` and the focused SDK test passed in the backend.
- `pnpm.cmd run build` and `pnpm.cmd exec tsc --noEmit` passed in `chusky-web`.

## What was completed

### Public website

The existing public pages remain available:

- `/` — landing page
- `/features` — feature overview
- `/how-it-works` — product flow
- `/developers` — developer information
- `/pricing` — pricing page
- `/start-creating` — call to action / signup entry
- `/sign-in` — sign-in entry page

### Product dashboard

The new authenticated-product-style shell and pages were added under `/app`.
The authenticated dashboard is connected to Chusky's first-party `/v1` API.
It presents only persisted account data or an explicit loading, unavailable, or
empty state; it does not fill resource pages with demo records.

- `/app` — dashboard overview, activity, quick actions, and system status
- `/app/chat` — chat workspace for interacting with Chusky
- `/app/conversations` — conversation list and conversation state
- `/app/approvals` — pending risky-action approvals with approve/deny controls
- `/app/apps` — connected applications and integrations
- `/app/tasks` — task list and task status
- `/app/reminders` — one-time reminders
- `/app/jobs` — recurring jobs and schedules
- `/app/memory` — saved memories and preferences
- `/app/scratchpad` — private temporary notes
- `/app/triggers` — external app triggers
- `/app/workspace` — workspace information and usage
- `/app/devices` — connected CLI/device sessions
- `/app/settings` — account and product settings

The app shell includes responsive navigation, a mobile menu, page headings,
status badges, cards, buttons, and a consistent Chusky visual system.

## Files added or changed

### New product routes

- `chusky-web/app/app/layout.tsx` — product-area layout and app shell wrapper
- `chusky-web/app/app/page.tsx` — dashboard route
- `chusky-web/app/app/[section]/page.tsx` — dynamic product-section route

### New product components

- `chusky-web/components/app/app-shell.tsx` — responsive sidebar, header,
  navigation, shared layout primitives, and status UI
- `chusky-web/components/app/app-pages.tsx` — dashboard and product-section
  page implementations, demo data, and local interactions

### Frontend configuration

- `chusky-web/package.json` — uses webpack explicitly for reliable local builds
- `chusky-web/pnpm-lock.yaml` — includes the Windows Lightning CSS native package

The public-site files and shared styling remain in the existing `chusky-web/app/`
and `chusky-web/components/` structure.

## How to run it locally

From PowerShell:

```powershell
cd C:\Users\mseyy\Downloads\tg-agent\chusky-web
pnpm install
pnpm dev -- -p 3010
```

Open [http://localhost:3010/app](http://localhost:3010/app).

If port 3000 is free, `pnpm dev` can be used and the dashboard will be at
`http://localhost:3000/app`.

From the repository root, `npm run dashboard` starts the same Next.js app in
one command. Operations is at `/app/operations`; Delivery is at `/app/delivery`.

## Verification completed

- Production build completed successfully with `pnpm run build`.
- Verified HTTP 200 responses for `/app`, `/app/chat`, `/app/approvals`, and
  `/app/settings`.
- Verified the frontend diff with `git diff --check`.
- The smooth-scroll warning from Next.js is informational and does not prevent
  the application from running.

## What is left

### Backend and authentication integration

- Add real authentication and protected dashboard access.
- Add a typed API client for the Chusky service.
- Connect the dashboard to the existing Redis-backed sessions, histories,
  memories, approvals, reminders, jobs, scratchpad, triggers, and device data.
- Connect the chat page to the shared Chusky agent/API flow and streaming or
  polling responses.
- Replace local approval actions with server-side approval records and the
  existing one-time, expiring approval rules.
- Add loading, empty, error, retry, optimistic-update, and unauthorized states
  for every data-driven page.

### Product functionality

- Implement create, edit, cancel, delete, and search actions for the relevant
  resources.
- Add real app connection and OAuth/linking flows for supported integrations.
- Add channel management for Telegram, Slack, WhatsApp, and future channel
  adapters while preserving Chusky account ownership and conversation scope.
- Add device pairing, token revocation, and last-seen status for CLI devices.
- Add account/profile management and persistent settings.

### Production readiness

- Define and document the frontend/backend API contract.
- Configure environment variables without committing secrets.
- Add frontend unit/component tests and end-to-end tests for authentication,
  chat, approvals, and CRUD flows.
- Run the complete repository checks, including `npm test`, typecheck, and the
  backend build, after API integration.
- Deploy the frontend and configure its production domain, HTTPS, CORS, and
  backend URL.
- Add observability, rate-limit handling, accessibility review, and responsive
  browser testing.

## Authentication integration

Better Auth is now wired between the Hono backend and the Next.js frontend.

Backend files:

- `src/auth.ts` — Better Auth configuration, SQLite database, Redis secondary
  storage, session policy, password policy, CSRF/origin protections, and startup
  migrations
- `src/authRoutes.ts` — `/api/auth/*` Hono route, CORS, and `/api/auth/ok`
- `src/auth-email.ts` — Resend verification and password-reset email delivery
- `src/config.ts` — auth enablement, trusted origins, and database settings
- `src/index.ts` — auth route registration in webhook and local polling modes

Frontend files:

- `chusky-web/lib/auth-client.ts` — Better Auth browser client
- `chusky-web/components/app/authenticated-app.tsx` — session gate for `/app`
- `chusky-web/components/app/app-shell.tsx` — sign-out action
- `chusky-web/components/landing/auth-pages.tsx` — real sign-in, sign-up,
  recovery, reset, and verification client calls
- `chusky-web/.env.example` — `NEXT_PUBLIC_AUTH_URL`

### Local configuration

Set these variables in the backend `.env`:

```env
BETTER_AUTH_ENABLED=true
BETTER_AUTH_SECRET=<a unique value with at least 32 characters>
BETTER_AUTH_URL=http://localhost:8080
# Include the port used by your frontend. Next.js defaults to 3000; use 3010
# only when you start it with `pnpm dev -- -p 3010`.
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:3010
BETTER_AUTH_DATABASE=./data/better-auth.sqlite
BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION=true
```

Set this in `chusky-web/.env.local`:

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:8080
```

Start the backend and frontend separately, then visit `/sign-up`. In local
development, email delivery is accepted but logged as unconfigured unless
`RESEND_API_KEY` and `AUTH_EMAIL_FROM` are set. Production requires both values;
the server refuses to silently skip auth email delivery in production.

The root Better Auth API is intentionally opt-in. If
`BETTER_AUTH_ENABLED=false`, the existing Telegram polling behavior remains
unchanged and auth routes return no authenticated service behavior.

## Backend-connected pages

The first-party dashboard now uses the authenticated Chusky `/v1` API without
exposing `CHUSKY_API_KEY` in the browser:

- `chusky-web/lib/chusky-api.ts` — typed, credentialed client for threads,
  streamed runs, tasks, and usage; it handles NDJSON streaming, idempotency
  keys, API errors, and session cookies.
- `chusky-web/components/app/chat-page.tsx` — creates/loads a thread and sends
  prompts to `/v1/threads/:id/runs/stream`, rendering tool activity, approval
  requests, failures, cancellation, and streamed assistant text.
- `chusky-web/components/app/backend-pages.tsx` — live overview metrics,
  recent conversations, conversation listing, and task listing with loading,
  empty, offline, and retry states.
- `chusky-web/components/app/app-pages.tsx` — routes Overview, Chat,
  Conversations, and Tasks to the backend-connected page components.
- `chusky-web/components/app/operations-dashboard.tsx` — live Operations and
  Delivery pages for Redis/QStash/Sendblue readiness, enabled channels,
  workflow/provider/delivery failure counters, and the latest runtime incident.
- `chusky-web/components/app/app-shell.tsx` — adds `/app/operations` and
  `/app/delivery` to the authenticated workspace navigation.
- `src/sdkApi.ts` — exposes the authenticated `GET /v1/ops/health` diagnostics
  endpoint without returning provider secrets.
- `src/index.ts` — expands public `/health` with Redis, QStash, Sendblue,
  channel, and failure-monitoring status.
- `src/monitoring.ts` — records structured workflow, delivery, provider, and
  Redis failures for the live dashboard and logs.
- `chusky-web/components/app/account-pages.tsx` — replaces demo-only account
  pages with real persisted approvals, channels, reminders, jobs, memories,
  scratchpad notes, triggers, devices, workspace state, settings, and webhook
  data, including truthful empty/offline states and approval decisions.
- `src/store.ts` — refuses in-memory persistence in production or webhook mode;
  Redis must be configured and reachable.
- `src/cli/setup.ts` — makes `chusky doctor` print remote provider checks and
  runtime failure counts.
- `src/sdkApi.ts` — accepts the Better Auth session for first-party web
  requests, maps the auth user to an isolated `web` project namespace, and
  continues to support project-key SDK clients. It also exposes the scoped
  `GET /v1/account/overview` resource used by the account pages.
- `src/index.ts` — mounts `/v1` when Better Auth is enabled in both local
  polling and hosted webhook modes.

The public `/v1` files, webhook, and audit endpoints are available in the
backend contract but are not yet surfaced by the browser client. Runtime
failure counters are process-local for now; durable workflow state and the
Redis fail-closed startup guard remain authoritative.
