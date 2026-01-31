import { defineConfig, devices } from '@playwright/test';
import pg from 'pg';

export default defineConfig({
  testDir: './src/game/tests/acceptance/channels/playwright',
  fullyParallel: false, // Run tests sequentially for now
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E tests
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      slowMo: 500,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: './playwright.global-setup.ts',

  // Reset database before each test file
  // Note: This is handled via test fixtures or beforeEach in the test files
});

/**
 * Helper function to reset the database.
 * Call this from test files via a fixture or beforeEach.
 */
export async function resetDatabase(): Promise<void> {
  const dbUrl = (globalThis as Record<string, unknown>)
    .__PLAYWRIGHT_DATABASE_URL__ as string | undefined;

  if (!dbUrl) {
    console.log('[resetDatabase] No databaseUrl, skipping reset');
    return;
  }

  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    await pool.query(`
      TRUNCATE TABLE games, players, outbox_events RESTART IDENTITY CASCADE;
    `);
    await pool.query(`
      DELETE FROM auth.sessions;
      DELETE FROM auth.refresh_tokens;
      DELETE FROM auth.mfa_factors;
      DELETE FROM auth.mfa_challenges;
      DELETE FROM auth.mfa_amr_claims;
      DELETE FROM auth.identities;
      DELETE FROM auth.users;
    `);
    console.log('[resetDatabase] Data reset complete');
  } finally {
    await pool.end();
  }
}
