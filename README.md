# Personal Website Platform

Astro + Express, SSR-first portfolio platform with theming, i18n, and an OAuth-protected admin surface. All visible text is sourced from translations, config, or the SQLite content layer.

## Commands
- `bun install` (or npm/pnpm) to install deps
- `bun run dev` — Astro dev server
- `bun run build` — Astro SSR build
- `bun run preview` — Preview build
- `bun run storybook` — Component stories
- `bun run generate:dumb Name` / `bun run generate:smart Name` — component scaffolds
- `bun run server/app.ts` (via `bunx tsx` or `node`) after `astro build` to serve SSR through Express

## Configuration
- Central config: `src/config/app-config.ts` (branding, SEO defaults, theme tokens, OAuth endpoints, locales, DB path).
- Env validation: `src/config/env.ts` (SESSION_SECRET, OAUTH_* values, DATABASE_PATH, SITE_URL, PORT).
- Theme: CSS variables + Tailwind powered by the orange palette in `src/config/theme.ts`. Runtime variables are injected in `BaseLayout`.
- Translations: JSON files under `src/i18n/locales`. Add/remove languages by duplicating a locale file and registering the code in `app-config.ts`.

## Components
- Dumb UI: `src/components/ui` (props only, no data). Every component has a Storybook story in `stories/`.
- Smart: `src/components/smart` (translations, data loading, auth/theme). Compose dumb components.
- Architecture guide: `src/components/README.md`.
- Generators: `bunx tsx scripts/generate-dumb-component.ts Name` and `bunx tsx scripts/generate-smart-component.ts Name`.

## Content & Pages
- SQLite schema lives in `src/server/db.ts` (users, projects, translations, pages, sections, settings). Seed data is inserted on first run.
- Locale-aware routes: `/[lang]/` for home, projects, project detail, pages, about, and contact.
- Generic pages render from DB sections via `GenericPageSections`.
- Theme toggle persists to a cookie via `/api/theme`; locale switching is path-based.

## Admin Panel
- Express + server-rendered forms under `/admin` (projects, pages, translations info).
- Protected by OAuth 2.1 + OIDC with PKCE (`/auth/login`, `/auth/callback`, `/auth/logout`), session-based, user auto-created on first login.
- CSRF protection on all POST routes via `csrf-csrf`.

## Deployment
1) Set env vars (`SESSION_SECRET`, `OAUTH_ISSUER`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`, `SITE_URL`, `DATABASE_PATH`, `PORT`).
2) `bun install && bun run build`.
3) Serve with `node server/app.ts` (or compile to JS first) so Express wraps the Astro SSR handler from `dist/server/entry.mjs`.

## Customization
- Branding/content: `src/config/app-config.ts` plus DB entries for projects/pages.
- Theme: adjust palette/tokens in `src/config/theme.ts` or override values in `app-config.ts`.
- Adding languages: create `src/i18n/locales/<code>.json`, add the code to `app-config.ts`, and seed translations in the DB.
- SEO: defaults in config; sitemap and robots generated from live routes.
