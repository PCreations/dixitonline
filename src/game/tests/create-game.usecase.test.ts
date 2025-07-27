import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameDriver, GameDriverUnitTestLayer } from './game.driver.js';

describe('Feature: Creating a new game', () => {
	it.effect(
		'Example: Creating a new game with the default deck and settings',
		() => {
			return Effect.gen(function* () {
				const gameDriver = yield* GameDriver;

				yield* gameDriver.useCases.createGame({
					gameId: 'id-game-1',
					playerId: 'id-player-1',
				});

				yield* gameDriver.assert.createdGameToEqual({
					id: 'id-game-1',
					createdBy: 'id-player-1',
				});
			}).pipe(Effect.provide(GameDriverUnitTestLayer));
		},
	);
});
