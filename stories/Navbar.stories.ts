import type { Meta, StoryObj } from '@storybook/html';

type NavItem = { label: string; href: string; active?: boolean };
type NavbarArgs = { brand: string; items: NavItem[] };

const render = ({ brand, items }: NavbarArgs) => {
	const itemMarkup = items
		.map(
			(item) =>
				`<a href="${item.href}" class="px-3 py-2 rounded-full ${
					item.active
						? 'bg-[color:var(--color-primary)] text-[color:var(--color-background)]'
						: 'text-[color:var(--color-text)] hover:text-[color:var(--color-primary)]'
				}">${item.label}</a>`
		)
		.join('');
	return `<header class="container py-4 flex items-center justify-between gap-4">
    <a class="font-semibold text-[color:var(--color-text)] text-lg tracking-tight" href="#">${brand}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">${itemMarkup}</nav>
  </header>`;
};

const meta: Meta<NavbarArgs> = {
	title: 'UI/Navbar',
	render,
	args: {
		brand: 'Brand',
		items: [
			{ label: 'Home', href: '#', active: true },
			{ label: 'Projects', href: '#' },
			{ label: 'Contact', href: '#' }
		]
	}
};

export default meta;

type Story = StoryObj<NavbarArgs>;

export const Default: Story = {};
