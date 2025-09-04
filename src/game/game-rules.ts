import { Effect } from "effect";
import { CardId } from "./deck.entity.js";
import { PlayerId } from "./player.entity.js";

export interface GameRules {
  canPlayerSelectMoreCards(
    selectedCards: ReadonlyArray<{ playerId: PlayerId; cardId: CardId }>,
    playerId: PlayerId,
  ): Effect.Effect<void, Error, never>;
  isVotingPhase(selectedCardsCount: number, totalPlayers: number): boolean;
}

export class ThreePlayerRules implements GameRules {
  canPlayerSelectMoreCards(
    selectedCards: ReadonlyArray<{ playerId: PlayerId; cardId: CardId }>,
    playerId: PlayerId,
  ): Effect.Effect<void, Error, never> {
    const playerSelectedCount = selectedCards.filter(
      (card) => card.playerId === playerId,
    ).length;

    if (playerSelectedCount >= 2) {
      return Effect.fail(new Error("A player can only select two cards"));
    }

    return Effect.void;
  }

  isVotingPhase(selectedCardsCount: number): boolean {
    return selectedCardsCount === 4;
  }
}

export class NormalRules implements GameRules {
  canPlayerSelectMoreCards(
    selectedCards: ReadonlyArray<{ playerId: PlayerId; cardId: CardId }>,
    playerId: PlayerId,
  ): Effect.Effect<void, Error, never> {
    const hasPlayerSelected = selectedCards.some(
      (card) => card.playerId === playerId,
    );

    if (hasPlayerSelected) {
      return Effect.fail(new Error("A player can only select one card"));
    }

    return Effect.void;
  }

  isVotingPhase(selectedCardsCount: number, totalPlayers: number): boolean {
    return selectedCardsCount === totalPlayers - 1;
  }
}

export class GameRulesFactory {
  static create(playerCount: number): GameRules {
    if (playerCount === 3) {
      return new ThreePlayerRules();
    }
    return new NormalRules();
  }
}
