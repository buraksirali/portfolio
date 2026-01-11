#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

const main = (): void => {
	const name = process.argv[2];

	if (!name) {
		process.stderr.write('Please provide a component name: bunx tsx scripts/generate-smart-component.ts Hero\n');
		process.exitCode = 1;
		return;
	}

	const componentDir = path.join(process.cwd(), 'src/components/smart');
	const componentPath = path.join(componentDir, `${name}.astro`);

	if (!fs.existsSync(componentDir)) {
		fs.mkdirSync(componentDir, { recursive: true });
	}

	if (fs.existsSync(componentPath)) {
		process.stderr.write(`Component ${name} already exists.\n`);
		process.exitCode = 1;
		return;
	}

	const template = `---
import { createTranslator, type Locale } from '../../i18n';
import Section from '../ui/Section.astro';

export interface Props {
  titleKey?: string;
}

const locale = (Astro.locals.locale ?? 'en') as Locale;
const translator = createTranslator(locale);
const { titleKey = 'pages.title' } = Astro.props;
---

<Section title={translator(titleKey)}>
  <p class="text-[color:var(--color-muted)]">Smart component placeholder for ${name}.</p>
</Section>
`;

	fs.writeFileSync(componentPath, template, 'utf8');
	process.stdout.write(`Created smart component ${componentPath}\n`);
};

main();
