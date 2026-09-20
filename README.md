# Couples Platform

Production-oriented Telegram Bot + Telegram Mini App foundation for a private couples ecosystem.

## Architecture

- `apps/bot` — grammY Telegram bot.
- `apps/api` — Fastify API with Telegram Mini App authentication, request context, authorization foundation, health checks and security middleware.
- `apps/web` — React/Vite user Mini App.
- `apps/admin` — React/Vite admin application scaffold.
- `packages/database` — Prisma schema and centralized Prisma client.
- `packages/shared` — shared Zod schemas and DTO contracts.
- `packages/config` — validated centralized environment configuration.

## Phase 2 backend foundation

The API now follows:

```text
Telegram Mini App / Bot
        ↓
validated Telegram identity
        ↓
authenticated User
        ↓
active CoupleMember
        ↓
active Couple
        ↓
couple-scoped service/repository access
        ↓
Prisma
        ↓
PostgreSQL
```

Implemented foundations:

- Cryptographic Telegram Mini App `initData` validation.
- Configurable `auth_date` freshness.
- Trusted Telegram identity → database User resolution.
- Centralized authenticated request context.
- Active couple membership resolution.
- Reusable couple-isolation assertion.
- Consistent success/error response envelopes.
- Zod request validation and centralized validation errors.
- Structured Fastify logging with sensitive-header redaction.
- Request IDs and `X-Request-ID`.
- CORS restricted to configured Web App origin, with localhost development support.
- Security headers and request body limits.
- Application-level rate limiting foundation.
- `GET /health`.
- `GET /health/ready` with database connectivity check.
- BigInt-safe Telegram ID handling at API boundaries.
- Singleton/application-scoped Prisma access and graceful disconnect.
- Focused tests for Telegram authentication and couple isolation/context.

## API authentication

Protected API requests must send:

```text
X-Telegram-Init-Data: <Telegram Web App initData>
```

The backend never trusts separately supplied Telegram user IDs or couple IDs.

`GET /v1/me` resolves the authenticated Telegram user without requiring an active couple.

Couple-owned endpoints resolve the active couple server-side and scope database queries by that authenticated couple.

## Environment

Copy `.env.example` to `.env` and fill in the real secrets locally. Never commit `.env`.

Required values include:

```env
DATABASE_URL=
BOT_TOKEN=
WEB_APP_URL=
API_PORT=3001
API_URL=http://localhost:3001
ADMIN_TELEGRAM_IDS=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
NODE_ENV=development
```

## Commands

```bash
pnpm install
pnpm db:generate
pnpm build
pnpm typecheck
pnpm test
pnpm dev
```

`pnpm db:migrate` remains available for intentional schema migrations. The Phase 2 implementation does not reset PostgreSQL, delete migration history, or modify the Prisma schema.

## Scope

Phase 2 intentionally does not add new Couple creation/invitation UX, Memories, Reading features, Letters, Dates, Games, Notifications, Admin authentication/dashboard, payments, or complex gamification.


## Phase 3 — real couple MVP

The Phase 3 implementation keeps the Phase 2 authentication/security architecture and adds the real couple journey:

- Telegram `/start` safely bootstraps/updates the PostgreSQL User and shows the configured Mini App button.
- `CoupleService` owns create, current-couple, member, invite, accept and leave business rules.
- Couples are strictly limited to two active members.
- Invite tokens are cryptographically random, stored only as SHA-256 hashes, and expire after 24 hours.
- Invite acceptance and membership creation run in a serializable PostgreSQL transaction.
- The Mini App uses Telegram's real `initData` through `X-Telegram-Init-Data`; there are no mock users.
- Home, no-couple, create-couple, invite and join flows are functional.
- Existing Memories/Reading scaffold routes remain protected by the existing active-couple context.
- No Prisma schema or migration was added because the existing `User`, `Couple`, `CoupleMember` and `CoupleInvite` models already support this phase.

### Phase 3 API

All application routes use the existing `/v1` convention:

```text
GET  /health
GET  /health/ready

POST /v1/auth/telegram
GET  /v1/me

GET  /v1/couple
POST /v1/couple
POST /v1/couple/leave
GET  /v1/couple/members

POST /v1/couple/invite
GET  /v1/couple/invite/:code
POST /v1/couple/invite/:code/accept
```

### Run

```bash
cp .env.example .env
# Set DATABASE_URL, BOT_TOKEN and WEB_APP_URL

pnpm install
pnpm db:generate

# API
pnpm --filter @couples/api dev

# Bot (separate terminal)
pnpm --filter @couples/bot dev

# Mini App (separate terminal)
pnpm --filter @couples/web dev
```

For a real Telegram test, `WEB_APP_URL` must be the HTTPS Mini App URL configured for the bot. The Mini App will reject direct browser access without Telegram `initData`, by design.

### Verification note

The source was statically inspected and the Phase 3 implementation was completed in the provided repository. Dependency installation/build/test execution could not be performed in this environment because the package registry was unavailable, so no build/test result is claimed here.

## Phase 3 hardening / Telegram integration

The current source also includes the end-to-end Telegram MVP wiring:

- Telegram's official Web App SDK is loaded by the Mini App.
- The frontend reads the real `Telegram.WebApp.initData` and sends it on every API request as `X-Telegram-Init-Data`.
- The backend cryptographically validates `initData` before resolving the PostgreSQL User.
- Telegram `start_param` and `?invite=` are supported for invite entry.
- `/start invite_<code>` opens the Mini App directly into the invitation flow.
- The bot exposes `/start` and `/help`, registers bot commands, and configures the Telegram chat menu button.
- Invite creation returns a Telegram deep link when `BOT_USERNAME` is configured.
- Blocked/deleted database users are denied API access.
- Invite codes are restricted to the generated URL-safe token format.
- Vite accepts changing `*.trycloudflare.com` development hosts instead of one hard-coded tunnel hostname.

### Required Telegram configuration

Set these values in the local `.env`:

```env
BOT_TOKEN="<your-bot-token>"
BOT_USERNAME="<your-bot-username-without-@>"
WEB_APP_URL="https://<your-https-mini-app-url>"
API_URL="http://localhost:3001"
```

`WEB_APP_URL` must be the exact HTTPS URL served by the Mini App when testing inside Telegram. `BOT_USERNAME` is used only to create shareable Telegram invite links.

### Local development

Start PostgreSQL first, then run the API, bot and Mini App in separate terminals:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate

pnpm --filter @couples/api dev
pnpm --filter @couples/bot dev
pnpm --filter @couples/web dev
```

For Telegram testing, expose the Mini App over HTTPS and set `WEB_APP_URL` to that public URL. The API can remain on `localhost:3001` only if the browser environment can reach it; for a real Telegram device, the API also needs a public HTTPS URL and `VITE_API_URL` should point to it.

### Current product boundary

The couple onboarding flow is now a real vertical slice: Telegram user -> verified initData -> database user -> create couple / invitation -> partner joins -> couple context. Memories and Reading still have scaffold endpoints and should be implemented as separate feature phases rather than mixing their persistence logic into authentication.
