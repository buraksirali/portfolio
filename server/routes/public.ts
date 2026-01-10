import express from 'express';
import path from 'node:path';
import type { ParsedQs } from 'qs';
import type { EmptyLocals, EmptyParams } from '../types';
import type { RequestPayload } from './auth';

type AstroEntryModule = {
	handler: express.RequestHandler<EmptyParams, RequestPayload, Record<string, never>, ParsedQs, EmptyLocals>;
};

const loadAstroHandler = async (): Promise<
	express.RequestHandler<EmptyParams, RequestPayload, Record<string, never>, ParsedQs, EmptyLocals>
> => {
	const module = (await import('../../dist/server/entry.mjs')) as AstroEntryModule;
	return module.handler;
};

// Public/static routes and Astro SSR handler. Runs after admin/auth routes.
export const registerPublicRoutes = (app: express.Express) => {
	const clientDir = path.join(process.cwd(), 'dist/client');
	app.use(express.static(clientDir, { index: false }));
	app.use('/public', express.static(path.join(process.cwd(), 'public')));

	const astroHandler: express.RequestHandler<EmptyParams, RequestPayload, Record<string, never>, ParsedQs, EmptyLocals> = async (
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
};
