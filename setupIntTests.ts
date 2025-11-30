import { afterAll, beforeAll } from 'vitest';
import { createAcceptanceTestSetup } from './src/shared/tests/setup/acceptance-test.setup.js';
import { closeTestDb, initTestDb } from './src/shared/tests/setup/test-db.js';

// Configure testcontainers timeouts via environment variables
process.env.TESTCONTAINERS_WAIT_STRATEGY_TIMEOUT = '180000'; // 3 minutes
process.env.TESTCONTAINERS_WAIT_STRATEGY_RETRIES = '120'; // More retries
// Disable ryuk (reaper) container to avoid timeout issues
process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';

// Create the acceptance test setup
const acceptanceSetup = createAcceptanceTestSetup({
  userTimezone: 'UTC',
});

// Setup before all tests
beforeAll(async () => {
  console.log('Setting up acceptance test environment...');
  await acceptanceSetup.setup();

  // Initialize the database connection for tests to use
  if (process.env.DATABASE_URL) {
    initTestDb(process.env.DATABASE_URL);
    console.log('Test database connection initialized');
  }

  console.log('Acceptance test environment ready');
}, 120000); // 2 minutes timeout for Docker startup

// Teardown after all tests
afterAll(async () => {
  console.log('Tearing down acceptance test environment...');

  // Close database connection
  await closeTestDb();
  console.log('Test database connection closed');

  await acceptanceSetup.teardown();
  console.log('Acceptance test environment cleaned up');
}, 60000); // 1 minute timeout for cleanup
