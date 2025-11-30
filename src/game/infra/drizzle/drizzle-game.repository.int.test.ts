import { Effect, Option } from "effect";
import { Card, CardId } from "src/game/deck.entity.js";
import {
  StartedGameEntity,
  StartedGameSnapshot,
} from "src/game/game.entity.js";
import { PlayerId } from "src/game/player.entity.js";
import { getTestDb } from "src/shared/tests/setup/test-db.js";
import { cardId, deckId, gameId, playerId, turnId } from "src/shared/tests/uuid-test-helper.js";
import { describe, expect, it } from "vitest";
import { makeDrizzleGameRepository } from "./drizzle-game.repository.js";

describe("DrizzleGameRepository", () => {
  it("should be able to save a game", async () => {
    const gameSnapshot = {
      id: gameId(1),
      status: {
        _tag: "StartedGame",
      },
      createdBy: playerId(1),
      deckId: deckId(1),
      endCondition: {
        type: "NumberOfTimesBeingStoryteller",
        numberOfTimes: 1,
      },
      players: [playerId(1), playerId(2), playerId(3), playerId(4)],
      version: 1,
      currentTurn: {
        id: turnId(1),
        gameId: gameId(1),
        turnNumber: 1,
        currentStorytellerId: playerId(1),
        playerHands: [
          {
            playerId: playerId(1),
            cards: [
              { id: CardId(cardId(2)), url: "https://example.com/card-2" },
              { id: CardId(cardId(3)), url: "https://example.com/card-3" },
              { id: CardId(cardId(4)), url: "https://example.com/card-4" },
              { id: CardId(cardId(5)), url: "https://example.com/card-5" },
              { id: CardId(cardId(6)), url: "https://example.com/card-6" },
            ],
          },
          {
            playerId: playerId(2),
            cards: [
              { id: CardId(cardId(8)), url: "https://example.com/card-8" },
              { id: CardId(cardId(9)), url: "https://example.com/card-9" },
              { id: CardId(cardId(10)), url: "https://example.com/card-10" },
              { id: CardId(cardId(11)), url: "https://example.com/card-11" },
              { id: CardId(cardId(12)), url: "https://example.com/card-12" },
            ],
          },
          {
            playerId: playerId(3),
            cards: [
              { id: CardId(cardId(14)), url: "https://example.com/card-14" },
              { id: CardId(cardId(15)), url: "https://example.com/card-15" },
              { id: CardId(cardId(16)), url: "https://example.com/card-16" },
              { id: CardId(cardId(17)), url: "https://example.com/card-17" },
              { id: CardId(cardId(18)), url: "https://example.com/card-18" },
            ],
          },
          {
            playerId: playerId(4),
            cards: [
              { id: CardId(cardId(20)), url: "https://example.com/card-20" },
              { id: CardId(cardId(21)), url: "https://example.com/card-21" },
              { id: CardId(cardId(22)), url: "https://example.com/card-22" },
              { id: CardId(cardId(23)), url: "https://example.com/card-23" },
              { id: CardId(cardId(24)), url: "https://example.com/card-24" },
            ],
          },
        ],
        cardsInDrawPile: Array.from({ length: 24 }, (_, i) =>
          Card.create({
            id: CardId(cardId(i + 25)),
            url: `https://example.com/card-${i + 25}`,
          })),
        phase: "scoring",
        turnClue: Option.some({
          clue: "clue-1",
          cardId: CardId(cardId(1)),
        }),
        selectedCards: [
          { cardId: CardId(cardId(7)), playerId: PlayerId(playerId(2)) },
          { cardId: CardId(cardId(13)), playerId: PlayerId(playerId(3)) },
          { cardId: CardId(cardId(19)), playerId: PlayerId(playerId(4)) },
        ],
        votedCards: [
          {
            cardId: CardId(cardId(7)),
            ownedBy: PlayerId(playerId(2)),
            votedBy: PlayerId(playerId(4)),
          },
          {
            cardId: CardId(cardId(1)),
            ownedBy: PlayerId(playerId(1)),
            votedBy: PlayerId(playerId(2)),
          },
          {
            cardId: CardId(cardId(1)),
            ownedBy: PlayerId(playerId(1)),
            votedBy: PlayerId(playerId(3)),
          },
        ],
        pointsByPlayer: new Map(),
        startedAt: new Date(),
      },
      playersHavingBeenStoryteller: {
        [playerId(1)]: 1,
        [playerId(2)]: 0,
        [playerId(3)]: 0,
        [playerId(4)]: 0,
      },
      playersReadyForNextTurn: [
        PlayerId(playerId(1)),
        PlayerId(playerId(2)),
        PlayerId(playerId(3)),
      ],
      scores: [
        {
          playerId: PlayerId(playerId(1)),
          score: 5,
        },
      ],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;
    const game = StartedGameEntity.fromSnapshot(gameSnapshot);

    // Get the test database connection
    const db = getTestDb();

    // Create the repository with the test database
    const gameRepository = makeDrizzleGameRepository({ db });

    // Save the game
    const result = await Effect.runPromise(gameRepository.save(game));

    // Verify the game was saved successfully (no error thrown)
    expect(result).toBeUndefined();
  });
});
