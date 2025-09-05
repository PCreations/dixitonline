import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import {
  GameBuilder,
  getCardInHandByIndex,
  getCurrentStorytellerId,
  getPlayerHand,
} from './game.builder.js';
import { GameDriver, makeGameDriverUnitTestLayer } from './game.driver.js';

describe("Feature: Submitting the storyteller's clue", () => {
  it.effect(
    'Example: The storyteller can submit a clue on one of their cards',
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder('id-game-1')
            .hostedBy('id-player-1')
            .withPlayers('id-player-1', 'id-player-2', 'id-player-3')
            .withDeck('id-deck-1')
            .started(),
        );
        const storytellerId = getCurrentStorytellerId(game);
        const storytellerHand = getPlayerHand(game, {
          playerId: storytellerId,
        });
        const [firstCardOfStoryteller, ...restOfStorytellerHand] =
          storytellerHand;

        yield* gameDriver.when.submittingClue({
          gameId: 'id-game-1',
          playerId: storytellerId,
          cardId: firstCardOfStoryteller.id,
          clue: 'A clue',
        });

        yield* gameDriver.assert.turnClueToBeSubmitted({
          gameId: 'id-game-1',
          storytellerClue: 'A clue',
          storytellerCardId: firstCardOfStoryteller.id,
        });
        yield* gameDriver.assert.playerHandsToEqual({
          gameId: 'id-game-1',
          playerHands: expect.arrayContaining([
            {
              playerId: storytellerId,
              cards: restOfStorytellerHand.map((card) => card.id),
            },
          ]),
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: The storyteller cannot submit a clue on a card they don't have",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder('id-game-1')
            .hostedBy('id-player-1')
            .withPlayers('id-player-1', 'id-player-2', 'id-player-3')
            .withDeck('id-deck-1')
            .started(),
        );
        const storytellerId = getCurrentStorytellerId(game);
        const notStorytellerCardId = getCardInHandByIndex(game, {
          playerId: 'id-player-2',
          cardIndex: 0,
        });

        yield* gameDriver.when.submittingClue({
          gameId: 'id-game-1',
          playerId: storytellerId,
          cardId: notStorytellerCardId,
          clue: 'A clue',
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToSubmitClue({
          error:
            "The storyteller cannot submit a clue on a card they don't have",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect('Example: Only the current storyteller can submit a clue', () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder('id-game-1')
          .hostedBy('id-player-1')
          .withPlayers('id-player-1', 'id-player-2', 'id-player-3')
          .withDeck('id-deck-1')
          .started(),
      );

      yield* gameDriver.when.submittingClue({
        gameId: 'id-game-1',
        playerId: 'id-player-2',
        cardId: getCardInHandByIndex(game, {
          playerId: 'id-player-2',
          cardIndex: 0,
        }),
        clue: 'A clue',
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToSubmitClue({
        error: 'Only the storyteller can submit a clue',
      });
    }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
  });
});
