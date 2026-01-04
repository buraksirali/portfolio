import express, { type Request, type RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import session from 'express-session';
import csurf from 'csurf';
import * as oauth from 'oauth4webapi';
import type { ParsedQs } from 'qs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appConfig, env } from '../src/config';
import { createTranslator, defaultLocale, supportedLocales, type Locale } from '../src/i18n';
import {
	getOrCreateUser,
	getPages,
	getProjectBySlug,
	getProjects,
	savePage,
	upsertProject
} from '../src/server/db';

type EmptyParams = ParamsDictionary;
type EmptyLocals = Record<string, never>;

type LocaleQuery = ParsedQs & { locale?: string };

type LocaleField<Field extends string> = {
	[K in Locale as `${Field}_${K}`]: string;
};

type ProjectFormBody = {
	slug: string;
	status: 'published' | 'draft';
	tech?: string;
	link?: string;
} & LocaleField<'name'> &
	LocaleField<'description'> &
	LocaleField<'hero'>;

type PageFormBody = {
	slug: string;
	published: '0' | '1';
} & LocaleField<'heading'> &
	LocaleField<'body'>;

const isLocale = (value: string): value is Locale =>
	supportedLocales.some((localeCode: Locale) => localeCode === value);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
	session({
		secret: env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false
	})
);

const csrfProtection = csurf();

type SessionUser = { id: string; email: string; name?: string };

declare module 'express-session' {
	interface SessionData {
		user?: SessionUser;
		oidc?: { codeVerifier: string; state: string; nonce: string };
	}
}

type CallbackQuery = ParsedQs & {
	code?: string;
	state?: string;
	scope?: string;
	error?: string;
	error_description?: string;
};

const requireAuth: RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals> = (
	req,
	res,
	next
): void => {
	if (!req.session.user) {
		res.redirect('/auth/login');
		return;
	}
	next();
};

const withTranslator = (
	req: Request<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals>
): { t: ReturnType<typeof createTranslator>; locale: Locale } => {
	const requestedLocale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
	const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;
	return { t: createTranslator(locale), locale };
};

const buildAdminLayout = (
	title: string,
	body: string,
	t: ReturnType<typeof createTranslator>,
	csrf?: string
): string => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { font-family: system-ui, -apple-system, sans-serif; background: #fffaf3; color: #2b190a; }
    a { color: #c2410c; text-decoration: none; }
    a:hover { text-decoration: underline; }
    input, textarea, select, button { padding: 0.5rem 0.65rem; border-radius: 8px; border: 1px solid #f4d7bb; width: 100%; }
    button { background: #f97316; color: white; border: none; cursor: pointer; }
    button:hover { background: #c2410c; }
    label { display: grid; gap: 0.35rem; font-weight: 600; }
    fieldset { border-radius: 12px; }
  </style>
</head>
<body>
  <header style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-bottom:1px solid #eee;">
    <div style="font-weight:700;">${appConfig.branding.siteName} – ${t('admin.title')}</div>
    <nav style="display:flex;gap:1rem;">
      <a href="/admin/projects">${t('admin.projects')}</a>
      <a href="/admin/pages">${t('admin.pages')}</a>
      <a href="/admin/translations">${t('admin.translations')}</a>
      <form method="post" action="/auth/logout">
        ${csrf ? `<input type="hidden" name="_csrf" value="${csrf}">` : ''}
        <button type="submit" style="background:none;border:1px solid #ddd;padding:0.35rem 0.75rem;color:#c2410c;">${t('admin.logout')}</button>
      </form>
    </nav>
  </header>
  <main style="padding:1.5rem;max-width:960px;margin:0 auto;display:grid;gap:1rem;">${body}</main>
</body>
</html>
`;

const loadIssuer = async (): Promise<oauth.AuthorizationServer> => {
	const wellKnown = new URL('.well-known/openid-configuration', appConfig.auth.issuer);
	const discoveryResponse = await oauth.discoveryRequest(wellKnown);
	return oauth.processDiscoveryResponse(new URL(appConfig.auth.issuer), discoveryResponse);
};

const getClient = (): oauth.Client => ({
	client_id: appConfig.auth.clientId,
	client_secret: appConfig.auth.clientSecret,
	token_endpoint_auth_method: appConfig.auth.clientSecret ? 'client_secret_basic' : 'none'
});

const authLoginHandler: RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals> = async (
	req,
	res
): Promise<void> => {
	const as = await loadIssuer();
	const client = getClient();
	const codeVerifier = oauth.generateRandomCodeVerifier();
	const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
	const state = oauth.generateRandomState();
	const nonce = oauth.generateRandomNonce();
	req.session.oidc = { codeVerifier, state, nonce };

	const authorizationUrl = new URL(as.authorization_endpoint);
	authorizationUrl.searchParams.set('client_id', client.client_id);
	authorizationUrl.searchParams.set('response_type', 'code');
	authorizationUrl.searchParams.set('redirect_uri', appConfig.auth.redirectUri);
	authorizationUrl.searchParams.set('scope', appConfig.auth.scopes.join(' '));
	authorizationUrl.searchParams.set('state', state);
	authorizationUrl.searchParams.set('code_challenge', codeChallenge);
	authorizationUrl.searchParams.set('code_challenge_method', 'S256');
	authorizationUrl.searchParams.set('nonce', nonce);
	res.redirect(authorizationUrl.toString());
};

app.get('/auth/login', authLoginHandler);

const authCallbackHandler: RequestHandler<EmptyParams, void, Record<string, never>, CallbackQuery, EmptyLocals> = async (
	req,
	res
): Promise<void> => {
	const stored = req.session.oidc;
	if (!stored) {
		res.status(400).send('Missing auth session');
		return;
	}
	const as = await loadIssuer();
	const client = getClient();

	const params = oauth.validateAuthResponse(as, client, req.query);
	if (oauth.isOAuth2Error(params)) {
		res.status(400).send(params);
		return;
	}

	if (params.state !== stored.state) {
		res.status(400).send('State mismatch');
		return;
	}

	const tokenResponse = await oauth.authorizationCodeGrantRequest(
		as,
		client,
		params,
		appConfig.auth.redirectUri,
		stored.codeVerifier
	);
	const result = await oauth.processAuthorizationCodeOpenIDResponse(as, client, tokenResponse);
	if (oauth.isOAuth2Error(result)) {
		res.status(400).json(result);
		return;
	}

	const claims = oauth.getValidatedIdTokenClaims(result);
	const email = (claims.email as string) ?? '';
	if (!email) {
		res.status(400).send('Email missing from provider response');
		return;
	}
	const name = (claims.name as string) ?? (claims.preferred_username as string) ?? undefined;
	const user = getOrCreateUser({ email, name });
	req.session.user = { id: user.id, email: user.email, name: user.name };
	res.redirect('/admin/projects');
};

app.get('/auth/callback', authCallbackHandler);

const logoutHandler: RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals> = (req, res): void => {
	req.session.destroy((destroyError: Error | null) => {
		if (destroyError) {
			res.status(500).send('Failed to log out');
			return;
		}
		res.redirect('/');
	});
};

app.post('/auth/logout', csrfProtection, logoutHandler);

const adminRootHandler: RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals> = (
	req,
	res
): void => {
	res.redirect('/admin/projects');
};

app.get('/admin', requireAuth, csrfProtection, adminRootHandler);

const adminProjectsHandler: RequestHandler<EmptyParams, void, Record<string, never>, LocaleQuery, EmptyLocals> = (
	req,
	res
): void => {
	const { t, locale } = withTranslator(req);
	const projects = getProjects(locale);
	const csrfToken = req.csrfToken();
	const form = `
    <h1>${t('admin.projects')}</h1>
    <p>${t('admin.status')}</p>
    <section style="display:grid;gap:1rem;">
      ${projects
				.map(
					(p) => `<article style="border:1px solid #eee;padding:1rem;border-radius:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${p.translation?.name ?? p.slug}</strong>
            <small>${p.status}</small>
          </div>
          <p>${p.translation?.description ?? ''}</p>
        </article>`
				)
				.join('')}
    </section>
    <h2 style="margin-top:2rem;">${t('admin.save')} ${t('admin.projects')}</h2>
    <form method="post" action="/admin/projects" style="display:grid;gap:1rem;">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <label>${t('admin.slug')} <input name="slug" required /></label>
      <label>${t('admin.status')}
        <select name="status">
          <option value="published">${t('admin.published')}</option>
          <option value="draft">${t('admin.draft')}</option>
        </select>
      </label>
      <label>${t('projects.tech')} <input name="tech" /></label>
      <label>${t('projects.link')} <input name="link" /></label>
      ${appConfig.locales.supported
				.map(
					(loc) => `<fieldset style="border:1px solid #eee;padding:1rem;">
          <legend>${t('admin.locale')}: ${loc.toUpperCase()}</legend>
          <label>${t('admin.name')} <input name="name_${loc}" /></label>
          <label>${t('admin.description')} <textarea name="description_${loc}"></textarea></label>
          <label>${t('admin.heroTitle')} <input name="hero_${loc}" /></label>
        </fieldset>`
				)
				.join('')}
      <button type="submit">${t('admin.save')}</button>
    </form>
  `;
	res.send(buildAdminLayout(t('admin.projects'), form, t, csrfToken));
};

app.get('/admin/projects', requireAuth, csrfProtection, adminProjectsHandler);

const adminProjectsPostHandler: RequestHandler<EmptyParams, void, ProjectFormBody, LocaleQuery, EmptyLocals> = (
	req,
	res
): void => {
	const translations = appConfig.locales.supported.map((locale) => ({
		project_id: '',
		locale: locale as Locale,
		name: req.body[`name_${locale}`] ?? '',
		description: req.body[`description_${locale}`] ?? '',
		hero_title: req.body[`hero_${locale}`] ?? ''
	}));
	const id = getProjectBySlug(req.body.slug, translations[0].locale)?.id ?? undefined;
	const projectId = id ?? randomUUID();
	const payload = {
		id: projectId,
		slug: req.body.slug,
		status: req.body.status === 'published' ? 'published' : 'draft',
		tech: req.body.tech,
		link: req.body.link
	};
	upsertProject(
		payload,
		translations.map((tr) => ({ ...tr, project_id: projectId }))
	);
	res.redirect('/admin/projects');
};

app.post('/admin/projects', requireAuth, csrfProtection, adminProjectsPostHandler);

const adminPagesHandler: RequestHandler<EmptyParams, void, Record<string, never>, LocaleQuery, EmptyLocals> = (
	req,
	res
): void => {
	const { t, locale } = withTranslator(req);
	const csrfToken = req.csrfToken();
	const pages = getPages(locale);
	const body = `
    <h1>${t('admin.pages')}</h1>
    <section style="display:grid;gap:1rem;">
      ${pages
				.map(
					(p) => `<article style="border:1px solid #eee;padding:1rem;border-radius:12px;">
          <strong>${p.slug}</strong> – ${p.published ? t('admin.published') : t('admin.draft')}
        </article>`
				)
				.join('')}
    </section>
    <h2 style="margin-top:2rem;">${t('admin.save')} ${t('admin.pages')}</h2>
    <form method="post" action="/admin/pages" style="display:grid;gap:1rem;">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <label>${t('admin.slug')} <input name="slug" required /></label>
      <label>${t('admin.status')}
        <select name="published">
          <option value="1">${t('admin.published')}</option>
          <option value="0">${t('admin.draft')}</option>
        </select>
      </label>
      ${appConfig.locales.supported
				.map(
					(loc) => `<fieldset style="border:1px solid #eee;padding:1rem;">
          <legend>${t('admin.locale')}: ${loc.toUpperCase()}</legend>
          <label>${t('admin.name')} <input name="heading_${loc}" /></label>
          <label>${t('admin.description')} <textarea name="body_${loc}"></textarea></label>
        </fieldset>`
				)
				.join('')}
      <button type="submit">${t('admin.save')}</button>
    </form>
  `;
	res.send(buildAdminLayout(t('admin.pages'), body, t, csrfToken));
};

app.get('/admin/pages', requireAuth, csrfProtection, adminPagesHandler);

const adminPagesPostHandler: RequestHandler<EmptyParams, void, PageFormBody, LocaleQuery, EmptyLocals> = (
	req,
	res
): void => {
	const slug = req.body.slug;
	const published = req.body.published === '1' ? 1 : 0;
	const sections = appConfig.locales.supported.map((loc, index) => ({
		locale: loc as Locale,
		heading: req.body[`heading_${loc}`] ?? '',
		body: req.body[`body_${loc}`] ?? '',
		position: index
	}));
	savePage({ slug, template: 'generic', published }, sections);
	res.redirect('/admin/pages');
};

app.post('/admin/pages', requireAuth, csrfProtection, adminPagesPostHandler);

const adminTranslationsHandler: RequestHandler<EmptyParams, void, Record<string, never>, LocaleQuery, EmptyLocals> = (
	req,
	res
): void => {
	const { t } = withTranslator(req);
	const csrfToken = req.csrfToken();
	const body = `
    <h1>${t('admin.translations')}</h1>
    <p>${t('admin.locale')} ${appConfig.locales.supported.join(', ')}</p>
    <p>${t('admin.translationInfo')}</p>
    <form method="post" action="/auth/logout">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <button type="submit">${t('admin.logout')}</button>
    </form>
  `;
	res.send(buildAdminLayout(t('admin.translations'), body, t, csrfToken));
};

app.get('/admin/translations', requireAuth, csrfProtection, adminTranslationsHandler);

const clientDir = path.join(process.cwd(), 'dist/client');
app.use(express.static(clientDir, { index: false }));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

type AstroEntryModule = {
	handler: RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals>;
};

const loadAstroHandler = async (): Promise<RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals>> => {
	const module = (await import('../dist/server/entry.mjs')) as AstroEntryModule;
	return module.handler;
};

const astroHandler: RequestHandler<EmptyParams, void, Record<string, never>, ParsedQs, EmptyLocals> = async (
	req,
	res,
	next
): Promise<void> => {
	try {
		const handler = await loadAstroHandler();
		await handler(req, res, next);
	} catch (error: Error) {
		process.stderr.write(`SSR handler error: ${error.message}\n`);
		res.status(500).send('SSR handler failed');
	}
};

app.use(astroHandler);

app.listen(env.PORT, () => {
	process.stdout.write(`Server running on http://localhost:${env.PORT}\n`);
});
