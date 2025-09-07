import { Option } from "effect";
import { CardId, DeckSnapshot } from "./deck.entity.js";
import { StartedGameSnapshot } from "./game.entity.js";
import { PlayerId } from "./player.entity.js";
import { TurnId } from "./turn.entity.js";

export interface Shuffler {
  shuffle(
    cards: ReadonlyArray<{ id: CardId; url: string }>,
  ): ReadonlyArray<{ id: CardId; url: string }>;
}

export class TurnBoardCardsShuffler {
  private readonly boardCardsForTurn: Map<
    TurnId,
    ReadonlyArray<{ id: CardId; url: string }>
  > = new Map();

  constructor(private readonly shuffler: Shuffler) {}

  shuffleForTurn(
    turnId: TurnId,
    cards: ReadonlyArray<{ id: CardId; url: string }>,
  ): ReadonlyArray<{ id: CardId; url: string }> {
    if (this.boardCardsForTurn.has(turnId)) {
      return this.boardCardsForTurn.get(turnId) ?? [];
    }

    this.boardCardsForTurn.set(turnId, this.shuffler.shuffle(cards));
    return this.boardCardsForTurn.get(turnId)!;
  }
}

export class GameViewProjector {
  constructor(
    private readonly boardCardsShuffler: TurnBoardCardsShuffler,
    private readonly deck: DeckSnapshot,
  ) {}

  public project(game: StartedGameSnapshot) {
    const playerStatus = Object.fromEntries(
      game.players.map((playerId) => [
        playerId,
        this.isPlayerReadyForNextPhase({ game, playerId })
          ? "ready"
          : "not-ready",
      ]),
    );
    const boardCards = this.getBoardCards({ game });
    const votes = this.getVotes({ game });
    return Object.fromEntries(
      game.players.map((playerId) => [
        playerId,
        {
          id: playerId,
          name: playerId,
          score:
            game.scores.find((score) => score.playerId === playerId)?.score ??
              0,
          cards: (
            game.currentTurn.playerHands.find(
              (hand) => hand.playerId === playerId,
            )?.cards ?? []
          ).map((card) => ({
            id: card.id,
            url: card.url,
          })),
          storyteller: game.currentTurn.currentStorytellerId,
          phase: game.currentTurn.phase,
          playerStatus,
          ...boardCards,
          ...votes,
          ...this.getPoints({ game, playerId }),
        },
      ]),
    );
  }

  private isPlayerReadyForNextPhase(opts: {
    game: StartedGameSnapshot;
    playerId: string;
  }) {
    const isStoryteller =
      opts.game.currentTurn.currentStorytellerId === opts.playerId;
    if (opts.game.currentTurn.phase === "storytelling") {
      if (isStoryteller) {
        return Option.isSome(opts.game.currentTurn.turnClue);
      }
      return true;
    }
    if (opts.game.currentTurn.phase === "selecting-cards") {
      if (isStoryteller) {
        return true;
      }
      return opts.game.currentTurn.selectedCards.some(
        (card) => card.playerId === opts.playerId,
      );
    }
    if (opts.game.currentTurn.phase === "voting") {
      if (isStoryteller) {
        return true;
      }
      return opts.game.currentTurn.votedCards.some(
        (card) => card.votedBy === opts.playerId,
      );
    }
    if (opts.game.currentTurn.phase === "scoring") {
      return opts.game.playersReadyForNextTurn.includes(
        PlayerId(opts.playerId),
      );
    }
    return false;
  }

  private getBoardCards(opts: { game: StartedGameSnapshot }) {
    if (
      ["storytelling", "selecting-cards"].includes(opts.game.currentTurn.phase)
    ) {
      return {};
    }
    if (
      opts.game.currentTurn.phase === "voting" ||
      opts.game.currentTurn.phase === "scoring"
    ) {
      const storytellerCard = Option.getOrThrowWith(
        opts.game.currentTurn.turnClue,
        () =>
          new Error(
            "Error while getting board cards on voting phase when projecting views",
          ),
      );
      const allAvailableCards = opts.game.currentTurn.selectedCards
        .map((c) => ({
          id: c.cardId,
          url: this.getCardUrl(c.cardId),
        }))
        .concat([
          {
            id: storytellerCard.cardId,
            url: `https://example.com/${storytellerCard.cardId}`,
          },
        ]);
      return {
        boardCards: this.boardCardsShuffler.shuffleForTurn(
          TurnId(opts.game.currentTurn.id),
          allAvailableCards,
        ),
      };
    }
    return {};
  }

  private getVotes(opts: { game: StartedGameSnapshot }) {
    const votes: Record<CardId, Array<PlayerId>> = {};
    if (opts.game.currentTurn.phase === "scoring") {
      for (const vote of opts.game.currentTurn.votedCards) {
        votes[vote.cardId] = (votes[vote.cardId] ?? []).concat(vote.votedBy);
      }
      for (const card of opts.game.currentTurn.selectedCards) {
        votes[card.cardId] = votes[card.cardId] ?? [];
      }
    }
    return Object.keys(votes).length > 0
      ? {
        votes,
      }
      : {};
  }

  private getPoints(opts: { game: StartedGameSnapshot; playerId: string }) {
    if (opts.game.currentTurn.phase === "scoring") {
      return {
        points:
          opts.game.currentTurn.pointsByPlayer.get(PlayerId(opts.playerId)) ??
            [],
      };
    }
    return {};
  }

  private getCardUrl(cardId: CardId) {
    return this.deck.cardsById[cardId].url;
  }
}
