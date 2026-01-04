import type { Meta, StoryObj } from '@storybook/html';

type Action = { label: string; href: string; variant?: 'primary' | 'ghost' };
type HeroArgs = { title: string; subtitle?: string; eyebrow?: string; actions?: Action[] };

const render = ({ title, subtitle, eyebrow, actions = [] }: HeroArgs) => {
	const actionButtons = actions
		.map((action) => {
			const base =
				'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200';
			const variants: Record<NonNullable<Action['variant']>, string> = {
				primary: `${base} bg-[color:var(--color-primary)] text-[color:var(--color-background)] hover:bg-[color:var(--color-primary-strong)] shadow-card`,
				ghost: `${base} border border-[color:var(--color-border)] text-[color:var(--color-text)] hover:border-[color:var(--color-primary)]`
			};
			const variant = action.variant ?? 'primary';
			return `<a class="${variants[variant]}" href="${action.href}">${action.label}</a>`;
		})
		.join('');
	return `<section class="container py-12 md:py-16 space-y-6">
    <div class="space-y-3 max-w-3xl">
      ${eyebrow ? `<p class="text-sm uppercase tracking-[0.15em] text-[color:var(--color-muted)]">${eyebrow}</p>` : ''}
      <h1 class="text-4xl md:text-5xl font-semibold leading-tight text-[color:var(--color-text)]">${title}</h1>
      ${subtitle ? `<p class="text-lg text-[color:var(--color-muted)]">${subtitle}</p>` : ''}
    </div>
    ${actions.length > 0 ? `<div class="flex flex-wrap gap-3">${actionButtons}</div>` : ''}
  </section>`;
};

const meta: Meta<HeroArgs> = {
	title: 'UI/Hero',
	render,
	args: {
		title: 'Design boldly. Ship fast.',
		subtitle: 'Modular hero that expects text and action props.',
		actions: [
			{ label: 'Primary CTA', href: '#', variant: 'primary' },
			{ label: 'Secondary', href: '#', variant: 'ghost' }
		]
	}
};

export default meta;

type Story = StoryObj<HeroArgs>;

export const Default: Story = {};
