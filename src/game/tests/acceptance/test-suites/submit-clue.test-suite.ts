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

export const submitClueTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory
) => {
  const { gameId, playerId, deckId } = idFactory;

  describe("Feature: Submitting the storyteller's clue", () => {
    it.effect(
      'Example: The storyteller can submit a clue on one of their cards',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3))
              .withDeck(deckId(1))
              .started(),
          );
          const storytellerId = getCurrentStorytellerId(game);
          const storytellerHand = getPlayerHand(game, {
            playerId: storytellerId,
          });
          const [firstCardOfStoryteller, ...restOfStorytellerHand] =
            storytellerHand;

          yield* gameDriver.when.submittingClue({
            gameId: gameId(1),
            playerId: storytellerId,
            cardId: firstCardOfStoryteller.id,
            clue: 'A clue',
          });

          yield* gameDriver.assert.turnClueToBeSubmitted({
            gameId: gameId(1),
            storytellerClue: 'A clue',
            storytellerCardId: firstCardOfStoryteller.id,
          });
          yield* gameDriver.assert.playerHandsToEqual({
            gameId: gameId(1),
            playerHands: expect.arrayContaining([
              {
                playerId: storytellerId,
                cards: restOfStorytellerHand.map((card) => card.id),
              },
            ]),
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect(
      "Example: The storyteller cannot submit a clue on a card they don't have",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3))
              .withDeck(deckId(1))
              .started(),
          );
          const storytellerId = getCurrentStorytellerId(game);
          const notStorytellerCardId = getCardInHandByIndex(game, {
            playerId: playerId(2),
            cardIndex: 0,
          });

          yield* gameDriver.when.submittingClue({
            gameId: gameId(1),
            playerId: storytellerId,
            cardId: notStorytellerCardId,
            clue: 'A clue',
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToSubmitClue({
            error:
              "The storyteller cannot submit a clue on a card they don't have",
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect('Example: Only the current storyteller can submit a clue', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3))
            .withDeck(deckId(1))
            .started(),
        );

        yield* gameDriver.when.submittingClue({
          gameId: gameId(1),
          playerId: playerId(2),
          cardId: getCardInHandByIndex(game, {
            playerId: playerId(2),
            cardIndex: 0,
          }),
          clue: 'A clue',
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToSubmitClue({
          error: 'Only the storyteller can submit a clue',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });
  });
};
