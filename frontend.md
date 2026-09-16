# Chusky Frontend

## Overview

The frontend is a Next.js application in `chusky-web/`. It contains the public
Chusky marketing site and an authenticated dashboard connected to the owner-
scoped `/v1` API for agent operations, meetings, channels, connected apps, and
voice configuration.

The frontend was pushed separately from the parent agent repository:

- Remote: `https://github.com/zester4/chusky-web.git`
- Branch: `codex/chusky-web`
- Commit: `dcf35df` (`Build Chusky product frontend`)

The parent `tg-agent` repository changes were not included in that push.

## Latest implementation update — shared dashboard workspace and verified uploads

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
- `components/app/mcp-page.tsx` powers `/app/mcp` from the authenticated MCP
  catalogue and connection APIs. It never displays stored credentials; token
  input is sent once to the backend, which encrypts it before use.
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
- The chat workspace keeps a compact saved-chat rail with explicit **New chat**
  and **View all conversations** actions. Starting a chat creates a new durable
  thread; it does not replace or clear the previous thread. The first message
  becomes the thread title after the run settles, so old chats remain easy to
  identify and revisit.
- `/app/conversations` loads active and archived threads, supports loading older
  pages, and lets users restore an archived conversation. Deletion remains an
  explicit confirmed action.
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

- Vercel needs `CHUSKY_API_ORIGIN=https://chusky.up.railway.app` so its same-
  origin `/api/auth/*` and `/v1/*` rewrites reach the backend. `NEXT_PUBLIC_AUTH_URL`
  is for the Better Auth browser client and is not used as a rewrite fallback;
  this prevents a frontend-origin self-loop.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS dashboard URL and
  `NEXT_PUBLIC_CHUSKY_MCP_URL` to the deployed MCP `/mcp` endpoint. The
  Organizations page shows a copyable MCP config for each selected project;
  it contains environment-variable placeholders, never a project key.
- The Cloudflare R2 bucket needs a CORS rule permitting `PUT` with the
  `Content-Type` header from `https://chusky-web.vercel.app` and, once DNS is
  live, `https://agent.selithub.shop`. Add `http://localhost:3000` only for
  local development.
- **Telegram workspace linking is live:** a signed-in user opens **Settings**,
  creates a one-time `web_…` code, and sends `/link <code>` from the Telegram
  account that already uses Chusky. The code expires after 10 minutes, is stored
  only as a hash, is consumed atomically, and cannot rebind either identity. Once
  linked, first-party dashboard requests resolve to the Telegram owner session,
  so chat, memory, approvals, reminders, channels, devices, and deliveries are
  the same private workspace.
- Email-verification links now return to `/verify-email/success`, a dedicated
  confirmation page that appears only after Better Auth has accepted the token.

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
- `/app/mcp` — approved third-party MCP catalogue and account connections
- `/app/tasks` — task list and task status
- `/app/reminders` — one-time reminders
- `/app/jobs` — recurring jobs and schedules
- `/app/memory` — saved memories and preferences
- `/app/scratchpad` — private temporary notes
- `/app/triggers` — external app triggers
- `/app/workspace` — workspace information and usage
- `/app/devices` — connected CLI/device sessions
- `/app/settings` — account and product settings
- `/app/calls` — approval-gated Twilio or Bland call requests, provider readiness, and safe call outcomes
- `/app/meetings` — calendar meeting preparations and briefs, Recall session roster/history/outcomes, saved participant follow-ups, and the meeting representative profile. A calendar item appears as joinable only if the backend verified a supported conferencing URL; the UI opens a drafted chat request rather than silently starting a bot.
- `/app/channels` — linked Telegram/Slack/WhatsApp/Sendblue identities, proactive-reply preferences, short-lived link flows, and owner-scoped unlink. Unlinking the Chusky identity does not uninstall a provider-side app.

The app shell includes responsive navigation, a mobile menu, page headings,
status badges, cards, buttons, and a consistent Chusky visual system.

### Calls workspace

- The **Calls** sidebar page uses first-party, Better-Auth-cookie-only account
  routes. It never receives Twilio credentials, Deepgram credentials, stream
  tickets, or call audio.
- A verified web account must first be linked to its Telegram/Chusky workspace.
  This prevents an unlinked dashboard account from initiating calls in a
  separate session.
- The page validates an E.164 destination and purpose, then creates a pending
  `CHUCK_START_PHONE_CALL` approval. A separate **Approve and call** action
  executes the exact stored request without asking a model to reinterpret it.
- Call history is account-scoped and masks phone numbers. Bland summaries are
  shown separately from the transcript; provider errors are reduced to a safe
  user-facing status while diagnostics remain server-side.
- Each call request may include an editable representative profile (identity,
  organization, purpose mode, tone, facts, communication guidance, and selected
  read-only context capabilities). The exact profile is stored in the pending
  approval and is shown before the owner approves dialing.

### Meeting, channel, app, and voice controls

- The Meetings page reads the calendar lifecycle records and Recall meeting
  records from `/v1/meetings`; it shows attendee names, short conversation
  history, structured outcomes, and privately collected follow-up contacts.
  Calendar trigger types are explained as event notifications, not blanket
  meeting authorization. Preparation join actions prefill a new chat and still
  require the user to send the request.
- The meeting representative profile edits the existing account-scoped profile
  through `/v1/meetings/profile`: role, objective, communication style,
  approved knowledge, authority guidance, exact connected-app tool slugs,
  aliases, native tools, scheduling, and optional calendar auto-join.
- Settings loads the server-curated Flux voice list for Twilio and Recall
  meetings, including `flux-haley-en`, and the available curated Bland list
  when configured. Preferences persist per owner and can be reset to a
  provider default. The UI shows an unavailable catalogue as unavailable; it
  does not fabricate voice options.
- Connected apps show each owner-scoped Composio account with optional alias,
  allow adding another connection, and disconnect only after an explicit
  confirmation. Device tokens are never exposed; the Devices page revokes a
  selected CLI device through an opaque owner-scoped identifier.

## Files added or changed

### New product routes

- `chusky-web/app/app/layout.tsx` — product-area layout and app shell wrapper
- `chusky-web/app/app/page.tsx` — dashboard route
- `chusky-web/app/app/[section]/page.tsx` — dynamic product-section route

### New product components

- `chusky-web/components/app/app-shell.tsx` — responsive sidebar, header,
  navigation, shared layout primitives, and status UI
- `chusky-web/components/app/app-pages.tsx` — routes authenticated product
  sections to their focused, API-backed page components
- `chusky-web/components/app/meetings-page.tsx` and
  `chusky-web/components/app/channels-page.tsx` — calendar/Recall meeting
  lifecycle, representative profile, follow-up records, and linked channel
  management
- `chusky-web/components/app/organizations-page.tsx` and
  `chusky-web/app/accept-invitation/page.tsx` — shared organization workspace,
  membership, invitations, and organization-scoped agent projects

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

### Verification commands

From `chusky-web/`, use the reproducible checks below:

```powershell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run build
$env:CHUSKY_WEB_URL = "https://chusky-web.vercel.app"
pnpm run smoke
```

The smoke script checks public routing, the Better Auth health route, private
cache headers on the dashboard shell, and an unauthenticated `401` on the
protected API. It does not pretend to verify a signed-in session.

### Remaining production validation

- Add browser-level signed-in end-to-end coverage for the new meeting, channel,
  Composio disconnect, device revoke, voice selection, and call-profile flows.
- Exercise the calendar trigger → brief → suggested join flow against an
  authorized staging Google Calendar and Recall meeting; verify provider
  participant updates and outcome delivery in a real session.
- Validate that provider OAuth callback completion refreshes Composio
  connections on the deployed environment and that each curated voice ID is
  accepted by its actual Twilio/Recall/Bland runtime configuration.

### Production readiness

- Create/configure Neon, put its pooled and direct URLs on Oracle, run
  `npm run auth:migrate`, and redeploy. Existing SQLite users must be explicitly
  migrated or create a new account; this is not an automatic migration.
- Configure R2 CORS, Vercel's `CHUSKY_API_ORIGIN`, and the `agent.selithub.shop`
  DNS record before relying on browser uploads and the custom dashboard URL.
- Add production observability, accessibility review, responsive browser testing,
  and a signed-in release test for sign-up → verify email → sign-in → link
  Telegram. The repository now provides the unauthenticated smoke boundary;
  browser credentials and provider staging accounts must remain outside source
  control.

## Authentication integration

Better Auth is now wired between the Hono backend and the Next.js frontend.

Backend files:

- `src/auth.ts` — Better Auth configuration, Neon/PostgreSQL production database
  support, local SQLite fallback, Redis secondary storage, session policy,
  password policy, CSRF/origin protections, and startup migrations
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
- `chusky-web/.env.example` — `CHUSKY_API_ORIGIN`, `NEXT_PUBLIC_AUTH_URL`,
  `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_CHUSKY_MCP_URL`

### Local configuration

Set these variables in the backend `.env`:

```env
BETTER_AUTH_ENABLED=true
BETTER_AUTH_SECRET=<a unique value with at least 32 characters>
BETTER_AUTH_URL=http://localhost:8080
# Include the port used by your frontend. Next.js defaults to 3000; use 3010
# only when you start it with `pnpm dev -- -p 3010`.
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:3010
# Neon pooled Postgres connection string in production. Do not put either URL
# in Vercel: they belong only on the Oracle backend.
BETTER_AUTH_DATABASE_URL=postgresql://<role>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_MIGRATION_DATABASE_URL=postgresql://<role>:<password>@<endpoint>.<region>.aws.neon.tech/neondb?sslmode=require
# Local-only fallback; production refuses to use SQLite.
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
exposing the private Oracle `CHUSKY_PROJECT_KEY` or any scoped developer
`CHUSKY_API_KEY` in the browser:

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
- `chusky-web/components/app/developer-api-page.tsx` — lets a signed-in,
  email-verified user create and manage up to 10 scoped developer credentials
  at `/app/developer-api`. A `chsk_…` key is shown only immediately after
  creation or rotation; the Oracle-only `CHUSKY_PROJECT_KEY` is never exposed
  to the dashboard or browser.
- `src/sdkApi.ts` — provides Better-Auth-cookie-only `/v1/account/projects`
  endpoints with owner isolation, verified-email enforcement, scope
  validation, safe key prefixes, rotation, and revocation. Root-only
  `/v1/admin/projects` operations still require `CHUSKY_PROJECT_KEY`.
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
  requests, safely resolves a linked account to its Telegram owner, and keeps
  unlinked web workspaces isolated. It exposes the scoped
  `GET /v1/account/overview` and first-party `POST /v1/account/telegram-link`
  resources used by the account pages; project-key SDK clients cannot create a
  dashboard-to-Telegram link.
- `src/index.ts` — mounts `/v1` when Better Auth is enabled in both local
  polling and hosted webhook modes.

Chat already uses the first-party file intent/upload/verification flow. The
dashboard can list developer webhooks but still lacks a dedicated webhook
management workspace and audit-event browser. Runtime failure counters are
process-local for now; durable workflow state and the Redis fail-closed startup
guard remain authoritative.
