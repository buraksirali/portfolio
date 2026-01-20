# Database Migrations

This project currently bootstraps tables inside `src/server/db.ts` via `initSchema`. For production, move schema setup to migrations so changes are explicit and repeatable.

## Minimal Migration Flow
1) Create a `migrations/` directory with ordered SQL files (timestamp or numeric prefix).
2) Add a `schema_migrations` table to track applied filenames.
3) Use a small runner script (Bun + `pg`) that:
   - reads migration files in order,
   - runs each pending file inside a transaction,
   - records the filename in `schema_migrations`.
4) Run the migration script before deploy/startup.

## Example: Users Table Migration
```sql
-- migrations/001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The app expects `users(id, email, name)` to exist for admin authorization (`src/server/db.ts`).

## Transition Plan
- Keep `initSchema` only during the migration rollout.
- Once migrations are in place, remove `initSchema` and move seeding into explicit scripts.
