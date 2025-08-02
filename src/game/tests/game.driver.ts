import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase } from '../create-game.usecase.js';
import { DeckEntity, DeckId } from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
import { GameEntity, GameId } from '../game.entity.js';
import { GameRepository, InMemoryGameRepository } from '../game.repository.js';

interface GameDriverDSL {
	readonly given: {
		readonly defaultDeck: (props: { id: string }) => Effect.Effect<void>;
		readonly existingDeck: (props: { id: string }) => Effect.Effect<void>;
	};
	readonly useCases: {
		readonly createGame: (props: {
			gameId: string;
			playerId: string;
			deckId?: string;
			endCondition?: {
				type: 'number-of-times-being-storyteller';
				numberOfTimes: number;
			};
		}) => Effect.Effect<void>;
	};
	readonly assert: {
		readonly createdGameToEqual: (game: {
			id: string;
			createdBy: string;
			deckId: string;
			endCondition?: {
				type: 'number-of-times-being-storyteller';
				numberOfTimes: number;
			};
		}) => Effect.Effect<void, never, never>;
	};
}

export class GameDriver extends Context.Tag('GameDriver')<
	GameDriver,
	GameDriverDSL
>() {}

export const GameDriverUnitTestLayer = Layer.effect(
	GameDriver,
	Effect.gen(function* () {
		const createGameUseCase = yield* CreateGameUseCase;
		const gameRepository = yield* GameRepository;
		const deckRepository = yield* DeckRepository;

		return {
			given: {
				defaultDeck: (props: { id: string }) =>
					deckRepository.save(
						DeckEntity.createDefault({ id: DeckId(props.id) }),
					),
				existingDeck: (props: { id: string }) =>
					deckRepository.save(
						DeckEntity.create({ id: DeckId(props.id), isDefault: false }),
					),
			},
			useCases: {
				createGame: (props: {
					gameId: string;
					playerId: string;
					deckId?: string;
					endCondition?: {
						type: 'number-of-times-being-storyteller';
						numberOfTimes: number;
					};
				}) =>
					createGameUseCase.createGame({
						gameId: props.gameId,
						playerId: props.playerId,
						deckId: Option.fromNullable(props.deckId),
						endCondition: Option.fromNullable(props.endCondition),
					}),
			},
			assert: {
				createdGameToEqual: (game: {
					id: string;
					createdBy: string;
					deckId: string;
					endCondition?: {
						type: 'number-of-times-being-storyteller';
						numberOfTimes: number;
					};
				}) =>
					Effect.gen(function* () {
						const createdGame = yield* gameRepository.findById(game.id);

						expect(createdGame).toEqual(
							Option.some(
								GameEntity.create({
									id: GameId(game.id),
									createdBy: game.createdBy,
									deckId: DeckId(game.deckId),
									endCondition: {
										type: 'number-of-times-being-storyteller',
										numberOfTimes: 3,
										...game.endCondition,
									},
								}),
							),
						);
					}),
			},
		};
	}),
).pipe(
	Layer.provide(
		Layer.mergeAll(
			InMemoryGameRepository,
			InMemoryDeckRepository,
			CreateGameUseCase.Default,
		),
	),
);
