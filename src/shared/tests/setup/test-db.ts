import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

let testDb: NodePgDatabase<Record<string, never>> | null = null;
let client: pg.Pool | null = null;

/**
 * Gets the test database instance.
 * This should be called after the acceptance test setup has run.
 */
export function getTestDb(): NodePgDatabase<Record<string, never>> {
  if (!testDb) {
    throw new Error(
      'Test database not initialized. Make sure acceptance test setup has run.'
    );
  }
  return testDb;
}

/**
 * Initializes the test database connection.
 * This is called by the acceptance test setup.
 */
export function initTestDb(databaseUrl: string): void {
  if (testDb) {
    return; // Already initialized
  }

  client = new pg.Pool({
    connectionString: databaseUrl,
    max: 1, // Single connection for tests
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

  testDb = drizzle(client);
}

/**
 * Closes the test database connection.
 * This is called by the acceptance test teardown.
 */
export async function closeTestDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    testDb = null;
  }
}
