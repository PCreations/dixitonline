import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameBuilder } from '../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const joinGameTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory
) => {
  const { gameId, playerId } = idFactory;

  describe('Feature: Joining a game as a player', () => {
    it.effect('Example: Joining a game as a player', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1)).hostedBy(playerId(1)),
        );

        yield* gameDriver.when.joiningGame({
          gameId: gameId(1),
          playerId: playerId(2),
        });

        yield* gameDriver.assert.playerToHaveJoinedGame({
          gameId: gameId(1),
          playerId: playerId(2),
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: A player already in a game cannot join again', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayer(playerId(2)),
        );

        yield* gameDriver.when.joiningGame({
          gameId: gameId(1),
          playerId: playerId(2),
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
          error: `Player already in game: ${playerId(2)}`,
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: A player cannot join a game that does not exist', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.when.joiningGame({
          gameId: gameId('does-not-exist'),
          playerId: playerId(2),
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
          error: 'Game not found',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: A player cannot join a game that is already full', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingFullGame({
          gameId: gameId(1),
        });

        yield* gameDriver.when.joiningGame({
          gameId: gameId(1),
          playerId: playerId('not-in-game'),
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
          error: 'Game is full',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      'Example: Optimistic concurrency: A player cannot join a game that was not full at the time of joining if some player just joined in between',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .withPlayers(
                playerId(1),
                playerId(2),
                playerId(3),
                playerId(4),
                playerId(5),
              )
              .hostedBy(playerId(1)),
          );

          yield* gameDriver.when.joiningGameWhileAnotherPlayerJustJoinedInBetween(
            {
              gameId: gameId(1),
              playerId: playerId(6),
              playerThatHasJustJoinedInBetween: playerId(7),
            },
          );

          yield* gameDriver.assert.playerToNotHaveBeenAbleToJoinGame({
            error: 'Game is full',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );
  });
};
