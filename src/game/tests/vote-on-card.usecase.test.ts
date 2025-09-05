import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  GameBuilder,
  getCardInHandByIndex,
  getCurrentStorytellerId,
  getSelectedCardsByPlayer,
  getStorytellerCardId,
} from "./game.builder.js";
import { GameDriver, makeGameDriverUnitTestLayer } from "./game.driver.js";

describe("Feature: Voting on a board card", () => {
  it.effect(
    "Example: A player can vote on a board card",
    () => {
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
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
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
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: A player can vote for for the storyteller's card",
    () => {
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
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect(
    "Example: A player cannot vote for their own card",
    () => {
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
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );

  it.effect.fails(
    "Example: A player cannot vote more than once",
    () => {
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
        const storytellerCardId = getCardInHandByIndex(game, {
          playerId: getCurrentStorytellerId(game),
          cardIndex: 0,
        });

        yield* gameDriver.when.votingOnCard({
          gameId: "id-game-1",
          playerId: "id-player-3",
          cardId: storytellerCardId,
        });

        yield* gameDriver.assert.playerToNotHaveBeenAbleToVoteOnCard({
          error: "The player cannot vote more than once",
        });
      }).pipe(Effect.provide(makeGameDriverUnitTestLayer()));
    },
  );
});
