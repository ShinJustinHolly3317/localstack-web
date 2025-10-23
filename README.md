# LocalStack Web UI

A lightweight web interface to browse and edit Amazon SQS and SNS resources when using [LocalStack](https://github.com/localstack/localstack).

# Screenshots

![Dashboard](public/screenshots/home.png)
*Modern dashboard with real-time metrics and navigation*

## Features

- **Modern Dashboard**
  - Real-time overview of SQS and SNS services
  - Live statistics: Total Queues, Total Topics, Total Messages, Busiest Queue
  - Top 5 queues with most messages (color-coded by message count)
  - Quick action cards for easy navigation
  - Auto-refresh every 30 seconds

- **Unified Navigation**
  - Consistent top navigation bar across all pages
  - Home icon for quick dashboard access
  - Seamless navigation between Dashboard, SQS, and SNS

- **SQS Dashboard**
  - List all queues with real-time message counts
  - View queue attributes in a friendly table (like AWS console)
  - Inline editing of writable attributes
  - Send a message to any queue (with support for FIFO MessageGroupId and DeduplicationId)
  - Peek at up to 5 current messages (non-destructive, with quick visibility reset)
  - Purge all messages in a queue (danger action)
  - Search bar, auto-refresh, and sidebar message counts
  - Loader overlay and success toast for smooth UX

![SQS Dashboard](public/screenshots/sqs-page.png)
*SQS dashboard: View, edit, send, peek, and purge messages in your queues*

- **SNS Dashboard**
  - List all topics
  - View topic attributes in a table
  - See all SQS queues subscribed to each topic
  - Search bar and resizable sidebar

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (optional, for compose)
- A running LocalStack container exposing SQS and SNS (default port **4566**)

### Install

```bash
pnpm install
# (optional) install client deps explicitly
pnpm --prefix client install
```

### Development (two terminals)

```bash
# 1) Backend (NestJS on :3000)
pnpm start:dev

# 2) Frontend (Vite on :5173 with API proxy)
pnpm --prefix client dev
```

Configure the React API base URL via env:

- Create `client/.env.development`:

```ini
VITE_API_BASE_URL=http://localhost:3000
```

Then open `http://localhost:5173`.

### Docker Compose (dev)

We bundle a compose file to run both services:

```bash
# create .env (same dir as docker-compose.yml)
cat > .env <<EOF
BACKEND_PORT=3000
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:3000
EOF

docker compose up
```

Access:

- Frontend: `http://localhost:${FRONTEND_PORT}` (default 5173)
- Backend API: `http://localhost:${BACKEND_PORT}/api` (default 3000)

### Production run

```bash
# build client and server, then run
pnpm run build:client && pnpm run build && pnpm run start:prod
```

Notes:

- Nest serves the built React app from `client/dist` with SPA fallback (non-`/api` routes).
- Client fetches use `VITE_API_BASE_URL` if set; otherwise same-origin `/api`.

### Routes

- `/` Dashboard
- `/sqs` SQS Explorer
- `/sns` SNS Topics

## Development Notes

- Backend: NestJS in `src/*` exposes APIs under `/api`.
- Frontend: React + TypeScript (Vite) lives in `client/*`.
- Legacy static pages under `public/*.html` have been removed in favor of the SPA.

## Release Notes
**v2.0.1**
- Add docker compose
- Fix docker host and port when using docker compose

**v2.0.0**
- Migrated UI to React (TypeScript) SPA with Vite and React Router.
- Nest now serves `client/dist` and includes SPA fallback for non-`/api` routes.
- Added `VITE_API_BASE_URL` for client-side API domain configuration.
- Added `docker-compose.yml` to run backend and frontend together.
- Upgraded dev base images in compose to Node 20-alpine.
- Breaking: removed legacy static pages `public/sqs.html` and `public/sns.html`.
  - Old URLs `/sqs.html` → `/sqs`, `/sns.html` → `/sns`.

**v1.5.0**
- Complete UI redesign with dashboard metrics and quick actions.

**v1.3.0**
- SQS: send message (FIFO support), peek messages, purge queue actions.

**v1.2.0**
- Adds SNS dashboard: list topics, view attributes, see SQS subscriptions.

---

Feel free to open issues or PRs for improvements! ✨