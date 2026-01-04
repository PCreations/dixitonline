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

export type AuthSyncResult =
	| { readonly success: true }
	| { readonly success: false; readonly error: 'username_taken' };

export interface AuthHookConfig {
	readonly jwtVerifier: JwtVerifier;
	/**
	 * Optional callback to sync player to database when authenticated.
	 * Called with the authenticated user to ensure player exists in DB.
	 * Returns an AuthSyncResult indicating success or specific error type.
	 */
	readonly onAuthenticated?: (user: AuthUser) => Promise<AuthSyncResult>;
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

	return async (request: FastifyRequest, reply: FastifyReply) => {
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
				const syncResult = await onAuthenticated(result.value);
				if (!syncResult.success && syncResult.error === 'username_taken') {
					// Set cookie to notify frontend about the error
					reply.header(
						'Set-Cookie',
						'auth_error=username_taken; Path=/; Max-Age=60; SameSite=Lax',
					);
				}
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
