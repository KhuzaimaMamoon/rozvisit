# RozVisit — Environment Variables Reference
### Document 26

**Sources:** Documents 00–25, especially the env contract (Doc 10 §8), the secrets rules (Doc 18 §19–20), the DevOps guide (Doc 25 §5–7), and the auth design (Doc 13 §3).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.
**Real secrets are never included.** Development examples in this document use **clearly fake, labeled placeholder values** so a reader can never mistake them for real credentials. The `.env.example` files at the end contain shape only — no values — per Doc 25 §6.

**Note on categories:** the prompt lists several categories (CORS, Socket.IO, Redis) that RozVisit's confirmed design does not use at MVP. Each is honored below with a short section stating why no variable is needed and when it would join.

---

## How to Read This Document

Every variable is specified with the 9 fields from the prompt:

| Field | Meaning |
|---|---|
| **Variable** | Exact name — UPPER_SNAKE_CASE |
| **Service** | Where it is used (server, client, or a specific outside service) |
| **Purpose** | One-sentence job |
| **Required / Optional** | Whether the app refuses to boot without it |
| **Development example** | A **fake, obviously placeholder** value for a developer's local `.env` |
| **Production rule** | Where it comes from in production; who sees it |
| **Sensitivity** | `Public`, `Sensitive`, or `Secret` (see below) |
| **Default behavior** | What happens if it's absent |
| **Validation** | How `config/env.js` checks it (Doc 09 §13, Doc 18 §19) |

**Sensitivity tiers:**

- **Public** — safe to log, safe to appear in error messages, safe to ship to the browser via Vite's `VITE_` prefix.
- **Sensitive** — not a secret, but not to be logged or shown in errors (a database URI without the password portion is Sensitive; with the password it's Secret).
- **Secret** — never in code, comments, PRs, issues, logs, or error messages; rotation-required on any suspected leak (Doc 18 §20, Doc 24 §22).

---

# Part A — Server Variables (`server/.env`)

## A.1 Server Runtime

### `PORT`

| Field | Value |
|---|---|
| Variable | `PORT` |
| Service | Server (Node.js/Express) |
| Purpose | The TCP port the HTTP server listens on |
| Required | Optional |
| Development example | `PORT=5000` |
| Production rule | Set by Render's environment; the app reads it and binds |
| Sensitivity | Public |
| Default behavior | Defaults to `5000` if not set — this is the one variable safe to have a default because it's Public and non-security-relevant |
| Validation | Numeric; 1024–65535; app refuses non-numeric |

### `NODE_ENV`

| Field | Value |
|---|---|
| Variable | `NODE_ENV` |
| Service | Server; changes runtime behavior (error verbosity, log format, security defaults) |
| Purpose | Names the environment: `development`, `test`, or `production` |
| Required | Required |
| Development example | `NODE_ENV=development` |
| Production rule | `production` in Render; `test` in CI |
| Sensitivity | Public |
| Default behavior | The app refuses to boot without it — no silent-default because `production` behavior must be intentional |
| Validation | Must be one of `development` \| `test` \| `production` |

---

## A.2 MongoDB

### `MONGO_URI`

| Field | Value |
|---|---|
| Variable | `MONGO_URI` |
| Service | MongoDB Atlas (Doc 25 §8) |
| Purpose | The full connection string to the database |
| Required | Required |
| Development example | `MONGO_URI=mongodb://localhost:27017/rozvisit_dev` **(local Mongo)** or `mongodb+srv://<fake-dev-user>:<fake-pass>@<fake-cluster>.mongodb.net/rozvisit_dev` |
| Production rule | Copied from Atlas; stored in Render's environment; **the password portion is Secret** |
| Sensitivity | Secret (contains the DB user password) |
| Default behavior | Boot refused — the app cannot function without a database |
| Validation | Non-empty; parseable by `mongoose.connect`; the connection is attempted at boot and boot fails if the DB is unreachable (Doc 09 §11) |

**Redaction note (Doc 25 §5):** connection error messages redact the password portion before logging.

---

## A.3 JWT — Two separate secrets (Doc 13 §3)

### `JWT_ACCESS_SECRET`

| Field | Value |
|---|---|
| Variable | `JWT_ACCESS_SECRET` |
| Service | Server auth layer |
| Purpose | Signs short-lived (15-minute) access tokens |
| Required | Required |
| Development example | `JWT_ACCESS_SECRET=devonly-fake-access-secret-please-replace-min-32-bytes-xxxx` |
| Production rule | Set in Render; ≥32 bytes of random material; rotated on suspected compromise; **must be different from `JWT_REFRESH_SECRET`** — a leaked access secret must not forge refresh tokens |
| Sensitivity | Secret |
| Default behavior | Boot refused |
| Validation | Length ≥32 characters (`config/env.js` refuses shorter — a short secret is a broken secret) |

### `JWT_REFRESH_SECRET`

| Field | Value |
|---|---|
| Variable | `JWT_REFRESH_SECRET` |
| Service | Server auth layer |
| Purpose | Signs 7-day refresh tokens delivered as httpOnly cookies |
| Required | Required |
| Development example | `JWT_REFRESH_SECRET=devonly-fake-refresh-secret-please-replace-min-32-bytes-yyyy` |
| Production rule | Same as `JWT_ACCESS_SECRET`; must be a different value |
| Sensitivity | Secret |
| Default behavior | Boot refused |
| Validation | Length ≥32; refused if equal to `JWT_ACCESS_SECRET` |

---

## A.4 Field Encryption (Doc 18 §22)

### `FIELD_ENCRYPTION_KEY`

| Field | Value |
|---|---|
| Variable | `FIELD_ENCRYPTION_KEY` |
| Service | Server; used only via `utils/crypto.js` |
| Purpose | The AES-256-GCM key material for sensitive-field encryption at rest (care notes, addresses, CNIC, consent recordings) |
| Required | Required |
| Development example | `FIELD_ENCRYPTION_KEY=ZmFrZS1kZXYtb25seS1rZXktcGxlYXNlLXJlcGxhY2UtaW4tcHJvZC0=` **(fake base64; not usable)** |
| Production rule | 32-byte random material, base64-encoded; generated at Atlas/Render setup and copied to Render's environment; never rotated in-place — the key-id rotation pattern (Doc 25 §7, Doc 18 §22) *(Recommendation)* handles rotation without a stop-the-world migration |
| Sensitivity | Secret |
| Default behavior | Boot refused |
| Validation | Decodes to exactly 32 bytes; boot refused otherwise |

---

## A.5 File Storage — Cloudinary (D-05)

### `CLOUDINARY_CLOUD_NAME`

| Field | Value |
|---|---|
| Variable | `CLOUDINARY_CLOUD_NAME` |
| Service | Cloudinary (EXT-001) |
| Purpose | Names the Cloudinary account/tenant |
| Required | Required |
| Development example | `CLOUDINARY_CLOUD_NAME=rozvisit-dev-fake` |
| Production rule | The real cloud name from Cloudinary; set in Render |
| Sensitivity | Sensitive (identifies the tenant; not secret alone) |
| Default behavior | Boot refused |
| Validation | Non-empty string |

### `CLOUDINARY_API_KEY`

| Field | Value |
|---|---|
| Variable | `CLOUDINARY_API_KEY` |
| Service | Cloudinary |
| Purpose | Public API key paired with the secret |
| Required | Required |
| Development example | `CLOUDINARY_API_KEY=000000000000000` **(all-zeros placeholder)** |
| Production rule | From Cloudinary settings; stored in Render |
| Sensitivity | Sensitive |
| Default behavior | Boot refused |
| Validation | Non-empty numeric string |

### `CLOUDINARY_API_SECRET`

| Field | Value |
|---|---|
| Variable | `CLOUDINARY_API_SECRET` |
| Service | Cloudinary |
| Purpose | Signs upload permits and admin API calls (Doc 09 §17) |
| Required | Required |
| Development example | `CLOUDINARY_API_SECRET=devonly-fake-cloudinary-secret-please-replace` |
| Production rule | From Cloudinary settings; stored in Render; **rotate on suspected leak** |
| Sensitivity | Secret |
| Default behavior | Boot refused |
| Validation | Non-empty |

---

## A.6 Push Notifications — Firebase

### `FIREBASE_SERVICE_ACCOUNT_JSON`

| Field | Value |
|---|---|
| Variable | `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Service | Firebase Cloud Messaging (EXT-002) |
| Purpose | The service account credentials that let the backend send push notifications |
| Required | Required at Phase 1 (push is an MVP channel — Doc 19 §2) |
| Development example | `FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"rozvisit-dev-fake","private_key_id":"fake","private_key":"-----BEGIN PRIVATE KEY-----FAKE-----END PRIVATE KEY-----\n","client_email":"fake@example.com"}` |
| Production rule | Downloaded from Firebase console as JSON, minified to one line, stored in Render as a single string |
| Sensitivity | Secret (contains a private key) |
| Default behavior | Boot refused (push is a mandatory MVP channel; if push is genuinely unavailable during pilot setup, a temporary `PUSH_DISABLED=true` flag would be the honest pattern *(Recommendation — not present until needed)*) |
| Validation | Parseable JSON; contains `client_email`, `private_key`, `project_id` |

---

## A.7 Email

### `EMAIL_PROVIDER_API_KEY`

| Field | Value |
|---|---|
| Variable | `EMAIL_PROVIDER_API_KEY` |
| Service | Email provider (EXT-003) — provider chosen at build *(Recommendation)* |
| Purpose | Authenticates the backend to the transactional email service |
| Required | Required |
| Development example | `EMAIL_PROVIDER_API_KEY=devonly-fake-email-provider-key-please-replace` |
| Production rule | From the chosen provider's dashboard; stored in Render |
| Sensitivity | Secret |
| Default behavior | Boot refused; in local development, if left unset, the email channel logs to the console instead of sending (Doc 25 §1) *(Recommendation — the local console fallback is behavior of the email interface implementation, not of env.js, so env.js still requires it in `production` and `test`, but permits absence in `development`)* |
| Validation | Non-empty in `production` and `test`; permitted absent in `development` |

### `EMAIL_FROM_ADDRESS`

| Field | Value |
|---|---|
| Variable | `EMAIL_FROM_ADDRESS` |
| Service | Email provider |
| Purpose | The `From:` address on outgoing mail |
| Required | Required |
| Development example | `EMAIL_FROM_ADDRESS=dev-noreply@example.invalid` **(`.invalid` TLD guarantees non-delivery)** |
| Production rule | `noreply@<rozvisit-domain>` for automated messages; `support@<rozvisit-domain>` reserved for reply-expected mail (Doc 19 §5) |
| Sensitivity | Public |
| Default behavior | Boot refused |
| Validation | Valid email format |

### `APP_BASE_URL`

| Field | Value |
|---|---|
| Variable | `APP_BASE_URL` |
| Service | Server auth layer |
| Purpose | Builds email-verification and password-reset links sent by the email channel |
| Required | Required |
| Development example | `APP_BASE_URL=http://localhost:5173` |
| Production rule | The public RozVisit application origin, set in Render's environment |
| Sensitivity | Public |
| Default behavior | Boot refused — an email link without its application origin is not usable |
| Validation | Must be a valid absolute URL |

### `DEV_LOG_AUTH_LINKS`

| Field | Value |
|---|---|
| Variable | `DEV_LOG_AUTH_LINKS` |
| Service | Server local-development email channel |
| Purpose | Explicitly permits local console output of a single-use verification or reset URL for manual testing. |
| Required | Optional; unset/false by default |
| Development example | `DEV_LOG_AUTH_LINKS=true` only with `NODE_ENV=development` and `APP_BASE_URL=http://localhost:5173` |
| Production rule | **Never set or enable.** |
| Sensitivity | Secret-bearing debug output; the variable is Public but enabling it intentionally permits token URLs in local logs. |
| Default behavior | No verification or reset URL is logged. |
| Validation | Only `true` or `false`; `true` refuses boot unless the environment is `development` and `APP_BASE_URL` uses `localhost`, `127.0.0.1`, or `::1`. |

---

## A.8 Error Tracking — Sentry *(Recommendation)*

### `SENTRY_DSN`

| Field | Value |
|---|---|
| Variable | `SENTRY_DSN` |
| Service | Sentry (Doc 25 §26) |
| Purpose | Routes captured errors to the RozVisit Sentry project |
| Required | Optional at Phase 1; recommended before real users arrive (Doc 18 §37.2) |
| Development example | Leave unset locally — a set DSN would send local errors to production tracking |
| Production rule | From Sentry project settings; stored in Render |
| Sensitivity | Sensitive (identifies the project; not a full secret) |
| Default behavior | Missing → error tracking is a no-op; the app runs, and errors log locally |
| Validation | If set, must be a valid Sentry DSN URL |

---

## A.9 Third-Party Services — Phase 2 (Doc 19 §6, Doc 09 §17)

The following are **reserved shape**. They are not required at MVP; the app boots without them until Phase 2 code paths need them.

### `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

| Field | Value |
|---|---|
| Service | Twilio (EXT-006) |
| Purpose | Send SMS (emergency fan-out, caregiver fallback) |
| Required | Required at Phase 2 |
| Development example | `TWILIO_ACCOUNT_SID=ACfake0000000000000000000000000000`, `TWILIO_AUTH_TOKEN=devonly-fake-twilio-token`, `TWILIO_FROM_NUMBER=+10000000000` |
| Production rule | From Twilio console; stored in Render |
| Sensitivity | Secret (`TWILIO_AUTH_TOKEN`); Sensitive (SID, from number) |
| Default behavior | Missing at MVP: SMS channel unused, no error. Missing at Phase 2 when SMS is expected: boot refused |
| Validation | SID begins with `AC`; token non-empty; from-number in E.164 |

### `WHATSAPP_API_TOKEN`

| Field | Value |
|---|---|
| Service | WhatsApp Business API (EXT-007) |
| Purpose | Send WhatsApp messages (emergency fan-out, updates) |
| Required | Required at Phase 2 |
| Development example | `WHATSAPP_API_TOKEN=devonly-fake-whatsapp-token` |
| Production rule | From Meta's WhatsApp Business setup |
| Sensitivity | Secret |
| Default behavior | Same pattern as Twilio |
| Validation | Non-empty |

---

## A.10 CORS

**No environment variable at MVP.** The API is served from the same origin as the portals (Doc 18 §14), so no CORS configuration is needed and none is read from the environment.

**Phase 2 posture, if a separate static host is introduced** *(Recommendation — added if that day comes)*:

```
CORS_ALLOWED_ORIGINS=https://app.rozvisit.com,https://staging.rozvisit.com
```

- **Sensitivity:** Public.
- **Validation:** comma-separated list of `https://`-prefixed origins; `*` is refused (Doc 18 §14).
- **Default:** empty → same-origin only.

---

## A.11 Socket.IO

**No environment variable required.** Socket.IO joins the same Node process at Phase 2 (Doc 09 §12) and reuses the JWT secrets already set (Section A.3). The one variable that would appear if we ever needed cross-instance sockets is the Redis URL (Section A.12).

---

## A.12 Redis Roadmap — Growth Stage

**No environment variable at MVP.** Redis is not deployed (Doc 21 §10). When Growth-stage triggers add it:

### `REDIS_URL`

| Field | Value |
|---|---|
| Service | Redis (rate limits, Socket.IO adapter, hot data) |
| Purpose | Connection URL for the Redis instance |
| Required | Required at Growth stage; not before |
| Development example | `REDIS_URL=redis://localhost:6379` **(local Redis)** |
| Production rule | From the Redis provider (Render Redis, Upstash, or equivalent); stored in Render |
| Sensitivity | Secret (may contain a password portion) |
| Default behavior | Missing → the in-memory implementations remain active (per Doc 21 §15) |
| Validation | Parseable Redis URL; connection tested at boot when set |

---

## A.13 Log Level *(Recommendation — small operational lever)*

### `LOG_LEVEL`

| Field | Value |
|---|---|
| Variable | `LOG_LEVEL` |
| Service | Server logger (Doc 20 §15) |
| Purpose | Sets the minimum level emitted: `error`, `warn`, `info`, `debug` |
| Required | Optional |
| Development example | `LOG_LEVEL=debug` |
| Production rule | `info` in production; `warn` during a quiet-noise investigation |
| Sensitivity | Public |
| Default behavior | Defaults to `info` in production, `debug` in development |
| Validation | One of the four levels |

---

# Part B — Client Variables (`client/.env`)

Vite exposes only variables prefixed with `VITE_` to the browser. Everything the client receives is Public by definition — anyone can read it in the shipped bundle.

## B.1 API Base URL

### `VITE_API_BASE_URL`

| Field | Value |
|---|---|
| Variable | `VITE_API_BASE_URL` |
| Service | Client (Vite build) |
| Purpose | The base path for API calls made from the portals |
| Required | Optional (has a sensible default at MVP) |
| Development example | `VITE_API_BASE_URL=http://localhost:5000/api` |
| Production rule | `/api` — the same-origin default at MVP (Doc 09 §8, Doc 18 §14); an absolute URL if a separate host is ever introduced |
| Sensitivity | Public |
| Default behavior | Defaults to `/api` if unset |
| Validation | Absolute URL or a path beginning with `/` |

## B.2 Optional Client Toggles *(Recommendation — reserved shape)*

None used at MVP. Client feature flags, if ever needed, would live here as `VITE_FEATURE_<name>=true|false`. Public sensitivity in every case — a client feature flag is never a secret.

---

# Part C — The Safe `.env.example` Files

These are the files that live in the repository. They contain **shape only** — no values, no examples, no defaults — per Doc 25 §6. A developer copies them to `.env` and fills in real (or, locally, fake) values.

## C.1 `server/.env.example`

```
# ─────────────────────────────────────────────────
# RozVisit — Server environment (shape only)
# Copy to server/.env and fill in values.
# NEVER commit server/.env.
# ─────────────────────────────────────────────────

# Runtime
PORT=
NODE_ENV=

# Database (MongoDB Atlas connection string; password portion is Secret)
MONGO_URI=

# Auth — two separate secrets, ≥32 bytes each, DIFFERENT values
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Field encryption (32-byte random material, base64)
FIELD_ENCRYPTION_KEY=

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Push notifications (Firebase service account JSON, single-line)
FIREBASE_SERVICE_ACCOUNT_JSON=

# Email (provider chosen at build)
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=

# Error tracking (optional at MVP)
SENTRY_DSN=

# Logging (optional)
LOG_LEVEL=
# Development only; logs single-use auth URLs. NEVER enable outside localhost development.
DEV_LOG_AUTH_LINKS=

# ── Phase 2 additions (not required at MVP) ──────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
WHATSAPP_API_TOKEN=

# ── Growth stage (not required until then) ───────
REDIS_URL=
```

## C.2 `client/.env.example`

```
# ─────────────────────────────────────────────────
# RozVisit — Client environment (shape only)
# Only VITE_ variables reach the browser.
# Everything here is Public by definition.
# ─────────────────────────────────────────────────

# API base URL — defaults to /api (same-origin) if unset
VITE_API_BASE_URL=
```

---

# Part D — Cross-Cutting Rules

## D.1 Boot-time verification (repeated for emphasis — Doc 25 §5.3)

`config/env.js`:
1. Loads `.env` (dotenv or equivalent).
2. Validates every required variable per this document's Validation column.
3. **Refuses to boot** — with a loud, honest error message — if any required variable is missing or fails validation.
4. Freezes the exported config object so no later code mutates it.

**A missing-secret deploy therefore fails at Render's build/health-check step, not quietly at the first user login.** This is a security property, not just a convenience (Doc 18 §19).

## D.2 What Never Happens

- No env var is read outside `config/env.js` (Doc 23 §4).
- No env var's value appears in a log line (Doc 20 §15, Doc 18 §23) — the logger's redactor knows secret variable names.
- No env var's value appears in an error message to a user (ERR-003).
- No env var value is ever committed — the pre-commit hook (Doc 23 §30) plus a secret-scanning check *(Recommendation — GitHub secret scanning is on by default for private repos)* catch this.
- No env var carries a "sensible default" secret in `.env.example` (Doc 25 §6).

## D.3 If a Secret Leaks (Doc 24 §22 restated)

The order is fixed:

1. **Rotate the secret immediately** (not "remove from git first" — the secret has already been leaked; the git commit is a symptom, not the disease).
2. Update Render's environment with the new value.
3. Update every developer who needs the new value out-of-band.
4. If credentials are affected: use the "revoke everything + force reset" lever (Doc 13 §27).
5. Remove from git history (secondary step).
6. Document the incident in `docs/incidents/`.

---

# Part E — Full Variable Summary

| Variable | Category | Required at MVP? | Sensitivity |
|---|---|---|---|
| `PORT` | Server runtime | Optional | Public |
| `NODE_ENV` | Server runtime | Required | Public |
| `MONGO_URI` | MongoDB | Required | Secret |
| `JWT_ACCESS_SECRET` | JWT | Required | Secret |
| `JWT_REFRESH_SECRET` | JWT | Required | Secret |
| `FIELD_ENCRYPTION_KEY` | Encryption | Required | Secret |
| `CLOUDINARY_CLOUD_NAME` | File storage | Required | Sensitive |
| `CLOUDINARY_API_KEY` | File storage | Required | Sensitive |
| `CLOUDINARY_API_SECRET` | File storage | Required | Secret |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Push | Required | Secret |
| `EMAIL_PROVIDER_API_KEY` | Email | Required (prod/test) | Secret |
| `EMAIL_FROM_ADDRESS` | Email | Required | Public |
| `SENTRY_DSN` | Monitoring | Optional | Sensitive |
| `LOG_LEVEL` | Server runtime | Optional | Public |
| `DEV_LOG_AUTH_LINKS` | Local auth testing | Optional | Public (enables secret-bearing local logs) |
| `TWILIO_ACCOUNT_SID` | Third-party (Phase 2) | Phase 2 | Sensitive |
| `TWILIO_AUTH_TOKEN` | Third-party (Phase 2) | Phase 2 | Secret |
| `TWILIO_FROM_NUMBER` | Third-party (Phase 2) | Phase 2 | Sensitive |
| `WHATSAPP_API_TOKEN` | Third-party (Phase 2) | Phase 2 | Secret |
| `CORS_ALLOWED_ORIGINS` | CORS | Not at MVP | Public |
| `REDIS_URL` | Redis (Growth) | Not at MVP | Secret |
| `VITE_API_BASE_URL` | Client | Optional | Public |

---

*End of Document 26 — RozVisit Environment Variables Reference*
