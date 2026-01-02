import 'dotenv/config';
import fastifyFormbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import { Effect, Either, Layer, ManagedRuntime, Option } from 'effect';
import Fastify, { FastifyInstance } from 'fastify';
import { dirname, join } from 'path';
import { h } from 'preact';
import { fileURLToPath } from 'url';
import {
  CurrentUser,
  createJwtVerifier,
  registerAuthHook,
} from './auth/index.js';
import { CreateGameUseCase } from './game/create-game.usecase.js';
import { GameLayerLiveWithDependencies } from './game/index.js';
import { JoinGameUseCase } from './game/join-game.usecase.js';
import { LobbyQueryService } from './game/lobby.query-service.js';
import { Database } from './infra/db/database.service.js';
import { EnsurePlayerExistsUseCase, PlayerId, PlayerLayerLive } from './player/index.js';
import { CreateGame } from './view/components/CreateGame.js';
import { Game } from './view/components/Game.js';
import { Home } from './view/components/Home.js';
import { Lobby } from './view/components/Lobby.js';
import { Login } from './view/components/Login.js';
import { renderHtmlPage, renderToString } from './view/render.js';
import { createLobbyViewModel } from './view/view-models/lobby.view-model.js';

const isDev = process.env.NODE_ENV === 'development';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database URL from environment or use default for development
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/dixitonline';

// Supabase configuration for JWT validation
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const jwtVerifier = createJwtVerifier({ url: supabaseUrl });

// Create the complete application layer with database
const AppLayer = Layer.mergeAll(
  GameLayerLiveWithDependencies,
  PlayerLayerLive,
).pipe(Layer.provide(Database.Live({ connectionString: databaseUrl })));

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
// Assets are in src/view/assets, not dist/view/assets
await fastify.register(fastifyStatic, {
  root: join(__dirname, '..', 'src', 'view', 'assets'),
  prefix: '/assets/',
});

// Register form body parser for HTML forms
await fastify.register(fastifyFormbody);

// Register auth hook for JWT validation + player sync
registerAuthHook(fastify, {
  jwtVerifier,
  onAuthenticated: async (user) => {
    const program = Effect.gen(function* () {
      const ensurePlayerExistsUseCase = yield* EnsurePlayerExistsUseCase;
      yield* ensurePlayerExistsUseCase.execute({
        playerId: PlayerId(user.playerId),
        username: user.username,
        isAnonymous: user.isAnonymous,
      });
    });
    await appRuntime.runPromise(program);
  },
});

// Handle graceful shutdown of database connections
// Dispose the ManagedRuntime to trigger cleanup of all scoped resources (database connection)
fastify.addHook('onClose', async () => {
  console.log('Server shutting down, disposing ManagedRuntime...');
  await appRuntime.dispose();
  console.log('ManagedRuntime disposed, database connections cleaned up');
});

// Form body schema for game creation
interface CreateGameFormBody {
  endConditionType?: string;
  numberOfTimes?: string;
  limitOfPoints?: string;
}

fastify.route({
  method: 'GET',
  url: '/',
  handler: async function handler(request, reply) {
    // Check if user is authenticated and get their info
    const user = Option.isSome(request.authUser)
      ? { username: request.authUser.value.username || 'Joueur' }
      : undefined;

    const component = h(Home, { user });
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
  method: 'GET',
  url: '/game/:gameId/lobby',
  handler: async function handler(request, reply) {
    const { gameId } = request.params as { gameId: string };

    // Redirect to login if not authenticated
    if (Option.isNone(request.authUser)) {
      return reply.redirect(`/login?redirect=/game/${gameId}/lobby`);
    }

    // Extract props from request context (user is authenticated at this point)
    const currentPlayerId = request.authUser.value.playerId;

    const program = Effect.gen(function* () {
      // Query: Load state via Query Service
      const lobbyQueryService = yield* LobbyQueryService;
      const maybeLobbyState = yield* lobbyQueryService.getLobbyState(gameId);

      if (Option.isNone(maybeLobbyState)) {
        return reply.status(404).send({ error: 'Game not found' });
      }

      // Transform: Pure view model function
      const viewModel = createLobbyViewModel(maybeLobbyState.value, {
        currentPlayerId,
      });

      // Render: Pass view model to pure component
      const component = h(Lobby, viewModel);
      const body = renderToString(component);
      const html = renderHtmlPage('Lobby - Tixid Online', body);

      return reply.type('text/html').send(html);
    });

    return appRuntime.runPromise(program).catch((error) => {
      // @ts-ignore - pino type issue with FastifyBaseLogger
      request.log.error({ err: error }, 'Failed to load lobby');
      return reply.status(500).send({
        error: 'Failed to load lobby',
        details: error.message || 'An unexpected error occurred',
      });
    });
  },
});

fastify.route({
  method: 'GET',
  url: '/game/:gameId/join',
  handler: async function handler(request, reply) {
    const { gameId } = request.params as { gameId: string };

    // Redirect to home if not authenticated
    if (Option.isNone(request.authUser)) {
      // TODO: Store gameId in session and redirect back after login
      return reply.redirect(`/login?redirect=/game/${gameId}/join`);
    }

    const program = Effect.gen(function* () {
      const { playerId } = yield* CurrentUser;

      // Command: Join the game
      const joinGameUseCase = yield* JoinGameUseCase;
      yield* joinGameUseCase.joinGame({ gameId, playerId });

      // Redirect to lobby on success
      return reply.redirect(`/game/${gameId}/lobby`);
    });

    return appRuntime
      .runPromise(program.pipe(Effect.provide(request.authLayer)))
      .catch((error) => {
        // @ts-ignore - pino type issue with FastifyBaseLogger
        request.log.error({ err: error }, 'Failed to join game');

        // Handle specific errors
        if (error.message === 'Game not found') {
          return reply.status(404).send({ error: 'Game not found' });
        }

        return reply.status(500).send({
          error: 'Failed to join game',
          details: error.message || 'An unexpected error occurred',
        });
      });
  },
});

fastify.route({
  method: 'GET',
  url: '/game',
  handler: async function handler(_request, reply) {
    const component = h(Game, {
      points: 2,
      turn: 3,
      status: 'Waiting for the storyteller...',
    });
    const body = renderToString(component);
    const html = renderHtmlPage('Game - Tixid Online', body);

    reply.type('text/html').send(html);
  },
});

fastify.route({
  method: 'GET',
  url: '/game/new',
  handler: async function handler(request, reply) {
    // Redirect to home if not authenticated
    if (Option.isNone(request.authUser)) {
      return reply.redirect('/');
    }

    const component = h(CreateGame, {});
    const body = renderToString(component);
    const html = renderHtmlPage('Créer une partie - Tixid Online', body);

    reply.type('text/html').send(html);
  },
});

fastify.route({
  method: 'POST',
  url: '/game/create',
  handler: async function handler(request, reply) {
    const body = request.body as CreateGameFormBody;

    // Generate UUID server-side
    const gameId = crypto.randomUUID();

    // Build endCondition from form data
    const endCondition =
      body.endConditionType === 'LimitOfPoints'
        ? Option.some({
            type: 'LimitOfPoints' as const,
            limit: Number.parseInt(body.limitOfPoints || '30', 10),
          })
        : Option.some({
            type: 'NumberOfTimesBeingStoryteller' as const,
            numberOfTimes: Option.some(
              Number.parseInt(body.numberOfTimes || '3', 10),
            ),
          });

    const program = Effect.gen(function* () {
      const { playerId } = yield* CurrentUser;

      const createGameUseCase = yield* CreateGameUseCase;
      const result = yield* createGameUseCase.createGame({
        gameId,
        hostId: playerId,
        deckId: Option.none(),
        endCondition,
      });

      return Either.match(result, {
        onRight: () => {
          // Redirect to game lobby (HTMX or standard redirect)
          if (request.headers['hx-request']) {
            reply.header('HX-Redirect', `/game/${gameId}/lobby`);
            return reply.status(200).send();
          }
          return reply.redirect(`/game/${gameId}/lobby`);
        },
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

    return appRuntime
      .runPromise(program.pipe(Effect.provide(request.authLayer)))
      .catch((error) => {
        if (error._tag === 'MissingAuthorizationHeader') {
          return reply.redirect('/');
        }

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
