import * as Sentry from '@sentry/node';
import { Effect, Either, Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { CurrentUser } from '../../auth/index.js';
import { CreateGameUseCase } from '../../game/create-game.usecase.js';
import { withHttpSpan } from '../../infra/observability/index.js';
import { CreateGame } from '../../view/components/CreateGame.js';
import type { CreateGameFormBody } from '../types.js';
import '../types.js';

const gameCreateRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime, renderHtmlPage, renderToString } = fastify;

  // GET /game/new
  fastify.route({
    method: 'GET',
    url: '/new',
    handler: async (request, reply) => {
      if (Option.isNone(request.authUser)) {
        return reply.redirect('/');
      }

      const component = h(CreateGame, {});
      const body = renderToString(component);
      const html = renderHtmlPage('Créer une partie - Tixid Online', body);

      return reply.type('text/html').send(html);
    },
  });

  // POST /game/create
  fastify.route({
    method: 'POST',
    url: '/create',
    handler: async (request, reply) => {
      const body = request.body as CreateGameFormBody;

      const gameId = crypto.randomUUID();

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
        .runPromise(
          program.pipe(
            Effect.provide(request.authLayer),
            withHttpSpan({ method: 'POST', url: '/game/create' }),
          ),
        )
        .catch((error) => {
          if (error._tag === 'MissingAuthorizationHeader') {
            return reply.redirect('/');
          }

          Sentry.captureException(error);
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Unexpected error');
          return reply.status(500).send({
            error: 'Internal Server Error',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });
};

export default gameCreateRoutes;
