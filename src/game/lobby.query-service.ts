import { Effect, Option } from "effect";
import { PlayerId, PlayerRepository } from "../player/index.js";
import { isNotStartedGame } from "./game.entity.js";
import { GameRepository } from "./game.repository.js";

export interface LobbyPlayer {
  readonly id: string;
  readonly username: string;
}

export interface LobbyState {
  readonly gameId: string;
  readonly hostId: string;
  readonly players: ReadonlyArray<LobbyPlayer>;
}

export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  "game/LobbyQueryService",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const playerRepository = yield* PlayerRepository;

      return {
        getLobbyState: (gameId: string) =>
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

            // Fetch all player names in a single query (no N+1)
            const playerIds = snapshot.players.map((id) => PlayerId(id));
            const playersMap = yield* playerRepository.findByIds(playerIds);

            // Build player list with names, fallback to "Unknown" if not found
            const players: ReadonlyArray<LobbyPlayer> = snapshot.players.map(
              (id) => {
                const player = playersMap.get(PlayerId(id));
                return {
                  id,
                  username: player?.toSnapshot().username ?? "Joueur inconnu",
                };
              },
            );

            return Option.some({
              gameId: snapshot.id,
              hostId: snapshot.createdBy,
              players,
            } satisfies LobbyState);
          }),
      };
    }),
    // Dependencies will be provided by the layer
  },
) {}
