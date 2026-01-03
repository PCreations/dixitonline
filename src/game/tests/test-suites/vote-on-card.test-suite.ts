import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import {
  GameBuilder,
  getSelectedCardsByPlayer,
  getStorytellerCardId,
} from '../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const voteOnCardTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory
) => {
  const { gameId, playerId, deckId } = idFactory;

  describe('Feature: Voting on a board card', () => {
    it.effect('Example: A player can vote on a board card', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([
              { playerId: playerId(2), cardIndex: 0 },
              { playerId: playerId(3), cardIndex: 0 },
              { playerId: playerId(4), cardIndex: 0 },
            ]),
        );
        const player3SelectedCard = getSelectedCardsByPlayer(game, {
          playerId: playerId(3),
        })[0].cardId;

        yield* gameDriver.when.votingOnCard({
          gameId: gameId(1),
          playerId: playerId(2),
          cardId: player3SelectedCard,
        });

        yield* gameDriver.assert.playerToHaveVotedOnCard({
          gameId: gameId(1),
          votedBy: playerId(2),
          cardId: player3SelectedCard,
          ownedBy: playerId(3),
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect("Example: A player not in game can't vote on a card", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([
              { playerId: playerId(2), cardIndex: 0 },
              { playerId: playerId(3), cardIndex: 0 },
              { playerId: playerId(4), cardIndex: 0 },
            ]),
        );

        yield* gameDriver.when.votingOnCard({
          gameId: gameId(1),
          playerId: playerId(5),
          cardId: 'id-card-not-selected-by-another-player',
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
          error: 'Player not in game',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      'Example: A player cannot vote for a card not selected by another player',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(3), cardIndex: 0 },
                { playerId: playerId(4), cardIndex: 0 },
              ]),
          );

          yield* gameDriver.when.votingOnCard({
            gameId: gameId(1),
            playerId: playerId(3),
            cardId: 'id-card-not-selected-by-another-player',
          });

          yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
            error: 'The card is not in the cards you can vote on',
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect("Example: A player can vote for for the storyteller's card", () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([
              { playerId: playerId(2), cardIndex: 0 },
              { playerId: playerId(3), cardIndex: 0 },
              { playerId: playerId(4), cardIndex: 0 },
            ]),
        );
        const storytellerCardId = getStorytellerCardId(game);

        yield* gameDriver.when.votingOnCard({
          gameId: gameId(1),
          playerId: playerId(3),
          cardId: storytellerCardId,
        });

        yield* gameDriver.assert.playerToHaveVotedOnCard({
          gameId: gameId(1),
          votedBy: playerId(3),
          ownedBy: playerId(1),
          cardId: storytellerCardId,
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: A player cannot vote for their own card', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([
              { playerId: playerId(2), cardIndex: 0 },
              { playerId: playerId(3), cardIndex: 0 },
              { playerId: playerId(4), cardIndex: 0 },
            ]),
        );
        const player3SelectedCard = getSelectedCardsByPlayer(game, {
          playerId: playerId(3),
        })[0].cardId;

        yield* gameDriver.when.votingOnCard({
          gameId: gameId(1),
          playerId: playerId(3),
          cardId: player3SelectedCard,
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
          error: 'The player cannot vote on their own card',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: A player cannot vote more than once', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .withDeck(deckId(1))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([
              { playerId: playerId(2), cardIndex: 0 },
              { playerId: playerId(3), cardIndex: 0 },
              { playerId: playerId(4), cardIndex: 0 },
            ])
            .withVotedCards([
              { playerId: playerId(3), cardSelectedByPlayer: playerId(2) },
            ]),
        );
        const storytellerCardId = getStorytellerCardId(game);

        yield* gameDriver.when.votingOnCard({
          gameId: gameId(1),
          playerId: playerId(3),
          cardId: storytellerCardId,
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
          error: 'The player cannot vote more than once',
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      "Example: When the last player has voted, the turn phase is updated to 'scoring' and the scores are computed",
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;

          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .withDeck(deckId(1))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(3), cardIndex: 0 },
                { playerId: playerId(4), cardIndex: 0 },
              ])
              .withVotedCards([
                { playerId: playerId(3), cardSelectedByPlayer: playerId(2) },
                { playerId: playerId(2), cardSelectedByPlayer: playerId(1) },
              ])
              .withScores([
                { playerId: playerId(1), score: 0 },
                { playerId: playerId(2), score: 0 },
                { playerId: playerId(3), score: 0 },
                { playerId: playerId(4), score: 0 },
              ]),
          );
          const storytellerCardId = getStorytellerCardId(game);

          yield* gameDriver.when.votingOnCard({
            gameId: gameId(1),
            playerId: playerId(4),
            cardId: storytellerCardId,
          });

          yield* gameDriver.assert.turnToBeInScoringPhase({
            gameId: gameId(1),
          });
          yield* gameDriver.assert.playersToHaveScore({
            gameId: gameId(1),
            scores: [
              {
                playerId: playerId(1),
                score: 3,
              },
              {
                playerId: playerId(2),
                score: 4,
              },
              {
                playerId: playerId(3),
                score: 0,
              },
              {
                playerId: playerId(4),
                score: 3,
              },
            ],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );
  });
};
