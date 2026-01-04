// Auth service
export { CurrentUser, makeCurrentUserLayer } from './auth.service.js';
export type { AuthUser } from './auth.service.js';

// JWT middleware
export {
	createJwtVerifier,
	InvalidJwtError,
	MissingAuthorizationHeader,
} from './jwt.middleware.js';
export type { JwtVerifier } from './jwt.middleware.js';

// Fastify hook
export { createAuthHook, registerAuthHook } from './auth.hook.js';
export type { AuthHookConfig, AuthSyncResult } from './auth.hook.js';
