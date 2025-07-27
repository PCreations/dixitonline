import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { CreateGameUseCase, GameRepository, InMemoryGameRepository } from '../create-game.usecase.js';

interface GameDriverDSL {
	readonly useCases: {
		readonly createGame: (props: {
			gameId: string;
			playerId: string;
		}) => Effect.Effect<void>;
	};
	readonly assert: {
		readonly createdGameToEqual: (game: {
			id: string;
			createdBy: string;
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

		return {
			useCases: {
				createGame: (props: { gameId: string; playerId: string }) =>
					createGameUseCase.createGame(props),
			},
			assert: {
				createdGameToEqual: (game: { id: string; createdBy: string }) =>
					Effect.gen(function* () {
						const createdGame = yield* gameRepository.findById(game.id);

						expect(createdGame).toEqual(Option.some(game));
					}),
			},
		};
	}),
).pipe(Layer.provide(Layer.mergeAll(InMemoryGameRepository, CreateGameUseCase.Default)));
