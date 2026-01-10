import express from 'express';
import session from 'express-session';
import { doubleCsrf } from 'csrf-csrf';
import { env } from '../../src/config';
import type { RequireAuthHandler } from '../types';

// Sets up global middleware (body parsers, sessions) and initializes CSRF utilities.
// Runs once on server bootstrap before any routes are attached.
export const registerMiddleware = (app: express.Express) => {
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	app.use(
		session({
			secret: env.SESSION_SECRET,
			resave: false,
			saveUninitialized: false
		})
	);

	const isProduction = env.NODE_ENV === 'production';

	const { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError } = doubleCsrf({
		getSecret: () => env.SESSION_SECRET,
		getSessionIdentifier: (req) => req.session.id ?? req.sessionID ?? 'anon',
		cookieName: 'x-csrf-token',
		cookieOptions: {
			path: '/',
			sameSite: 'lax',
			secure: isProduction,
			httpOnly: true
		},
		getCsrfTokenFromRequest: (req) => {
			const headerToken = req.get('x-csrf-token');
			if (headerToken) {
				return headerToken;
			}
			const body = req.body as Record<string, unknown> | undefined;
			if (body) {
				if (typeof body._csrf === 'string') {
					return body._csrf;
				}
				if (typeof body.csrfToken === 'string') {
					return body.csrfToken;
				}
			}
			return undefined;
		}
	});

	const requireAuth: RequireAuthHandler = (req, res, next): void => {
		if (!req.session.user) {
			res.redirect('/auth/login');
			return;
		}
		next();
	};

	return {
		requireAuth,
		doubleCsrfProtection,
		generateCsrfToken,
		invalidCsrfTokenError
	};
};
