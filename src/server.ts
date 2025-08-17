import { Effect, Either, Option, ParseResult, Schema as S } from 'effect';
import Fastify, { FastifyInstance } from 'fastify';
import { CreateGameUseCase } from './game/create-game.usecase.js';
import { GameLayerLive } from './game/index.js';

const isDev = process.env.NODE_ENV === 'development';

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

const CreateGameBodySchema = S.Struct({
  gameId: S.String,
  hostId: S.String,
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

    const runnable = Effect.provide(program, GameLayerLive);

    return Effect.runPromise(runnable).catch((error) => {
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
  await fastify.listen({ port: 3000 });
} catch (err) {
  console.error(err);
  process.exit(1);
}
