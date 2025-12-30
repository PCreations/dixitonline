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
}

export const createAuthHook = (config: AuthHookConfig) => {
	const { jwtVerifier } = config;

	return async (request: FastifyRequest, _reply: FastifyReply) => {
		const authorizationHeader = request.headers.authorization;

		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const token = yield* jwtVerifier.extractToken(authorizationHeader);
				const user = yield* jwtVerifier.verifyToken(token);
				return Option.some(user);
			}).pipe(
				Effect.catchTag('MissingAuthorizationHeader', () =>
					Effect.succeed(Option.none<AuthUser>()),
				),
				Effect.catchTag('InvalidJwtError', () =>
					Effect.succeed(Option.none<AuthUser>()),
				),
			),
		);

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
