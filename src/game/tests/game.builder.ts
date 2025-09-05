import { Context, Effect, Option } from "effect";
import { GameEntitySnapshot, isStartedGameSnapshot } from "../game.entity.js";
import { PlayerId } from "../player.entity.js";
import { GameDriver } from "./game.driver.js";

type EndConditionDto =
  | {
    type: "NumberOfTimesBeingStoryteller";
    numberOfTimes: number;
  }
  | {
    type: "LimitOfPoints";
    limit: number;
  };

interface GameConfig {
  gameId: string;
  deckId?: string;
  deckCards?: number;
  endCondition?: EndConditionDto;
  started?: boolean;
  hostId?: string;
  players: Array<string>;
  playersOrder?: Array<string>;
  storyteller?: string;
  clue?: { clue: string; cardIndex: number };
  selectedCards: Array<{ playerId: string; cardIndex: number }>;
  votedCards: Array<{ playerId: string; cardSelectedByPlayer: string }>;
  scores: Array<{ playerId: string; score: number }>;
  playersReadyForNextTurn: Array<string>;
  inScoringPhase?: boolean;
  scoringPhaseStartedAt?: Date;
}

export class GameBuilder {
  private config: GameConfig;

  constructor(gameId: string) {
    this.config = {
      gameId,
      players: [],
      selectedCards: [],
      votedCards: [],
      scores: [],
      playersReadyForNextTurn: [],
    };
  }

  withDeck(id: string, options?: { containingXCards?: number }): this {
    this.config.deckId = id;
    if (options?.containingXCards !== undefined) {
      this.config.deckCards = options.containingXCards;
    }
    return this;
  }

  withEndCondition(condition: EndConditionDto): this {
    this.config.endCondition = condition;
    return this;
  }

  hostedBy(playerId: string): this {
    this.config.hostId = playerId;
    if (!this.config.players.includes(playerId)) {
      this.config.players = [
        playerId,
        ...this.config.players.filter((p) => p !== playerId),
      ];
    }
    return this;
  }

  started(): this {
    this.config.started = true;
    return this;
  }

  withPlayer(playerId: string): this {
    if (!this.config.players.includes(playerId)) {
      this.config.players.push(playerId);
    }
    return this;
  }

  withPlayers(...playerIds: Array<string>): this {
    for (const playerId of playerIds) {
      this.withPlayer(playerId);
    }
    return this;
  }

  withSubmittedClueOnCardIndex(clue: string, cardIndex: number): this {
    this.config.clue = { clue, cardIndex };
    return this;
  }

  withSelectedCard({
    playerId,
    cardIndex,
  }: {
    playerId: string;
    cardIndex: number;
  }): this {
    this.config.selectedCards.push({ playerId, cardIndex });

    return this;
  }

  withSelectedCards(
    selections: Array<{ playerId: string; cardIndex: number }>,
  ): this {
    for (const selection of selections) {
      this.withSelectedCard({
        playerId: selection.playerId,
        cardIndex: selection.cardIndex,
      });
    }
    return this;
  }

  withVotedCards(
    votes: Array<{ playerId: string; cardSelectedByPlayer: string }>,
  ): this {
    this.config.votedCards = votes;
    return this;
  }

  withScores(scores: Array<{ playerId: string; score: number }>): this {
    this.config.scores = scores;
    return this;
  }

  withPlayersReadyForNextTurn(players: Array<string>): this {
    this.config.playersReadyForNextTurn = players;
    return this;
  }

  inScoringPhaseSince(now: Date): this {
    this.config.inScoringPhase = true;
    this.config.scoringPhaseStartedAt = now;
    return this;
  }

  get gameId(): string {
    return this.config.gameId;
  }

  get deckId(): string {
    return this.config.deckId ?? "default-deck-id";
  }

  build(driver: Context.Tag.Service<GameDriver>): Effect.Effect<void> {
    const self = this;

    return Effect.gen(function* () {
      const config = self.config;

      const deckId = config.deckId ?? "default-deck-id";

      const deckCards = config.deckCards
        ? Array.from({ length: config.deckCards }, (_, i) => `card-${i + 1}`)
        : Array.from({ length: 84 }, (_, i) => `card-${i + 1}`);

      yield* driver.given.existingDeck({
        id: deckId,
        ...(deckCards && { cards: deckCards }),
      });

      yield* driver.given.existingNonStartedGame({
        gameId: config.gameId,
        hostId: config.hostId!,
        deckId,
        players: config.players,
      });

      if (config.started || config.inScoringPhase) {
        if (config.inScoringPhase) {
          config.clue = { clue: "some clue", cardIndex: 0 };
        }

        yield* driver.when.startingGame({
          gameId: config.gameId,
          playerId: config.hostId!,
        });

        let game = yield* driver.getGameSnapshot(config.gameId);
        const storytellerId = getCurrentStorytellerId(game);
        const storytellerCardId = getCardInHandByIndex(game, {
          playerId: storytellerId,
          cardIndex: config.clue?.cardIndex ?? 0,
        });

        if (config.clue) {
          yield* driver.when.submittingClue({
            gameId: config.gameId,
            playerId: storytellerId,
            cardId: storytellerCardId,
            clue: config.clue.clue,
          });
          game = yield* driver.getGameSnapshot(config.gameId);
          if (config.inScoringPhase) {
            config.selectedCards = config.players.slice(1).map((playerId) => ({
              playerId,
              cardIndex: 0,
            }));
          }
          for (const selection of config.selectedCards) {
            yield* driver.when.selectingCard({
              gameId: config.gameId,
              playerId: selection.playerId,
              cardId: getCardInHandByIndex(game, {
                playerId: selection.playerId,
                cardIndex: selection.cardIndex,
              }),
            });
          }

          if (config.inScoringPhase) {
            config.votedCards = config.players.slice(1).map((playerId) => ({
              playerId,
              cardSelectedByPlayer: config.players[0],
            }));
          }
          for (const vote of config.votedCards) {
            game = yield* driver.getGameSnapshot(config.gameId);
            const selectedCards = getSelectedCardsByPlayer(game, {
              playerId: vote.cardSelectedByPlayer,
            });

            if (selectedCards.length === 0) {
              return yield* Effect.die(
                new Error(
                  `[Game Builder] No selected cards found for player ${vote.cardSelectedByPlayer}. Available cards: ${
                    JSON.stringify(
                      getSelectedCardsByPlayer(game, {
                        playerId: vote.cardSelectedByPlayer,
                      }),
                    )
                  }`,
                ),
              );
            }

            for (const selectedCard of selectedCards) {
              yield* driver.when.votingOnCard({
                gameId: config.gameId,
                playerId: vote.playerId,
                cardId: selectedCard.cardId,
              });
            }
          }
          game = yield* driver.getGameSnapshot(config.gameId);
          for (const playerId of config.playersReadyForNextTurn) {
            yield* driver.when.notifyingToBeReadyForNextTurn({
              gameId: config.gameId,
              playerId,
            });
          }
        }
      }
    });
  }
}

export type { EndConditionDto };
export type GameBuilderInstance = GameBuilder;

export const getCardsInDrawPile = (gameSnapshot: GameEntitySnapshot) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    return gameSnapshot.currentTurn.cardsInDrawPile;
  }
  throw new Error("Game is not started");
};

export const getCurrentStorytellerId = (gameSnapshot: GameEntitySnapshot) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    return gameSnapshot.currentTurn.currentStorytellerId;
  }
  throw new Error("Game is not started");
};

export const getStorytellerCardId = (gameSnapshot: GameEntitySnapshot) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    return Option.getOrThrowWith(
      gameSnapshot.currentTurn.turnClue,
      () => new Error("[Game Builder] Storyteller card not found"),
    ).cardId;
  }
  throw new Error("Game is not started");
};

export const getCardInHandByIndex = (
  gameSnapshot: GameEntitySnapshot,
  { playerId, cardIndex }: { playerId: string; cardIndex: number },
) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    const card = gameSnapshot.currentTurn.playerHands.find(
      (hand) => hand.playerId === playerId,
    )?.cards[cardIndex];
    if (!card) {
      throw new Error("Card not found");
    }
    return card.id;
  }
  throw new Error("Game is not started");
};

export const getSelectedCardsByPlayer = (
  gameSnapshot: GameEntitySnapshot,
  { playerId }: { playerId: string },
) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    const selectedCards = [...gameSnapshot.currentTurn.selectedCards];
    if (Option.isSome(gameSnapshot.currentTurn.turnClue)) {
      selectedCards.push({
        cardId: gameSnapshot.currentTurn.turnClue.value.cardId,
        playerId: PlayerId(gameSnapshot.currentTurn.currentStorytellerId),
      });
    }
    return selectedCards.filter((card) => card.playerId === playerId);
  }
  throw new Error("Game is not started");
};

export const getPlayerHand = (
  gameSnapshot: GameEntitySnapshot,
  { playerId }: { playerId: string },
) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    const hand = gameSnapshot.currentTurn.playerHands.find(
      (hand) => hand.playerId === playerId,
    );
    if (!hand) {
      throw new Error("Hand not found");
    }
    return hand.cards;
  }
  throw new Error("Game is not started");
};
