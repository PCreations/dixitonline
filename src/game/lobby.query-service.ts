import { Effect, Option } from "effect";
import { GameRepository } from "./game.repository.js";
import { isNotStartedGame } from "./game.entity.js";

export interface LobbyState {
  readonly gameId: string;
  readonly hostId: string;
  readonly players: ReadonlyArray<string>;
}

export class LobbyQueryService extends Effect.Service<LobbyQueryService>()(
  "game/LobbyQueryService",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        getLobbyState: (gameId: string) =>
          Effect.gen(function* () {
            const maybeGame = yield* gameRepository.findById(gameId);

            return Option.flatMap(maybeGame, (game) => {
              if (!isNotStartedGame(game)) {
                return Option.none();
              }

              const snapshot = game.toSnapshot();
              return Option.some({
                gameId: snapshot.id,
                hostId: snapshot.createdBy,
                players: snapshot.players,
              } satisfies LobbyState);
            });
          }),
      };
    }),
    // No dependencies - GameRepository will be provided by the layer
  },
) {}
