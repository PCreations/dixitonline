import { Effect, Layer, Option } from 'effect';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
	type AuthUser,
	CurrentUser,
	makeCurrentUserLayer,
} from './auth.service.js';
import { type JwtVerifier, MissingAuthorizationHeader } from './jwt.middleware.js';

declare module 'fastify' {
	interface FastifyRequest {
		authUser: Option.Option<AuthUser>;
		authLayer: Layer.Layer<CurrentUser, MissingAuthorizationHeader>;
	}
}

export interface AuthHookConfig {
	readonly jwtVerifier: JwtVerifier;
	/**
	 * Optional callback to sync player to database when authenticated.
	 * Called with the authenticated user to ensure player exists in DB.
	 */
	readonly onAuthenticated?: (user: AuthUser) => Promise<void>;
}

// Extract token from cookie header
const extractTokenFromCookie = (
	cookieHeader: string | undefined,
): string | undefined => {
	if (!cookieHeader) return undefined;
	const cookies = cookieHeader.split(';').map((c) => c.trim());
	const authCookie = cookies.find((c) => c.startsWith('sb-access-token='));
	if (!authCookie) return undefined;
	const token = authCookie.slice('sb-access-token='.length);
	return token || undefined;
};

export const createAuthHook = (config: AuthHookConfig) => {
	const { jwtVerifier, onAuthenticated } = config;

	return async (request: FastifyRequest, _reply: FastifyReply) => {
		// Try Authorization header first, then fallback to cookie
		const authorizationHeader = request.headers.authorization;
		const cookieToken = extractTokenFromCookie(request.headers.cookie);

		const result = await Effect.runPromise(
			Effect.gen(function* () {
				// Try Authorization header first
				const tokenFromHeader = yield* jwtVerifier
					.extractToken(authorizationHeader)
					.pipe(Effect.option);

				const token = Option.isSome(tokenFromHeader)
					? tokenFromHeader.value
					: cookieToken;

				if (!token) {
					return Option.none<AuthUser>();
				}

				const user = yield* jwtVerifier.verifyToken(token);
				return Option.some(user);
			}).pipe(
				Effect.catchTag('InvalidJwtError', () =>
					Effect.succeed(Option.none<AuthUser>()),
				),
			),
		);

		// Sync player to database if authenticated
		if (Option.isSome(result) && onAuthenticated) {
			try {
				await onAuthenticated(result.value);
			} catch (error) {
				// Log but don't fail the request - player sync is non-critical
				// @ts-ignore - pino type issue with FastifyBaseLogger
				request.log.error({ err: error }, 'Failed to sync player to database');
			}
		}

		request.authUser = result;
		request.authLayer = Option.match(result, {
			onNone: () =>
				Layer.fail(new MissingAuthorizationHeader()) as Layer.Layer<
					CurrentUser,
					MissingAuthorizationHeader
				>,
			onSome: (user) => makeCurrentUserLayer(user),
		});
	};
};

export const registerAuthHook = (
	server: FastifyInstance,
	config: AuthHookConfig,
) => {
	server.addHook('onRequest', createAuthHook(config));
};
