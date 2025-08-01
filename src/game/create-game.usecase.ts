import { Effect, Option } from 'effect';
import { DeckRepository, InMemoryDeckRepository } from './deck.repository.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';

export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()(
	'game/CreateGameUseCase',
	{
		effect: Effect.gen(function* () {
			const gameRepository = yield* GameRepository;
			const deckRepository = yield* DeckRepository;

			return {
				createGame: (props: {
					gameId: string;
					playerId: string;
					deckId: Option.Option<string>;
					endCondition: Option.Option<{
						type: 'number-of-times-being-storyteller';
						numberOfTimes: number;
					}>;
				}) =>
					Effect.gen(function* () {
						const defaultDeckId = yield* deckRepository.getDefaultDeckId();

						yield* gameRepository.save({
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
					}),
			};
		}),
		dependencies: [InMemoryGameRepository, InMemoryDeckRepository],
	},
) {}
