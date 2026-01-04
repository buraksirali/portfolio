import type { APIRoute } from 'astro';
import { appConfig } from '../config';

export const GET: APIRoute = () =>
	new Response(
		`User-agent: *\nAllow: /\nSitemap: ${appConfig.seo.canonicalHost}/sitemap.xml\n`,
		{
			headers: { 'Content-Type': 'text/plain' }
		}
	);
