import type express from 'express';
import type { ErrorRequestHandler } from 'express';

// Centralizes error middleware wiring; runs after routes/static/SSR handlers.
export const attachErrorHandlers = (app: express.Express, handlers: { csrfErrorHandler: ErrorRequestHandler }) => {
	app.use(handlers.csrfErrorHandler);
};
