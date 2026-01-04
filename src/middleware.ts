import cookie from 'cookie';
import type { MiddlewareHandler } from 'astro';
import { defaultLocale, supportedLocales, type Locale } from './i18n';

const isContentPath = (pathname: string) =>
	!pathname.startsWith('/auth') &&
	!pathname.startsWith('/admin') &&
	!pathname.startsWith('/assets') &&
	!pathname.startsWith('/favicon') &&
	!pathname.startsWith('/robots') &&
	!pathname.startsWith('/sitemap') &&
	!pathname.startsWith('/api');

export const onRequest: MiddlewareHandler = async (context, next) => {
	const { request, locals, url } = context;
	const cookies = cookie.parse(request.headers.get('cookie') ?? '');
	const theme = cookies.theme === 'dark' ? 'dark' : 'light';
	locals.theme = theme;

	if (!isContentPath(url.pathname)) {
		return next();
	}

	const [, maybeLocale] = url.pathname.split('/');
	const locale: Locale = supportedLocales.includes(maybeLocale as Locale)
		? (maybeLocale as Locale)
		: defaultLocale;

	locals.locale = locale;

	if (!maybeLocale && url.pathname === '/') {
		return next();
	}

	if (!supportedLocales.includes(maybeLocale as Locale)) {
		const target = `/${defaultLocale}${url.pathname}`;
		return Response.redirect(target, 307);
	}

	return next();
};
