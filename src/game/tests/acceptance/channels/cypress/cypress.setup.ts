import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

import {
  startSupabase,
  stopSupabase,
} from '../../../../../shared/tests/setup/supabase-env.js';
import { setupTestEnvironment } from '../../../../../shared/tests/setup/test-env.setup.js';

interface CypressEnvVars {
  DATABASE_URL: string;
  DATABASE_DIRECT_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NODE_ENV: string;
}

/**
 * Creates the Cypress acceptance test setup.
 *
 * This setup:
 * 1. Starts a dedicated Supabase environment (same pattern as Drizzle integration tests)
 * 2. Runs database migrations
 * 3. Starts the Fastify server with the test environment
 * 4. Waits for the server to be ready
 *
 * Used by cypress.config.ts in setupNodeEvents.
 */
export function createCypressAcceptanceSetup() {
  let supabaseInstanceId: string | undefined;
  let serverProcess: ChildProcess | undefined;
  let testEnvVars: CypressEnvVars | undefined;

  const setup = async (): Promise<CypressEnvVars> => {
    console.log('[Cypress Setup] Starting Supabase environment...');

    // 1. Start Supabase (same pattern as Drizzle)
    const supabaseEnv = await startSupabase();
    supabaseInstanceId = supabaseEnv.instanceId;

    // 2. Configure environment variables
    testEnvVars = {
      DATABASE_URL: supabaseEnv.databaseUrl,
      DATABASE_DIRECT_URL: supabaseEnv.databaseDirectUrl,
      SUPABASE_URL: supabaseEnv.supabaseUrl,
      SUPABASE_ANON_KEY: supabaseEnv.anonKey ?? '',
      SUPABASE_SERVICE_ROLE_KEY: supabaseEnv.supabaseKey,
      NODE_ENV: 'test',
    };

    setupTestEnvironment({
      databaseUrl: supabaseEnv.databaseUrl,
      databaseDirectUrl: supabaseEnv.databaseDirectUrl,
      supabaseUrl: supabaseEnv.supabaseUrl,
      supabaseKey: supabaseEnv.supabaseKey,
    });

    // 3. Run migrations
    console.log('[Cypress Setup] Running migrations...');
    await supabaseEnv.runMigrations();

    // 4. Start Fastify server
    console.log('[Cypress Setup] Starting server...');
    serverProcess = spawn('pnpm', ['dev'], {
      env: { ...process.env, ...testEnvVars },
      stdio: 'inherit',
      shell: true,
    });

    serverProcess.on('error', (err) => {
      console.error('[Cypress Setup] Server process error:', err);
    });

    // 5. Wait for server to be ready
    console.log('[Cypress Setup] Waiting for server...');
    await waitForServer('http://localhost:3000', 60000);
    console.log('[Cypress Setup] Server ready!');

    return testEnvVars;
  };

  const teardown = async (): Promise<void> => {
    console.log('[Cypress Setup] Tearing down...');

    if (serverProcess) {
      console.log('[Cypress Setup] Stopping server...');
      serverProcess.kill('SIGTERM');
      serverProcess = undefined;
    }

    if (supabaseInstanceId) {
      console.log('[Cypress Setup] Stopping Supabase...');
      await stopSupabase(supabaseInstanceId);
      supabaseInstanceId = undefined;
    }

    console.log('[Cypress Setup] Teardown complete.');
  };

  return { setup, teardown };
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet, continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}
