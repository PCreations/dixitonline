import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase } from '../create-game.usecase.js';
import { DeckEntity, DeckId } from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
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
						endCondition: Option.fromNullable(props.endCondition).pipe(
							Option.map((endCondition) => ({
								type: endCondition.type,
								numberOfTimes: Option.some(endCondition.numberOfTimes),
							})),
						),
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

						Option.match(createdGame, {
							onNone: () => expect.fail('Game not found'),
							onSome: (gameEntity) =>
								expect(gameEntity.toSnapshot()).toEqual({
									id: game.id,
									createdBy: game.createdBy,
									deckId: game.deckId,
									endCondition: game.endCondition ?? {
										type: 'number-of-times-being-storyteller',
										numberOfTimes: 3,
									},
								}),
						});
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
