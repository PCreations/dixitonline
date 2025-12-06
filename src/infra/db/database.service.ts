import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Context, Effect, Layer } from 'effect';
import pg from 'pg';

/**
 * Database service that manages the PostgreSQL connection
 */
export class Database extends Context.Tag('Database')<
  Database,
  {
    readonly db: NodePgDatabase<Record<string, never>>;
  }
>() {
  /**
   * Creates a Database layer with connection lifecycle management
   * The connection is established when the layer is acquired and closed when released
   */
  static Live = (config: { connectionString: string }) =>
    Layer.scoped(
      Database,
      Effect.gen(function* () {
        // Create the connection pool
        const pool = new pg.Pool({
          connectionString: config.connectionString,
          max: 10, // Maximum pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        // Create drizzle instance
        const db = drizzle(pool);

        // Register cleanup on scope release
        yield* Effect.addFinalizer(() =>
          Effect.promise(() => {
            console.log('Closing database connection pool...');
            return pool.end();
          }),
        );

        console.log('Database connection pool established');

        return { db };
      }),
    );
}
