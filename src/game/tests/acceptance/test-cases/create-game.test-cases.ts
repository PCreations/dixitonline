/**
 * Create Game Test Cases - Pure Effect Programs
 *
 * These test cases are test-runner agnostic and can be used with:
 * - Vitest (via it.effect())
 * - Playwright (via Effect.runPromise())
 *
 * Each test case is a pure Effect program that depends on GameDriver.
 */

import { Effect } from 'effect';
import { GameDriver } from '../../game-driver.interface.js';
import type { IdFactory } from '../test-suites/create-game.test-suite.js';

export interface TestCase<R = GameDriver> {
  readonly name: string;
  readonly program: (idFactory: IdFactory) => Effect.Effect<void, unknown, R>;
  /**
   * If true, this test requires features not available in all channels.
   * E.g., custom deck selection is not available in Playwright E2E UI.
   */
  readonly skipChannels?: ReadonlyArray<'playwright' | 'in-memory' | 'drizzle'>;
}

export const createGameTestCases: ReadonlyArray<TestCase> = [
  {
    name: 'Creating a new game with the default deck and settings',
    program: (idFactory) =>
      Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.defaultDeck({
          id: idFactory.deckId(1),
        });

        yield* gameDriver.when.creatingGame({
          gameId: idFactory.gameId(1),
          hostId: idFactory.playerId(1),
        });

        yield* gameDriver.assert.createdGameToEqual({
          id: idFactory.gameId(1),
          createdBy: idFactory.playerId(1),
          deckId: idFactory.deckId(1),
          players: [idFactory.playerId(1)],
        });
      }),
  },
  {
    name: 'Creating a new game with a custom deck',
    program: (idFactory) =>
      Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingDeck({
          id: idFactory.deckId(2),
        });

        yield* gameDriver.when.creatingGame({
          gameId: idFactory.gameId(1),
          hostId: idFactory.playerId(1),
          deckId: idFactory.deckId(2),
        });

        yield* gameDriver.assert.createdGameToEqual({
          id: idFactory.gameId(1),
          createdBy: idFactory.playerId(1),
          deckId: idFactory.deckId(2),
          players: [idFactory.playerId(1)],
        });
      }),
    // Custom deck selection is not available in Playwright UI
    skipChannels: ['playwright'],
  },
  {
    name: 'Creating a new game where end condition is "number of time being storyteller"',
    program: (idFactory) =>
      Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.defaultDeck({
          id: idFactory.deckId(1),
        });

        yield* gameDriver.when.creatingGame({
          gameId: idFactory.gameId(1),
          hostId: idFactory.playerId(1),
          endCondition: {
            type: 'NumberOfTimesBeingStoryteller',
            numberOfTimes: 2,
          },
        });

        yield* gameDriver.assert.createdGameToEqual({
          id: idFactory.gameId(1),
          createdBy: idFactory.playerId(1),
          deckId: idFactory.deckId(1),
          endCondition: {
            type: 'NumberOfTimesBeingStoryteller',
            numberOfTimes: 2,
          },
          players: [idFactory.playerId(1)],
        });
      }),
  },
  {
    name: 'Creating a new game where end condition is "limit of points"',
    program: (idFactory) =>
      Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.defaultDeck({
          id: idFactory.deckId(1),
        });

        yield* gameDriver.when.creatingGame({
          gameId: idFactory.gameId(1),
          hostId: idFactory.playerId(1),
          endCondition: {
            type: 'LimitOfPoints',
            limit: 10,
          },
        });

        yield* gameDriver.assert.createdGameToEqual({
          id: idFactory.gameId(1),
          createdBy: idFactory.playerId(1),
          deckId: idFactory.deckId(1),
          endCondition: {
            type: 'LimitOfPoints',
            limit: 10,
          },
          players: [idFactory.playerId(1)],
        });
      }),
  },
];
