import { Data, Effect } from 'effect';
import * as jose from 'jose';

import { PlayerId } from '../player/player.entity.js';
import type { AuthUser } from './auth.service.js';

export class InvalidJwtError extends Data.TaggedError('InvalidJwtError')<{
  readonly reason: string;
}> {}

export class MissingAuthorizationHeader extends Data.TaggedError(
  'MissingAuthorizationHeader',
)<{}> {}

interface SupabaseConfig {
  readonly url: string;
  readonly jwtSecret?: string;
  /** Optional JWT issuer override. If not set, derived from url. */
  readonly jwtIssuer?: string;
}

// Default JWT secret for local Supabase development
const DEFAULT_LOCAL_JWT_SECRET =
  'super-secret-jwt-token-with-at-least-32-characters-long';

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
  const jwtSecret = config.jwtSecret || DEFAULT_LOCAL_JWT_SECRET;
  const secretKey = new TextEncoder().encode(jwtSecret);
  // Use explicit issuer if provided, otherwise derive from URL
  const expectedIssuer = config.jwtIssuer || `${config.url}/auth/v1`;

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

        // Decode token to see actual issuer for debugging
        const decoded = jose.decodeJwt(token);
        const tokenIssuer = decoded.iss;

        // Build verify options - only check issuer if token has one
        // (GoTrue in some configs doesn't include iss claim)
        const verifyOptions = tokenIssuer ? { issuer: expectedIssuer } : {};

        // Try JWKS first, fallback to secret for local development
        const result = yield* Effect.tryPromise({
          try: async () => {
            try {
              // Try JWKS verification first (production)
              return await jose.jwtVerify(token, jwks, verifyOptions);
            } catch {
              // Fallback to secret-based verification (local development)
              return await jose.jwtVerify(token, secretKey, verifyOptions);
            }
          },
          catch: (error: unknown) =>
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
