## Smart vs Dumb components

- **Dumb (UI) components** live in `src/components/ui`. They are purely presentational, accept props only, and cannot fetch data, read global state, or import server utilities. Every dumb component must ship with a matching Storybook story inside `stories/`.
- **Smart components** live in `src/components/smart`. They compose dumb components and are allowed to read translations, config, theme, auth, or data loaders. They must not include brand- or site-specific copy; pull that from translations, config, or the database.

### When to use which
- Start with a dumb component whenever UI markup/styling is reusable.
- Promote to a smart component when you need to load data (DB/API), bind translations, read theme/user state, or orchestrate multiple dumb components together.
- Pages should be very thin, delegating to smart components that, in turn, render dumb components.

### Generators
- `bunx tsx scripts/generate-dumb-component.ts <Name>` creates `src/components/ui/<Name>.astro` plus `stories/<Name>.stories.ts`.
- `bunx tsx scripts/generate-smart-component.ts <Name>` creates `src/components/smart/<Name>.astro`.
- Templates stay minimal on purpose; adjust props to remain presentational for dumb components and push logic into smart components.
