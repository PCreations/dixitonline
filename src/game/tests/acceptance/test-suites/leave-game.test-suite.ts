import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameBuilder } from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const leaveGameTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory
) => {
  const { gameId, playerId } = idFactory;

  describe('Feature: Leaving a game as a player', () => {
    it.effect('Example: Leaving a game as a player', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayer(playerId(2)),
        );

        yield* gameDriver.when.leavingGame({
          gameId: gameId(1),
          playerId: playerId(2),
        });

        yield* gameDriver.assert.gameToHavePlayers({
          gameId: gameId(1),
          players: [playerId(1)],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: A player not in a game cannot leave it', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayer(playerId(2)),
        );

        yield* gameDriver.when.leavingGame({
          gameId: gameId(1),
          playerId: playerId(3),
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
          gameId: gameId('does-not-exist'),
          playerId: playerId(2),
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
          new GameBuilder(gameId(1)).hostedBy(playerId(1)),
        );

        yield* gameDriver.when.leavingGame({
          gameId: gameId(1),
          playerId: playerId(1),
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToLeaveGame({
          error: 'Host cannot leave the game',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });
  });
};
