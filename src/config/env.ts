import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const loadPortfolioEnv = (): void => {
	const envPath = path.resolve(process.cwd(), 'portfolio.env');
	if (!fs.existsSync(envPath)) {
		return;
	}
	const contents = fs.readFileSync(envPath, 'utf8');
	for (const line of contents.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#')) {
			continue;
		}
		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}
		const key = trimmed.slice(0, separatorIndex).trim();
		let value = trimmed.slice(separatorIndex + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		process.env[key] ??= value;
	}
};

loadPortfolioEnv();

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().default(4321),
	SESSION_SECRET: z.string().min(8).default('dev-secret-change-me'),
	SESSION_MAX_AGE_DAYS: z.coerce.number().default(7),
	OAUTH_CLIENT_ID: z.string().min(1).default('demo-client-id'),
	OAUTH_CLIENT_SECRET: z.string().optional(),
	OAUTH_ISSUER: z.string().url().default('https://example-issuer.test'),
	OAUTH_REDIRECT_URI: z.string().url().default('http://localhost:4321/auth/callback'),
	DATABASE_URL: z.string().url().default('postgres://postgres:postgres@localhost:5432/personal_website'),
	SITE_URL: z.string().url().default('http://localhost:4321')
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
