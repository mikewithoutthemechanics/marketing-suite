# Marketing Scheduler (prototype)

Lightweight scheduler prototype for multi-platform posting. Designed as a scaffold: connectors are stubs and must be implemented with real platform APIs and OAuth flows before production use.

Quick start

1. Copy `.env.example` to `.env` and set `MASTER_KEY` (strong secret) and `PORT` if desired.
2. Install dependencies

```powershell
cd "c:\Users\Personal\.vscode\Marketing Suite\scheduler-app"
npm install
```

3. Start the app

```powershell
npm run start
# Open http://localhost:4000
```

Docker (recommended when Node/npm not available locally)
---------------------------------

Build and start services (app, redis, postgres):

```powershell
cd "c:\Users\Personal\.vscode\Marketing Suite\scheduler-app"
docker compose up --build
```

Run worker separately (in a container or locally):

```powershell
docker compose exec app node worker.js
```

Features included in this scaffold

- API to add clients with per-platform credentials (encrypted by `MASTER_KEY`).
- Simple JSON datastore at `data/data.json` for rapid prototyping.
- Scheduler that polls for due posts and dispatches to connector stubs.
- `deploy.js` one-click deploy script that sends all queued/scheduled posts.
- Minimal admin UI at `/` to add clients and schedule posts.

GenAI integration

- You can optionally set `OPENROUTER_API_KEY` in `.env` to enable server-side generation of copy, images and experimental video calls using OpenRouter-compatible endpoints.
- Endpoints:
	- `POST /api/generate/text` { product, audience, brandVoice, goal, platform } -> tailored copy + hashtags
	- `POST /api/generate/image` { prompt, negative, aspect, size } -> image generation (returns vendor response or stub)
	- `POST /api/generate/video` { product, audience, duration, style } -> shot-list plan; if `prompt` provided, attempts synthetic video endpoint

Example `.env`:

```
MASTER_KEY=change_this_to_a_strong_secret
OPENROUTER_API_KEY=put_your_openrouter_or_compatible_key_here
PORT=4000

Production notes and optional services
------------------------------------

- Postgres: set `USE_POSTGRES=true` and `DATABASE_URL` to use Postgres instead of the local SQLite file. The app includes a `lib/db_pg.js` adapter and will run migrations on startup.
- Redis + Queue: set `USE_QUEUE=true` and `REDIS_URL` to enable a BullMQ-backed job queue to process posting jobs asynchronously. Worker is in `lib/queue.js`.
- Vault (optional): set `VAULT_ADDR` and `VAULT_TOKEN` to use HashiCorp Vault for provider secrets. Provider configs saved via the admin UI will be stored in Vault when configured.
- Webhooks: the app exposes `POST /webhook/:provider` as a generic receiver; configure provider webhook URLs to point to this endpoint and implement signature verification per provider.

Env variables summary
- `OPENROUTER_API_KEY` — API key for OpenRouter-compatible models (optional)
- `MASTER_KEY` — secret used to encrypt stored credentials
- `PORT` — server port
- `USE_POSTGRES` — set to `true` to use Postgres adapter
- `DATABASE_URL` — Postgres connection string
- `USE_QUEUE` — set to `true` to enable job queue (requires Redis)
- `REDIS_URL` — Redis connection string for BullMQ
- `VAULT_ADDR` and `VAULT_TOKEN` — if using HashiCorp Vault

Next steps I can take for production
- Implement provider-specific publish/upload flows (YouTube resumable upload, Instagram Graph media_publish, TikTok upload API).
- Add robust webhook signature verification and event handlers.
- Add background retry and dead-letter queue handling.

```

Security & production notes

- The connectors are placeholders. Implement platform-specific OAuth and rate-limit/error handling before using.
- Move to a managed datastore (Postgres) and a secrets store (AWS Secrets Manager, Azure KeyVault) for production.
- Add retries, idempotency keys, and detailed logging.

Next steps I can implement

1. Real platform connectors (YouTube, X, Instagram, TikTok, Facebook, LinkedIn, Reddit, Medium) with OAuth flows.
2. Background worker with job queue (BullMQ/Redis) and webhooks for delivery confirmation.
3. UI improvements, scheduled calendar view, and per-client role/access control.
