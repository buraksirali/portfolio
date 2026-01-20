This file defines how **Codex** should operate when working in this repository.
It is authoritative. If a prompt conflicts with this file, this file wins.

---

## What This Repository Is

A reusable, white‑label **portfolio website template** built with:

- Astro (SSR)
- Express (server + admin + auth)
- Tailwind CSS
- Bun

It is meant to be versioned as a template and then applied to real sites via branches.

---

## How Codex Must Think

- Assume you are working in an **existing codebase**.
- Prefer **refactor over rewrite**.
- Make the **smallest correct change**.
- Keep behavior identical unless explicitly told otherwise.
- Optimize for clarity and maintainability, not cleverness.

---

## Hard Constraints (Non‑Negotiable)

Codex MUST NOT:

- Introduce React, Vue, Svelte, Angular, Solid, or similar frameworks.
- Introduce a frontend SPA architecture.
- Hard‑code user‑visible text.
- Add dependencies without clear justification.
- Change runtime behavior during refactors unless explicitly requested.

Codex MUST:

- Use Astro for UI.
- Use Express for server logic.
- Use Bun as the package manager.
- Keep all user‑visible text in:
  - i18n dictionaries
  - config
  - database content
- Respect Smart vs Dumb component separation.

---

## Repository Mental Model

```
src/
  app.ts                # Composition root (wires everything)
  server/               # Express setup (middleware, routes, errors)
  pages/                # Astro SSR pages
  components/
    ui/                 # Dumb, presentational components
    smart/              # Data / i18n / theme aware components
  styles/               # Tailwind + CSS variables
  i18n/                 # Translation dictionaries
  config/               # Env + site + theme config
  db/                   # Database access layer

stories/                # Storybook stories (UI only)
scripts/                # Generators and dev utilities
```

---

## Component Rules

### Dumb Components
- Props only.
- No data fetching.
- No global state.
- Must have a Storybook story.
- No business logic.

### Smart Components
- Fetch data.
- Apply i18n and theming.
- Handle auth‑aware behavior.
- Compose dumb components.

Codex must not blur this boundary.

---

## Configuration Rules

- All environment variables must be validated.
- `.env.example` is the source of truth.
- No secrets in code.
- DB and auth must be env‑driven.

---

## Security Rules

Codex must enforce:

- Persistent sessions in production.
- Secure cookie flags:
  - httpOnly
  - secure (prod)
  - sameSite
- CSRF protection for admin routes.
- OAuth **2.1 + OpenID Connect with PKCE** only.
- Never log secrets, tokens, or cookies.

---

## Branching & Versioning Rules

- Template versions are git tags:
  - v1.0.0, v1.1.0, v2.0.0, …
- All infrastructure changes go to the template first.
- Portfolio branches should only modify:
  - config
  - content
  - theme variables

Codex must respect the current branch’s role.

---

## Testing & Verification

When Codex changes code:

- Ensure the app boots.
- Ensure SSR still works.
- Ensure admin still works.
- Ensure no hard‑coded strings were introduced.
- If tests exist, update them.
- If tests do not exist, describe manual verification steps.

---

## Output Expectations

When Codex responds, it should:

- Explain **what changed** and **why**.
- Avoid verbose theory.
- Stop once the requested task is complete.
- Not propose follow‑up work unless asked.

---

## When Unsure

- Document assumptions in comments or commit messages.
- Ask for clarification instead of guessing.
