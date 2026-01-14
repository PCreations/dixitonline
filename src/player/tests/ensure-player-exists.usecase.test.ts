import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { makePlayerDriverTestLayer, PlayerDriver } from './player.driver.js';

describe('Feature: Ensuring player exists in database', () => {
  it.effect('Example: Creating a new player when not exists', () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // WHEN
      yield* driver.when.ensuringPlayerExists({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });

      // THEN
      yield* driver.assert.playerToExist({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );

  it.effect('Example: Returning existing player when already exists', () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // GIVEN
      yield* driver.given.existingPlayer({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });

      // WHEN
      yield* driver.when.ensuringPlayerExists({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });

      // THEN
      yield* driver.assert.playerToExist({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );

  it.effect('Example: Updating username when changed', () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // GIVEN
      yield* driver.given.existingPlayer({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });

      // WHEN
      yield* driver.when.ensuringPlayerExists({
        playerId: 'player-1',
        username: 'Alicia',
        isAnonymous: true,
      });

      // THEN
      yield* driver.assert.playerToHaveUsername({
        playerId: 'player-1',
        username: 'Alicia',
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );

  it.effect('Example: Using default username when undefined', () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // WHEN
      yield* driver.when.ensuringPlayerExists({
        playerId: 'player-1',
        username: undefined,
        isAnonymous: true,
      });

      // THEN
      yield* driver.assert.playerToHaveUsername({
        playerId: 'player-1',
        username: 'Anonyme',
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );
});

describe('Feature: Linking email to player', () => {
  it.effect('Example: Anonymous player can link an email', () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // GIVEN
      yield* driver.given.existingPlayer({
        playerId: 'player-1',
        username: 'Alice',
        isAnonymous: true,
      });

      // WHEN
      yield* driver.when.linkingEmail({
        playerId: 'player-1',
        email: 'alice@example.com',
      });

      // THEN
      yield* driver.assert.playerToHaveEmail({
        playerId: 'player-1',
        email: 'alice@example.com',
      });
      yield* driver.assert.playerToNotBeAnonymous({
        playerId: 'player-1',
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );

  it.effect('Example: Player with email cannot link another email', () =>
    Effect.gen(function* () {
      const driver = yield* PlayerDriver;

      // GIVEN
      yield* driver.given.existingPlayer({
        playerId: 'player-1',
        username: 'Alice',
        email: 'alice@example.com',
        isAnonymous: false,
      });

      // WHEN
      yield* driver.when.linkingEmail({
        playerId: 'player-1',
        email: 'newemail@example.com',
      });

      // THEN
      yield* driver.assert.playerToNotHaveBeenAbleToLinkEmail({
        error: 'EmailAlreadyLinkedError',
      });
    }).pipe(Effect.provide(makePlayerDriverTestLayer())),
  );
});
