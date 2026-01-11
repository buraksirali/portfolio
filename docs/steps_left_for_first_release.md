* Auth & Authorization:
- Configure a real OAuth 2.1/OIDC provider with correct ISSUER/CLIENT_ID/SECRET/REDIRECT_URI and enforce an admin allowlist (currently any existing DB user passes). - Decide how you provision admins (pre-seed DB or allowlist emails/claims).

* Session Hardening:
- Use a persistent session store (Redis/Postgres) instead of the default in-memory store; set secure, sameSite, httpOnly, and maxAge on session cookies and trust proxy behind TLS/Load Balancer.

* Database Choice & Migrations:
- Ensure managed Postgres is provisioned with backups and documented seed/init steps.
- Ensure DATABASE_URL connection string is env-driven, with backups and per-environment instances.

* Content Seeding & Admin Data:
- Replace auto-seeding-on-import with explicit seed scripts.
- Add a way to create the first admin user without exposing a public “auto-create” path.

* Build/Deploy Pipeline:
- Define a repeatable build (bun install && bun run build) and a start command (app.ts after build).
- Add CI to lint/check/build. Ignore .astro/ and other generated artifacts in git.

* Security Middleware:
- Add basic security headers (helmet or manual), rate limiting on auth endpoints, and ensure CSRF/session secrets are set from env.

* Error/Health:
- Add a health check endpoint and structured logging (winston is installed but unused).
- Ensure error handling returns safe messages and logs details.

* Static/SSR Assets:
- Confirm dist/ is built and shipped with the server; ensure /public assets are in place.

* Testing:
- Add smoke/integration tests for login, admin POSTs (with CSRF), and a few SSR routes.

* Docs & Env:
- Provide an .env.example with required vars, and a short README section for production setup (OAuth config, DB, session store, build/start commands).
