import { Data, Effect } from "effect";
import { CardId } from "./deck.entity.js";
import { PlayerId } from "./player.entity.js";

const CARDS_PER_PLAYER = 6;

export type ScoreReason = Data.TaggedEnum<{
  EveryoneFoundTheStorytellerCard: {};
  NoOneFoundTheStorytellerCard: {};
  AtLeastOnePlayerFoundTheStorytellerCard: {};
  YouFoundTheStorytellerCard: {};
  APlayerVotedOnYourCard: {
    playerId: PlayerId;
  };
}>;

export const {
  EveryoneFoundTheStorytellerCard,
  NoOneFoundTheStorytellerCard,
  AtLeastOnePlayerFoundTheStorytellerCard,
  YouFoundTheStorytellerCard,
  APlayerVotedOnYourCard,
} = Data.taggedEnum<
  ScoreReason
>();

export interface GameRules {
  canPlayerSelectMoreCards(
    selectedCards: ReadonlyArray<{ playerId: PlayerId; cardId: CardId }>,
    playerId: PlayerId,
  ): Effect.Effect<void, Error, never>;
  isVotingPhase(selectedCardsCount: number, totalPlayers: number): boolean;
  isScoringPhase(votedCardsCount: number, totalPlayers: number): boolean;
  computeScore(board: {
    storytellerId: PlayerId;
    votes: ReadonlyArray<{
      cardId: CardId;
      ownedBy: PlayerId;
      votes: ReadonlyArray<PlayerId>;
    }>;
  }): ReadonlyArray<{
    playerId: PlayerId;
    points: ReadonlyArray<{
      value: number;
      reason: ScoreReason;
    }>;
  }>;
  getNumberOfCardsInHand: () => number;
}

export class ThreePlayerRules implements GameRules {
  getNumberOfCardsInHand(): number {
    return CARDS_PER_PLAYER + 1;
  }

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

  isScoringPhase(votedCardsCount: number, totalPlayers: number): boolean {
    return votedCardsCount === totalPlayers - 1;
  }

  computeScore(board: {
    storytellerId: PlayerId;
    votes: ReadonlyArray<{
      cardId: CardId;
      ownedBy: PlayerId;
      votes: ReadonlyArray<PlayerId>;
    }>;
  }): ReadonlyArray<{
    playerId: PlayerId;
    points: ReadonlyArray<{
      value: number;
      reason: ScoreReason;
    }>;
  }> {
    const scoreComputer = new ScoreComputer(board.votes.length);
    const storytellerCard = board.votes.find(
      (vote) => vote.ownedBy === board.storytellerId,
    );

    if (storytellerCard === undefined) {
      throw new Error("The storyteller card is not in the board");
    }

    return board.votes.map((boardCard) => ({
      playerId: boardCard.ownedBy,
      points: scoreComputer.computePointsForPlayer({
        cardId: boardCard.cardId,
        playerId: boardCard.ownedBy,
        votes: boardCard.votes,
        storytellerId: board.storytellerId,
        storytellerCard,
      }),
    }));
  }
}

export class NormalRules implements GameRules {
  getNumberOfCardsInHand(): number {
    return CARDS_PER_PLAYER;
  }

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

  isScoringPhase(votedCardsCount: number, totalPlayers: number): boolean {
    return votedCardsCount === totalPlayers - 1;
  }

  computeScore(board: {
    storytellerId: PlayerId;
    votes: ReadonlyArray<{
      cardId: CardId;
      ownedBy: PlayerId;
      votes: ReadonlyArray<PlayerId>;
    }>;
  }): ReadonlyArray<{
    playerId: PlayerId;
    points: ReadonlyArray<{
      value: number;
      reason: ScoreReason;
    }>;
  }> {
    const scoreComputer = new ScoreComputer(board.votes.length);
    const storytellerCard = board.votes.find(
      (vote) => vote.ownedBy === board.storytellerId,
    );

    if (storytellerCard === undefined) {
      throw new Error("The storyteller card is not in the board");
    }

    return board.votes.map((boardCard) => ({
      playerId: boardCard.ownedBy,
      points: scoreComputer.computePointsForPlayer({
        cardId: boardCard.cardId,
        playerId: boardCard.ownedBy,
        votes: boardCard.votes,
        storytellerId: board.storytellerId,
        storytellerCard,
      }),
    }));
  }
}

class ScoreComputer {
  constructor(private readonly numberOfPlayers: number) {}

  computePointsForPlayer(opts: {
    cardId: CardId;
    playerId: PlayerId;
    votes: ReadonlyArray<PlayerId>;
    storytellerId: PlayerId;
    storytellerCard: {
      cardId: CardId;
      ownedBy: PlayerId;
      votes: ReadonlyArray<PlayerId>;
    };
  }): ReadonlyArray<{
    value: number;
    reason: ScoreReason;
  }> {
    const isStoryteller = opts.storytellerId === opts.playerId;

    const noOneFoundTheStorytellerCard =
      opts.storytellerCard.votes.length === 0;
    const everyoneFoundTheStorytellerCard =
      opts.storytellerCard.votes.length === this.numberOfPlayers - 1;
    const foundTheStorytellerCard = opts.storytellerCard.votes.includes(
      opts.playerId,
    );

    const pointsEarnedWhenFoundTheStorytellerCard = this.numberOfPlayers === 3
      ? 4
      : 3;

    if (isStoryteller) {
      if (noOneFoundTheStorytellerCard) {
        return [{
          value: 0,
          reason: NoOneFoundTheStorytellerCard(),
        }];
      }

      if (everyoneFoundTheStorytellerCard) {
        return [{
          value: 0,
          reason: EveryoneFoundTheStorytellerCard(),
        }];
      }

      return [{
        value: pointsEarnedWhenFoundTheStorytellerCard,
        reason: AtLeastOnePlayerFoundTheStorytellerCard(),
      }];
    }

    return [
      ...(foundTheStorytellerCard && !everyoneFoundTheStorytellerCard
        ? [{
          value: pointsEarnedWhenFoundTheStorytellerCard,
          reason: YouFoundTheStorytellerCard(),
        }]
        : []),
      ...(noOneFoundTheStorytellerCard
        ? [{
          value: 2,
          reason: NoOneFoundTheStorytellerCard(),
        }]
        : []),
      ...(everyoneFoundTheStorytellerCard
        ? [{
          value: 2,
          reason: EveryoneFoundTheStorytellerCard(),
        }]
        : opts.votes.map((vote) => ({
          value: 1,
          reason: APlayerVotedOnYourCard({
            playerId: vote,
          }),
        }))),
    ];
  }
}

export class GameRulesFactory {
  static createForPlayersCount(playerCount: number): GameRules {
    if (playerCount === 3) {
      return new ThreePlayerRules();
    }
    return new NormalRules();
  }
}
