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

	it.effect('Example: A player already in a game cannot join again', () => {
		return Effect.gen(function* () {
			const gameDriver = yield* GameDriver;

			yield* gameDriver.given.existingGame({
				gameId: 'id-game-1',
				hostId: 'id-player-1',
				players: ['id-player-1', 'id-player-2'],
			});

			yield* gameDriver.useCases.joinGame({
				gameId: 'id-game-1',
				playerId: 'id-player-2',
			});

			yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
				error: 'Player already in game',
			});
		}).pipe(Effect.provide(GameDriverUnitTestLayer));
	});

	it.effect('Example: A player cannot join a game that does not exist', () => {
		return Effect.gen(function* () {
			const gameDriver = yield* GameDriver;

			yield* gameDriver.useCases.joinGame({
				gameId: 'id-game-does-not-exist',
				playerId: 'id-player-2',
			});

			yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
				error: 'Game not found',
			});
		}).pipe(Effect.provide(GameDriverUnitTestLayer));
	});

	it.effect('Example: A player cannot join a game that is already full', () => {
		return Effect.gen(function* () {
			const gameDriver = yield* GameDriver;

			yield* gameDriver.given.existingFullGame({
				gameId: 'id-game-1',
			});

			yield* gameDriver.useCases.joinGame({
				gameId: 'id-game-1',
				playerId: 'id-player-not-in-game',
			});

			yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
				error: 'Game is full',
			});
		}).pipe(Effect.provide(GameDriverUnitTestLayer));
	});

	it.effect(
		'Example: Optimistic concurrency: A player cannot join a game that is already full at the time of joining if other player just joined',
		() => {
			return Effect.gen(function* () {
				const gameDriver = yield* GameDriver;

				yield* gameDriver.given.existingGame({
					gameId: 'id-game-1',
					hostId: 'id-player-1',
					players: [
						'id-player-1',
						'id-player-2',
						'id-player-3',
						'id-player-4',
						'id-player-5',
					],
				});
				yield* gameDriver.given.otherPlayerJustJoinedInBetween({
					gameId: 'id-game-1',
					playerId: 'id-player-6',
				});

				yield* gameDriver.useCases.joinGame({
					gameId: 'id-game-1',
					playerId: 'id-player-7',
				});

				yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
					error: 'Game is full',
				});
			}).pipe(Effect.provide(GameDriverUnitTestLayer));
		},
	);
});
