import { Data, Effect } from 'effect';
import * as jose from 'jose';

import { PlayerId } from '../game/player.entity.js';
import type { AuthUser } from './auth.service.js';

export class InvalidJwtError extends Data.TaggedError('InvalidJwtError')<{
	readonly reason: string;
}> {}

export class MissingAuthorizationHeader extends Data.TaggedError(
	'MissingAuthorizationHeader',
)<{}> {}

interface SupabaseConfig {
	readonly url: string;
}

const createJwksGetter = (config: SupabaseConfig) => {
	let jwks: jose.JWTVerifyGetKey | null = null;

	return Effect.sync(() => {
		if (!jwks) {
			jwks = jose.createRemoteJWKSet(
				new URL(`${config.url}/auth/v1/.well-known/jwks.json`),
			);
		}
		return jwks;
	});
};

export const createJwtVerifier = (config: SupabaseConfig) => {
	const getJwks = createJwksGetter(config);

	return {
		extractToken: (
			authorizationHeader: string | undefined,
		): Effect.Effect<string, MissingAuthorizationHeader> => {
			if (!authorizationHeader?.startsWith('Bearer ')) {
				return Effect.fail(new MissingAuthorizationHeader());
			}
			return Effect.succeed(authorizationHeader.slice(7));
		},

		verifyToken: (token: string): Effect.Effect<AuthUser, InvalidJwtError> =>
			Effect.gen(function* () {
				const jwks = yield* getJwks;

				const result = yield* Effect.tryPromise({
					try: () =>
						jose.jwtVerify(token, jwks, {
							issuer: `${config.url}/auth/v1`,
						}),
					catch: (error) =>
						new InvalidJwtError({
							reason: error instanceof Error ? error.message : 'Unknown error',
						}),
				});

				const { payload } = result;

				if (!payload.sub) {
					return yield* Effect.fail(
						new InvalidJwtError({ reason: 'Missing sub claim' }),
					);
				}

				const userMetadata = payload.user_metadata as
					| { username?: string }
					| undefined;

				return {
					playerId: PlayerId(payload.sub),
					isAnonymous: payload.is_anonymous === true,
					username: userMetadata?.username,
				};
			}),
	};
};

export type JwtVerifier = ReturnType<typeof createJwtVerifier>;
