import { Effect, Option } from "effect";
import { GameRepository } from "./game.repository.js";
import { withOptimisticRetry } from "./optimistic-retry.js";
import { PlayerId } from "./player.entity.js";

export type JoinGameCommand = {
  gameId: string;
  playerId: string;
};

export class JoinGameUseCase extends Effect.Service<JoinGameUseCase>()(
  "game/JoinGameUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        joinGame: (props: JoinGameCommand) => {
          const joinGameLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findNotStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error("Game not found")),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const { entity: updatedGame, events } =
                    yield* gameEntity.addPlayer(PlayerId(props.playerId));

                  // Save game and events atomically (outbox pattern)
                  yield* gameRepository.saveWithEvents(updatedGame, events);
                }),
            });
          });

          return withOptimisticRetry(joinGameLogic).pipe(
            Effect.withSpan('JoinGameUseCase.joinGame', {
              attributes: {
                'game.id': props.gameId,
                'player.id': props.playerId,
              },
            }),
          );
        },
      };
    }),
    // No dependencies - GameRepository provided by layer composition
  },
) {}
