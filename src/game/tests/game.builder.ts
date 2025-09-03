import { Context, Effect } from "effect";
import { GameEntitySnapshot, isStartedGameSnapshot } from "../game.entity.js";
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
}

export class GameBuilder {
  private config: GameConfig;

  constructor(gameId: string) {
    this.config = {
      gameId,
      players: [],
      selectedCards: [],
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

  withSelectedCard(
    { playerId, cardIndex }: { playerId: string; cardIndex: number },
  ): this {
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

      if (config.started) {
        yield* driver.when.startingGame({
          gameId: config.gameId,
          playerId: config.hostId!,
        });

        const game = yield* driver.getGameSnapshot(config.gameId);
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
          const game = yield* driver.getGameSnapshot(config.gameId);
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
        }
      }
    });
  }
}

export type { EndConditionDto };
export type GameBuilderInstance = GameBuilder;

export const getCurrentStorytellerId = (gameSnapshot: GameEntitySnapshot) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    return gameSnapshot.currentTurn.currentStorytellerId;
  }
  throw new Error("Game is not started");
};

export const getCardInHandByIndex = (
  gameSnapshot: GameEntitySnapshot,
  { playerId, cardIndex }: { playerId: string; cardIndex: number },
) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    const card = gameSnapshot.currentTurn.playerHands.find((hand) =>
      hand.playerId === playerId
    )?.cards[cardIndex];
    if (!card) {
      throw new Error("Card not found");
    }
    return card.id;
  }
  throw new Error("Game is not started");
};

export const getSelectedCards = (gameSnapshot: GameEntitySnapshot) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    return gameSnapshot.currentTurn.selectedCards;
  }
  throw new Error("Game is not started");
};

export const getPlayerHand = (
  gameSnapshot: GameEntitySnapshot,
  { playerId }: { playerId: string },
) => {
  if (isStartedGameSnapshot(gameSnapshot)) {
    const hand = gameSnapshot.currentTurn.playerHands.find((hand) =>
      hand.playerId === playerId
    );
    if (!hand) {
      throw new Error("Hand not found");
    }
    return hand.cards;
  }
  throw new Error("Game is not started");
};
