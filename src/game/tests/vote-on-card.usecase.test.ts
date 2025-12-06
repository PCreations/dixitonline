import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  GameBuilder,
  getSelectedCardsByPlayer,
  getStorytellerCardId,
} from "./game.builder.js";
import { GameDriver, makeGameDriverTestLayer } from "./game.driver.js";

describe("Feature: Voting on a board card", () => {
  it.effect("Example: A player can vote on a board card", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .withDeck("id-deck-1")
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ]),
      );
      const player3SelectedCard = getSelectedCardsByPlayer(game, {
        playerId: "id-player-3",
      })[0].cardId;

      yield* gameDriver.when.votingOnCard({
        gameId: "id-game-1",
        playerId: "id-player-2",
        cardId: player3SelectedCard,
      });

      yield* gameDriver.assert.playerToHaveVotedOnCard({
        gameId: "id-game-1",
        votedBy: "id-player-2",
        cardId: player3SelectedCard,
        ownedBy: "id-player-3",
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect(
    "Example: A player not in game can't vote on a card",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers(
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            )
            .withDeck("id-deck-1")
            .started()
            .withSubmittedClueOnCardIndex("A clue", 0)
            .withSelectedCards([
              { playerId: "id-player-2", cardIndex: 0 },
              { playerId: "id-player-3", cardIndex: 0 },
              { playerId: "id-player-4", cardIndex: 0 },
            ]),
        );

        yield* gameDriver.when.votingOnCard({
          gameId: "id-game-1",
          playerId: "id-player-5",
          cardId: "id-card-not-selected-by-another-player",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
          error: "Player not in game",
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    },
  );

  it.effect(
    "Example: A player cannot vote for a card not selected by another player",
    () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder("id-game-1")
            .hostedBy("id-player-1")
            .withPlayers(
              "id-player-1",
              "id-player-2",
              "id-player-3",
              "id-player-4",
            )
            .withDeck("id-deck-1")
            .started()
            .withSubmittedClueOnCardIndex("A clue", 0)
            .withSelectedCards([
              { playerId: "id-player-2", cardIndex: 0 },
              { playerId: "id-player-3", cardIndex: 0 },
              { playerId: "id-player-4", cardIndex: 0 },
            ]),
        );

        yield* gameDriver.when.votingOnCard({
          gameId: "id-game-1",
          playerId: "id-player-3",
          cardId: "id-card-not-selected-by-another-player",
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
          error: "The card is not in the cards you can vote on",
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    },
  );

  it.effect("Example: A player can vote for for the storyteller's card", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .withDeck("id-deck-1")
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ]),
      );
      const storytellerCardId = getStorytellerCardId(game);

      yield* gameDriver.when.votingOnCard({
        gameId: "id-game-1",
        playerId: "id-player-3",
        cardId: storytellerCardId,
      });

      yield* gameDriver.assert.playerToHaveVotedOnCard({
        gameId: "id-game-1",
        votedBy: "id-player-3",
        ownedBy: "id-player-1",
        cardId: storytellerCardId,
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: A player cannot vote for their own card", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .withDeck("id-deck-1")
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ]),
      );
      const player3SelectedCard = getSelectedCardsByPlayer(game, {
        playerId: "id-player-3",
      })[0].cardId;

      yield* gameDriver.when.votingOnCard({
        gameId: "id-game-1",
        playerId: "id-player-3",
        cardId: player3SelectedCard,
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
        error: "The player cannot vote on their own card",
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: A player cannot vote more than once", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .withDeck("id-deck-1")
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ])
          .withVotedCards([
            { playerId: "id-player-3", cardSelectedByPlayer: "id-player-2" },
          ]),
      );
      const storytellerCardId = getStorytellerCardId(game);

      yield* gameDriver.when.votingOnCard({
        gameId: "id-game-1",
        playerId: "id-player-3",
        cardId: storytellerCardId,
      });

      yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
        error: "The player cannot vote more than once",
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: When the last player has voted, the turn phase is updated to 'scoring' and the scores are computed", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .withDeck("id-deck-1")
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ])
          .withVotedCards([
            { playerId: "id-player-3", cardSelectedByPlayer: "id-player-2" },
            { playerId: "id-player-2", cardSelectedByPlayer: "id-player-1" },
          ])
          .withScores([
            { playerId: "id-player-1", score: 0 },
            { playerId: "id-player-2", score: 0 },
            { playerId: "id-player-3", score: 0 },
            { playerId: "id-player-4", score: 0 },
          ]),
      );
      const storytellerCardId = getStorytellerCardId(game);

      yield* gameDriver.when.votingOnCard({
        gameId: "id-game-1",
        playerId: "id-player-4",
        cardId: storytellerCardId,
      });

      yield* gameDriver.assert.turnToBeInScoringPhase({
        gameId: "id-game-1",
      });
      yield* gameDriver.assert.playersToHaveScore({
        gameId: "id-game-1",
        scores: [{
          playerId: "id-player-1",
          score: 3,
        }, {
          playerId: "id-player-2",
          score: 4,
        }, {
          playerId: "id-player-3",
          score: 0,
        }, {
          playerId: "id-player-4",
          score: 3,
        }],
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });
});
