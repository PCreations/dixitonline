import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase } from '../create-game.usecase.js';
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
		}) => Effect.Effect<void>;
	};
	readonly assert: {
		readonly createdGameToEqual: (game: {
			id: string;
			createdBy: string;
			deckId: string;
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
					deckRepository.save({ id: props.id, isDefault: true }),
				existingDeck: (props: { id: string }) =>
					deckRepository.save({ id: props.id, isDefault: false }),
			},
			useCases: {
				createGame: (props: {
					gameId: string;
					playerId: string;
					deckId?: string;
				}) =>
					createGameUseCase.createGame({
						gameId: props.gameId,
						playerId: props.playerId,
						deckId: Option.fromNullable(props.deckId),
					}),
			},
			assert: {
				createdGameToEqual: (game: {
					id: string;
					createdBy: string;
					deckId: string;
				}) =>
					Effect.gen(function* () {
						const createdGame = yield* gameRepository.findById(game.id);

						expect(createdGame).toEqual(Option.some(game));
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
