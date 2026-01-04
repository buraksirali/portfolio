/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,ts}', './stories/**/*.{js,ts,astro}'],
	theme: {
		extend: {
			colors: {
				background: 'var(--color-background)',
				surface: 'var(--color-surface)',
				text: 'var(--color-text)',
				muted: 'var(--color-muted)',
				primary: 'var(--color-primary)',
				'primary-strong': 'var(--color-primary-strong)',
				accent: 'var(--color-accent)',
				border: 'var(--color-border)'
			},
			fontFamily: {
				sans: 'var(--font-family)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				'2xl': 'calc(var(--radius) * 1.2)'
			},
			boxShadow: {
				card: '0 10px 40px rgba(0, 0, 0, 0.08)'
			}
		}
	},
	plugins: []
};
