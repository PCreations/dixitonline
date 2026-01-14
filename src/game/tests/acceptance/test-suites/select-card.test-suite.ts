import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import {
  GameBuilder,
  getCardInHandByIndex,
  getCurrentStorytellerId,
  getPlayerHand,
} from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const selectCardTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  const { gameId, playerId, deckId } = idFactory;

  describe('Feature: Selecting a card when the turn is in the selecting-cards phase', () => {
    it.effect('Example: A player can select a card from their hand', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0),
        );
        const player2hand = getPlayerHand(game, {
          playerId: playerId(2),
        });

        yield* gameDriver.when.selectingCard({
          gameId: gameId(1),
          playerId: playerId(2),
          cardId: player2hand[0].id,
        });

        yield* gameDriver.assert.playerHandsToEqual({
          gameId: gameId(1),
          playerHands: expect.arrayContaining([
            {
              playerId: playerId(2),
              cards: [
                player2hand[1].id,
                player2hand[2].id,
                player2hand[3].id,
                player2hand[4].id,
                player2hand[5].id,
              ],
            },
          ]),
        });
        yield* gameDriver.assert.turnToHaveSelectedCards({
          gameId: gameId(1),
          selectedCards: [
            {
              cardId: player2hand[0].id,
              playerId: playerId(2),
            },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect("Example: A player not in game can't select a card", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([{ playerId: playerId(2), cardIndex: 0 }]),
        );
        const player2hand = getPlayerHand(game, {
          playerId: playerId(2),
        });

        yield* gameDriver.when.selectingCard({
          gameId: gameId(1),
          playerId: playerId(5),
          cardId: player2hand[1].id,
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
          error: 'Player not in game',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      'Example: A player cannot select another card from their hand if they have already selected one',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([{ playerId: playerId(2), cardIndex: 0 }]),
          );
          const player2hand = getPlayerHand(game, {
            playerId: playerId(2),
          });

          yield* gameDriver.when.selectingCard({
            gameId: gameId(1),
            playerId: playerId(2),
            cardId: player2hand[1].id,
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
            error: 'A player can only select one card',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      'Example: 3-players game : A player cannot select another card from their hand if they have already selected two',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(2), cardIndex: 1 },
              ]),
          );
          const player2handWithoutFirstSelectedCard = getPlayerHand(game, {
            playerId: playerId(2),
          });

          yield* gameDriver.when.selectingCard({
            gameId: gameId(1),
            playerId: playerId(2),
            cardId: player2handWithoutFirstSelectedCard[0].id,
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
            error: 'A player can only select two cards',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      'Example: A player cannot select another card from their hand if they have already selected one (duplicate)',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([{ playerId: playerId(2), cardIndex: 0 }]),
          );
          const player2hand = getPlayerHand(game, {
            playerId: playerId(2),
          });

          yield* gameDriver.when.selectingCard({
            gameId: gameId(1),
            playerId: playerId(2),
            cardId: player2hand[1].id,
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
            error: 'A player can only select one card',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      'Example: A player cannot select a card that is not in their hand',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0),
          );

          yield* gameDriver.when.selectingCard({
            gameId: gameId(1),
            playerId: playerId(2),
            cardId: 'id-card-not-in-player-hand',
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
            error: "The card is not in the player's hand",
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect('Example: The storyteller cannot select a card', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0),
        );
        const storytellerId = getCurrentStorytellerId(game);
        const storytellerCardId = getCardInHandByIndex(game, {
          playerId: storytellerId,
          cardIndex: 1,
        });

        yield* gameDriver.when.selectingCard({
          gameId: gameId(1),
          playerId: storytellerId,
          cardId: storytellerCardId,
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToSelectCard({
          error: 'The storyteller cannot select a card',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      'Example: When the last player selects a card in a more-than-3-players game, the turn phase is updated to voting',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(3), cardIndex: 0 },
              ]),
          );
          const player4hand = getPlayerHand(game, {
            playerId: playerId(4),
          });

          yield* gameDriver.when.selectingCard({
            gameId: gameId(1),
            playerId: playerId(4),
            cardId: player4hand[0].id,
          });

          yield* gameDriver.assert.turnToBeInVotingPhase({
            gameId: gameId(1),
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      'Example: When the last player selects their second card in a 3-players game, the turn phase is updated to voting',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(2), playerId(3))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(2), cardIndex: 1 },
                { playerId: playerId(3), cardIndex: 0 },
              ]),
          );
          const player3hand = getPlayerHand(game, {
            playerId: playerId(3),
          });

          yield* gameDriver.when.selectingCard({
            gameId: gameId(1),
            playerId: playerId(3),
            cardId: player3hand[0].id,
          });

          yield* gameDriver.assert.turnToBeInVotingPhase({
            gameId: gameId(1),
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );
  });
};
