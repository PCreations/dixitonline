import { Effect, Option } from 'effect';
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
							onNone: () => Effect.succeed(void 0),
							onSome: (gameEntity) =>
								Effect.gen(function* () {
									const updatedGame = yield* gameEntity.addPlayer(
										PlayerId(props.playerId),
									);
									yield* gameRepository.save(updatedGame);
								}),
						});
					}),
			};
		}),
		dependencies: [InMemoryGameRepository],
	},
) {}
