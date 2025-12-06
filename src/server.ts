import fastifyStatic from '@fastify/static';
import { Effect, Either, Layer, ManagedRuntime, Option, ParseResult, Schema as S } from 'effect';
import Fastify, { FastifyInstance } from 'fastify';
import { dirname, join } from 'path';
import { h } from 'preact';
import { fileURLToPath } from 'url';
import { CreateGameUseCase } from './game/create-game.usecase.js';
import { GameLayerLiveWithDependencies } from './game/index.js';
import { Database } from './infra/db/database.service.js';
import { Home } from './view/components/Home.js';
import { Login } from './view/components/Login.js';
import { renderHtmlPage, renderToString } from './view/render.js';

const isDev = process.env.NODE_ENV === 'development';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database URL from environment or use default for development
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/dixitonline';

// Create the complete application layer with database
const AppLayer = Layer.provide(
  GameLayerLiveWithDependencies,
  Database.Live({ connectionString: databaseUrl }),
);

// Create a long-lived ManagedRuntime with the AppLayer
// This runtime will be used for all requests and maintains the database connection
const appRuntime = ManagedRuntime.make(AppLayer);

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

// Register static files plugin
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'view', 'assets'),
  prefix: '/assets/',
});

// Handle graceful shutdown of database connections
// Dispose the ManagedRuntime to trigger cleanup of all scoped resources (database connection)
fastify.addHook('onClose', async () => {
  console.log('Server shutting down, disposing ManagedRuntime...');
  await appRuntime.dispose();
  console.log('ManagedRuntime disposed, database connections cleaned up');
});

const CreateGameBodySchema = S.Struct({
  gameId: S.String,
  hostId: S.String,
});

fastify.route({
  method: 'GET',
  url: '/',
  handler: async function handler(_request, reply) {
    const component = h(Home, {});
    const body = renderToString(component);
    const html = renderHtmlPage('Tixid Online', body);

    reply.type('text/html').send(html);
  },
});

fastify.route({
  method: 'GET',
  url: '/login',
  handler: async function handler(_request, reply) {
    const component = h(Login, {});
    const body = renderToString(component);
    const html = renderHtmlPage('Login - Tixid Online', body);

    reply.type('text/html').send(html);
  },
});

fastify.route({
  method: 'POST',
  url: '/game/create',
  handler: async function handler(request, reply) {
    // First, try to decode the request body
    const decodeResult = S.decodeUnknown(CreateGameBodySchema)(request.body);

    // Handle the decoding as an Effect
    const program = Effect.gen(function* () {
      const decoded = yield* decodeResult;
      const { gameId, hostId } = decoded;

      const createGameUseCase = yield* CreateGameUseCase;
      const result = yield* createGameUseCase.createGame({
        gameId,
        hostId,
        deckId: Option.none(),
        endCondition: Option.none(),
      });
      return Either.match(result, {
        onRight: () => reply.status(201).send({ success: true, gameId }),
        onLeft: (error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to create game');
          return reply.status(500).send({
            error: 'Failed to create game',
            details: error.message,
          });
        },
      });
    });

    // Use the long-lived runtime instead of providing the layer on each request
    return appRuntime.runPromise(program).catch((error) => {
      // Handle validation errors
      if (ParseResult.isParseError(error)) {
        const formatted = ParseResult.TreeFormatter.formatErrorSync(error);
        // @ts-ignore - pino type issue with FastifyBaseLogger
        request.log.warn({ err: error, formatted }, 'Invalid request body');
        return reply.status(400).send({
          error: 'Validation Error',
          details: formatted,
        });
      }

      // Handle other errors
      // @ts-ignore - pino type issue with FastifyBaseLogger
      request.log.error({ err: error }, 'Unexpected error');
      return reply.status(500).send({
        error: 'Internal Server Error',
        details: error.message || 'An unexpected error occurred',
      });
    });
  },
});

try {
  await fastify.listen({ port: 3010 });
} catch (err) {
  console.error(err);
  process.exit(1);
}
