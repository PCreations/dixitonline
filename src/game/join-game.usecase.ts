import { Effect, Either, Option } from 'effect';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { PlayerId } from './player.entity.js';

export type JoinGameCommand = {
	gameId: string;
	playerId: string;
};

export class JoinGameUseCase extends Effect.Service<JoinGameUseCase>()(
	'game/JoinGameUseCase',
	{
		effect: Effect.gen(function* () {
			const gameRepository = yield* GameRepository;

			return {
				joinGame: (props: JoinGameCommand) =>
					Effect.gen(function* () {
						const game = yield* gameRepository.findById(props.gameId);

						return yield* Option.match(game, {
							onNone: () => Effect.fail(new Error('Game not found')),
							onSome: (gameEntity) =>
								Effect.gen(function* () {
									const updatedGame = yield* gameEntity.addPlayer(
										PlayerId(props.playerId),
									);
									const result = yield* Effect.either(gameRepository.save(updatedGame));
									if (Either.isLeft(result)) {
										yield* Effect.fail(new Error('Game is full'));
									}
									return yield* Effect.succeed(result);
								}),
						});
					}),
			};
		}),
		dependencies: [InMemoryGameRepository],
	},
) {}
