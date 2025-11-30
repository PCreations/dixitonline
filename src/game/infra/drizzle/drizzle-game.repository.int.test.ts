import { Effect, Either, Option } from "effect";
import { Card, CardId } from "src/game/deck.entity.js";
import {
  StartedGameEntity,
  StartedGameSnapshot,
} from "src/game/game.entity.js";
import { OptimisticConcurrencyError } from "src/game/game.repository.js";
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

  it("should be able to update an existing game", async () => {
    // Create initial game snapshot
    const initialSnapshot = {
      id: gameId(2),
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
        id: turnId(2),
        gameId: gameId(2),
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
      ],
      scores: [
        {
          playerId: PlayerId(playerId(1)),
          score: 5,
        },
      ],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;

    const initialGame = StartedGameEntity.fromSnapshot(initialSnapshot);
    const db = getTestDb();
    const gameRepository = makeDrizzleGameRepository({ db });

    // Save initial game
    await Effect.runPromise(gameRepository.save(initialGame));

    // Update the game - add player 3 to ready list and increment version
    const updatedSnapshot = {
      ...initialSnapshot,
      version: 2,
      playersReadyForNextTurn: [
        PlayerId(playerId(1)),
        PlayerId(playerId(2)),
        PlayerId(playerId(3)),
      ],
    } satisfies StartedGameSnapshot;

    const updatedGame = StartedGameEntity.fromSnapshot(updatedSnapshot);

    // Save updated game
    const result = await Effect.runPromise(gameRepository.save(updatedGame));

    // Verify the update was successful (no error thrown)
    expect(result).toBeUndefined();
  });

  it("should throw OptimisticConcurrencyError when version mismatch occurs", async () => {
    // Create initial game snapshot
    const initialSnapshot = {
      id: gameId(3),
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
        id: turnId(3),
        gameId: gameId(3),
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
      ],
      scores: [
        {
          playerId: PlayerId(playerId(1)),
          score: 5,
        },
      ],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;

    const initialGame = StartedGameEntity.fromSnapshot(initialSnapshot);
    const db = getTestDb();
    const gameRepository = makeDrizzleGameRepository({ db });

    // Save initial game (version 1)
    await Effect.runPromise(gameRepository.save(initialGame));

    // Try to save the game again with version 1 (should fail because version 1 already exists)
    // The conflict update will check WHERE version = 0, but the DB has version = 1
    const conflictingGame = StartedGameEntity.fromSnapshot(initialSnapshot);

    // Verify that OptimisticConcurrencyError is thrown
    const result = await Effect.runPromise(
      Effect.either(gameRepository.save(conflictingGame))
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(OptimisticConcurrencyError);
    }
  });

  it("should find a started game by id", async () => {
    const gameSnapshot = {
      id: gameId(4),
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
        id: turnId(4),
        gameId: gameId(4),
        turnNumber: 1,
        currentStorytellerId: playerId(1),
        playerHands: [
          {
            playerId: playerId(1),
            cards: [
              { id: CardId(cardId(2)), url: "https://example.com/card-2" },
            ],
          },
        ],
        cardsInDrawPile: [],
        phase: "scoring",
        turnClue: Option.some({
          clue: "clue-1",
          cardId: CardId(cardId(1)),
        }),
        selectedCards: [],
        votedCards: [],
        pointsByPlayer: new Map(),
        startedAt: new Date(),
      },
      playersHavingBeenStoryteller: {
        [playerId(1)]: 1,
        [playerId(2)]: 0,
        [playerId(3)]: 0,
        [playerId(4)]: 0,
      },
      playersReadyForNextTurn: [],
      scores: [],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;

    const game = StartedGameEntity.fromSnapshot(gameSnapshot);
    const db = getTestDb();
    const gameRepository = makeDrizzleGameRepository({ db });

    // Save the game
    await Effect.runPromise(gameRepository.save(game));

    // Find the game by id
    const foundGame = await Effect.runPromise(gameRepository.findById(gameId(4)));

    expect(Option.isSome(foundGame)).toBe(true);
    if (Option.isSome(foundGame)) {
      expect(foundGame.value.id).toBe(gameId(4));
      expect(foundGame.value.version).toBe(1);
    }
  });

  it("should return None when game not found", async () => {
    const db = getTestDb();
    const gameRepository = makeDrizzleGameRepository({ db });

    const foundGame = await Effect.runPromise(gameRepository.findById(gameId(999)));

    expect(Option.isNone(foundGame)).toBe(true);
  });

  it("should find a started game by id using findStartedGameById", async () => {
    const gameSnapshot = {
      id: gameId(5),
      status: {
        _tag: "StartedGame",
      },
      createdBy: playerId(1),
      deckId: deckId(1),
      endCondition: {
        type: "NumberOfTimesBeingStoryteller",
        numberOfTimes: 1,
      },
      players: [playerId(1), playerId(2)],
      version: 1,
      currentTurn: {
        id: turnId(5),
        gameId: gameId(5),
        turnNumber: 1,
        currentStorytellerId: playerId(1),
        playerHands: [
          {
            playerId: playerId(1),
            cards: [
              { id: CardId(cardId(2)), url: "https://example.com/card-2" },
            ],
          },
        ],
        cardsInDrawPile: [],
        phase: "scoring",
        turnClue: Option.some({
          clue: "clue-1",
          cardId: CardId(cardId(1)),
        }),
        selectedCards: [],
        votedCards: [],
        pointsByPlayer: new Map(),
        startedAt: new Date(),
      },
      playersHavingBeenStoryteller: {
        [playerId(1)]: 1,
        [playerId(2)]: 0,
      },
      playersReadyForNextTurn: [],
      scores: [],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;

    const game = StartedGameEntity.fromSnapshot(gameSnapshot);
    const db = getTestDb();
    const gameRepository = makeDrizzleGameRepository({ db });

    await Effect.runPromise(gameRepository.save(game));

    const foundGame = await Effect.runPromise(gameRepository.findStartedGameById(gameId(5)));

    expect(Option.isSome(foundGame)).toBe(true);
    if (Option.isSome(foundGame)) {
      expect(foundGame.value.id).toBe(gameId(5));
    }
  });

  it("should check if player is in game", async () => {
    const gameSnapshot = {
      id: gameId(6),
      status: {
        _tag: "StartedGame",
      },
      createdBy: playerId(1),
      deckId: deckId(1),
      endCondition: {
        type: "NumberOfTimesBeingStoryteller",
        numberOfTimes: 1,
      },
      players: [playerId(1), playerId(2), playerId(3)],
      version: 1,
      currentTurn: {
        id: turnId(6),
        gameId: gameId(6),
        turnNumber: 1,
        currentStorytellerId: playerId(1),
        playerHands: [
          {
            playerId: playerId(1),
            cards: [
              { id: CardId(cardId(2)), url: "https://example.com/card-2" },
            ],
          },
        ],
        cardsInDrawPile: [],
        phase: "scoring",
        turnClue: Option.some({
          clue: "clue-1",
          cardId: CardId(cardId(1)),
        }),
        selectedCards: [],
        votedCards: [],
        pointsByPlayer: new Map(),
        startedAt: new Date(),
      },
      playersHavingBeenStoryteller: {
        [playerId(1)]: 1,
        [playerId(2)]: 0,
        [playerId(3)]: 0,
      },
      playersReadyForNextTurn: [],
      scores: [],
      randomizeStrategy: "noop",
    } satisfies StartedGameSnapshot;

    const game = StartedGameEntity.fromSnapshot(gameSnapshot);
    const db = getTestDb();
    const gameRepository = makeDrizzleGameRepository({ db });

    await Effect.runPromise(gameRepository.save(game));

    const isPlayer1InGame = await Effect.runPromise(
      gameRepository.isPlayerInGame(gameId(6), playerId(1))
    );
    const isPlayer4InGame = await Effect.runPromise(
      gameRepository.isPlayerInGame(gameId(6), playerId(4))
    );

    expect(isPlayer1InGame).toBe(true);
    expect(isPlayer4InGame).toBe(false);
  });
});
