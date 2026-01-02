import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer, Option } from "effect";
import { PlayerId, PlayerEntity } from "../../player.entity.js";
import { PlayerRepository } from "../../player.repository.js";
import { Database } from "../../../infra/db/database.service.js";
import { playersTable } from "../../../infra/db/schema.js";

export const makeDrizzlePlayerRepository = ({
  db,
}: {
  db: NodePgDatabase<Record<string, never>>;
}): Context.Tag.Service<PlayerRepository> => {
  return {
    findById: (id: PlayerId) => {
      return Effect.gen(function* () {
        const result = yield* Effect.promise(async () => {
          return await db
            .select()
            .from(playersTable)
            .where(eq(playersTable.id, id))
            .limit(1);
        });

        if (result.length === 0) {
          return Option.none();
        }

        const row = result[0];
        return Option.some(
          PlayerEntity.fromSnapshot({
            id: row.id,
            username: row.username,
            email: row.email,
            isAnonymous: row.isAnonymous,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          }),
        );
      });
    },

    // save does upsert: insert if not exists, update if exists
    save: (player: PlayerEntity) => {
      return Effect.gen(function* () {
        const snapshot = player.toSnapshot();

        yield* Effect.promise(async () => {
          return await db
            .insert(playersTable)
            .values({
              id: snapshot.id,
              username: snapshot.username,
              email: snapshot.email,
              isAnonymous: snapshot.isAnonymous,
              createdAt: snapshot.createdAt,
              updatedAt: snapshot.updatedAt,
            })
            .onConflictDoUpdate({
              target: playersTable.id,
              set: {
                username: snapshot.username,
                email: snapshot.email,
                isAnonymous: snapshot.isAnonymous,
                updatedAt: snapshot.updatedAt,
              },
            });
        });

        return yield* Effect.void;
      });
    },
  };
};

/**
 * DrizzlePlayerRepository Layer that depends on Database service
 */
export const DrizzlePlayerRepository = Layer.effect(
  PlayerRepository,
  Effect.gen(function* () {
    const { db } = yield* Database;
    return makeDrizzlePlayerRepository({ db });
  }),
);
