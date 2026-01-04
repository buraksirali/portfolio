import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().default(4321),
	SESSION_SECRET: z.string().min(8).default('dev-secret-change-me'),
	OAUTH_CLIENT_ID: z.string().min(1).default('demo-client-id'),
	OAUTH_CLIENT_SECRET: z.string().optional(),
	OAUTH_ISSUER: z.string().url().default('https://example-issuer.test'),
	OAUTH_REDIRECT_URI: z.string().url().default('http://localhost:4321/auth/callback'),
	DATABASE_PATH: z.string().default('data/site.db'),
	SITE_URL: z.string().url().default('http://localhost:4321')
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
