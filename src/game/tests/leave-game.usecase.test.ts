import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameBuilder } from './game.builder.js';
import { GameDriver, makeGameDriverTestLayer } from './game.driver.js';

describe('Feature: Leaving a game as a player', () => {
  it.effect('Example: Leaving a game as a player', () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder('id-game-1')
          .hostedBy('id-player-1')
          .withPlayer('id-player-2'),
      );

      yield* gameDriver.when.leavingGame({
        gameId: 'id-game-1',
        playerId: 'id-player-2',
      });

      yield* gameDriver.assert.gameToHavePlayers({
        gameId: 'id-game-1',
        players: ['id-player-1'],
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect('Example: A player not in a game cannot leave it', () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder('id-game-1')
          .hostedBy('id-player-1')
          .withPlayer('id-player-2'),
      );

      yield* gameDriver.when.leavingGame({
        gameId: 'id-game-1',
        playerId: 'id-player-3',
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToLeaveGame({
        error: 'Player not in game',
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect('Example: A player cannot leave a game that does not exist', () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.when.leavingGame({
        gameId: 'id-game-does-not-exist',
        playerId: 'id-player-2',
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToLeaveGame({
        error: 'Game not found',
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect('Example: The host cannot leave the game', () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder('id-game-1').hostedBy('id-player-1'),
      );

      yield* gameDriver.when.leavingGame({
        gameId: 'id-game-1',
        playerId: 'id-player-1',
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToLeaveGame({
        error: 'Host cannot leave the game',
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });
});
