import 'dotenv/config';
import * as Sentry from '@sentry/node';

// Initialize Sentry BEFORE other imports for automatic instrumentation
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    skipOpenTelemetrySetup: true,
  });
} else {
  console.log('SENTRY_DSN not set, Sentry disabled');
}

import fastifyFormbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import { Effect, Layer, ManagedRuntime } from 'effect';
import Fastify, { FastifyInstance } from 'fastify';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  type AuthSyncResult,
  createJwtVerifier,
  registerAuthHook,
} from './auth/index.js';
import {
  GameLayerLiveWithoutEventBus,
  InMemoryGameEventBus,
} from './game/index.js';
import { appRuntimePlugin, renderPlugin } from './http/plugins/index.js';
import {
  authRoutes,
  devPreviewRoutes,
  gameCreateRoutes,
  gameEventsRoutes,
  gameLobbyRoutes,
  gamePlayRoutes,
  homeRoutes,
  testRoutes,
} from './http/routes/index.js';
import { Database } from './infra/db/database.service.js';
import { TracingLive } from './infra/observability/index.js';
import {
  DrizzleOutboxRepository,
  makeOutboxPollingDaemonLive,
  OutboxEventRelay,
  OutboxEventRelayLive,
  OutboxEventRelayTest,
  OutboxPollingDaemon,
} from './infra/outbox/index.js';
import { makeSupabaseClientLive } from './infra/supabase/index.js';
import {
  EnsurePlayerExistsUseCase,
  PlayerId,
  PlayerLayerLive,
  UsernameAlreadyTakenError,
} from './player/index.js';

const isDev = process.env.NODE_ENV === 'development';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/dixitonline';
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseJwtIssuer = process.env.SUPABASE_JWT_ISSUER;
const jwtVerifier = createJwtVerifier({
  url: supabaseUrl,
  ...(supabaseJwtIssuer ? { jwtIssuer: supabaseJwtIssuer } : {}),
});
const pollIntervalMs = isDev ? 2000 : 5000;

// Build application layer
const DatabaseLayer = Database.Live({ connectionString: databaseUrl });

const AppLayer = (() => {
  const SharedServicesLayer = Layer.mergeAll(
    InMemoryGameEventBus,
    DrizzleOutboxRepository,
  );

  const RelayLayer = supabasePublishableKey
    ? OutboxEventRelayLive.pipe(
        Layer.provide(
          makeSupabaseClientLive({
            url: supabaseUrl,
            publishableKey: supabasePublishableKey,
          }),
        ),
      )
    : OutboxEventRelayTest;

  return Layer.mergeAll(
    GameLayerLiveWithoutEventBus.pipe(Layer.provide(SharedServicesLayer)),
    PlayerLayerLive,
    makeOutboxPollingDaemonLive({ pollIntervalMs }).pipe(
      Layer.provide(SharedServicesLayer),
    ),
    RelayLayer.pipe(Layer.provide(SharedServicesLayer)),
    SharedServicesLayer,
  ).pipe(Layer.provide(DatabaseLayer), Layer.provide(TracingLive));
})();

const appRuntime = ManagedRuntime.make(AppLayer);

// Start OutboxEventRelay
if (supabasePublishableKey) {
  console.log('Starting OutboxEventRelay for cross-instance event delivery...');
  appRuntime
    .runPromise(
      Effect.gen(function* () {
        const relay = yield* OutboxEventRelay;
        yield* relay.start();
        console.log('OutboxEventRelay started successfully');
      }),
    )
    .catch((error) => {
      console.error('Failed to start OutboxEventRelay:', error);
    });
} else {
  console.log(
    'SUPABASE_PUBLISHABLE_KEY not set, OutboxEventRelay disabled (events will only be delivered locally)',
  );
}

// Start OutboxPollingDaemon
console.log('Starting OutboxPollingDaemon for fallback event processing...');
appRuntime
  .runPromise(
    Effect.gen(function* () {
      const daemon = yield* OutboxPollingDaemon;
      yield* daemon.start();
      console.log(
        `OutboxPollingDaemon started (polling every ${pollIntervalMs}ms)`,
      );
    }),
  )
  .catch((error) => {
    console.error('Failed to start OutboxPollingDaemon:', error);
  });

// Create Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
            singleLine: false,
            messageFormat: '{if reqId}[{reqId}] {end}{msg}',
            errorLikeObjectKeys: ['err', 'error'],
            errorProps: 'message,stack',
          },
        },
        level: 'debug',
      }
    : true,
});

// Setup Sentry error handler
// @ts-expect-error - Sentry types not fully compatible with Fastify 5
Sentry.setupFastifyErrorHandler(fastify);

// Register core plugins
await fastify.register(fastifyStatic, {
  root: join(__dirname, '..', 'src', 'view', 'assets'),
  prefix: '/assets/',
});
await fastify.register(fastifyFormbody);

// Register custom plugins (decorators)
await fastify.register(appRuntimePlugin, { appRuntime });
await fastify.register(renderPlugin);

// Register auth hook
registerAuthHook(fastify, {
  jwtVerifier,
  onAuthenticated: async (user): Promise<AuthSyncResult> => {
    const program = Effect.gen(function* () {
      const ensurePlayerExistsUseCase = yield* EnsurePlayerExistsUseCase;
      yield* ensurePlayerExistsUseCase.execute({
        playerId: PlayerId(user.playerId),
        username: user.username,
        isAnonymous: user.isAnonymous,
      });
    });

    return appRuntime
      .runPromise(program)
      .then((): AuthSyncResult => ({ success: true }))
      .catch((error): AuthSyncResult => {
        if (error instanceof UsernameAlreadyTakenError) {
          return { success: false, error: 'username_taken' };
        }
        // Re-throw other errors to be logged by the auth hook
        throw error;
      });
  },
});

// Register route plugins
await fastify.register(homeRoutes);
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(gameCreateRoutes, { prefix: '/game' });
await fastify.register(gameLobbyRoutes, { prefix: '/game' });
await fastify.register(gamePlayRoutes, { prefix: '/game' });
await fastify.register(gameEventsRoutes, { prefix: '/game' });
await fastify.register(testRoutes, { prefix: '/api/test' });

// Dev-only routes for previewing UI components
if (isDev) {
  await fastify.register(devPreviewRoutes);
}

// Start server
try {
  await fastify.listen({ port: 3010 });
} catch (err) {
  console.error(err);
  process.exit(1);
}
