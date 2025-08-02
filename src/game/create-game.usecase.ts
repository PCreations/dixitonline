import { Effect, Option } from 'effect';
import { DeckRepository, InMemoryDeckRepository } from './deck.repository.js';
import { GameEntity } from './game.entity.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';

export type CreateGameCommand = {
	gameId: string;
	playerId: string;
	deckId: Option.Option<string>;
	endCondition: Option.Option<{
		type: 'number-of-times-being-storyteller';
		numberOfTimes: number;
	}>;
};

export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()(
	'game/CreateGameUseCase',
	{
		effect: Effect.gen(function* () {
			const gameRepository = yield* GameRepository;
			const deckRepository = yield* DeckRepository;

			return {
				createGame: (props: CreateGameCommand) =>
					Effect.gen(function* () {
						const defaultDeckId = yield* deckRepository.getDefaultDeckId();

						const game = GameEntity.create({
							id: props.gameId,
							createdBy: props.playerId,
							deckId: Option.getOrElse(props.deckId, () =>
								Option.getOrThrow(defaultDeckId),
							),
							endCondition: Option.getOrElse(props.endCondition, () => ({
								type: 'number-of-times-being-storyteller',
								numberOfTimes: 3,
							})),
						});

						yield* gameRepository.save(game);
					}),
			};
		}),
		dependencies: [InMemoryGameRepository, InMemoryDeckRepository],
	},
) {}
