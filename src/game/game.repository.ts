import { Context, Data, Effect, Layer, Option, ParseResult } from 'effect';
import {
  EndedGameEntity,
  GameEntity,
  isNotStartedGame,
  isStartedGame,
  NotStartedGameEntity,
  StartedGameEntity,
} from './game.entity.js';
import type { GameEvent } from './game-events.js';

const isEndedGame = (game: GameEntity): game is EndedGameEntity =>
  !isNotStartedGame(game) && !isStartedGame(game);

export class OptimisticConcurrencyError extends Data.TaggedError(
  'OptimisticConcurrencyError',
)<{}> {}

/**
 * Database error that preserves the original error in the cause chain.
 * Uses native ES2022 Error cause so Sentry can display the full error chain.
 */
export class DatabaseError extends Error {
  readonly _tag = 'DatabaseError' as const;

  constructor(options: { message: string; cause: unknown }) {
    super(options.message, { cause: options.cause });
    this.name = 'DatabaseError';
  }
}

export class GameRepository extends Effect.Tag('game/GameRepository')<
  GameRepository,
  {
    save: (
      game: GameEntity,
    ) => Effect.Effect<
      void,
      OptimisticConcurrencyError | DatabaseError | ParseResult.ParseError
    >;
    /**
     * Save the game and events atomically in a transaction.
     * Events are inserted into the outbox table for reliable delivery.
     */
    saveWithEvents: (
      game: GameEntity,
      events: ReadonlyArray<GameEvent>,
    ) => Effect.Effect<
      void,
      OptimisticConcurrencyError | DatabaseError | ParseResult.ParseError
    >;
    findById: (
      id: string,
    ) => Effect.Effect<
      Option.Option<NotStartedGameEntity | StartedGameEntity | EndedGameEntity>,
      ParseResult.ParseError | DatabaseError
    >;
    findNotStartedGameById: (
      id: string,
    ) => Effect.Effect<
      Option.Option<NotStartedGameEntity>,
      ParseResult.ParseError | DatabaseError
    >;
    findStartedGameById: (
      id: string,
    ) => Effect.Effect<
      Option.Option<StartedGameEntity>,
      ParseResult.ParseError | DatabaseError
    >;
    findEndedGameById: (
      id: string,
    ) => Effect.Effect<
      Option.Option<EndedGameEntity>,
      ParseResult.ParseError | DatabaseError
    >;
    isPlayerInGame: (
      gameId: string,
      playerId: string,
    ) => Effect.Effect<boolean, DatabaseError>;
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
        notStartedGames.get(gameToBeSaved.id) ??
        endedGames.get(gameToBeSaved.id),
    );
    if (shouldThrowOptimisticConcurrencyError(gameToBeSaved, actualGame)) {
      return Effect.fail(new OptimisticConcurrencyError());
    }
    if (isNotStartedGame(gameToBeSaved)) {
      notStartedGames.set(gameToBeSaved.id, gameToBeSaved);
    } else if (isStartedGame(gameToBeSaved)) {
      startedGames.set(gameToBeSaved.id, gameToBeSaved);
    } else if (isEndedGame(gameToBeSaved)) {
      // Clean up from other maps when game ends
      startedGames.delete(gameToBeSaved.id);
      notStartedGames.delete(gameToBeSaved.id);
      endedGames.set(gameToBeSaved.id, gameToBeSaved);
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
          | EndedGameEntity
          | undefined,
      );
      const actualGame = Option.fromNullable(
        startedGames.get(id) ?? notStartedGames.get(id) ?? endedGames.get(id),
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
        notStartedGames.get(gameId) ??
          startedGames.get(gameId) ??
          endedGames.get(gameId),
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
    const { GameEventBus } = yield* Effect.promise(
      () => import('./game-event-bus.js'),
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
