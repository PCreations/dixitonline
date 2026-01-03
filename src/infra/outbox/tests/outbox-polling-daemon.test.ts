import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameId } from '../../../game/game.entity.js';
import { PlayerJoined } from '../../../game/game-events.js';
import { PlayerId } from '../../../game/player.entity.js';
import { makeOutboxDriverTestLayer, OutboxDriver } from './outbox.driver.js';

describe('OutboxPollingDaemon', () => {
  describe('Feature: Processing unprocessed events', () => {
    it.effect(
      'Example: should publish unprocessed events to GameEventBus',
      () =>
        Effect.gen(function* () {
          const driver = yield* OutboxDriver;

          // GIVEN
          yield* driver.given.existingUnprocessedEvent({
            aggregateType: 'game',
            aggregateId: 'game-1',
            aggregateVersion: 1,
            event: PlayerJoined({
              gameId: GameId('game-1'),
              playerId: PlayerId('player-1'),
            }),
          });

          // WHEN
          yield* driver.when.daemonProcessesEvents();

          // THEN
          yield* driver.assert.eventToHaveBeenPublishedToGameEventBus({
            _tag: 'PlayerJoined',
            gameId: GameId('game-1'),
            playerId: PlayerId('player-1'),
          });
        }).pipe(Effect.provide(makeOutboxDriverTestLayer())),
    );

    it.effect(
      'Example: should mark events as processed after publishing',
      () =>
        Effect.gen(function* () {
          const driver = yield* OutboxDriver;

          // GIVEN
          yield* driver.given.existingUnprocessedEvent({
            aggregateType: 'game',
            aggregateId: 'game-1',
            aggregateVersion: 1,
            event: PlayerJoined({
              gameId: GameId('game-1'),
              playerId: PlayerId('player-1'),
            }),
          });

          // WHEN
          yield* driver.when.daemonProcessesEvents();

          // THEN
          yield* driver.assert.noUnprocessedEventsToRemain();
        }).pipe(Effect.provide(makeOutboxDriverTestLayer())),
    );

    it.effect(
      'Example: should process multiple events in order',
      () =>
        Effect.gen(function* () {
          const driver = yield* OutboxDriver;

          // GIVEN
          yield* driver.given.existingUnprocessedEvent({
            aggregateType: 'game',
            aggregateId: 'game-1',
            aggregateVersion: 1,
            event: PlayerJoined({
              gameId: GameId('game-1'),
              playerId: PlayerId('player-1'),
            }),
          });
          yield* driver.given.existingUnprocessedEvent({
            aggregateType: 'game',
            aggregateId: 'game-1',
            aggregateVersion: 2,
            event: PlayerJoined({
              gameId: GameId('game-1'),
              playerId: PlayerId('player-2'),
            }),
          });

          // WHEN
          yield* driver.when.daemonProcessesEvents();

          // THEN
          const eventBusState = driver.getEventBusState();
          const published = eventBusState.getPublishedEvents();
          expect(published).toHaveLength(2);
          expect(published[0]).toMatchObject({
            _tag: 'PlayerJoined',
            playerId: 'player-1',
          });
          expect(published[1]).toMatchObject({
            _tag: 'PlayerJoined',
            playerId: 'player-2',
          });

          yield* driver.assert.noUnprocessedEventsToRemain();
        }).pipe(Effect.provide(makeOutboxDriverTestLayer())),
    );

    it.effect(
      'Example: should ignore non-game events',
      () =>
        Effect.gen(function* () {
          const driver = yield* OutboxDriver;

          // GIVEN - a player aggregate event (not game)
          yield* driver.given.existingUnprocessedEvent({
            aggregateType: 'player',
            aggregateId: 'player-1',
            aggregateVersion: 1,
            event: PlayerJoined({
              gameId: GameId('game-1'),
              playerId: PlayerId('player-1'),
            }),
          });

          // WHEN
          yield* driver.when.daemonProcessesEvents();

          // THEN - event should be marked as processed but not published to game bus
          const eventBusState = driver.getEventBusState();
          const published = eventBusState.getPublishedEvents();
          expect(published).toHaveLength(0);

          yield* driver.assert.noUnprocessedEventsToRemain();
        }).pipe(Effect.provide(makeOutboxDriverTestLayer())),
    );

    it.effect(
      'Example: should do nothing when no unprocessed events exist',
      () =>
        Effect.gen(function* () {
          const driver = yield* OutboxDriver;

          // GIVEN - no events

          // WHEN
          yield* driver.when.daemonProcessesEvents();

          // THEN
          const eventBusState = driver.getEventBusState();
          const published = eventBusState.getPublishedEvents();
          expect(published).toHaveLength(0);
        }).pipe(Effect.provide(makeOutboxDriverTestLayer())),
    );
  });
});
