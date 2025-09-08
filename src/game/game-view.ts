import { Context, Effect, Layer } from "effect";
import { GameId } from "./game.entity.js";
import { GameViewValueObject } from "./game-view-projector.js";

export class GameView extends Effect.Tag("game/GameView")<
  GameView,
  {
    save(gameView: GameViewValueObject): Effect.Effect<void>;
    get(gameId: GameId): Effect.Effect<GameViewValueObject>;
  }
>() {}

const makeInMemoryGameView = (): Context.Tag.Service<GameView> => {
  const gameViews = new Map<GameId, GameViewValueObject>();

  return {
    save: (gameView) => {
      gameViews.set(GameId(Object.values(gameView)[0]!.gameId), gameView);

      return Effect.succeed(void 0);
    },
    get: (gameId) => {
      return Effect.succeed(gameViews.get(gameId) ?? {});
    },
  };
};

export const InMemoryGameView = Layer.sync(
  GameView,
  makeInMemoryGameView,
);
