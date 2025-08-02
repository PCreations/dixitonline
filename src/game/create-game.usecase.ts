import { Effect, Option } from 'effect';
import { DeckId } from './deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from './deck.repository.js';
import { EndCondition, GameEntity, GameId } from './game.entity.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { PlayerId } from './player.entity.js';

export type CreateGameCommand = {
	gameId: string;
	playerId: string;
	deckId: Option.Option<string>;
	endCondition: Option.Option<{
		type: 'number-of-times-being-storyteller';
		numberOfTimes: Option.Option<number>;
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

						const endCondition =
							EndCondition.createNumberOfTimesBeingStoryteller({
								numberOfTimes: Option.flatMap(
									props.endCondition,
									(endCondition) => endCondition.numberOfTimes,
								),
							});

						const game = GameEntity.create({
							id: GameId(props.gameId),
							createdBy: PlayerId(props.playerId),
							deckId: DeckId(
								Option.getOrElse(props.deckId, () =>
									Option.getOrThrow(defaultDeckId),
								),
							),
							endCondition,
						});

						yield* gameRepository.save(game);
					}),
			};
		}),
		dependencies: [InMemoryGameRepository, InMemoryDeckRepository],
	},
) {}
