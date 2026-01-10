import express from 'express';
import { env } from '../src/config';
import { registerMiddleware } from './middleware';
import { registerRoutes } from './routes';
import { attachErrorHandlers } from './errors';

// Builds the Express app, wires middleware/routes/errors, and starts listening.
export const createServer = () => {
	const app = express();
	const middleware = registerMiddleware(app);

	registerRoutes(app, middleware);

	attachErrorHandlers(app, {
		csrfErrorHandler: ((err, req, res, next) => {
			if (err === middleware.invalidCsrfTokenError) {
				res.status(403).send('Invalid CSRF token');
				return;
			}
			next(err);
		}) as express.ErrorRequestHandler
	});

	return app;
};

export const startServer = () => {
	const app = createServer();
	app.listen(env.PORT, () => {
		process.stdout.write(`Server running on http://localhost:${env.PORT}\n`);
	});
	return app;
};
