import { Effect, Option } from 'effect';
import { CardId } from './deck.entity.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { withOptimisticRetry } from './optimistic-retry.js';
import { PlayerId } from './player.entity.js';

export type SelectCardCommand = {
  gameId: string;
  playerId: string;
  cardId: string;
};

export class SelectCardUseCase extends Effect.Service<SelectCardUseCase>()(
  'game/SelectCardUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        selectCard: (props: SelectCardCommand) => {
          const selectCardLogic = Effect.gen(function* () {
            const game = yield* gameRepository.findStartedGameById(
              props.gameId,
            );

            return yield* Option.match(game, {
              onNone: () => Effect.fail(new Error('Game not found')),
              onSome: (gameEntity) =>
                Effect.gen(function* () {
                  const updatedGame = yield* gameEntity.selectCard({
                    playerId: PlayerId(props.playerId),
                    cardId: CardId(props.cardId),
                  }); //?

                  yield* gameRepository.save(updatedGame);
                }),
            });
          });

          return withOptimisticRetry(selectCardLogic);
        },
      };
    }),
    dependencies: [InMemoryGameRepository],
  },
) {}
