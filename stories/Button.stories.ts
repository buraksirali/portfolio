import type { Meta, StoryObj } from '@storybook/html';

type ButtonArgs = {
	label: string;
	variant: 'primary' | 'ghost';
	href?: string;
};

const render = ({ label, variant, href }: ButtonArgs) => {
	const base =
		'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200';
	const variants: Record<ButtonArgs['variant'], string> = {
		primary: `${base} bg-[color:var(--color-primary)] text-[color:var(--color-background)] hover:bg-[color:var(--color-primary-strong)] shadow-card`,
		ghost: `${base} border border-[color:var(--color-border)] text-[color:var(--color-text)] hover:border-[color:var(--color-primary)]`
	};
	return href
		? `<a class="${variants[variant]}" href="${href}" role="button">${label}</a>`
		: `<button class="${variants[variant]}" type="button">${label}</button>`;
};

const meta: Meta<ButtonArgs> = {
	title: 'UI/Button',
	render,
	args: {
		label: 'Primary action',
		variant: 'primary'
	}
};

export default meta;

type Story = StoryObj<ButtonArgs>;

export const Primary: Story = {};

export const Ghost: Story = {
	args: {
		variant: 'ghost',
		label: 'Secondary'
	}
};
