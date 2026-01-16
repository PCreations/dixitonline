/**
 * Playwright test utilities for database management.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import pg from 'pg';

interface TestConfig {
  databaseUrl: string;
}

/**
 * Read test config from the temp file created by global setup.
 */
function getTestConfig(): TestConfig | null {
  try {
    const configPath = join(process.cwd(), '.playwright-temp', 'test-config.json');
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as TestConfig;
  } catch {
    return null;
  }
}

/**
 * Helper function to reset the database between tests.
 * Reads database URL from the config file created by playwright.global-setup.ts
 */
export async function resetDatabase(): Promise<void> {
  const config = getTestConfig();
  const dbUrl = config?.databaseUrl;

  if (!dbUrl) {
    console.log('[resetDatabase] No databaseUrl, skipping reset');
    return;
  }

  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    // Only reset game data, NOT auth users
    // This is because browser sessions persist between tests,
    // and deleting auth users would invalidate those sessions
    await pool.query(`
      TRUNCATE TABLE games, players, outbox_events RESTART IDENTITY CASCADE;
    `);
    console.log('[resetDatabase] Game data reset complete');
  } finally {
    await pool.end();
  }
}
