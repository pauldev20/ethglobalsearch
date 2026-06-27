# ETHSearch

A better way to search and explore ETHGlobal showcase projects.

## Stack
- **Next.js 16 / React 19 / Tailwind 4** — frontend.
- **Convex** (self-hostable) — database, full-text + vector search, cron, actions.
  Components: `rag` (embeddings/vector index), `workpool` (sync + embed pools),
  `aggregate` (counts/offset pagination), `migrations`.
- **S3-compatible object storage** — project/sponsor images, served via stable public-read URLs.
- **Embeddings via OpenAI-compatible API** — default OpenRouter
  (`openai/text-embedding-3-small`, 1536-dim). Configurable via env vars.

## Architecture

```
ETHGlobal GraphQL ─► ingest action ─► projects / prizes / events tables
                                          │
                                          ├─► S3 (images) ──► images mapping table ──► public URLs
                                          │
                                          └─► embed workpool ─► RAG vector index ─► similarities table

User ─► Next.js ─► search query (FTS + index-driven filters, aggregate pagination) ─► results
                └► getGraph query (similarity graph)                                ─► results
```

## Run (local)

```bash
bun install
bunx convex dev                                  # writes NEXT_PUBLIC_CONVEX_URL to .env.local
bunx convex env set OPENROUTER_API_KEY <key>     # https://openrouter.ai/keys
# S3 image storage (any S3-compatible provider):
bunx convex env set S3_ENDPOINT <url>
bunx convex env set S3_REGION <region>
bunx convex env set S3_BUCKET <bucket>
bunx convex env set S3_ACCESS_KEY_ID <id>
bunx convex env set S3_SECRET_ACCESS_KEY <secret>
bunx convex env set S3_PUBLIC_BASE <public-read base url>
# optional: EMBEDDINGS_MODEL (default openai/text-embedding-3-small), EMBEDDINGS_DIM (default 1536)
bun dev                                          # next.js
```

## Convex commands

All pipeline functions are `internal` — run them with `bunx convex run`:

```bash
# ingest a small dev sample
bunx convex run ingest:ingestDev

# full sync (all hackathons, with images) — change-detected
bunx convex run ingest:scheduleSyncAll '{"fetch_images": true}'

# embed projects missing/stale embeddings (also triggered on-demand by sync)
bunx convex run embeddings:scanAndEnqueue

# wipe + re-embed everything + rebuild similarities
bunx convex run embeddings:reembedAll

# stop a runaway embed scan (cancels feeders + drains the pool)
bunx convex run embeddings:haltEmbedding

# one-time: backfill the projects count aggregate (after first deploy / large import)
bunx convex run migrations:runBackfillProjectsAgg
```

Cron (`convex/crons.ts`, **production only** — gated on `NODE_ENV === "production"`):
- **Weekly, Sunday 03:00 UTC** — full sync (ingest + images, change-detected).
  Embedding is enqueued on-demand by the sync when projects change.

### Switching embedding model

Each project row stores its `embedding_model`; the embed scan re-embeds rows whose
model differs. If the new model has a **different output dimension**, set
`EMBEDDINGS_DIM` to match before re-embedding:

```bash
bunx convex env set EMBEDDINGS_MODEL <new/model>
bunx convex env set EMBEDDINGS_DIM <dim>          # if dimension changed
bunx convex run embeddings:reembedAll             # wipe + re-embed + clear similarities
```

## Self-host (Docker Compose)

```bash
cp .env.example .env
# set INSTANCE_SECRET (openssl rand -hex 32), URLs, Postgres + S3 credentials
docker compose up -d --build
# initial deploy of convex code into the self-hosted backend:
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY=<from container logs> \
  bunx convex deploy
# then backfill the count aggregate once:
bunx convex run migrations:runBackfillProjectsAgg
```

Stack: Next.js web (3000), Convex backend (3210/3211), Postgres. Both the backend's
internal storage and the app's images use external S3 (no local object store).

## Layout
- `src/` — Next.js app router.
- `convex/` — schema, queries, actions, cron, components.
- `public/` — static assets.
- `docker-compose.yml` — self-host stack.
