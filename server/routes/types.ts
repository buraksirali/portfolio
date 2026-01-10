import type express from 'express';
import type { RequireAuthHandler } from '../types';

export type CsrfDeps = {
	doubleCsrfProtection: express.RequestHandler;
	generateCsrfToken: (req: express.Request, res: express.Response) => string;
	invalidCsrfTokenError: Error;
};

export type RouteDependencies = CsrfDeps & {
	requireAuth: RequireAuthHandler;
};
