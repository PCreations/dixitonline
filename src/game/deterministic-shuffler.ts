import { Layer } from 'effect';

import { type CardId } from './deck.entity.js';
import { type Shuffler, ShufflerService } from './game-view-projector.js';

/**
 * A deterministic shuffler that always returns the same shuffle
 * for a given list of cards based on their IDs
 */
export class DeterministicShuffler implements Shuffler {
  private seedFromCards(
    cards: ReadonlyArray<{ id: CardId; url: string }>,
  ): number {
    // Create a stable hash from the card IDs in their current order
    const cardIdsString = cards.map((c) => c.id).join(',');
    let hash = 0;
    for (let i = 0; i < cardIdsString.length; i++) {
      const char = cardIdsString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  shuffle(
    cards: ReadonlyArray<{ id: CardId; url: string }>,
  ): ReadonlyArray<{ id: CardId; url: string }> {
    const seed = this.seedFromCards(cards);
    const random = this.seededRandom(seed);

    // Fisher-Yates shuffle with seeded random
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
}

/**
 * A simple random shuffler for comparison/testing
 */
export class RandomShuffler implements Shuffler {
  shuffle(
    cards: ReadonlyArray<{ id: CardId; url: string }>,
  ): ReadonlyArray<{ id: CardId; url: string }> {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Layer providing RandomShuffler for production use.
 * Use this in server.ts to enable real card shuffling.
 */
export const RandomShufflerLayer = Layer.sync(
  ShufflerService,
  () => new RandomShuffler(),
);
