import { Context, Effect, Layer, Option } from "effect";
import { PlayerId, PlayerEntity } from "./player.entity.js";

export class PlayerRepository extends Effect.Tag("player/PlayerRepository")<
  PlayerRepository,
  {
    /**
     * Find a player by ID.
     * @returns Option.some(player) if found, Option.none() otherwise
     */
    readonly findById: (
      id: PlayerId,
    ) => Effect.Effect<Option.Option<PlayerEntity>>;

    /**
     * Save a player (always upsert: insert if not exists, update if exists).
     * Following repository-pattern skill: single write method.
     */
    readonly save: (player: PlayerEntity) => Effect.Effect<void>;
  }
>() {}

const makeInMemoryPlayerRepository = (): Context.Tag.Service<PlayerRepository> => {
  const players = new Map<string, PlayerEntity>();

  return {
    findById: (id: PlayerId) => {
      const player = players.get(id);
      return Effect.succeed(Option.fromNullable(player));
    },
    // save does upsert: insert if not exists, update if exists
    save: (player: PlayerEntity) => {
      const snapshot = player.toSnapshot();
      players.set(snapshot.id, player);
      return Effect.succeed(void 0);
    },
  };
};

export const InMemoryPlayerRepository = Layer.sync(
  PlayerRepository,
  makeInMemoryPlayerRepository,
);
