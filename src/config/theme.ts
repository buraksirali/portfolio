import { z } from 'zod';

export const palette = {
	50: '#fff7ed',
	100: '#ffedd5',
	200: '#fed7aa',
	300: '#fdba74',
	400: '#fb923c',
	500: '#f97316',
	600: '#ea580c',
	700: '#c2410c',
	800: '#9a3412',
	900: '#7c2d12'
};

const themeModeSchema = z.object({
	background: z.string(),
	surface: z.string(),
	text: z.string(),
	muted: z.string(),
	primary: z.string(),
	primaryStrong: z.string(),
	accent: z.string(),
	border: z.string()
});

export const themeSchema = z.object({
	radius: z.string(),
	fontFamily: z.string(),
	light: themeModeSchema,
	dark: themeModeSchema
});

export const defaultTheme = themeSchema.parse({
	radius: '12px',
	fontFamily: '"Sora", "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
	light: {
		background: '#fffbf7',
		surface: '#fff7ed',
		text: '#1f1300',
		muted: '#7c2d12',
		primary: palette[500],
		primaryStrong: palette[700],
		accent: palette[400],
		border: '#f4d7bb'
	},
	dark: {
		background: '#1a0f07',
		surface: '#241207',
		text: '#fff7ed',
		muted: '#fed7aa',
		primary: palette[400],
		primaryStrong: palette[600],
		accent: palette[300],
		border: '#3d2412'
	}
});

export type ThemeConfig = z.infer<typeof themeSchema>;
