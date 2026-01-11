import type express from 'express';
import { randomUUID } from 'node:crypto';
import { appConfig } from '../../src/config';
import { createTranslator, defaultLocale, supportedLocales, type Locale } from '../../src/i18n';
import { getPages, getProjectBySlug, getProjects, savePage, upsertProject, type Project } from '../../src/server/db';
import type {
	EmptyLocals,
	EmptyParams,
	LocaleQuery,
	PageFormBody,
	ProjectFormBody
} from '../types';
import type { RouteDependencies } from './types';

const withTranslator = (
	req: express.Request<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals>
): { translator: ReturnType<typeof createTranslator>; locale: Locale } => {
	const requestedLocale = typeof req.query.locale === 'string' ? req.query.locale : null;
	const locale = requestedLocale && supportedLocales.includes(requestedLocale as Locale) ? (requestedLocale as Locale) : defaultLocale;
	return { translator: createTranslator(locale), locale };
};

const buildAdminLayout = (
	title: string,
	body: string,
	translator: ReturnType<typeof createTranslator>,
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
    <div style="font-weight:700;">${appConfig.branding.siteName} – ${translator('admin.title')}</div>
    <nav style="display:flex;gap:1rem;">
      <a href="/admin/projects">${translator('admin.projects')}</a>
      <a href="/admin/pages">${translator('admin.pages')}</a>
      <a href="/admin/translations">${translator('admin.translations')}</a>
      <form method="post" action="/auth/logout">
        ${csrf ? `<input type="hidden" name="_csrf" value="${csrf}">` : ''}
        <button type="submit" style="background:none;border:1px solid #ddd;padding:0.35rem 0.75rem;color:#c2410c;">${translator('admin.logout')}</button>
      </form>
    </nav>
  </header>
  <main style="padding:1.5rem;max-width:960px;margin:0 auto;display:grid;gap:1rem;">${body}</main>
</body>
</html>
`;

// Admin routes (projects/pages/translations) and auth guard.
export const registerAdminRoutes = (app: express.Express, deps: RouteDependencies) => {
	const adminRootHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		_,
		res
	): void => {
		res.redirect('/admin/projects');
	};

	app.get('/admin', deps.requireAuth, adminRootHandler);

	const adminProjectsHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		const { translator, locale } = withTranslator(req);
		const projects = getProjects(locale);
		const csrfToken = deps.generateCsrfToken(req, res);
		const form = `
    <h1>${translator('admin.projects')}</h1>
    <p>${translator('admin.status')}</p>
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
    <h2 style="margin-top:2rem;">${translator('admin.save')} ${translator('admin.projects')}</h2>
    <form method="post" action="/admin/projects" style="display:grid;gap:1rem;">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <label>${translator('admin.slug')} <input name="slug" required /></label>
      <label>${translator('admin.status')}
        <select name="status">
          <option value="published">${translator('admin.published')}</option>
          <option value="draft">${translator('admin.draft')}</option>
        </select>
      </label>
      <label>${translator('projects.tech')} <input name="tech" /></label>
      <label>${translator('projects.link')} <input name="link" /></label>
      ${appConfig.locales.supported
				.map(
					(loc) => `<fieldset style="border:1px solid #eee;padding:1rem;">
          <legend>${translator('admin.locale')}: ${loc.toUpperCase()}</legend>
          <label>${translator('admin.name')} <input name="name_${loc}" /></label>
          <label>${translator('admin.description')} <textarea name="description_${loc}"></textarea></label>
          <label>${translator('admin.heroTitle')} <input name="hero_${loc}" /></label>
        </fieldset>`
				)
				.join('')}
      <button type="submit">${translator('admin.save')}</button>
    </form>
  `;
		res.send(buildAdminLayout(translator('admin.projects'), form, translator, csrfToken));
	};

	app.get('/admin/projects', deps.requireAuth, adminProjectsHandler);

	const adminProjectsPostHandler: express.RequestHandler<EmptyParams, string, ProjectFormBody, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
	const translations = appConfig.locales.supported.map((locale) => {
		const nameKey = `name_${locale}` as keyof ProjectFormBody;
		const descriptionKey = `description_${locale}` as keyof ProjectFormBody;
		const heroKey = `hero_${locale}` as keyof ProjectFormBody;
		return {
			project_id: '',
			locale: locale as Locale,
			name: req.body[nameKey] ?? '',
			description: req.body[descriptionKey] ?? '',
			hero_title: req.body[heroKey] ?? ''
		};
	});
		const existingId = getProjectBySlug(req.body.slug, translations[0]?.locale ?? defaultLocale)?.id ?? null;
		const projectId = existingId ?? randomUUID();
		const payload: Project = {
			id: projectId,
			slug: req.body.slug,
			status: req.body.status === 'published'
				? 'published'
				: 'draft',
			tech: req.body.tech,
			link: req.body.link
		};
		upsertProject(
			payload,
			translations.map((tr) => ({ ...tr, project_id: projectId }))
		);
		res.redirect('/admin/projects');
	};

	app.post('/admin/projects', deps.requireAuth, deps.doubleCsrfProtection, adminProjectsPostHandler);

	const adminPagesHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		const { translator, locale } = withTranslator(req);
		const csrfToken = deps.generateCsrfToken(req, res);
		const pages = getPages(locale);
		const body = `
    <h1>${translator('admin.pages')}</h1>
    <section style="display:grid;gap:1rem;">
      ${pages
				.map(
					(p) => `<article style="border:1px solid #eee;padding:1rem;border-radius:12px;">
          <strong>${p.slug}</strong> – ${p.published ? translator('admin.published') : translator('admin.draft')}
        </article>`
				)
				.join('')}
    </section>
    <h2 style="margin-top:2rem;">${translator('admin.save')} ${translator('admin.pages')}</h2>
    <form method="post" action="/admin/pages" style="display:grid;gap:1rem;">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <label>${translator('admin.slug')} <input name="slug" required /></label>
      <label>${translator('admin.status')}
        <select name="published">
          <option value="1">${translator('admin.published')}</option>
          <option value="0">${translator('admin.draft')}</option>
        </select>
      </label>
      ${appConfig.locales.supported
				.map(
					(loc) => `<fieldset style="border:1px solid #eee;padding:1rem;">
          <legend>${translator('admin.locale')}: ${loc.toUpperCase()}</legend>
          <label>${translator('admin.name')} <input name="heading_${loc}" /></label>
          <label>${translator('admin.description')} <textarea name="body_${loc}"></textarea></label>
        </fieldset>`
				)
				.join('')}
      <button type="submit">${translator('admin.save')}</button>
    </form>
  `;
		res.send(buildAdminLayout(translator('admin.pages'), body, translator, csrfToken));
	};

	app.get('/admin/pages', deps.requireAuth, adminPagesHandler);

	const adminPagesPostHandler: express.RequestHandler<EmptyParams, string, PageFormBody, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		const slug = req.body.slug;
		const published = req.body.published === '1' ? 1 : 0;
		const sections = appConfig.locales.supported.map((loc, index) => ({
			locale: loc as Locale,
			heading: req.body[`heading_${loc}` as keyof PageFormBody] ?? '',
			body: req.body[`body_${loc}` as keyof PageFormBody] ?? '',
			position: index
		}));
		savePage({ slug, template: 'generic', published }, sections);
		res.redirect('/admin/pages');
	};

	app.post('/admin/pages', deps.requireAuth, deps.doubleCsrfProtection, adminPagesPostHandler);

	const adminTranslationsHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		const { translator } = withTranslator(req);
		const csrfToken = deps.generateCsrfToken(req, res);
		const body = `
    <h1>${translator('admin.translations')}</h1>
    <p>${translator('admin.locale')} ${appConfig.locales.supported.join(', ')}</p>
    <p>${translator('admin.translationInfo')}</p>
    <form method="post" action="/auth/logout">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <button type="submit">${translator('admin.logout')}</button>
    </form>
	`;
		res.send(buildAdminLayout(translator('admin.translations'), body, translator, csrfToken));
	};

	app.get('/admin/translations', deps.requireAuth, adminTranslationsHandler);
};
