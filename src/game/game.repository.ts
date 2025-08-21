import { Context, Data, Effect, Layer, Option } from "effect";
import { GameEntity } from "./game.entity.js";

export class OptimisticConcurrencyError extends Data.TaggedError(
  "OptimisticConcurrencyError",
)<{}> {}

export class GameRepository extends Effect.Tag("game/GameRepository")<
  GameRepository,
  {
    save: (game: GameEntity) => Effect.Effect<void, OptimisticConcurrencyError>;
    findById: (id: string) => Effect.Effect<Option.Option<GameEntity>>;
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
  const games = new Map<string, GameEntity>();
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
      const actualGame = Option.fromNullable(games.get(gameToBeSaved.props.id));
      if (shouldThrowOptimisticConcurrencyError(gameToBeSaved, actualGame)) {
        return Effect.fail(new OptimisticConcurrencyError());
      }
      games.set(gameToBeSaved.props.id, gameToBeSaved);
      return Effect.succeed(void 0);
    },
    findById: (id: string) => {
      const staleGame = Option.fromNullable(staleReads.get(id));
      const actualGame = Option.fromNullable(games.get(id));
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
      const maybeGame = Option.fromNullable(games.get(gameId));
      if (Option.isNone(maybeGame)) {
        return Effect.succeed(false);
      }
      return Effect.succeed(
        maybeGame.value.toSnapshot().players.includes(playerId),
      );
    },
    simulateStaleRead: (staleGame: GameEntity) => {
      staleReads.set(staleGame.props.id, staleGame);
      return Effect.succeed(void 0);
    },
  };
};

export const InMemoryGameRepository = Layer.sync(
  GameRepository,
  makeInMemoryGameRepository,
);
