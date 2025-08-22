import { Array as Arr, Effect, Option } from "effect";
import { describe, expect, test } from "vitest";
import { Card, CardId, DeckEntity, DeckId } from "../deck.entity.js";
import { GameEntity, GameId, GameStatus } from "../game.entity.js";
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

/**
 * For these tests, the Game Entity become our entry point. Thus, everything exported from Game Entity is considered public API.
 */
describe.only("Game logic", () => {
  test("Game can be started", () => {
    const now = new Date();
    const { deck, cards } = createDeckWithXcards(25);
    const choppedCards = Arr.chunksOf(cards, 6);
    const remainingCard = cards.at(-1);
    const game = GameEntity.fromSnapshot({
      id: GameId("game-id"),
      createdBy: PlayerId("player-id"),
      deckId: deck.id,
      endCondition: {
        type: "NumberOfTimesBeingStoryteller",
        numberOfTimes: 3,
      },
      players: ["player-id", "player-id-2", "player-id-3", "player-id-4"],
      status: GameStatus.Created,
      version: 1,
      currentTurn: Option.none(),
    });

    const updatedGame = Effect.runSync(game.start({
      playerId: PlayerId("player-id"),
      deck,
      startedAt: now,
    }));

    const gameSnapshot = updatedGame.toSnapshot();

    expect(gameSnapshot.version).toBe(2);
    expect(gameSnapshot.status).toBe(GameStatus.Started);
    expect(gameSnapshot.currentTurn).toStrictEqual(Option.some({
      id: TurnId("game-id-turn-1"),
      gameId: GameId("game-id"),
      currentStorytellerId: PlayerId("player-id"),
      playerHands: [{
        playerId: PlayerId("player-id"),
        cards: choppedCards[0],
      }, {
        playerId: PlayerId("player-id-2"),
        cards: choppedCards[1],
      }, {
        playerId: PlayerId("player-id-3"),
        cards: choppedCards[2],
      }, {
        playerId: PlayerId("player-id-4"),
        cards: choppedCards[3],
      }],
      cardsInDrawPile: [remainingCard],
      turnNumber: 1,
      startedAt: now,
      turnClue: Option.none(),
      phase: "storytelling",
    }));
  });
});
