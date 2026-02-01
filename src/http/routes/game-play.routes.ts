import { Effect, Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { h } from 'preact';
import { CurrentUser } from '../../auth/index.js';
import { GameQueryService } from '../../game/game.query-service.js';
import { NotifyReadyForNextTurnUseCase } from '../../game/notify-ready-for-next-turn.usecase.js';
import { SelectCardUseCase } from '../../game/select-card.usecase.js';
import { SubmitClueUseCase } from '../../game/submit-clue.usecase.js';
import { VoteOnCardUseCase } from '../../game/vote-on-card.usecase.js';
import {
  withHttpSpan,
  withSentryErrorCapture,
} from '../../infra/observability/index.js';
import { Game } from '../../view/components/Game.js';
import { GamePage } from '../../view/components/GamePage.js';
import { GamePreview } from '../../view/components/GamePreview.js';
import type { GameParams } from '../types.js';
import '../types.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:44321';

const buildCardUrl = (cardNumber: number) =>
  `${SUPABASE_URL}/storage/v1/object/public/decks/default/card_${cardNumber}.jpg`;

interface ClueBody {
  cardId: string;
  clue: string;
}

interface CardBody {
  cardId: string;
}

const gamePlayRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime, renderHtmlPage, renderToString } = fastify;

  // GET /game - Simple preview page with fan layout (for testing)
  fastify.route({
    method: 'GET',
    url: '/',
    handler: async (request, reply) => {
      const cards = [100, 101, 102, 103, 104].map((n) => ({
        id: `card_${n}`,
        url: buildCardUrl(n),
      }));

      const component = h(GamePreview, {
        points: 2,
        turn: 3,
        status: 'Waiting for the storyteller...',
        cards,
      });
      const body = renderToString(component);
      const html = renderHtmlPage('Game - Tixid Online', body, {
        isAuthenticated: Option.isSome(request.authUser),
      });

      return reply.type('text/html').send(html);
    },
  });

  // GET /game/:gameId - Main game page
  fastify.route({
    method: 'GET',
    url: '/:gameId',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.redirect(`/login?redirect=/game/${gameId}`);
      }

      const currentPlayerId = request.authUser.value.playerId;

      const program = Effect.gen(function* () {
        const gameQueryService = yield* GameQueryService;
        const maybeGameState = yield* gameQueryService.getGameState(
          gameId,
          currentPlayerId,
        );

        if (Option.isNone(maybeGameState)) {
          // Game not started or not found - redirect to lobby
          return reply.redirect(`/game/${gameId}/lobby`);
        }

        const view = maybeGameState.value;
        const component = h(GamePage, { view, gameId });
        const body = renderToString(component);
        const html = renderHtmlPage('Game - Tixid Online', body, {
          isAuthenticated: true,
        });

        return reply.type('text/html').send(html);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            withHttpSpan({ method: 'GET', url: `/game/${gameId}` }),
            withSentryErrorCapture,
          ),
        )
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to load game');
          return reply.status(500).send({
            error: 'Failed to load game',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // POST /game/:gameId/clue - Submit clue (storytelling phase)
  fastify.route({
    method: 'POST',
    url: '/:gameId/clue',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;
      const { cardId, clue } = request.body as ClueBody;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const program = Effect.gen(function* () {
        const { playerId } = yield* CurrentUser;
        const submitClueUseCase = yield* SubmitClueUseCase;

        yield* submitClueUseCase.submitClue({
          gameId,
          playerId,
          cardId,
          clue,
        });

        // Return updated game content
        return yield* renderGameContent(gameId, playerId);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            Effect.provide(request.authLayer),
            withHttpSpan({ method: 'POST', url: `/game/${gameId}/clue` }),
            withSentryErrorCapture,
          ),
        )
        .then((html) => reply.type('text/html').send(html))
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to submit clue');
          return reply.status(400).send({
            error: 'Failed to submit clue',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // POST /game/:gameId/select-card - Select card (selecting-cards phase)
  fastify.route({
    method: 'POST',
    url: '/:gameId/select-card',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;
      const { cardId } = request.body as CardBody;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const program = Effect.gen(function* () {
        const { playerId } = yield* CurrentUser;
        const selectCardUseCase = yield* SelectCardUseCase;

        yield* selectCardUseCase.selectCard({
          gameId,
          playerId,
          cardId,
        });

        // Return updated game content
        return yield* renderGameContent(gameId, playerId);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            Effect.provide(request.authLayer),
            withHttpSpan({
              method: 'POST',
              url: `/game/${gameId}/select-card`,
            }),
            withSentryErrorCapture,
          ),
        )
        .then((html) => reply.type('text/html').send(html))
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to select card');
          return reply.status(400).send({
            error: 'Failed to select card',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // POST /game/:gameId/vote - Vote on card (voting phase)
  fastify.route({
    method: 'POST',
    url: '/:gameId/vote',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;
      const { cardId } = request.body as CardBody;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const program = Effect.gen(function* () {
        const { playerId } = yield* CurrentUser;
        const voteOnCardUseCase = yield* VoteOnCardUseCase;

        yield* voteOnCardUseCase.voteOnCard({
          gameId,
          playerId,
          cardId,
        });

        // Return updated game content
        return yield* renderGameContent(gameId, playerId);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            Effect.provide(request.authLayer),
            withHttpSpan({ method: 'POST', url: `/game/${gameId}/vote` }),
            withSentryErrorCapture,
          ),
        )
        .then((html) => reply.type('text/html').send(html))
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to vote');
          return reply.status(400).send({
            error: 'Failed to vote',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // POST /game/:gameId/ready - Ready for next turn (scoring phase)
  fastify.route({
    method: 'POST',
    url: '/:gameId/ready',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const program = Effect.gen(function* () {
        const { playerId } = yield* CurrentUser;
        const notifyReadyUseCase = yield* NotifyReadyForNextTurnUseCase;

        yield* notifyReadyUseCase.notifyReadyForNextTurn({
          gameId,
          playerId,
        });

        // Return updated game content
        return yield* renderGameContent(gameId, playerId);
      });

      return appRuntime
        .runPromise(
          program.pipe(
            Effect.provide(request.authLayer),
            withHttpSpan({ method: 'POST', url: `/game/${gameId}/ready` }),
            withSentryErrorCapture,
          ),
        )
        .then((html) => reply.type('text/html').send(html))
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to mark ready');
          return reply.status(400).send({
            error: 'Failed to mark ready',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // GET /game/:gameId/content - Get current game content (for SSE updates)
  fastify.route({
    method: 'GET',
    url: '/:gameId/content',
    handler: async (request, reply) => {
      const { gameId } = request.params as GameParams;

      if (Option.isNone(request.authUser)) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const currentPlayerId = request.authUser.value.playerId;

      const program = renderGameContent(gameId, currentPlayerId);

      return appRuntime
        .runPromise(
          program.pipe(
            withHttpSpan({ method: 'GET', url: `/game/${gameId}/content` }),
            withSentryErrorCapture,
          ),
        )
        .then((html) => reply.type('text/html').send(html))
        .catch((error) => {
          // @ts-ignore - pino type issue with FastifyBaseLogger
          request.log.error({ err: error }, 'Failed to load game content');
          return reply.status(500).send({
            error: 'Failed to load game content',
            details: error.message || 'An unexpected error occurred',
          });
        });
    },
  });

  // Helper function to render game content fragment
  function renderGameContent(gameId: string, playerId: string) {
    return Effect.gen(function* () {
      const gameQueryService = yield* GameQueryService;
      const maybeGameState = yield* gameQueryService.getGameState(
        gameId,
        playerId,
      );

      if (Option.isNone(maybeGameState)) {
        return '<div class="error">Game not found</div>';
      }

      const view = maybeGameState.value;
      const component = h(Game, { view });
      return renderToString(component);
    });
  }
};

export default gamePlayRoutes;
