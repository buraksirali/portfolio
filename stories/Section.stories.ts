import type { Meta, StoryObj } from '@storybook/html';

type SectionArgs = {
	title?: string;
	description?: string;
	eyebrow?: string;
};

const render = ({ title, description, eyebrow }: SectionArgs) => `<section class="container space-y-4">
  ${eyebrow ? `<p class="text-sm uppercase tracking-[0.15em] text-[color:var(--color-muted)]">${eyebrow}</p>` : ''}
  ${title ? `<h2 class="text-3xl md:text-4xl font-semibold text-[color:var(--color-text)]">${title}</h2>` : ''}
  ${description ? `<p class="max-w-3xl text-lg text-[color:var(--color-muted)]">${description}</p>` : ''}
  <div class="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]">Slot content</div>
</section>`;

const meta: Meta<SectionArgs> = {
	title: 'UI/Section',
	render,
	args: {
		title: 'Section title',
		description: 'Supporting copy to frame the content within this section.',
		eyebrow: 'Eyebrow'
	}
};

export default meta;

type Story = StoryObj<SectionArgs>;

export const Default: Story = {};
