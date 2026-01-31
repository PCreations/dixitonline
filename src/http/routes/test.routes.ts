/**
 * Test Routes - Backdoor API endpoints for E2E tests
 *
 * These routes are ONLY available in test/development mode.
 * They allow the Playwright driver to:
 * - Setup test data (decks, games)
 * - Query game state for assertions
 * - Perform actions without authentication
 * - Authenticate as a specific player
 *
 * SECURITY: These routes bypass authentication and should NEVER be enabled in production.
 */

import { Effect, Option } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import * as jose from 'jose';

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
import { LeaveGameUseCase } from '../../game/leave-game.usecase.js';
import { NotifyReadyForNextTurnUseCase } from '../../game/notify-ready-for-next-turn.usecase.js';
import { SelectCardUseCase } from '../../game/select-card.usecase.js';
import { StartGameUseCase } from '../../game/start-game.usecase.js';
import { SubmitClueUseCase } from '../../game/submit-clue.usecase.js';
import { VoteOnCardUseCase } from '../../game/vote-on-card.usecase.js';
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
   * POST /api/test/action/leave-game
   * Leave a game without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
    };
  }>('/action/leave-game', async (request, reply) => {
    const { gameId, playerId } = request.body;

    const program = Effect.gen(function* () {
      const leaveGameUseCase = yield* LeaveGameUseCase;

      yield* leaveGameUseCase.leaveGame({
        gameId,
        playerId,
      });

      return { success: true, gameId, playerId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to leave game:', error);
      return reply.status(500).send({
        error: 'Failed to leave game',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/start-game
   * Start a game without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
    };
  }>('/action/start-game', async (request, reply) => {
    const { gameId, playerId } = request.body;

    const program = Effect.gen(function* () {
      const startGameUseCase = yield* StartGameUseCase;

      yield* startGameUseCase.startGame({
        gameId,
        playerId,
      });

      return { success: true, gameId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to start game:', error);
      return reply.status(500).send({
        error: 'Failed to start game',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/submit-clue
   * Submit a clue without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
      cardId: string;
      clue: string;
    };
  }>('/action/submit-clue', async (request, reply) => {
    const { gameId, playerId, cardId, clue } = request.body;

    const program = Effect.gen(function* () {
      const submitClueUseCase = yield* SubmitClueUseCase;

      yield* submitClueUseCase.submitClue({
        gameId,
        playerId,
        cardId,
        clue,
      });

      return { success: true, gameId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to submit clue:', error);
      return reply.status(500).send({
        error: 'Failed to submit clue',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/select-card
   * Select a card without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
      cardId: string;
    };
  }>('/action/select-card', async (request, reply) => {
    const { gameId, playerId, cardId } = request.body;

    const program = Effect.gen(function* () {
      const selectCardUseCase = yield* SelectCardUseCase;

      yield* selectCardUseCase.selectCard({
        gameId,
        playerId,
        cardId,
      });

      return { success: true, gameId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to select card:', error);
      return reply.status(500).send({
        error: 'Failed to select card',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/vote-on-card
   * Vote on a card without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
      cardId: string;
    };
  }>('/action/vote-on-card', async (request, reply) => {
    const { gameId, playerId, cardId } = request.body;

    const program = Effect.gen(function* () {
      const voteOnCardUseCase = yield* VoteOnCardUseCase;

      yield* voteOnCardUseCase.voteOnCard({
        gameId,
        playerId,
        cardId,
      });

      return { success: true, gameId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to vote on card:', error);
      return reply.status(500).send({
        error: 'Failed to vote on card',
        message: String(error),
      });
    }
  });

  /**
   * POST /api/test/action/notify-ready
   * Notify ready for next turn without authentication
   */
  fastify.post<{
    Body: {
      gameId: string;
      playerId: string;
    };
  }>('/action/notify-ready', async (request, reply) => {
    const { gameId, playerId } = request.body;

    const program = Effect.gen(function* () {
      const notifyReadyUseCase = yield* NotifyReadyForNextTurnUseCase;

      yield* notifyReadyUseCase.notifyReadyForNextTurn({
        gameId,
        playerId,
      });

      return { success: true, gameId };
    });

    try {
      const result = await appRuntime.runPromise(program);
      return reply.send(result);
    } catch (error) {
      console.error('[test-routes] Failed to notify ready:', error);
      return reply.status(500).send({
        error: 'Failed to notify ready',
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
    return reply.send({
      success: true,
      message: 'Use Playwright reset instead',
    });
  });

  /**
   * POST /api/test/auth/login
   * Authenticate as a specific player by setting a test JWT cookie.
   * This bypasses Supabase Auth for E2E testing purposes.
   */
  fastify.post<{
    Body: {
      playerId: string;
      username?: string;
    };
  }>('/auth/login', async (request, reply) => {
    const { playerId, username } = request.body;

    // Generate a test JWT with the specified playerId as the sub claim
    const jwtSecret =
      process.env.SUPABASE_JWT_SECRET ||
      'super-secret-jwt-token-with-at-least-32-characters-long';
    const secretKey = new TextEncoder().encode(jwtSecret);

    const token = await new jose.SignJWT({
      sub: playerId,
      is_anonymous: true,
      user_metadata: { username: username || playerId },
      role: 'authenticated',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    // Set the auth cookie
    reply.header(
      'Set-Cookie',
      `sb-access-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
    );

    return reply.send({
      success: true,
      playerId,
      username: username || playerId,
      token, // Include token in response for Playwright to use
    });
  });
};

export default testRoutes;
