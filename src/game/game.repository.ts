import { Context, Data, Effect, Layer, Option, ParseResult } from "effect";
import { UnknownException } from "effect/Cause";
import type { GameEvent } from "./game-events.js";
import {
  EndedGameEntity,
  GameEntity,
  isNotStartedGame,
  NotStartedGameEntity,
  StartedGameEntity,
} from "./game.entity.js";

export class OptimisticConcurrencyError extends Data.TaggedError(
  "OptimisticConcurrencyError",
)<{}> {}

export class GameRepository extends Effect.Tag("game/GameRepository")<
  GameRepository,
  {
    save: (game: GameEntity) => Effect.Effect<void, OptimisticConcurrencyError | UnknownException | ParseResult.ParseError>;
    /**
     * Save the game and events atomically in a transaction.
     * Events are inserted into the outbox table for reliable delivery.
     */
    saveWithEvents: (
      game: GameEntity,
      events: ReadonlyArray<GameEvent>,
    ) => Effect.Effect<void, OptimisticConcurrencyError | UnknownException | ParseResult.ParseError>;
    findById: (
      id: string,
    ) => Effect.Effect<Option.Option<NotStartedGameEntity | StartedGameEntity>, ParseResult.ParseError>;
    findNotStartedGameById: (
      id: string,
    ) => Effect.Effect<Option.Option<NotStartedGameEntity>, ParseResult.ParseError>;
    findStartedGameById: (
      id: string,
    ) => Effect.Effect<Option.Option<StartedGameEntity>, ParseResult.ParseError>;
    findEndedGameById: (
      id: string,
    ) => Effect.Effect<Option.Option<EndedGameEntity>, ParseResult.ParseError>;
    isPlayerInGame: (
      gameId: string,
      playerId: string,
    ) => Effect.Effect<boolean>;
    simulateStaleRead: (staleGame: GameEntity) => Effect.Effect<void>;
  }
>() {}

type InMemoryGameRepositoryOptions = {
  readonly onEvents?: (events: ReadonlyArray<GameEvent>) => void;
};

const makeInMemoryGameRepository = (
  options: InMemoryGameRepositoryOptions = {},
): Context.Tag.Service<GameRepository> => {
  const notStartedGames = new Map<string, NotStartedGameEntity>();
  const startedGames = new Map<string, StartedGameEntity>();
  const endedGames = new Map<string, EndedGameEntity>();
  const staleReads = new Map<string, GameEntity>();

  const shouldThrowOptimisticConcurrencyError = (
    gameToBeSaved: GameEntity,
    existingGame: Option.Option<GameEntity>,
  ) => {
    // Simulation here of a query that could resemble "update game where id = $id and version = $version set version = $gameToBeSaved.version - 1"
    return Option.getOrElse(
      Option.map(existingGame, (existingGame) => {
        return existingGame.version !== gameToBeSaved.version - 1;
      }),
      () => false,
    );
  };

  const save = (gameToBeSaved: GameEntity) => {
    const actualGame = Option.fromNullable(
      startedGames.get(gameToBeSaved.id) ??
        notStartedGames.get(gameToBeSaved.id),
    );
    if (shouldThrowOptimisticConcurrencyError(gameToBeSaved, actualGame)) {
      return Effect.fail(new OptimisticConcurrencyError());
    }
    if (isNotStartedGame(gameToBeSaved)) {
      notStartedGames.set(gameToBeSaved.id, gameToBeSaved);
    } else {
      startedGames.set(gameToBeSaved.id, gameToBeSaved as StartedGameEntity);
    }
    return Effect.succeed(void 0);
  };

  return {
    save,
    // In-memory: save the game and optionally notify about events
    saveWithEvents: (game, events) => {
      const result = save(game);
      if (options.onEvents && events.length > 0) {
        options.onEvents(events);
      }
      return result;
    },
    findById: (id: string) => {
      const staleGame = Option.fromNullable(
        staleReads.get(id) as
          | NotStartedGameEntity
          | StartedGameEntity
          | undefined,
      );
      const actualGame = Option.fromNullable(
        startedGames.get(id) ?? notStartedGames.get(id),
      );
      return Option.match(staleGame, {
        onNone: () => {
          return Effect.succeed(actualGame);
        },
        onSome: () => {
          staleReads.delete(id);
          return Effect.succeed(staleGame);
        },
      });
    },
    findNotStartedGameById: (id: string) => {
      const staleGame = Option.fromNullable(
        staleReads.get(id) as NotStartedGameEntity | undefined,
      );
      const actualGame = Option.fromNullable(notStartedGames.get(id));
      return Option.match(staleGame, {
        onNone: () => {
          return Effect.succeed(actualGame);
        },
        onSome: () => {
          staleReads.delete(id);
          return Effect.succeed(staleGame);
        },
      });
    },
    findStartedGameById: (id: string) => {
      const staleGame = Option.fromNullable(
        staleReads.get(id) as StartedGameEntity | undefined,
      );
      const actualGame = Option.fromNullable(startedGames.get(id));
      return Option.match(staleGame, {
        onNone: () => {
          return Effect.succeed(actualGame);
        },
        onSome: () => {
          staleReads.delete(id);
          return Effect.succeed(staleGame);
        },
      });
    },
    findEndedGameById: (id: string) => {
      const staleGame = Option.fromNullable(
        staleReads.get(id) as EndedGameEntity | undefined,
      );
      const actualGame = Option.fromNullable(endedGames.get(id));
      return Option.match(staleGame, {
        onNone: () => {
          return Effect.succeed(actualGame);
        },
        onSome: () => {
          staleReads.delete(id);
          return Effect.succeed(staleGame);
        },
      });
    },
    isPlayerInGame: (gameId: string, playerId: string) => {
      const maybeGame = Option.fromNullable(
        notStartedGames.get(gameId) ?? startedGames.get(gameId),
      );
      if (Option.isNone(maybeGame)) {
        return Effect.succeed(false);
      }
      return Effect.succeed(
        maybeGame.value.toSnapshot().players.includes(playerId),
      );
    },
    simulateStaleRead: (staleGame: GameEntity) => {
      staleReads.set(staleGame.id, staleGame);
      return Effect.succeed(void 0);
    },
  };
};

export { makeInMemoryGameRepository };

export const InMemoryGameRepository = Layer.sync(
  GameRepository,
  makeInMemoryGameRepository,
);

/**
 * In-memory repository that publishes events to the GameEventBus.
 * Used in tests to simulate the outbox pattern behavior.
 */
export const InMemoryGameRepositoryWithEventBus = Layer.effect(
  GameRepository,
  Effect.gen(function* () {
    const { GameEventBus } = yield* Effect.promise(() =>
      import('./game-event-bus.js'),
    );
    const eventBus = yield* GameEventBus;

    return makeInMemoryGameRepository({
      onEvents: (events) => {
        for (const event of events) {
          Effect.runSync(eventBus.publish(event));
        }
      },
    });
  }),
);
