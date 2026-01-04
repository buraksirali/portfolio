import type { APIRoute } from 'astro';
import cookie from 'cookie';

export const post: APIRoute = async ({ request, url, redirect }) => {
	const data = await request.formData();
	const theme = data.get('theme') === 'dark' ? 'dark' : 'light';
	const referer = request.headers.get('referer');
	const destination = referer ?? url.origin;

	return new Response(null, {
		status: 303,
		headers: {
			'Set-Cookie': cookie.serialize('theme', theme, {
				path: '/',
				maxAge: 60 * 60 * 24 * 365,
				httpOnly: false,
				sameSite: 'lax'
			}),
			Location: destination
		}
	});
};
