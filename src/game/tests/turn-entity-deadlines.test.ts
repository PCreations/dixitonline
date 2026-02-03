import { describe, expect, it } from '@effect/vitest';
import { Card, CardId } from '../deck.entity.js';
import { GameId, PlayerHand } from '../game.entity.js';
import { PlayerId } from '../player.entity.js';
import { TurnEntity, TurnId } from '../turn.entity.js';

const createTestTurn = () => {
  const gameId = GameId('test-game');
  const turnId = TurnId('test-turn');
  const storytellerId = PlayerId('storyteller');
  const player1 = PlayerId('player-1');
  const player2 = PlayerId('player-2');

  const createCards = (prefix: string, count: number) =>
    Array.from({ length: count }, (_, i) =>
      Card.create({
        id: CardId(`${prefix}-card-${i + 1}`),
        url: `https://example.com/${prefix}-card-${i + 1}`,
      }),
    ) as [Card, ...Card[]];

  return TurnEntity.create({
    id: turnId,
    gameId,
    currentStorytellerId: storytellerId,
    playerHands: [
      PlayerHand.create({
        playerId: storytellerId,
        cards: createCards('storyteller', 6),
      }),
      PlayerHand.create({
        playerId: player1,
        cards: createCards('player1', 6),
      }),
      PlayerHand.create({
        playerId: player2,
        cards: createCards('player2', 6),
      }),
    ],
    cardsInDrawPile: createCards('draw', 10),
    startedAt: new Date('2024-01-01T12:00:00Z'),
  });
};

describe('TurnEntity playerDeadlines', () => {
  describe('setPlayerDeadline', () => {
    it('stores the deadline for a player', () => {
      const turn = createTestTurn();
      const playerId = PlayerId('storyteller');
      const deadline = new Date('2024-01-01T12:00:30Z');

      const updatedTurn = turn.setPlayerDeadline(playerId, deadline);
      const snapshot = updatedTurn.toSnapshot();

      expect(snapshot.playerDeadlines.get(playerId)).toEqual(deadline);
    });

    it('overwrites existing deadline for the same player', () => {
      const turn = createTestTurn();
      const playerId = PlayerId('storyteller');
      const firstDeadline = new Date('2024-01-01T12:00:30Z');
      const secondDeadline = new Date('2024-01-01T12:01:00Z');

      const turnWithFirstDeadline = turn.setPlayerDeadline(
        playerId,
        firstDeadline,
      );
      const turnWithSecondDeadline = turnWithFirstDeadline.setPlayerDeadline(
        playerId,
        secondDeadline,
      );

      expect(
        turnWithSecondDeadline.toSnapshot().playerDeadlines.get(playerId),
      ).toEqual(secondDeadline);
    });
  });

  describe('clearPlayerDeadline', () => {
    it('removes the deadline for a player', () => {
      const turn = createTestTurn();
      const playerId = PlayerId('storyteller');
      const deadline = new Date('2024-01-01T12:00:30Z');

      const turnWithDeadline = turn.setPlayerDeadline(playerId, deadline);
      const turnWithoutDeadline =
        turnWithDeadline.clearPlayerDeadline(playerId);

      expect(
        turnWithoutDeadline.toSnapshot().playerDeadlines.has(playerId),
      ).toBe(false);
    });

    it('does nothing if player has no deadline', () => {
      const turn = createTestTurn();
      const playerId = PlayerId('storyteller');

      const result = turn.clearPlayerDeadline(playerId);

      expect(result.toSnapshot().playerDeadlines.has(playerId)).toBe(false);
    });
  });

  describe('getExpiredPlayerDeadlines', () => {
    it('returns empty array when no deadlines are set', () => {
      const turn = createTestTurn();
      const now = new Date('2024-01-01T12:00:30Z');

      const expired = turn.getExpiredPlayerDeadlines(now);

      expect(expired).toEqual([]);
    });

    it('returns player IDs whose deadlines have expired', () => {
      const turn = createTestTurn();
      const storytellerId = PlayerId('storyteller');
      const player1 = PlayerId('player-1');
      const expiredDeadline = new Date('2024-01-01T12:00:00Z');
      const futureDeadline = new Date('2024-01-01T12:01:00Z');
      const now = new Date('2024-01-01T12:00:30Z');

      const turnWithDeadlines = turn
        .setPlayerDeadline(storytellerId, expiredDeadline)
        .setPlayerDeadline(player1, futureDeadline);

      const expired = turnWithDeadlines.getExpiredPlayerDeadlines(now);

      expect(expired).toEqual([storytellerId]);
    });

    it('returns multiple expired players', () => {
      const turn = createTestTurn();
      const storytellerId = PlayerId('storyteller');
      const player1 = PlayerId('player-1');
      const player2 = PlayerId('player-2');
      const expiredDeadline = new Date('2024-01-01T12:00:00Z');
      const now = new Date('2024-01-01T12:00:30Z');

      const turnWithDeadlines = turn
        .setPlayerDeadline(storytellerId, expiredDeadline)
        .setPlayerDeadline(player1, expiredDeadline)
        .setPlayerDeadline(player2, expiredDeadline);

      const expired = turnWithDeadlines.getExpiredPlayerDeadlines(now);

      expect(expired).toHaveLength(3);
      expect(expired).toContain(storytellerId);
      expect(expired).toContain(player1);
      expect(expired).toContain(player2);
    });

    it('considers deadline equal to now as expired', () => {
      const turn = createTestTurn();
      const playerId = PlayerId('storyteller');
      const deadline = new Date('2024-01-01T12:00:30Z');
      const now = new Date('2024-01-01T12:00:30Z');

      const turnWithDeadline = turn.setPlayerDeadline(playerId, deadline);
      const expired = turnWithDeadline.getExpiredPlayerDeadlines(now);

      expect(expired).toEqual([playerId]);
    });
  });

  describe('snapshot serialization', () => {
    it('preserves deadlines through toSnapshot/fromSnapshot roundtrip', () => {
      const turn = createTestTurn();
      const storytellerId = PlayerId('storyteller');
      const player1 = PlayerId('player-1');
      const deadline1 = new Date('2024-01-01T12:00:30Z');
      const deadline2 = new Date('2024-01-01T12:01:00Z');

      const turnWithDeadlines = turn
        .setPlayerDeadline(storytellerId, deadline1)
        .setPlayerDeadline(player1, deadline2);

      const snapshot = turnWithDeadlines.toSnapshot();
      const restored = TurnEntity.fromSnapshot(snapshot);
      const restoredSnapshot = restored.toSnapshot();

      expect(restoredSnapshot.playerDeadlines.get(storytellerId)).toEqual(
        deadline1,
      );
      expect(restoredSnapshot.playerDeadlines.get(player1)).toEqual(deadline2);
    });

    it('handles empty deadlines map', () => {
      const turn = createTestTurn();

      const snapshot = turn.toSnapshot();
      const restored = TurnEntity.fromSnapshot(snapshot);
      const restoredSnapshot = restored.toSnapshot();

      expect(restoredSnapshot.playerDeadlines.size).toBe(0);
    });
  });
});
