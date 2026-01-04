#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

const main = (): void => {
	const name = process.argv[2];

	if (!name) {
		process.stderr.write('Please provide a component name: bunx tsx scripts/generate-dumb-component.ts Button\n');
		process.exitCode = 1;
		return;
	}

	const componentDir = path.join(process.cwd(), 'src/components/ui');
	const storiesDir = path.join(process.cwd(), 'stories');
	const componentPath = path.join(componentDir, `${name}.astro`);
	const storyPath = path.join(storiesDir, `${name}.stories.ts`);

	if (!fs.existsSync(componentDir)) {
		fs.mkdirSync(componentDir, { recursive: true });
	}
	if (!fs.existsSync(storiesDir)) {
		fs.mkdirSync(storiesDir, { recursive: true });
	}

	if (fs.existsSync(componentPath)) {
		process.stderr.write(`Component ${name} already exists.\n`);
		process.exitCode = 1;
		return;
	}

	const componentTemplate = `---
export interface Props {
  title?: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<section class="p-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
  {title && <h3 class="text-xl font-semibold text-[color:var(--color-text)]">{title}</h3>}
  {description && <p class="text-[color:var(--color-muted)]">{description}</p>}
  <slot />
</section>
`;

	const storyTemplate = `import type { Meta, StoryObj } from '@storybook/astro';
import Component from '../src/components/ui/${name}.astro';

const meta: Meta<typeof Component> = {
  title: 'UI/${name}',
  component: Component
};

export default meta;

type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {
    title: '${name} title',
    description: 'Optional description'
  }
};
`;

	fs.writeFileSync(componentPath, componentTemplate, 'utf8');
	fs.writeFileSync(storyPath, storyTemplate, 'utf8');
	process.stdout.write(`Created dumb component and story for ${name}\n`);
};

main();
