import { Effect, Option } from 'effect';
import { PlayerId, PlayerRepository } from '../player/index.js';
import type { CardId } from './deck.entity.js';
import {
  type EndedGameEntity,
  isEndedGame,
  isNotStartedGame,
  isStartedGame,
  type StartedGameSnapshot,
} from './game.entity.js';
import { GameRepository } from './game.repository.js';
import type { ScoreReason } from './game-rules.js';
import { GameViewProjector } from './game-view-projector.js';

// === Shared Types ===
export interface PlayerInfo {
  readonly id: string;
  readonly name: string;
  readonly isCurrentPlayer: boolean;
}

export interface CardView {
  readonly id: string;
  readonly url: string;
}

export interface PlayerStatus {
  readonly player: PlayerInfo;
  readonly status: 'ready' | 'not-ready';
  readonly score: number;
}

export interface HtmxAction {
  readonly type: string;
  readonly url: string;
  readonly method: 'POST' | 'GET';
  readonly label: string;
  readonly disabled: boolean;
}

export interface PointEarned {
  readonly points: number;
  readonly reason: ScoreReason;
}

// === Base Props (common to all in-game phases) ===
interface GameViewBase {
  readonly gameId: string;
  readonly currentPlayer: PlayerInfo;
  readonly score: number;
  readonly turnNumber: number;
  readonly storyteller: PlayerInfo;
  readonly hand: ReadonlyArray<CardView>;
  readonly playersStatus: ReadonlyArray<PlayerStatus>;
}

// === Phase-specific Views (Discriminated Union) ===

// Storytelling Phase - Storyteller
export interface StorytellingPhaseAsStorytellerView extends GameViewBase {
  readonly _tag: 'StorytellingPhaseAsStoryteller';
  readonly action: HtmxAction;
}

// Storytelling Phase - Guesser
export interface StorytellingAsGuesserView extends GameViewBase {
  readonly _tag: 'StorytellingAsGuesser';
}

// Selecting Cards Phase - Storyteller
export interface SelectingCardsAsStorytellerView extends GameViewBase {
  readonly _tag: 'SelectingCardsAsStoryteller';
  readonly clue: string;
}

// Selecting Cards Phase - Guesser
export interface SelectingCardsAsGuesserView extends GameViewBase {
  readonly _tag: 'SelectingCardsAsGuesser';
  readonly clue: string;
  readonly hasSelectedCard: boolean;
  readonly action: HtmxAction;
}

// Voting Phase - Storyteller
export interface VotingAsStorytellerView extends GameViewBase {
  readonly _tag: 'VotingAsStoryteller';
  readonly clue: string;
  readonly boardCards: ReadonlyArray<CardView>;
}

// Voting Phase - Guesser
export interface VotingAsGuesserView extends GameViewBase {
  readonly _tag: 'VotingAsGuesser';
  readonly clue: string;
  readonly boardCards: ReadonlyArray<CardView>;
  readonly hasVoted: boolean;
  readonly ownCardId: string;
  readonly action: HtmxAction;
}

// Scoring Phase (same for all players)
export interface ScoringView extends GameViewBase {
  readonly _tag: 'Scoring';
  readonly clue: string;
  readonly boardCards: ReadonlyArray<CardView>;
  readonly votes: Record<string, ReadonlyArray<PlayerInfo>>;
  readonly storytellerCardId: string;
  readonly pointsEarned: ReadonlyArray<PointEarned>;
  readonly action: HtmxAction;
}

// Ended Phase
export interface EndedView {
  readonly _tag: 'Ended';
  readonly gameId: string;
  readonly currentPlayer: PlayerInfo;
  readonly rankings: ReadonlyArray<{
    readonly rank: number;
    readonly player: PlayerInfo;
    readonly score: number;
  }>;
  readonly action: HtmxAction;
}

// === Union Type ===
export type GamePlayerView =
  | StorytellingPhaseAsStorytellerView
  | StorytellingAsGuesserView
  | SelectingCardsAsStorytellerView
  | SelectingCardsAsGuesserView
  | VotingAsStorytellerView
  | VotingAsGuesserView
  | ScoringView
  | EndedView;

// === Query Service ===
export class GameQueryService extends Effect.Service<GameQueryService>()(
  'game/GameQueryService',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const playerRepository = yield* PlayerRepository;
      const gameViewProjector = yield* GameViewProjector;

      return {
        getGameState: (gameId: string, currentPlayerId: string) =>
          Effect.gen(function* () {
            const maybeGame = yield* gameRepository.findById(gameId);

            if (Option.isNone(maybeGame)) {
              return Option.none<GamePlayerView>();
            }

            const game = maybeGame.value;

            // For lobby state, redirect to LobbyQueryService
            if (isNotStartedGame(game)) {
              return Option.none<GamePlayerView>();
            }

            // Fetch all player names in a single query
            const playerIds = game
              .toSnapshot()
              .players.map((id) => PlayerId(id));
            const playersMap = yield* playerRepository.findByIds(playerIds);

            const getPlayerInfo = (
              playerId: string,
              isCurrentPlayer: boolean,
            ): PlayerInfo => {
              const player = playersMap.get(PlayerId(playerId));
              return {
                id: playerId,
                name: player?.toSnapshot().username ?? 'Joueur inconnu',
                isCurrentPlayer,
              };
            };

            if (isEndedGame(game)) {
              return Option.some(
                buildEndedView(game, currentPlayerId, getPlayerInfo),
              );
            }

            if (isStartedGame(game)) {
              const snapshot = game.toSnapshot();
              const projection = yield* gameViewProjector.project(snapshot);
              const playerView = projection[currentPlayerId];

              if (!playerView || !('cards' in playerView)) {
                return Option.none<GamePlayerView>();
              }

              return Option.some(
                buildGameView(
                  snapshot,
                  playerView as PlayerProjection,
                  currentPlayerId,
                  getPlayerInfo,
                ),
              );
            }

            return Option.none<GamePlayerView>();
          }),
      };
    }),
    dependencies: [GameViewProjector.Default],
  },
) {}

// === Helper functions ===

function buildEndedView(
  game: EndedGameEntity,
  currentPlayerId: string,
  getPlayerInfo: (playerId: string, isCurrent: boolean) => PlayerInfo,
): EndedView {
  const snapshot = game.toSnapshot();
  const { scores } = snapshot;

  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return {
    _tag: 'Ended',
    gameId: snapshot.id,
    currentPlayer: getPlayerInfo(currentPlayerId, true),
    rankings: sortedScores.map((s, index) => ({
      rank: index + 1,
      player: getPlayerInfo(
        s.playerId as string,
        s.playerId === currentPlayerId,
      ),
      score: s.score,
    })),
    action: {
      type: 'back-to-home',
      url: '/',
      method: 'GET',
      label: "Retour à l'accueil",
      disabled: false,
    },
  };
}

interface PlayerProjection {
  readonly gameId: string;
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly cards: ReadonlyArray<{ id: string; url: string }>;
  readonly storyteller: string;
  readonly phase: 'storytelling' | 'selecting-cards' | 'voting' | 'scoring';
  readonly playerStatus: Record<string, 'ready' | 'not-ready'>;
  readonly boardCards?: ReadonlyArray<{ id: CardId; url: string }>;
  readonly votes?: Record<CardId, Array<PlayerId>>;
  readonly clue?: string;
  readonly storytellerCardId?: CardId;
  readonly points?: ReadonlyArray<{ points: number; reason: ScoreReason }>;
}

function buildGameView(
  snapshot: StartedGameSnapshot,
  playerView: PlayerProjection,
  currentPlayerId: string,
  getPlayerInfo: (playerId: string, isCurrent: boolean) => PlayerInfo,
): GamePlayerView {
  const isStoryteller = playerView.storyteller === currentPlayerId;
  const { phase } = playerView;

  const baseView: GameViewBase = {
    gameId: playerView.gameId,
    currentPlayer: getPlayerInfo(currentPlayerId, true),
    score: playerView.score,
    turnNumber: snapshot.currentTurn.turnNumber,
    storyteller: getPlayerInfo(
      playerView.storyteller,
      playerView.storyteller === currentPlayerId,
    ),
    hand: playerView.cards.map((c) => ({ id: c.id, url: c.url })),
    playersStatus: snapshot.players.map((playerId) => ({
      player: getPlayerInfo(playerId, playerId === currentPlayerId),
      status: playerView.playerStatus[playerId],
      score: snapshot.scores.find((s) => s.playerId === playerId)?.score ?? 0,
    })),
  };

  switch (phase) {
    case 'storytelling':
      if (isStoryteller) {
        return {
          ...baseView,
          _tag: 'StorytellingAsStoryteller',
          action: {
            type: 'submit-clue',
            url: `/game/${playerView.gameId}/clue`,
            method: 'POST',
            label: "Soumettre l'indice",
            disabled: false,
          },
        };
      }
      return {
        ...baseView,
        _tag: 'StorytellingAsGuesser',
      };

    case 'selecting-cards':
      if (isStoryteller) {
        return {
          ...baseView,
          _tag: 'SelectingCardsAsStoryteller',
          clue: playerView.clue ?? '',
        };
      }
      return {
        ...baseView,
        _tag: 'SelectingCardsAsGuesser',
        clue: playerView.clue ?? '',
        hasSelectedCard: playerView.playerStatus[currentPlayerId] === 'ready',
        action: {
          type: 'select-card',
          url: `/game/${playerView.gameId}/select-card`,
          method: 'POST',
          label: 'Sélectionner une carte',
          disabled: playerView.playerStatus[currentPlayerId] === 'ready',
        },
      };

    case 'voting': {
      const ownCardId = findPlayerOwnCardId(snapshot, currentPlayerId);
      if (isStoryteller) {
        return {
          ...baseView,
          _tag: 'VotingAsStoryteller',
          clue: playerView.clue ?? '',
          boardCards: playerView.boardCards ?? [],
        };
      }
      return {
        ...baseView,
        _tag: 'VotingAsGuesser',
        clue: playerView.clue ?? '',
        boardCards: playerView.boardCards ?? [],
        hasVoted: playerView.playerStatus[currentPlayerId] === 'ready',
        ownCardId: ownCardId ?? '',
        action: {
          type: 'vote',
          url: `/game/${playerView.gameId}/vote`,
          method: 'POST',
          label: 'Voter',
          disabled: playerView.playerStatus[currentPlayerId] === 'ready',
        },
      };
    }

    case 'scoring': {
      const votesWithPlayerInfo: Record<string, ReadonlyArray<PlayerInfo>> = {};
      if (playerView.votes) {
        for (const [cardId, voters] of Object.entries(playerView.votes)) {
          votesWithPlayerInfo[cardId] = voters.map((voterId) =>
            getPlayerInfo(voterId as string, voterId === currentPlayerId),
          );
        }
      }

      return {
        ...baseView,
        _tag: 'Scoring',
        clue: playerView.clue ?? '',
        boardCards: playerView.boardCards ?? [],
        votes: votesWithPlayerInfo,
        storytellerCardId: playerView.storytellerCardId ?? '',
        pointsEarned: playerView.points ?? [],
        action: {
          type: 'ready-for-next-turn',
          url: `/game/${playerView.gameId}/ready`,
          method: 'POST',
          label: 'Continuer',
          disabled: playerView.playerStatus[currentPlayerId] === 'ready',
        },
      };
    }
  }
}

function findPlayerOwnCardId(
  snapshot: StartedGameSnapshot,
  playerId: string,
): string | undefined {
  const selectedCard = snapshot.currentTurn.selectedCards.find(
    (c) => c.playerId === playerId,
  );
  return selectedCard?.cardId;
}
