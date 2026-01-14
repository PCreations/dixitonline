import { describe, expect, it } from 'vitest';

import { CardId } from '../deck.entity.js';
import {
  DeterministicShuffler,
  RandomShuffler,
} from '../deterministic-shuffler.js';

describe('DeterministicShuffler', () => {
  const createCards = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: CardId(`card-${i}`),
      url: `https://example.com/card-${i}.jpg`,
    }));
  };

  it('should return the same shuffle for the same input', () => {
    const shuffler = new DeterministicShuffler();
    const cards = createCards(10);

    const result1 = shuffler.shuffle(cards);
    const result2 = shuffler.shuffle(cards);
    const result3 = shuffler.shuffle(cards);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it('should return different shuffle for different input order', () => {
    const shuffler = new DeterministicShuffler();
    const cards = createCards(5);

    // Shuffle the input order
    const reorderedCards = [cards[2], cards[0], cards[4], cards[1], cards[3]];

    const result1 = shuffler.shuffle(cards);
    const result2 = shuffler.shuffle(reorderedCards);

    // Results should be different since order matters
    expect(result1).not.toEqual(result2);

    // But shuffling the same reordered list should give the same result
    const result3 = shuffler.shuffle(reorderedCards);
    expect(result2).toEqual(result3);
  });

  it('should return different shuffles for different card sets', () => {
    const shuffler = new DeterministicShuffler();
    const cards1 = createCards(5);
    const cards2 = createCards(5).map((c, i) => ({
      ...c,
      id: CardId(`different-${i}`),
    }));

    const result1 = shuffler.shuffle(cards1);
    const result2 = shuffler.shuffle(cards2);

    expect(result1).not.toEqual(result2);
  });

  it('should actually shuffle the cards', () => {
    const shuffler = new DeterministicShuffler();
    const cards = createCards(10);

    const result = shuffler.shuffle(cards);

    // Should have same cards but in different order
    expect(result).toHaveLength(cards.length);
    expect(new Set(result)).toEqual(new Set(cards));

    // Should not be in the same order (with high probability for 10 cards)
    const isShuffled = result.some(
      (card, index) => card.id !== cards[index].id,
    );
    expect(isShuffled).toBe(true);
  });

  it('RandomShuffler should give different results each time', () => {
    const shuffler = new RandomShuffler();
    const cards = createCards(10);

    const results = new Set();
    for (let i = 0; i < 10; i++) {
      const result = shuffler.shuffle(cards);
      results.add(JSON.stringify(result.map((c) => c.id)));
    }

    // Should have multiple different shuffles
    expect(results.size).toBeGreaterThan(1);
  });
});
