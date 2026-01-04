import type { Meta, StoryObj } from '@storybook/html';

type FooterArgs = { text: string };

const render = ({ text }: FooterArgs) =>
	`<footer class="container py-8 mt-12 border-t border-[color:var(--color-border)] text-sm text-[color:var(--color-muted)]">${text}</footer>`;

const meta: Meta<FooterArgs> = {
	title: 'UI/Footer',
	render,
	args: {
		text: 'Built for creators who value speed, ownership, and warmth.'
	}
};

export default meta;

type Story = StoryObj<FooterArgs>;

export const Default: Story = {};
