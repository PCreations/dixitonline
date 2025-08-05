import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameDriver, GameDriverUnitTestLayer } from './game.driver.js';

describe('Feature: Creating a new game', () => {
	it.effect(
		'Example: Creating a new game with the default deck and settings',
		() => {
			return Effect.gen(function* () {
				const gameDriver = yield* GameDriver;
				yield* gameDriver.given.defaultDeck({
					id: 'id-deck-1',
				});

				yield* gameDriver.useCases.createGame({
					gameId: 'id-game-1',
					hostId: 'id-player-1',
				});

				yield* gameDriver.assert.createdGameToEqual({
					id: 'id-game-1',
					createdBy: 'id-player-1',
					deckId: 'id-deck-1',
					players: ['id-player-1'],
				});
			}).pipe(Effect.provide(GameDriverUnitTestLayer));
		},
	);

	it.effect('Example: Creating a new game with a custom deck', () => {
		return Effect.gen(function* () {
			const gameDriver = yield* GameDriver;
			yield* gameDriver.given.existingDeck({
				id: 'id-deck-2',
			});

			yield* gameDriver.useCases.createGame({
				gameId: 'id-game-1',
				hostId: 'id-player-1',
				deckId: 'id-deck-2',
			});

			yield* gameDriver.assert.createdGameToEqual({
				id: 'id-game-1',
				createdBy: 'id-player-1',
				deckId: 'id-deck-2',
				players: ['id-player-1'],
			});
		}).pipe(Effect.provide(GameDriverUnitTestLayer));
	});

	it.effect(
		'Example: Creating a new game where end condition is "number of time being storyteller"',
		() => {
			return Effect.gen(function* () {
				const gameDriver = yield* GameDriver;

				yield* gameDriver.given.defaultDeck({
					id: 'id-deck-1',
				});

				yield* gameDriver.useCases.createGame({
					gameId: 'id-game-1',
					hostId: 'id-player-1',
					endCondition: {
						type: 'NumberOfTimesBeingStoryteller',
						numberOfTimes: 2,
					},
				});

				yield* gameDriver.assert.createdGameToEqual({
					id: 'id-game-1',
					createdBy: 'id-player-1',
					deckId: 'id-deck-1',
					endCondition: {
						type: 'NumberOfTimesBeingStoryteller',
						numberOfTimes: 2,
					},
					players: ['id-player-1'],
				});
			}).pipe(Effect.provide(GameDriverUnitTestLayer));
		},
	);

	it.effect(
		'Example: Creating a new game where end condition is "limit of points"',
		() => {
			return Effect.gen(function* () {
				const gameDriver = yield* GameDriver;

				yield* gameDriver.given.defaultDeck({
					id: 'id-deck-1',
				});

				yield* gameDriver.useCases.createGame({
					gameId: 'id-game-1',
					hostId: 'id-player-1',
					endCondition: {
						type: 'LimitOfPoints',
						limit: 10,
					},
				});

				yield* gameDriver.assert.createdGameToEqual({
					id: 'id-game-1',
					createdBy: 'id-player-1',
					deckId: 'id-deck-1',
					endCondition: {
						type: 'LimitOfPoints',
						limit: 10,
					},
					players: ['id-player-1'],
				});
			}).pipe(Effect.provide(GameDriverUnitTestLayer));
		},
	);
});
