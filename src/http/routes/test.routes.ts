/**
 * Test Routes - Backdoor API endpoints for E2E tests
 *
 * These routes are ONLY available in test/development mode.
 * They allow the Playwright driver to:
 * - Setup test data (decks, games)
 * - Query game state for assertions
 * - Perform actions without authentication
 *
 * SECURITY: These routes bypass authentication and should NEVER be enabled in production.
 */

import { Effect, Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';

import { CreateGameUseCase } from '../../game/create-game.usecase.js';
import {
  Card,
  CardId,
  DeckEntity,
  DeckId,
  IdentityDeckShuffleStrategy,
} from '../../game/deck.entity.js';
import { DeckRepository } from '../../game/deck.repository.js';
import { GameRepository } from '../../game/game.repository.js';
import { JoinGameUseCase } from '../../game/join-game.usecase.js';
import { PlayerId, PlayerRepository } from '../../player/index.js';

const NUMBER_OF_CARDS_IN_DECK = 100;

const testRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime } = fastify;

  // Only register in test/development mode
  if (
    process.env.NODE_ENV === 'production' ||
    !['test', 'development'].includes(process.env.NODE_ENV ?? '')
  ) {
    console.log(
      '[test-routes] Not registered - NODE_ENV must be test or development',
    );
    return;
  }

  console.log('[test-routes] Registering test backdoor routes');

  /**
   * POST /api/test/setup/deck
   * Create a deck for testing
   */
  fastify.post<{
    Body: {
      id: string;
      cards?: string[];
      isDefault?: boolean;
    };
  }>('/setup/deck', async (request, reply) => {
    const { id, cards = [], isDefault = false } = request.body;

    const program = Effect.gen(function* () {
      const deckRepository = yield* DeckRepository;

      // Generate cards if not provided
      const deckCards = cards.length > 0 ? cards : [];
      const allCards = deckCards
        .concat(
          Array.from(
            { length: NUMBER_OF_CARDS_IN_DECK - deckCards.length },
            (_, i) => `card-default-${i + 1}`,
          ),
        )
        .map((cardId) =>
          Card.create({
            id: CardId(cardId),
            url: `https://example.com/${cardId}`,
          }),
        );

      const deck = isDefault
        ? DeckEntity.createDefault({ id: DeckId(id), cards: allCards })
        : DeckEntity.create({
            id: DeckId(id),
            isDefault: false,
            cards: allCards,
            shuffleStrategy: new IdentityDeckShuffleStrategy(),
          });

      yield* deckRepository.save(deck);

      return { success: true, deckId: id };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to setup deck:', error);
      return reply.status(500).send({
        error: 'Failed to setup deck',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/create-game
   * Create a game without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      hostId: string;
      deckId?: string;
      endCondition?: {
        type: 'NumberOfTimesBeingStoryteller' | 'LimitOfPoints';
        numberOfTimes?: number;
        limit?: number;
      };
    };
  }>('/action/create-game', async (request, reply) => {
    const { gameId, hostId, deckId, endCondition } = request.body;

    const program = Effect.gen(function* () {
      const createGameUseCase = yield* CreateGameUseCase;

      yield* createGameUseCase.createGame({
        gameId,
        hostId,
        deckId: Option.fromNullable(deckId),
        endCondition: Option.fromNullable(endCondition).pipe(
          Option.map((ec) =>
            ec.type === 'NumberOfTimesBeingStoryteller'
              ? {
                  type: 'NumberOfTimesBeingStoryteller' as const,
                  numberOfTimes: Option.fromNullable(ec.numberOfTimes),
                }
              : {
                  type: 'LimitOfPoints' as const,
                  limit: ec.limit ?? 30,
                },
          ),
        ),
      });

      return { success: true, gameId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to create game:', error);
      return reply.status(500).send({
        error: 'Failed to create game',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/join-game
   * Join a game without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
    };
  }>('/action/join-game', async (request, reply) => {
    const { gameId, playerId } = request.body;

    const program = Effect.gen(function* () {
      const joinGameUseCase = yield* JoinGameUseCase;

      yield* joinGameUseCase.joinGame({
        gameId,
        playerId,
      });

      return { success: true, gameId, playerId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to join game:', error);
      return reply.status(500).send({
        error: 'Failed to join game',
        message: String(error),
      });
    }
  });

  /**
   * GET /api/test/game/:gameId/snapshot
   * Get the current state of a game
   */
  fastify.get<{
    Params: { gameId: string };
  }>('/game/:gameId/snapshot', async (request, reply) => {
    const { gameId } = request.params;

    const program = Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      const maybeGame = yield* gameRepository.findById(gameId);

      if (Option.isNone(maybeGame)) {
        return { found: false, gameId };
      }

      return {
        found: true,
        gameId,
        snapshot: maybeGame.value.toSnapshot(),
      };
    });

    try {
      const result = await appRuntime.runPromise(program);
      if (!result.found) {
        return reply.status(404).send({ error: 'Game not found', gameId });
      }
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to get game snapshot:', error);
      return reply.status(500).send({
        error: 'Failed to get game snapshot',
        message: String(error),
      });
    }
  });

  /**
   * GET /api/test/player/:playerId
   * Get player info
   */
  fastify.get<{
    Params: { playerId: string };
  }>('/player/:playerId', async (request, reply) => {
    const { playerId } = request.params;

    const program = Effect.gen(function* () {
      const playerRepository = yield* PlayerRepository;

      const maybePlayer = yield* playerRepository.findById(PlayerId(playerId));

      if (Option.isNone(maybePlayer)) {
        return { found: false, playerId };
      }

      return {
        found: true,
        playerId,
        snapshot: maybePlayer.value.toSnapshot(),
      };
    });

    try {
      const result = await appRuntime.runPromise(program);
      if (!result.found) {
        return reply.status(404).send({ error: 'Player not found', playerId });
      }
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to get player:', error);
      return reply.status(500).send({
        error: 'Failed to get player',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/reset
   * Reset the database (truncate all tables)
   * Note: This is also handled by Playwright's globalSetup, but available for manual use
   */
  fastify.post('/reset', async (request, reply) => {
    // This route delegates to a Supabase admin operation
    // For now, return success as the actual reset happens in Playwright config
    return reply.send({ success: true, message: 'Use Playwright reset instead' });
  });
};

export default testRoutes;
