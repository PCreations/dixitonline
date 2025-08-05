import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameDriver, GameDriverUnitTestLayer } from './game.driver.js';

describe('Feature: Joining a game as a player', () => {
	it.effect('Example: Joining a game as a player', () => {
		return Effect.gen(function* () {
			const gameDriver = yield* GameDriver;

			yield* gameDriver.given.existingGame({
				gameId: 'id-game-1',
				hostId: 'id-player-1',
			});

			yield* gameDriver.useCases.joinGame({
				gameId: 'id-game-1',
				playerId: 'id-player-2',
			});

			yield* gameDriver.assert.playerToHaveJoinedGame({
				gameId: 'id-game-1',
				playerId: 'id-player-2',
			});
		}).pipe(Effect.provide(GameDriverUnitTestLayer));
	});
});
