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
): { t: ReturnType<typeof createTranslator>; locale: Locale } => {
	const requestedLocale = typeof req.query.locale === 'string' ? req.query.locale : null;
	const locale = requestedLocale && supportedLocales.includes(requestedLocale as Locale) ? (requestedLocale as Locale) : defaultLocale;
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

// Admin routes (projects/pages/translations) and auth guard.
export const registerAdminRoutes = (app: express.Express, deps: RouteDependencies) => {
	const adminRootHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		res.redirect('/admin/projects');
	};

	app.get('/admin', deps.requireAuth, adminRootHandler);

	const adminProjectsHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		const { t, locale } = withTranslator(req);
		const projects = getProjects(locale);
		const csrfToken = deps.generateCsrfToken(req, res);
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

	app.post('/admin/projects', deps.requireAuth, deps.doubleCsrfProtection, adminProjectsPostHandler);

	const adminPagesHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, LocaleQuery, EmptyLocals> = (
		req,
		res
	): void => {
		const { t, locale } = withTranslator(req);
		const csrfToken = deps.generateCsrfToken(req, res);
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
		const { t } = withTranslator(req);
		const csrfToken = deps.generateCsrfToken(req, res);
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

	app.get('/admin/translations', deps.requireAuth, adminTranslationsHandler);
};
