/**
 * Request flow (top to bottom):
 * 1) createServer (server/server.ts) builds the Express app.
 * 2) registerMiddleware attaches parsers, sessions, and CSRF utilities.
 * 3) registerRoutes wires auth/admin/api/public routes in order.
 * 4) attachErrorHandlers adds the CSRF error middleware.
 * 5) startServer boots the listener.
 */
import { startServer } from './server';

startServer();
