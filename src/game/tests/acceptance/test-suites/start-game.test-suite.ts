import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import {
  PlayersRandomizeStrategy,
  PlayersRandomizeStrategyType,
} from '../../../game.entity.js';
import { PlayerId } from '../../../player.entity.js';
import { GameBuilder } from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const startGameTestSuite = (
  makeGameDriverTestLayer: (options?: {
    randomizeStrategy?: PlayersRandomizeStrategyType;
  }) => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  const { gameId, playerId, deckId } = idFactory;

  describe('Feature: Starting a game', () => {
    describe('Scenario: Starting a game with different configurations', () => {
      it.effect(
        'Example: Starting a game when the minimum number of players is reached',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;

            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withPlayers(playerId(2), playerId(3)),
            );

            yield* gameDriver.when.startingGame({
              gameId: gameId(1),
              playerId: playerId(1),
            });

            yield* gameDriver.assert.gameToHaveBeenStarted({
              gameId: gameId(1),
            });
          }).pipe(Effect.provide(makeGameDriverTestLayer()));
        },
      );

      it.effect('Example: Only the host can start the game', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3)),
          );

          yield* gameDriver.when.startingGame({
            gameId: gameId(1),
            playerId: playerId(2),
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
            error: 'Only the host can start the game',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      });

      it.effect(
        'Example: Cannot start a game if the game does not meet the minimum number of players',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;

            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withPlayers(playerId(2)),
            );

            yield* gameDriver.when.startingGame({
              gameId: gameId(1),
              playerId: playerId(1),
            });

            yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
              error: 'The game does not meet the minimum number of players',
            });
          }).pipe(Effect.provide(makeGameDriverTestLayer()));
        },
      );

      it.effect('Example: A player not in game cannot start it', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3)),
          );

          yield* gameDriver.when.startingGame({
            gameId: gameId(1),
            playerId: playerId('not-in-game'),
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
            error: 'Player not in game',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      });

      it.effect(
        'Example: Optimistic concurrency: A player cannot start a game if a player has left in between at the time of starting, making the game not meet the minimum number of players',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;

            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withPlayers(playerId(2), playerId(3)),
            );

            yield* gameDriver.when.startingGameWhileAnotherPlayerLeftInBetween({
              gameId: gameId(1),
              playerId: playerId(1),
              playerThatHasLeftInBetween: playerId(2),
            });

            yield* gameDriver.assert.playerToNotHaveBeenAbleToStartGame({
              error: 'The game does not meet the minimum number of players',
            });
          }).pipe(Effect.provide(makeGameDriverTestLayer()));
        },
      );
    });

    describe('Scenario: The first turn has correctly started', () => {
      it.effect('Example: Starting a game with 4 players', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          const { deck } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1)),
          );

          yield* gameDriver.when.startingGame({
            gameId: gameId(1),
            playerId: playerId(1),
          });

          yield* gameDriver.assert.currentTurnToBeStarted({
            gameId: gameId(1),
            storytellerId: playerId(1),
          });
          yield* gameDriver.assert.playerHandsToEqual({
            gameId: gameId(1),
            playerHands: [
              {
                playerId: playerId(1),
                cards: deck.cards.slice(0, 6).map((card) => card.id),
              },
              {
                playerId: playerId(2),
                cards: deck.cards.slice(6, 12).map((card) => card.id),
              },
              {
                playerId: playerId(3),
                cards: deck.cards.slice(12, 18).map((card) => card.id),
              },
              {
                playerId: playerId(4),
                cards: deck.cards.slice(18, 24).map((card) => card.id),
              },
            ],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      });

      it.effect(
        'Example: Starting a game with 3 players : each player receives 7 cards instead of 6',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;

            const { deck } = yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withPlayers(playerId(2), playerId(3))
                .withDeck(deckId(1)),
            );

            yield* gameDriver.when.startingGame({
              gameId: gameId(1),
              playerId: playerId(1),
            });

            yield* gameDriver.assert.currentTurnToBeStarted({
              gameId: gameId(1),
              storytellerId: playerId(1),
            });
            yield* gameDriver.assert.playerHandsToEqual({
              gameId: gameId(1),
              playerHands: [
                {
                  playerId: playerId(1),
                  cards: deck.cards.slice(0, 7).map((card) => card.id),
                },
                {
                  playerId: playerId(2),
                  cards: deck.cards.slice(7, 14).map((card) => card.id),
                },
                {
                  playerId: playerId(3),
                  cards: deck.cards.slice(14, 21).map((card) => card.id),
                },
              ],
            });
          }).pipe(Effect.provide(makeGameDriverTestLayer()));
        },
      );

      it.effect(
        'Example: The players orders can be randomized when the game is started',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;

            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withPlayers(playerId(2), playerId(3), playerId(4))
                .withDeck(deckId(1)),
            );

            yield* gameDriver.when.startingGame({
              gameId: gameId(1),
              playerId: playerId(1),
            });

            yield* gameDriver.assert.gameToHavePlayers({
              gameId: gameId(1),
              players: [playerId(3), playerId(1), playerId(4), playerId(2)],
            });
          }).pipe(
            Effect.provide(
              makeGameDriverTestLayer({
                randomizeStrategy: PlayersRandomizeStrategy.of({
                  type: 'fake',
                  randomize: () => [
                    PlayerId(playerId(3)),
                    PlayerId(playerId(1)),
                    PlayerId(playerId(4)),
                    PlayerId(playerId(2)),
                  ],
                }),
              }),
            ),
          );
        },
      );
    });
  });
};
