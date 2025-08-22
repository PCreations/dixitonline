import { Context, Data, Effect, Layer, Option } from "effect";
import {
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
    save: (game: GameEntity) => Effect.Effect<void, OptimisticConcurrencyError>;
    findById: (
      id: string,
    ) => Effect.Effect<Option.Option<NotStartedGameEntity | StartedGameEntity>>;
    findNotStartedGameById: (
      id: string,
    ) => Effect.Effect<Option.Option<NotStartedGameEntity>>;
    findStartedGameById: (
      id: string,
    ) => Effect.Effect<Option.Option<StartedGameEntity>>;
    isPlayerInGame: (
      gameId: string,
      playerId: string,
    ) => Effect.Effect<boolean>;
    simulateStaleRead: (
      staleGame: GameEntity,
    ) => Effect.Effect<void>;
  }
>() {}

const makeInMemoryGameRepository = (): Context.Tag.Service<GameRepository> => {
  const notStartedGames = new Map<string, NotStartedGameEntity>();
  const startedGames = new Map<string, StartedGameEntity>();
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

  return {
    save: (gameToBeSaved: GameEntity) => {
      const actualGame = Option.fromNullable(
        notStartedGames.get(gameToBeSaved.id) ??
          startedGames.get(gameToBeSaved.id),
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
    },
    findById: (id: string) => {
      const staleGame = Option.fromNullable(
        staleReads.get(id) as
          | NotStartedGameEntity
          | StartedGameEntity
          | undefined,
      );
      const actualGame = Option.fromNullable(
        notStartedGames.get(id) ?? startedGames.get(id),
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
      const actualGame = Option.fromNullable(
        notStartedGames.get(id),
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

export const InMemoryGameRepository = Layer.sync(
  GameRepository,
  makeInMemoryGameRepository,
);
