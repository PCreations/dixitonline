import { Option } from "effect";
import { Card, CardId } from "src/game/deck.entity.js";
import {
  StartedGameEntity,
  StartedGameSnapshot,
} from "src/game/game.entity.js";
import { PlayerId } from "src/game/player.entity.js";
import { describe, it } from "vitest";

describe("DrizzleGameRepository", () => {
  it("should be able to save a game", () => {
    const gameSnapshot = {
      id: "id-game-1",
      status: {
        _tag: "StartedGame",
      },
      createdBy: "id-player-1",
      deckId: "id-deck-1",
      endCondition: {
        type: "NumberOfTimesBeingStoryteller",
        numberOfTimes: 1,
      },
      players: ["id-player-1", "id-player-2", "id-player-3", "id-player-4"],
      version: 1,
      currentTurn: {
        id: "id-turn-1",
        gameId: "id-game-1",
        turnNumber: 1,
        currentStorytellerId: "id-player-1",
        playerHands: [
          {
            playerId: "id-player-1",
            cards: [
              {
                id: CardId("id-card-2"),
                url: "https://example.com/card-2",
              },
              {
                id: CardId("id-card-3"),
                url: "https://example.com/card-3",
              },
              {
                id: CardId("id-card-4"),
                url: "https://example.com/card-4",
              },
              {
                id: CardId("id-card-5"),
                url: "https://example.com/card-5",
              },
              {
                id: CardId("id-card-6"),
                url: "https://example.com/card-6",
              },
            ],
          },
          {
            playerId: "id-player-2",
            cards: [
              {
                id: CardId("id-card-8"),
                url: "https://example.com/card-8",
              },
              {
                id: CardId("id-card-9"),
                url: "https://example.com/card-9",
              },
              {
                id: CardId("id-card-10"),
                url: "https://example.com/card-10",
              },
              {
                id: CardId("id-card-11"),
                url: "https://example.com/card-11",
              },
              {
                id: CardId("id-card-12"),
                url: "https://example.com/card-12",
              },
            ],
          },
          {
            playerId: "id-player-3",
            cards: [
              {
                id: CardId("id-card-14"),
                url: "https://example.com/card-14",
              },
              {
                id: CardId("id-card-15"),
                url: "https://example.com/card-15",
              },
              {
                id: CardId("id-card-16"),
                url: "https://example.com/card-16",
              },
              {
                id: CardId("id-card-17"),
                url: "https://example.com/card-17",
              },
              {
                id: CardId("id-card-18"),
                url: "https://example.com/card-18",
              },
            ],
          },
          {
            playerId: "id-player-4",
            cards: [
              {
                id: CardId("id-card-20"),
                url: "https://example.com/card-20",
              },
              {
                id: CardId("id-card-21"),
                url: "https://example.com/card-21",
              },
              {
                id: CardId("id-card-22"),
                url: "https://example.com/card-22",
              },
              {
                id: CardId("id-card-23"),
                url: "https://example.com/card-23",
              },
              {
                id: CardId("id-card-24"),
                url: "https://example.com/card-24",
              },
            ],
          },
        ],
        cardsInDrawPile: Array.from({ length: 24 }, (_, i) =>
          Card.create({
            id: CardId(`id-card-${i + 25}`),
            url: `https://example.com/card-${i + 25}`,
          })),
        phase: "scoring",
        turnClue: Option.some({
          clue: "clue-1",
          cardId: CardId("id-card-1"),
        }),
        selectedCards: [
          {
            cardId: CardId("id-card-7"),
            playerId: PlayerId("id-player-2"),
          },
          {
            cardId: CardId("id-card-13"),
            playerId: PlayerId("id-player-3"),
          },
          {
            cardId: CardId("id-card-19"),
            playerId: PlayerId("id-player-4"),
          },
        ],
        votedCards: [
          {
            cardId: CardId("id-card-7"),
            ownedBy: PlayerId("id-player-2"),
            votedBy: PlayerId("id-player-4"),
          },
          {
            cardId: CardId("id-card-1"),
            ownedBy: PlayerId("id-player-1"),
            votedBy: PlayerId("id-player-2"),
          },
          {
            cardId: CardId("id-card-1"),
            ownedBy: PlayerId("id-player-1"),
            votedBy: PlayerId("id-player-3"),
          },
        ],
        pointsByPlayer: new Map(),
        startedAt: new Date(),
      },
      playersHavingBeenStoryteller: {
        "id-playe-1": 1,
        "id-player-2": 0,
        "id-player-3": 0,
        "id-player-4": 0,
      },
      playersReadyForNextTurn: [
        PlayerId("id-player-1"),
        PlayerId("id-player-2"),
        PlayerId("id-player-3"),
      ],
      scores: [
        {
          playerId: PlayerId("id-player-1"),
          score: 5,
        },
      ],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;
    const game = StartedGameEntity.fromSnapshot(gameSnapshot);
    const gameRepository = new DrizzleGameRepository();
    gameRepository.save(game);
  });
});
