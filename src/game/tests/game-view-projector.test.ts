import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { isEndedGameSnapshot, StartedGameSnapshot } from "../game.entity.js";
import {
  APlayerVotedOnYourCard,
  AtLeastOnePlayerFoundTheStorytellerCard,
  YouFoundTheStorytellerCard,
} from "../game-rules.js";
import { GameViewProjector } from "../game-view-projector.js";
import { PlayerId } from "../player.entity.js";
import { GameBuilder } from "./game.builder.js";
import { GameDriver, makeGameDriverTestLayer } from "./game.driver.js";

describe("Game View Projector", () => {
  it.effect("Example: storytelling phase", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;
      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withDeckCards({
            deckId: "id-deck-1",
            cards: [
              "card-1",
              "card-2",
              "card-3",
              "card-4",
              "card-5",
              "card-6",
              "card-7",
              "card-8",
              "card-9",
              "card-10",
              "card-11",
              "card-12",
              "card-13",
              "card-14",
              "card-15",
              "card-16",
              "card-17",
              "card-18",
              "card-19",
              "card-20",
              "card-21",
              "card-22",
              "card-23",
              "card-24",
              "card-25",
              "card-26",
              "card-27",
              "card-28",
              "card-29",
              "card-30",
              "card-31",
              "card-32",
            ],
          })
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .started(),
      );
      const gameViewProjector = yield* GameViewProjector;

      const {
        "id-player-1": player1view,
        "id-player-2": player2view,
        "id-player-3": player3view,
        "id-player-4": player4view,
      } = yield* gameViewProjector.project(
        game as StartedGameSnapshot,
      );

      expect(player1view).toEqual({
        gameId: "id-game-1",
        id: "id-player-1",
        name: "id-player-1",
        storyteller: "id-player-1",
        phase: "storytelling",
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "ready",
        },
        score: 0,
        cards: [
          { id: "card-1", url: "https://example.com/card-1" },
          { id: "card-2", url: "https://example.com/card-2" },
          { id: "card-3", url: "https://example.com/card-3" },
          { id: "card-4", url: "https://example.com/card-4" },
          { id: "card-5", url: "https://example.com/card-5" },
          { id: "card-6", url: "https://example.com/card-6" },
        ],
      });
      expect(player2view).toEqual({
        gameId: "id-game-1",
        id: "id-player-2",
        name: "id-player-2",
        storyteller: "id-player-1",
        phase: "storytelling",
        score: 0,
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "ready",
        },
        cards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-8", url: "https://example.com/card-8" },
          { id: "card-9", url: "https://example.com/card-9" },
          { id: "card-10", url: "https://example.com/card-10" },
          { id: "card-11", url: "https://example.com/card-11" },
          { id: "card-12", url: "https://example.com/card-12" },
        ],
      });
      expect(player3view).toEqual({
        gameId: "id-game-1",
        id: "id-player-3",
        name: "id-player-3",
        storyteller: "id-player-1",
        phase: "storytelling",
        score: 0,
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "ready",
        },
        cards: [
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-14", url: "https://example.com/card-14" },
          { id: "card-15", url: "https://example.com/card-15" },
          { id: "card-16", url: "https://example.com/card-16" },
          { id: "card-17", url: "https://example.com/card-17" },
          { id: "card-18", url: "https://example.com/card-18" },
        ],
      });
      expect(player4view).toEqual({
        gameId: "id-game-1",
        id: "id-player-4",
        name: "id-player-4",
        storyteller: "id-player-1",
        phase: "storytelling",
        score: 0,
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "ready",
        },
        cards: [
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-20", url: "https://example.com/card-20" },
          { id: "card-21", url: "https://example.com/card-21" },
          { id: "card-22", url: "https://example.com/card-22" },
          { id: "card-23", url: "https://example.com/card-23" },
          { id: "card-24", url: "https://example.com/card-24" },
        ],
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: selecting cards phase, more than 3 players-game", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;
      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withDeckCards({
            deckId: "id-deck-1",
            cards: [
              "card-1",
              "card-2",
              "card-3",
              "card-4",
              "card-5",
              "card-6",
              "card-7",
              "card-8",
              "card-9",
              "card-10",
              "card-11",
              "card-12",
              "card-13",
              "card-14",
              "card-15",
              "card-16",
              "card-17",
              "card-18",
              "card-19",
              "card-20",
              "card-21",
              "card-22",
              "card-23",
              "card-24",
              "card-25",
              "card-26",
              "card-27",
              "card-28",
              "card-29",
              "card-30",
              "card-31",
              "card-32",
            ],
          })
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
          ]),
      );
      const gameViewProjector = yield* GameViewProjector;

      const {
        "id-player-1": player1view,
        "id-player-2": player2view,
        "id-player-3": player3view,
        "id-player-4": player4view,
      } = yield* gameViewProjector.project(
        game as StartedGameSnapshot,
      );

      expect(player1view).toEqual({
        gameId: "id-game-1",
        id: "id-player-1",
        name: "id-player-1",
        storyteller: "id-player-1",
        phase: "selecting-cards",
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "not-ready",
        },
        score: 0,
        cards: [
          { id: "card-2", url: "https://example.com/card-2" },
          { id: "card-3", url: "https://example.com/card-3" },
          { id: "card-4", url: "https://example.com/card-4" },
          { id: "card-5", url: "https://example.com/card-5" },
          { id: "card-6", url: "https://example.com/card-6" },
        ],
      });
      expect(player2view).toEqual({
        gameId: "id-game-1",
        id: "id-player-2",
        name: "id-player-2",
        storyteller: "id-player-1",
        phase: "selecting-cards",
        score: 0,
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "not-ready",
        },
        cards: [
          { id: "card-8", url: "https://example.com/card-8" },
          { id: "card-9", url: "https://example.com/card-9" },
          { id: "card-10", url: "https://example.com/card-10" },
          { id: "card-11", url: "https://example.com/card-11" },
          { id: "card-12", url: "https://example.com/card-12" },
        ],
      });
      expect(player3view).toEqual({
        gameId: "id-game-1",
        id: "id-player-3",
        name: "id-player-3",
        storyteller: "id-player-1",
        phase: "selecting-cards",
        score: 0,
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "not-ready",
        },
        cards: [
          { id: "card-14", url: "https://example.com/card-14" },
          { id: "card-15", url: "https://example.com/card-15" },
          { id: "card-16", url: "https://example.com/card-16" },
          { id: "card-17", url: "https://example.com/card-17" },
          { id: "card-18", url: "https://example.com/card-18" },
        ],
      });
      expect(player4view).toEqual({
        gameId: "id-game-1",
        id: "id-player-4",
        name: "id-player-4",
        storyteller: "id-player-1",
        phase: "selecting-cards",
        score: 0,
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "ready",
          "id-player-4": "not-ready",
        },
        cards: [
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-20", url: "https://example.com/card-20" },
          { id: "card-21", url: "https://example.com/card-21" },
          { id: "card-22", url: "https://example.com/card-22" },
          { id: "card-23", url: "https://example.com/card-23" },
          { id: "card-24", url: "https://example.com/card-24" },
        ],
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: voting cards phase", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;
      // Shuffler is now injected via dependencies

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withDeckCards({
            deckId: "id-deck-1",
            cards: [
              "card-1",
              "card-2",
              "card-3",
              "card-4",
              "card-5",
              "card-6",
              "card-7",
              "card-8",
              "card-9",
              "card-10",
              "card-11",
              "card-12",
              "card-13",
              "card-14",
              "card-15",
              "card-16",
              "card-17",
              "card-18",
              "card-19",
              "card-20",
              "card-21",
              "card-22",
              "card-23",
              "card-24",
              "card-25",
              "card-26",
              "card-27",
              "card-28",
              "card-29",
              "card-30",
              "card-31",
              "card-32",
            ],
          })
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ])
          .withVotedCards([
            { playerId: "id-player-2", cardSelectedByPlayer: "id-player-1" },
          ]),
      );
      const gameViewProjector = yield* GameViewProjector;

      const {
        "id-player-1": player1view,
        "id-player-2": player2view,
        "id-player-3": player3view,
        "id-player-4": player4view,
      } = yield* gameViewProjector.project(
        game as StartedGameSnapshot,
      );

      // Shuffler behavior is now controlled by the injected service
      expect(player1view).toEqual({
        gameId: "id-game-1",
        id: "id-player-1",
        name: "id-player-1",
        storyteller: "id-player-1",
        phase: "voting",
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        score: 0,
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-2", url: "https://example.com/card-2" },
          { id: "card-3", url: "https://example.com/card-3" },
          { id: "card-4", url: "https://example.com/card-4" },
          { id: "card-5", url: "https://example.com/card-5" },
          { id: "card-6", url: "https://example.com/card-6" },
        ],
      });
      expect(player2view).toEqual({
        gameId: "id-game-1",
        id: "id-player-2",
        name: "id-player-2",
        storyteller: "id-player-1",
        phase: "voting",
        score: 0,
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-8", url: "https://example.com/card-8" },
          { id: "card-9", url: "https://example.com/card-9" },
          { id: "card-10", url: "https://example.com/card-10" },
          { id: "card-11", url: "https://example.com/card-11" },
          { id: "card-12", url: "https://example.com/card-12" },
        ],
      });
      expect(player3view).toEqual({
        gameId: "id-game-1",
        id: "id-player-3",
        name: "id-player-3",
        storyteller: "id-player-1",
        phase: "voting",
        score: 0,
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-14", url: "https://example.com/card-14" },
          { id: "card-15", url: "https://example.com/card-15" },
          { id: "card-16", url: "https://example.com/card-16" },
          { id: "card-17", url: "https://example.com/card-17" },
          { id: "card-18", url: "https://example.com/card-18" },
        ],
      });
      expect(player4view).toEqual({
        gameId: "id-game-1",
        id: "id-player-4",
        name: "id-player-4",
        storyteller: "id-player-1",
        phase: "voting",
        score: 0,
        playerStatus: {
          "id-player-1": "ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-20", url: "https://example.com/card-20" },
          { id: "card-21", url: "https://example.com/card-21" },
          { id: "card-22", url: "https://example.com/card-22" },
          { id: "card-23", url: "https://example.com/card-23" },
          { id: "card-24", url: "https://example.com/card-24" },
        ],
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: scoring cards phase", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withDeckCards({
            deckId: "id-deck-1",
            cards: [
              "card-1",
              "card-2",
              "card-3",
              "card-4",
              "card-5",
              "card-6",
              "card-7",
              "card-8",
              "card-9",
              "card-10",
              "card-11",
              "card-12",
              "card-13",
              "card-14",
              "card-15",
              "card-16",
              "card-17",
              "card-18",
              "card-19",
              "card-20",
              "card-21",
              "card-22",
              "card-23",
              "card-24",
              "card-25",
              "card-26",
              "card-27",
              "card-28",
              "card-29",
              "card-30",
              "card-31",
              "card-32",
            ],
          })
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .started()
          .withSubmittedClueOnCardIndex("A clue", 0)
          .withSelectedCards([
            { playerId: "id-player-2", cardIndex: 0 },
            { playerId: "id-player-3", cardIndex: 0 },
            { playerId: "id-player-4", cardIndex: 0 },
          ])
          .withVotedCards([
            { playerId: "id-player-2", cardSelectedByPlayer: "id-player-1" },
            { playerId: "id-player-3", cardSelectedByPlayer: "id-player-2" },
            { playerId: "id-player-4", cardSelectedByPlayer: "id-player-1" },
          ])
          .withScores([
            { playerId: "id-player-1", score: 0 },
            { playerId: "id-player-2", score: 0 },
            { playerId: "id-player-3", score: 0 },
            { playerId: "id-player-4", score: 0 },
          ])
          .withPlayersReadyForNextTurn(["id-player-2"]),
      );
      const gameViewProjector = yield* GameViewProjector;

      const {
        "id-player-1": player1view,
        "id-player-2": player2view,
        "id-player-3": player3view,
        "id-player-4": player4view,
      } = yield* gameViewProjector.project(
        game as StartedGameSnapshot,
      );

      expect(player1view).toEqual({
        gameId: "id-game-1",
        id: "id-player-1",
        name: "id-player-1",
        storyteller: "id-player-1",
        phase: "scoring",
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        score: 3,
        points: [
          {
            points: 3,
            reason: AtLeastOnePlayerFoundTheStorytellerCard(),
          },
        ],
        votes: {
          "card-1": ["id-player-2", "id-player-4"],
          "card-7": ["id-player-3"],
          "card-13": [],
          "card-19": [],
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-2", url: "https://example.com/card-2" },
          { id: "card-3", url: "https://example.com/card-3" },
          { id: "card-4", url: "https://example.com/card-4" },
          { id: "card-5", url: "https://example.com/card-5" },
          { id: "card-6", url: "https://example.com/card-6" },
        ],
      });
      expect(player2view).toEqual({
        gameId: "id-game-1",
        id: "id-player-2",
        name: "id-player-2",
        storyteller: "id-player-1",
        phase: "scoring",
        score: 4,
        points: [
          {
            points: 3,
            reason: YouFoundTheStorytellerCard(),
          },
          {
            points: 1,
            reason: APlayerVotedOnYourCard({
              playerId: PlayerId("id-player-3"),
            }),
          },
        ],
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        votes: {
          "card-1": ["id-player-2", "id-player-4"],
          "card-7": ["id-player-3"],
          "card-13": [],
          "card-19": [],
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-8", url: "https://example.com/card-8" },
          { id: "card-9", url: "https://example.com/card-9" },
          { id: "card-10", url: "https://example.com/card-10" },
          { id: "card-11", url: "https://example.com/card-11" },
          { id: "card-12", url: "https://example.com/card-12" },
        ],
      });
      expect(player3view).toEqual({
        gameId: "id-game-1",
        id: "id-player-3",
        name: "id-player-3",
        storyteller: "id-player-1",
        phase: "scoring",
        score: 0,
        points: [],
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        votes: {
          "card-1": ["id-player-2", "id-player-4"],
          "card-7": ["id-player-3"],
          "card-13": [],
          "card-19": [],
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-14", url: "https://example.com/card-14" },
          { id: "card-15", url: "https://example.com/card-15" },
          { id: "card-16", url: "https://example.com/card-16" },
          { id: "card-17", url: "https://example.com/card-17" },
          { id: "card-18", url: "https://example.com/card-18" },
        ],
      });
      expect(player4view).toEqual({
        gameId: "id-game-1",
        id: "id-player-4",
        name: "id-player-4",
        storyteller: "id-player-1",
        phase: "scoring",
        score: 3,
        points: [
          {
            points: 3,
            reason: YouFoundTheStorytellerCard(),
          },
        ],
        playerStatus: {
          "id-player-1": "not-ready",
          "id-player-2": "ready",
          "id-player-3": "not-ready",
          "id-player-4": "not-ready",
        },
        votes: {
          "card-1": ["id-player-2", "id-player-4"],
          "card-7": ["id-player-3"],
          "card-13": [],
          "card-19": [],
        },
        boardCards: [
          { id: "card-7", url: "https://example.com/card-7" },
          { id: "card-13", url: "https://example.com/card-13" },
          { id: "card-19", url: "https://example.com/card-19" },
          { id: "card-1", url: "https://example.com/card-1" },
        ],
        cards: [
          { id: "card-20", url: "https://example.com/card-20" },
          { id: "card-21", url: "https://example.com/card-21" },
          { id: "card-22", url: "https://example.com/card-22" },
          { id: "card-23", url: "https://example.com/card-23" },
          { id: "card-24", url: "https://example.com/card-24" },
        ],
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });

  it.effect("Example: ended game", () => {
    return Effect.gen(function* () {
      const gameDriver = yield* GameDriver;
      const { game } = yield* gameDriver.given.existingGame(
        gameDriver,
        new GameBuilder("id-game-1")
          .hostedBy("id-player-1")
          .withEndCondition({
            type: "LimitOfPoints",
            limit: 10,
          })
          .withPlayers(
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          )
          .withScores([
            { playerId: "id-player-1", score: 10 },
            { playerId: "id-player-2", score: 3 },
            { playerId: "id-player-3", score: 4 },
            { playerId: "id-player-4", score: 5 },
          ])
          .inScoringPhaseSince(new Date())
          .withPlayersReadyForNextTurn([
            "id-player-1",
            "id-player-2",
            "id-player-3",
            "id-player-4",
          ]),
      );
      if (!isEndedGameSnapshot(game)) {
        throw new Error("Game is not ended");
      }

      const gameViewProjector = yield* GameViewProjector;

      const {
        "id-player-1": player1view,
        "id-player-2": player2view,
        "id-player-3": player3view,
        "id-player-4": player4view,
      } = yield* gameViewProjector.project(
        game,
      );
      expect(player1view).toEqual({
        gameId: "id-game-1",
        id: "id-player-1",
        name: "id-player-1",
        phase: "ended",
        score: 10,
      });
      expect(player2view).toEqual({
        gameId: "id-game-1",
        id: "id-player-2",
        name: "id-player-2",
        phase: "ended",
        score: 5,
      });
      expect(player3view).toEqual({
        gameId: "id-game-1",
        id: "id-player-3",
        name: "id-player-3",
        phase: "ended",
        score: 6,
      });
      expect(player4view).toEqual({
        gameId: "id-game-1",
        id: "id-player-4",
        name: "id-player-4",
        phase: "ended",
        score: 7,
      });
    }).pipe(Effect.provide(makeGameDriverTestLayer()));
  });
});
