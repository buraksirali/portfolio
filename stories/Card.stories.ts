import type { Meta, StoryObj } from '@storybook/html';

type CardArgs = {
	title: string;
	description?: string;
	eyebrow?: string;
	tags?: string[];
	href?: string;
	linkLabel?: string;
};

const render = ({ title, description, eyebrow, tags = [], href, linkLabel }: CardArgs) => {
	const tagList = tags
		.map(
			(tag) =>
				`<span class="text-xs px-3 py-1 rounded-full bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary-strong)] border border-[color:var(--color-border)]">${tag}</span>`
		)
		.join('');
	const link = href
		? `<a class="inline-flex items-center gap-2 font-semibold text-[color:var(--color-primary)]" href="${href}">${linkLabel ?? 'View'}<span aria-hidden="true">→</span></a>`
		: '';
	return `<article class="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-4 shadow-card">
    ${eyebrow ? `<p class="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">${eyebrow}</p>` : ''}
    <h3 class="text-xl font-semibold text-[color:var(--color-text)]">${title}</h3>
    ${description ? `<p class="text-[color:var(--color-muted)]">${description}</p>` : ''}
    ${tags.length > 0 ? `<div class="flex flex-wrap gap-2">${tagList}</div>` : ''}
    ${link}
  </article>`;
};

const meta: Meta<CardArgs> = {
	title: 'UI/Card',
	render,
	args: {
		title: 'Case Study',
		description: 'A concise description of the work delivered for the client.',
		eyebrow: 'Published',
		tags: ['Astro', 'Express'],
		linkLabel: 'View'
	}
};

export default meta;

type Story = StoryObj<CardArgs>;

export const Default: Story = {};
