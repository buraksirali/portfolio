import { z } from 'zod';
import { env } from './env';
import { defaultTheme, themeSchema } from './theme';

const brandingSchema = z.object({
	siteName: z.string(),
	tagline: z.string(),
	logoAlt: z.string(),
	contactEmail: z.string().email(),
	contactPhone: z.string()
});

const seoSchema = z.object({
	defaultTitle: z.string(),
	defaultDescription: z.string(),
	twitterHandle: z.string(),
	canonicalHost: z.string().url()
});

const localeSchema = z.object({
	defaultLocale: z.string(),
	supported: z.array(z.string().min(2)),
	dateFormat: z.string()
});

const appConfigSchema = z.object({
	branding: brandingSchema,
	seo: seoSchema,
	locales: localeSchema,
	theme: themeSchema,
	auth: z.object({
		issuer: z.string().url(),
		clientId: z.string(),
		clientSecret: z.string().optional(),
		redirectUri: z.string().url(),
		scopes: z.array(z.string())
	}),
	database: z.object({
		path: z.string()
	})
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const appConfig: AppConfig = appConfigSchema.parse({
	branding: {
		siteName: 'Orange Spark',
		tagline: 'Modular portfolio platform',
		logoAlt: 'Orange Spark logo',
		contactEmail: 'owner@example.com',
		contactPhone: '+90 000 000 00 00'
	},
	seo: {
		defaultTitle: 'Orange Spark Portfolio',
		defaultDescription: 'A configurable, white-label portfolio built with Astro and Express.',
		twitterHandle: '@orangespark',
		canonicalHost: env.SITE_URL
	},
	locales: {
		defaultLocale: 'en',
		supported: ['en', 'tr', 'de'],
		dateFormat: 'PP'
	},
	theme: defaultTheme,
	auth: {
		issuer: env.OAUTH_ISSUER,
		clientId: env.OAUTH_CLIENT_ID,
		clientSecret: env.OAUTH_CLIENT_SECRET,
		redirectUri: env.OAUTH_REDIRECT_URI,
		scopes: ['openid', 'profile', 'email']
	},
	database: {
		path: env.DATABASE_PATH
	}
});
