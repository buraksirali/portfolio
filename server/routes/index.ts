import type express from 'express';
import { registerAdminRoutes } from './admin';
import { registerAuthRoutes } from './auth';
import { registerPublicRoutes } from './public';
import { registerApiRoutes } from './api';
import type { RouteDependencies } from './types';

// Registers all route groups in order.
export const registerRoutes = (app: express.Express, deps: RouteDependencies) => {
	registerAuthRoutes(app, deps);
	registerAdminRoutes(app, deps);
	registerApiRoutes(app, deps);
	registerPublicRoutes(app);
};
