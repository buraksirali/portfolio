import type express from 'express';
import * as oauth from 'oauth4webapi';
import { appConfig } from '../../src/config';
import { getUserByEmail } from '../../src/server/db';
import type { CallbackQuery, EmptyParams, EmptyLocals } from '../types';
import type { RouteDependencies } from './types';
import type { ParsedQs } from 'qs';
import { isDefined } from '../../helpers/equality.helpers';

// Auth routes: OAuth login/callback and logout. Runs after core middleware.
export const registerAuthRoutes = (app: express.Express, deps: RouteDependencies) => {
	const loadIssuer = async (): Promise<oauth.AuthorizationServer> => {
		const wellKnown = new URL('.well-known/openid-configuration', appConfig.auth.issuer);
		const discoveryResponse = await oauth.discoveryRequest(wellKnown);
		return oauth.processDiscoveryResponse(new URL(appConfig.auth.issuer), discoveryResponse);
	};

	const getClient = (): oauth.Client => ({
		client_id: appConfig.auth.clientId,
		client_secret: appConfig.auth.clientSecret,
		token_endpoint_auth_method: appConfig.auth.clientSecret
			? 'client_secret_basic'
			: 'none'
	});

	const authLoginHandler: express.RequestHandler<EmptyParams, oauth.OAuth2Error | string, Record<string, never>, ParsedQs, EmptyLocals> = async (
		req,
		res
	): Promise<void> => {
		const as = await loadIssuer();
		const client = getClient();
		const codeVerifier = oauth.generateRandomCodeVerifier();
		const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
		const state = oauth.generateRandomState();
		const nonce = oauth.generateRandomNonce();
		req.session.oidc = { codeVerifier, state, nonce };

		if (!isDefined(as.authorization_endpoint)) {
			throw new Error('Authorization endpoint is undefined!');
		}
		const authorizationUrl = new URL(as.authorization_endpoint);
		authorizationUrl.searchParams.set('client_id', client.client_id);
		authorizationUrl.searchParams.set('response_type', 'code');
		authorizationUrl.searchParams.set('redirect_uri', appConfig.auth.redirectUri);
		authorizationUrl.searchParams.set('scope', appConfig.auth.scopes.join(' '));
		authorizationUrl.searchParams.set('state', state);
		authorizationUrl.searchParams.set('code_challenge', codeChallenge);
		authorizationUrl.searchParams.set('code_challenge_method', 'S256');
		authorizationUrl.searchParams.set('nonce', nonce);
		res.redirect(authorizationUrl.toString());
	};

	app.get('/auth/login', authLoginHandler);

	const authCallbackHandler: express.RequestHandler<
		EmptyParams,
		oauth.OAuth2Error | string,
		Record<string, never>,
		CallbackQuery,
		EmptyLocals
	> = async (
		req,
		res
	): Promise<void> => {
		const stored = req.session.oidc;
		if (!isDefined(stored)) {
			res.status(400).send('Missing auth session');
			return;
		}
		const as = await loadIssuer();
		const client = getClient();

		const callbackUrl = new URL(req.originalUrl, appConfig.auth.redirectUri);
		const params = oauth.validateAuthResponse(as, client, callbackUrl);
		if (oauth.isOAuth2Error(params)) {
			res.status(400).send(params);
			return;
		}

		const responseState = params.get('state') ?? null;
		if (responseState !== stored.state) {
			res.status(400).send('State mismatch');
			return;
		}

		const tokenResponse = await oauth.authorizationCodeGrantRequest(
			as,
			client,
			params,
			appConfig.auth.redirectUri,
			stored.codeVerifier
		);
		const result = await oauth.processAuthorizationCodeOpenIDResponse(as, client, tokenResponse);
		if (oauth.isOAuth2Error(result)) {
			res.status(400).json(result);
			return;
		}

		const claims = oauth.getValidatedIdTokenClaims(result);
		const email = (claims.email as string) ?? null;
		if (!isDefined(email) || email === '') {
			res.status(400).send('Email missing from provider response');
			return;
		}
		const existingUser = await getUserByEmail(email);
		if (!existingUser) {
			res.status(403).send('User is not authorized');
			return;
		}
		req.session.user = {
			id: existingUser.id,
			email: existingUser.email,
			name: existingUser.name ?? ''
		};
		res.redirect('/admin/projects');
	};

	app.get('/auth/callback', authCallbackHandler);

	const logoutHandler: express.RequestHandler<EmptyParams, string, Record<string, never>, ParsedQs, EmptyLocals> = (
		req,
		res
	): void => {
		req.session.destroy((destroyError: Error | null) => {
			if (isDefined(destroyError)) {
				res.status(500).send('Failed to log out');
				return;
			}
			res.redirect('/');
		});
	};

	app.post('/auth/logout', deps.doubleCsrfProtection, logoutHandler);
};
