import { Effect, Option } from 'effect';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { PlayerId } from './player.entity.js';

export type LeaveGameCommand = {
	gameId: string;
	playerId: string;
};

export class LeaveGameUseCase extends Effect.Service<LeaveGameUseCase>()(
	'game/LeaveGameUseCase',
	{
		effect: Effect.gen(function* () {
			const gameRepository = yield* GameRepository;

			return {
				leaveGame: (props: LeaveGameCommand) =>
					Effect.gen(function* () {
						const game = yield* gameRepository.findById(props.gameId);

						return yield* Option.match(game, {
							onNone: () => Effect.fail(new Error('Game not found')),
							onSome: (gameEntity) =>
								Effect.gen(function* () {
									const updatedGame = yield* gameEntity.removePlayer(
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
