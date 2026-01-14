import { Context, Data, Effect, Layer, Option, ParseResult } from 'effect';
import { PlayerEntity, PlayerId } from './player.entity.js';

export class OptimisticConcurrencyError extends Data.TaggedError(
  'OptimisticConcurrencyError',
)<{
  readonly playerId: PlayerId;
}> {}

export class UsernameAlreadyTakenError extends Data.TaggedError(
  'UsernameAlreadyTakenError',
)<{
  readonly username: string;
}> {}

/**
 * Database error that preserves the original error in the cause chain.
 * Uses native ES2022 Error cause so Sentry can display the full error chain.
 */
export class DatabaseError extends Error {
  readonly _tag = 'DatabaseError' as const;

  constructor(options: { message: string; cause: unknown }) {
    super(options.message, { cause: options.cause });
    this.name = 'DatabaseError';
  }
}

export class PlayerRepository extends Effect.Tag('player/PlayerRepository')<
  PlayerRepository,
  {
    /**
     * Find a player by ID.
     * @returns Option.some(player) if found, Option.none() otherwise
     */
    readonly findById: (
      id: PlayerId,
    ) => Effect.Effect<
      Option.Option<PlayerEntity>,
      ParseResult.ParseError | DatabaseError
    >;

    /**
     * Find multiple players by their IDs in a single query.
     * @returns Map of PlayerId to PlayerEntity for found players
     */
    readonly findByIds: (
      ids: ReadonlyArray<PlayerId>,
    ) => Effect.Effect<
      ReadonlyMap<PlayerId, PlayerEntity>,
      ParseResult.ParseError | DatabaseError
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
      | OptimisticConcurrencyError
      | UsernameAlreadyTakenError
      | DatabaseError
      | ParseResult.ParseError
    >;

    /**
     * Check if a username is already taken.
     */
    readonly existsByUsername: (
      username: string,
    ) => Effect.Effect<boolean, DatabaseError>;
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

        // Check username uniqueness (simulate DB constraint)
        const snapshot = player.toSnapshot();
        for (const [id, p] of players) {
          if (
            id !== player.id &&
            p.toSnapshot().username === snapshot.username
          ) {
            return Effect.fail(
              new UsernameAlreadyTakenError({ username: snapshot.username }),
            );
          }
        }

        players.set(player.id, player);
        return Effect.succeed(void 0);
      },

      existsByUsername: (username: string) => {
        for (const player of players.values()) {
          if (player.toSnapshot().username === username) {
            return Effect.succeed(true);
          }
        }
        return Effect.succeed(false);
      },
    };
  };

export const InMemoryPlayerRepository = Layer.sync(
  PlayerRepository,
  makeInMemoryPlayerRepository,
);
