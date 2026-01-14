import { Effect, Option } from 'effect';
import { PlayerId, PlayerRepository } from '../player/index.js';
import { isNotStartedGame } from './game.entity.js';
import { GameRepository } from './game.repository.js';
import { GameViewProjector, type LobbyAction } from './game-view-projector.js';

export interface LobbyPlayer {
  readonly id: string;
  readonly username: string;
}

export interface LobbyState {
  readonly gameId: string;
  readonly hostId: string;
  readonly players: ReadonlyArray<LobbyPlayer>;
  readonly isHost: boolean;
  readonly canStart: boolean;
  readonly actions: ReadonlyArray<LobbyAction>;
}

export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  'game/LobbyQueryService',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const playerRepository = yield* PlayerRepository;
      const gameViewProjector = yield* GameViewProjector;

      return {
        getLobbyState: (gameId: string, currentPlayerId: string) =>
          Effect.gen(function* () {
            const maybeGame = yield* gameRepository.findById(gameId);

            if (Option.isNone(maybeGame)) {
              return Option.none<LobbyState>();
            }

            const game = maybeGame.value;
            if (!isNotStartedGame(game)) {
              return Option.none<LobbyState>();
            }

            const snapshot = game.toSnapshot();

            // Get projection for current player (includes canStart, isHost, actions)
            const lobbyViews = yield* gameViewProjector.projectLobby(snapshot);
            const currentPlayerView = lobbyViews[currentPlayerId];

            // Fetch all player names in a single query (no N+1)
            const playerIds = snapshot.players.map((id) => PlayerId(id));
            const playersMap = yield* playerRepository.findByIds(playerIds);

            // Build player list with names, fallback to "Unknown" if not found
            const players: ReadonlyArray<LobbyPlayer> = snapshot.players.map(
              (id) => {
                const player = playersMap.get(PlayerId(id));
                return {
                  id,
                  username: player?.toSnapshot().username ?? 'Joueur inconnu',
                };
              },
            );

            return Option.some({
              gameId: snapshot.id,
              hostId: snapshot.createdBy,
              players,
              isHost: currentPlayerView?.isHost ?? false,
              canStart: currentPlayerView?.canStart ?? false,
              actions: currentPlayerView?.actions ?? [],
            } satisfies LobbyState);
          }),
      };
    }),
    dependencies: [GameViewProjector.Default],
  },
) {}
