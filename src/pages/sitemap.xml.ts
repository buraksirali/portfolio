import type { APIRoute } from 'astro';
import { appConfig } from '../config';
import { supportedLocales } from '../i18n';
import { getPages, getProjects } from '../server/db';

const renderUrl = (loc: string) => `
  <url>
    <loc>${loc}</loc>
  </url>
`;

export const GET: APIRoute = async () => {
	const base = appConfig.seo.canonicalHost.replace(/\/$/, '');
	const urls: string[] = [];

	for (const locale of supportedLocales) {
		urls.push(`${base}/${locale}/`);
		urls.push(`${base}/${locale}/projects/`);
		urls.push(`${base}/${locale}/pages/`);
		const projects = await getProjects(locale);
		projects.forEach((project) => urls.push(`${base}/${locale}/projects/${project.slug}/`));
		const pages = await getPages(locale);
		pages.forEach((page) => urls.push(`${base}/${locale}/pages/${page.slug}/`));
		urls.push(`${base}/${locale}/about/`);
		urls.push(`${base}/${locale}/contact/`);
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(renderUrl).join('\n')}
  </urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
