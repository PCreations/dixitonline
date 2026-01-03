import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { GameDriver, GameDriverLayer } from "../game.driver.js";

/**
 * ID Factory for generating test IDs.
 * - For unit tests (in-memory): use simple string IDs
 * - For integration tests (Drizzle/PostgreSQL): use UUIDs
 */
export interface IdFactory {
  gameId: (id: string | number) => string;
  playerId: (id: string | number) => string;
  deckId: (id: string | number) => string;
}

/**
 * Default ID factory that generates simple string IDs.
 * Suitable for unit tests with in-memory repositories.
 */
export const defaultIdFactory: IdFactory = {
  gameId: (id) => `id-game-${id}`,
  playerId: (id) => `id-player-${id}`,
  deckId: (id) => `id-deck-${id}`,
};

export const createGameTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory
) => {
  const { gameId, playerId, deckId } = idFactory;

  describe("Feature: Creating a new game", () => {
    it.effect(
      "Example: Creating a new game with the default deck and settings",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.defaultDeck({
            id: deckId(1),
          });

          yield* gameDriver.when.creatingGame({
            gameId: gameId(1),
            hostId: playerId(1),
          });

          yield* gameDriver.assert.createdGameToEqual({
            id: gameId(1),
            createdBy: playerId(1),
            deckId: deckId(1),
            players: [playerId(1)],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      }
    );

    it.effect("Example: Creating a new game with a custom deck", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingDeck({
          id: deckId(2),
        });

        yield* gameDriver.when.creatingGame({
          gameId: gameId(1),
          hostId: playerId(1),
          deckId: deckId(2),
        });

        yield* gameDriver.assert.createdGameToEqual({
          id: gameId(1),
          createdBy: playerId(1),
          deckId: deckId(2),
          players: [playerId(1)],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      'Example: Creating a new game where end condition is "number of time being storyteller"',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.defaultDeck({
            id: deckId(1),
          });

          yield* gameDriver.when.creatingGame({
            gameId: gameId(1),
            hostId: playerId(1),
            endCondition: {
              type: "NumberOfTimesBeingStoryteller",
              numberOfTimes: 2,
            },
          });

          yield* gameDriver.assert.createdGameToEqual({
            id: gameId(1),
            createdBy: playerId(1),
            deckId: deckId(1),
            endCondition: {
              type: "NumberOfTimesBeingStoryteller",
              numberOfTimes: 2,
            },
            players: [playerId(1)],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      }
    );

    it.effect(
      'Example: Creating a new game where end condition is "limit of points"',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.defaultDeck({
            id: deckId(1),
          });

          yield* gameDriver.when.creatingGame({
            gameId: gameId(1),
            hostId: playerId(1),
            endCondition: {
              type: "LimitOfPoints",
              limit: 10,
            },
          });

          yield* gameDriver.assert.createdGameToEqual({
            id: gameId(1),
            createdBy: playerId(1),
            deckId: deckId(1),
            endCondition: {
              type: "LimitOfPoints",
              limit: 10,
            },
            players: [playerId(1)],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      }
    );
  });
};
