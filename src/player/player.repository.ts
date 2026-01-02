import { Context, Data, Effect, Layer, Option, ParseResult } from 'effect';
import { UnknownException } from 'effect/Cause';
import { PlayerEntity, PlayerId } from './player.entity.js';

export class OptimisticConcurrencyError extends Data.TaggedError(
  'OptimisticConcurrencyError',
)<{
  readonly playerId: PlayerId;
}> {}

export class PlayerRepository extends Effect.Tag('player/PlayerRepository')<
  PlayerRepository,
  {
    /**
     * Find a player by ID.
     * @returns Option.some(player) if found, Option.none() otherwise
     */
    readonly findById: (
      id: PlayerId,
    ) => Effect.Effect<Option.Option<PlayerEntity>, ParseResult.ParseError>;

    /**
     * Find multiple players by their IDs in a single query.
     * @returns Map of PlayerId to PlayerEntity for found players
     */
    readonly findByIds: (
      ids: ReadonlyArray<PlayerId>,
    ) => Effect.Effect<
      ReadonlyMap<PlayerId, PlayerEntity>,
      ParseResult.ParseError
    >;

    /**
     * Save a player (upsert with optimistic concurrency control).
     * - Insert if not exists
     * - Update if exists and version matches (version - 1)
     * - Fail with OptimisticConcurrencyError if version mismatch
     */
    readonly save: (
      player: PlayerEntity,
    ) => Effect.Effect<
      void,
      OptimisticConcurrencyError | UnknownException | ParseResult.ParseError
    >;
  }
>() {}

const makeInMemoryPlayerRepository =
  (): Context.Tag.Service<PlayerRepository> => {
    const players = new Map<string, PlayerEntity>();

    return {
      findById: (id: PlayerId) => {
        const player = players.get(id);
        return Effect.succeed(Option.fromNullable(player));
      },

      findByIds: (ids: ReadonlyArray<PlayerId>) => {
        const result = new Map<PlayerId, PlayerEntity>();
        for (const id of ids) {
          const player = players.get(id);
          if (player) {
            result.set(id, player);
          }
        }
        return Effect.succeed(result as ReadonlyMap<PlayerId, PlayerEntity>);
      },

      // save with optimistic concurrency control
      save: (player: PlayerEntity) => {
        const existingPlayer = players.get(player.id);

        // Check optimistic concurrency: version must be previous + 1
        if (existingPlayer && existingPlayer.version !== player.version - 1) {
          return Effect.fail(
            new OptimisticConcurrencyError({ playerId: player.id }),
          );
        }

        players.set(player.id, player);
        return Effect.succeed(void 0);
      },
    };
  };

export const InMemoryPlayerRepository = Layer.sync(
  PlayerRepository,
  makeInMemoryPlayerRepository,
);
