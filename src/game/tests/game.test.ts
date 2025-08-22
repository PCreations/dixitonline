import { Array as Arr, Effect, Option } from "effect";
import { describe, expect, test } from "vitest";
import { Card, CardId, DeckEntity, DeckId } from "../deck.entity.js";
import {
  GameId,
  isStartedGame,
  NotStartedGameEntity,
  StartedGameEntity,
} from "../game.entity.js";
import { PlayerId } from "../player.entity.js";
import { TurnId } from "../turn.entity.js";

const createDeckWithXcards = (x: number) => {
  const cards = Arr.range(0, x - 1).map((i) =>
    Card.create({
      id: CardId(`card-id-${i}`),
      url: `https://example.com/card-${i}`,
    })
  );
  const deck = DeckEntity.create({
    id: DeckId("deck-id"),
    isDefault: false,
    cards,
  });

  return { deck, cards };
};

const createTestNotStartedGame = (
  props: Partial<Parameters<typeof NotStartedGameEntity["fromSnapshot"]>[0]>,
  opts: Parameters<typeof NotStartedGameEntity["fromSnapshot"]>[1] = {},
) => {
  const { deck: defaultDeck } = createDeckWithXcards(25);
  return {
    game: NotStartedGameEntity.fromSnapshot({
      id: GameId("game-id"),
      createdBy: PlayerId("player-id"),
      deckId: defaultDeck.id,
      endCondition: {
        type: "NumberOfTimesBeingStoryteller",
        numberOfTimes: 3,
      },
      players: ["player-id", "player-id-2", "player-id-3", "player-id-4"],
      version: 1,
      ...props,
    }, opts),
    deck: defaultDeck,
  };
};

const createStartedGameWithXPlayers = (x: number) => {
  return (
    props: Partial<Parameters<typeof StartedGameEntity["fromSnapshot"]>[0]> =
      {},
  ) => {
    const players = Arr.range(0, x - 1).map((i) => PlayerId(`player-id-${i}`));
    const { game, deck } = createTestNotStartedGame({
      players: Arr.range(0, x - 1).map((i) => PlayerId(`player-id-${i}`)),
      createdBy: players[0],
      ...props,
    });

    const startedGame = Effect.runSync(game.start({
      playerId: PlayerId(game.toSnapshot().players[0]),
      deck,
      startedAt: new Date(),
    }));

    return {
      game: startedGame,
      deck,
      storytellerId: startedGame.toSnapshot().currentTurn.currentStorytellerId,
      storytellerHand: startedGame.toSnapshot().currentTurn.playerHands[0],
    };
  };
};

/**
 * For these tests, the Game Entity become our entry point. Thus, everything exported from Game Entity is considered public API.
 */
describe("Game logic", () => {
  describe("Starting a game", () => {
    test("Game can be started", () => {
      const now = new Date();
      const { deck, cards } = createDeckWithXcards(25);
      const cardChunks = Arr.chunksOf(cards, 6);
      const remainingCard = cards.at(-1);
      const { game } = createTestNotStartedGame({
        id: GameId("game-id"),
        createdBy: PlayerId("player-id"),
        deckId: deck.id,
        endCondition: {
          type: "NumberOfTimesBeingStoryteller",
          numberOfTimes: 3,
        },
        players: ["player-id", "player-id-2", "player-id-3", "player-id-4"],
        version: 1,
      });

      const updatedGame = Effect.runSync(game.start({
        playerId: PlayerId("player-id"),
        deck,
        startedAt: now,
      }));

      const gameSnapshot = updatedGame.toSnapshot();
      expect(gameSnapshot.version).toBe(2);
      expect(isStartedGame(updatedGame)).toBe(true);
      expect(gameSnapshot.currentTurn).toStrictEqual({
        id: TurnId("game-id-turn-1"),
        gameId: GameId("game-id"),
        currentStorytellerId: PlayerId("player-id"),
        playerHands: [{
          playerId: PlayerId("player-id"),
          cards: cardChunks[0],
        }, {
          playerId: PlayerId("player-id-2"),
          cards: cardChunks[1],
        }, {
          playerId: PlayerId("player-id-3"),
          cards: cardChunks[2],
        }, {
          playerId: PlayerId("player-id-4"),
          cards: cardChunks[3],
        }],
        cardsInDrawPile: [remainingCard],
        turnNumber: 1,
        startedAt: now,
        turnClue: Option.none(),
        phase: "storytelling",
      });
    });

    test("Players receive 7 cards instead of 6 when the number of players is 3", () => {
      const now = new Date();
      const { deck, game } = createTestNotStartedGame({
        players: ["player-id", "player-id-2", "player-id-3"],
      });

      const updatedGame = Effect.runSync(game.start({
        playerId: PlayerId("player-id"),
        deck,
        startedAt: now,
      }));

      const gameSnapshot = updatedGame.toSnapshot();
      const currentTurn = gameSnapshot.currentTurn;
      expect(currentTurn.playerHands[0].cards.length).toBe(7);
      expect(currentTurn.playerHands[1].cards.length).toBe(7);
      expect(currentTurn.playerHands[2].cards.length).toBe(7);
    });

    test("Players orders can be randomized", () => {
      const now = new Date();
      const { game, deck } = createTestNotStartedGame({
        players: ["player-id", "player-id-2", "player-id-3"],
      }, {
        randomizeStrategy: {
          randomize: (players) => [players[2], players[0], players[1]],
        },
      });

      const updatedGame = Effect.runSync(game.start({
        playerId: PlayerId("player-id"),
        deck,
        startedAt: now,
      }));

      const gameSnapshot = updatedGame.toSnapshot();
      expect(gameSnapshot.players).toEqual([
        "player-id-3",
        "player-id",
        "player-id-2",
      ]);
      const currentTurn = gameSnapshot.currentTurn;
      expect(currentTurn.currentStorytellerId).toBe(PlayerId("player-id-3"));
    });
  });

  describe("Storytelling phase", () => {
    test("The storyteller can submit a clue on one of their cards", () => {
      const { game, storytellerId, storytellerHand } =
        createStartedGameWithXPlayers(4)();

      const updatedGame = Effect.runSync(game.submitClue({
        playerId: PlayerId(storytellerId),
        gameId: game.id,
        cardId: storytellerHand.cards[0].id,
        clue: "A clue",
      }));

      const gameSnapshot = updatedGame.toSnapshot();
      const currentTurn = gameSnapshot.currentTurn;
      expect(currentTurn.turnClue).toStrictEqual(Option.some("A clue"));
    });

    test("Other player than the storyteller cannot submit a clue", () => {
      const { game, storytellerHand } = createStartedGameWithXPlayers(4)();

      const error = Effect.runSync(Effect.flip(game.submitClue({
        playerId: PlayerId("player-id-2"),
        gameId: game.id,
        cardId: storytellerHand.cards[0].id,
        clue: "A clue",
      })));

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Only the storyteller can submit a clue");
    });
  });
});
