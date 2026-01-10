import type { RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { Locale } from '../src/i18n';

export type EmptyParams = ParamsDictionary;
export type EmptyLocals = Record<string, never>;
export type LocaleQuery = ParsedQs & { locale?: string };

export type LocaleField<Field extends string> = {
	[K in Locale as `${Field}_${K}`]: string;
};

export type ProjectFormBody = {
	slug: string;
	status: 'published' | 'draft';
	tech?: string;
	link?: string;
} & LocaleField<'name'> &
	LocaleField<'description'> &
	LocaleField<'hero'>;

export type PageFormBody = {
	slug: string;
	published: '0' | '1';
} & LocaleField<'heading'> &
	LocaleField<'body'>;

export type SessionUser = { id: string; email: string; name?: string };

declare module 'express-session' {
	interface SessionData {
		user?: SessionUser;
		oidc?: { codeVerifier: string; state: string; nonce: string };
	}
}

// Auth guard should accept arbitrary body/query so it can precede POST handlers with typed bodies.
// Auth guard should allow any response body; it does not set its own body today.
export type RequireAuthHandler = RequestHandler<EmptyParams, unknown, unknown, ParsedQs, EmptyLocals>;

export type CallbackQuery = ParsedQs & {
	code?: string;
	state?: string;
	scope?: string;
	error?: string;
	error_description?: string;
};
