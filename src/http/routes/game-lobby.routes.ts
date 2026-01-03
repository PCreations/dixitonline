import * as Sentry from '@sentry/node';
import { Effect, Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { CurrentUser } from '../../auth/index.js';
import { JoinGameUseCase } from '../../game/join-game.usecase.js';
import { LobbyQueryService } from '../../game/lobby.query-service.js';
import {
  withHttpSpan,
  withSentryErrorCapture,
} from '../../infra/observability/index.js';
import { Lobby } from '../../view/components/Lobby.js';
import { LobbyContent } from '../../view/components/LobbyContent.js';
import { createLobbyViewModel } from '../../view/view-models/lobby.view-model.js';
import type { GameParams } from '../types.js';
import '../types.js';

const gameLobbyRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime, renderHtmlPage, renderToString } = fastify;

  // GET /game/:gameId/lobby
  fastify.route({
    method: 'GET',
    url: '/:gameId/lobby',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.redirect(`/login?redirect=/game/${gameId}/lobby`);
      }

      const currentPlayerId = request.authUser.value.playerId;

      const program = Effect.gen(function* () {
        const lobbyQueryService = yield* LobbyQueryService;
        const maybeLobbyState = yield* lobbyQueryService.getLobbyState(gameId);

        if (Option.isNone(maybeLobbyState)) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        const viewModel = createLobbyViewModel(maybeLobbyState.value, {
          currentPlayerId,
        });

        const component = h(Lobby, viewModel);
        const body = renderToString(component);
        const html = renderHtmlPage('Lobby - Tixid Online', body);

        return reply.type('text/html').send(html);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            withHttpSpan({ method: 'GET', url: `/game/${gameId}/lobby` }),
            withSentryErrorCapture,
          ),
        )
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to load lobby');
          return reply.status(500).send({
            error: 'Failed to load lobby',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // GET /game/:gameId/join
  fastify.route({
    method: 'GET',
    url: '/:gameId/join',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.redirect(`/login?redirect=/game/${gameId}/join`);
      }

      const program = Effect.gen(function* () {
        const { playerId } = yield* CurrentUser;

        const joinGameUseCase = yield* JoinGameUseCase;
        yield* joinGameUseCase.joinGame({ gameId, playerId });

        return reply.redirect(`/game/${gameId}/lobby`);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            Effect.provide(request.authLayer),
            withHttpSpan({ method: 'GET', url: `/game/${gameId}/join` }),
          ),
        )
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to join game');

          if (error.message === 'Game not found') {
            return reply.status(404).send({ error: 'Game not found' });
          }

          Sentry.captureException(error);
          return reply.status(500).send({
            error: 'Failed to join game',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // GET /game/:gameId/lobby/content
  fastify.route({
    method: 'GET',
    url: '/:gameId/lobby/content',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const currentPlayerId = request.authUser.value.playerId;

      const program = Effect.gen(function* () {
        const lobbyQueryService = yield* LobbyQueryService;
        const maybeLobbyState = yield* lobbyQueryService.getLobbyState(gameId);

        if (Option.isNone(maybeLobbyState)) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        const viewModel = createLobbyViewModel(maybeLobbyState.value, {
          currentPlayerId,
        });

        const html = renderToString(h(LobbyContent, viewModel));

        return reply.type('text/html').send(html);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            withHttpSpan({
              method: 'GET',
              url: `/game/${gameId}/lobby/content`,
            }),
            withSentryErrorCapture,
          ),
        )
        .catch((error) => {
          // @ts-ignore - pino type issue
          request.log.error({ err: error }, 'Failed to load lobby content');
          return reply
            .status(500)
            .send({ error: 'Failed to load lobby content' });
        });
    },
  });
};

export default gameLobbyRoutes;
