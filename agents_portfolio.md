# agents_portfolio.md

This file defines **branch-specific rules for the `personal-portfolio` branch**.
It **extends `agents_base.md`** and only overrides or adds rules specific to the personal portfolio website.

If a rule here conflicts with `agents_base.md`, this file takes precedence **for this branch only**.

---

## Branch Identity

- **Branch name:** `personal-portfolio`
- **Purpose:** Personal portfolio website for Burak
- **Domain:** https://buraksirali.com
- **Auth provider:** Keycloak (OIDC) hosted at https://auth.buraksirali.com
- **Versioning:** Not versioned. This branch tracks the latest stable template.

This branch represents a **real, user-facing website**, not a reusable template.

---

## High-Level Goals

- Showcase all personal and professional projects.
- Support future **interactive demos** (small, contained, SSR-first).
- Act as a living reference implementation of the template.
- Clearly communicate *why the template exists* and what problems it solves.
- Serve as a credibility signal (architecture, code quality, documentation).

---

## Allowed Changes (Compared to Template)

Codex MAY:
- Add new pages specific to the portfolio:
  - Projects index
  - Project detail pages
  - Component showcase page
  - Tech stack page
  - Marketing / manifesto page explaining the template
- Add portfolio-specific content:
  - Project metadata
  - Descriptions
  - Media
- Adjust configuration values:
  - Branding
  - SEO metadata
  - Theme variables
- Add small, self-contained demo code under projects (SSR-safe).

Codex MUST:
- Reuse existing template infrastructure.
- Prefer configuration and content over new abstractions.
- Keep demos isolated and optional.

---

## Forbidden Changes

Codex MUST NOT:
- Modify core template architecture.
- Add new infrastructure dependencies.
- Introduce frontend frameworks or client-heavy demos.
- Turn the portfolio branch into a “special case” codebase.
- Hard-code text outside i18n / config / DB.

If a missing feature is needed by the portfolio:
- It must be implemented in the **template branch first**,
- then merged into `portfolio`.

---

## Pages Required on This Branch

Codex should ensure the following pages exist and are wired correctly:

1. **Projects**
   - List all projects.
   - Each project has a detail page.
   - Future-proofed for demos and media.

2. **Component Showcase**
   - Lists all UI components provided by the template.
   - Uses the same components as Storybook.
   - Acts as a live reference.

3. **Tech Stack**
   - Displays the stack used by the template and this site.
   - No marketing fluff. Factual, concise.

4. **Template Rationale**
   - Marketing-style page.
   - Explains:
     - why the template exists
     - what problems it solves
     - who it is for

---

## Authentication Rules (Portfolio)

- Authentication uses **Keycloak via OAuth 2.1 + OIDC**.
- Issuer: https://auth.buraksirali.com
- Portfolio users:
  - Public visitors: no auth required
  - Admin (you): full access
- No additional auth roles unless explicitly requested.

---

## SEO & Public-Facing Quality Bar

This branch must prioritize:
- SEO correctness (meta, OpenGraph, canonical URLs).
- Performance (minimal JS, fast SSR).
- Accessibility (basic a11y, contrast-safe themes).
- Content clarity.

This is a **public site**. Quality bar is higher than template.

---

## Testing & Verification (Portfolio)

When Codex makes changes here:
- Verify pages render correctly on buraksirali.com-like config.
- Ensure demos do not break SSR.
- Ensure admin-only functionality is not exposed publicly.
- Ensure no placeholder or template-only content leaks through.

---

## Output Expectations for Codex

When working on this branch, Codex should:
- Treat changes as production-impacting.
- Avoid experimental code.
- Explain changes briefly and clearly.
- Stop once the requested task is complete.

---

## Guiding Principle

This branch should look like:

> “This is how the template is meant to be used in real life.”

Nothing more. Nothing less.
