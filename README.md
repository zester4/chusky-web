# Chusky Web

Chusky Web is the Next.js frontend for Chusky: an authenticated dashboard for
conversations, durable tasks, missions, approvals, connected apps, channels,
meetings, automation, memory, and developer access.

The frontend is maintained in its own repository and talks to the Chusky
backend in [`tg-agent`](https://github.com/zester4/tg-agent) through the
authenticated `/v1` API. It does not contain provider credentials or agent
secrets.

## Requirements

- Node.js 22 or newer
- pnpm 11 (`corepack enable` can activate the package-manager version pinned in
  `package.json`)
- A running Chusky backend for authenticated dashboard features

## Local development

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
```

The dashboard is available at `http://localhost:3000`.

Set `CHUSKY_API_ORIGIN` in `.env.local` to the backend origin, for example
`http://localhost:8080`. Next.js proxies `/api/auth/*`, `/v1/*`, `/public/*`,
and `/builder/*` to that origin so browser requests remain first-party to the
web application.

## Configuration

The main browser-safe settings are:

| Variable | Purpose |
| --- | --- |
| `CHUSKY_API_ORIGIN` | Absolute backend origin used by the Next.js rewrites |
| `NEXT_PUBLIC_AUTH_URL` | Better Auth browser origin |
| `NEXT_PUBLIC_SITE_URL` | Canonical dashboard URL for metadata and links |
| `NEXT_PUBLIC_CHUSKY_MCP_URL` | MCP endpoint shown in the dashboard |
| `NEXT_PUBLIC_CHUSKY_CLI_SERVER_URL` | Optional backend URL used in CLI setup guidance |

X OAuth values are server-side configuration only. Keep `X_CLIENT_SECRET` out
of browser code and register the exact `X_OAUTH_REDIRECT_URI` with the X
Developer Portal.

Production deployments must use HTTPS for non-local backend and site URLs.
The Vercel deployment should point `CHUSKY_API_ORIGIN` at the deployed Railway
backend, such as `https://chusky.up.railway.app`.

## Dashboard areas

Authenticated product routes are grouped under `/app` and include:

- `/app/chat` and `/app/conversations` for durable owner-scoped chat history
- `/app/tasks`, `/app/reminders`, `/app/jobs`, and `/app/missions` for durable work
- `/app/approvals`, `/app/channels`, `/app/apps`, and `/app/mcp` for controls and integrations
- `/app/capabilities` for capabilities, including the private workspace tab
- `/app/meetings`, `/app/calls`, and `/app/autonomy` for communication and proactive work
- `/app/memory`, `/app/scratchpad`, `/app/devices`, and `/app/settings` for personal controls

Pages load real account-scoped API data and expose explicit loading, empty,
unavailable, and error states. The browser does not invent provider accounts,
execution history, approvals, or successful external actions.

## Backend connection

`lib/chusky-api.ts` contains the typed browser API client. Authentication is
handled by Better Auth, while the backend enforces ownership, approval, channel,
and provider boundaries. File uploads use short-lived backend-issued intents;
the browser sends file bytes to the temporary upload URL and passes only the
resulting file ID to the agent stream.

The web dashboard is one surface of the same Chusky workspace used by Telegram,
the CLI, Slack, iMessage, and other linked channels. Linking a channel must
resolve to the existing owner workspace rather than create a second history.

## Checks

Run the relevant checks before opening a pull request or deploying:

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
```

For a deployed smoke check, configure the required production URL and run:

```powershell
pnpm run smoke
```

## Repository notes

- `frontend.md` contains the detailed frontend architecture and production notes.
- `AGENTS.md` contains the local Next.js editing guidance.
- `.env.example` documents the supported local configuration without secrets.
- Never commit `.env*` files containing credentials, build output, or provider tokens.
