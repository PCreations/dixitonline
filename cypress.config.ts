import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { defineConfig } from 'cypress';
import pg from 'pg';

import {
  startSupabase,
  stopSupabase,
} from './src/shared/tests/setup/supabase-env.js';
import { setupTestEnvironment } from './src/shared/tests/setup/test-env.setup.js';

let supabaseInstanceId: string | undefined;
let serverProcess: ChildProcess | undefined;
let databaseUrl: string | undefined;
let testEnvVars: Record<string, string> = {};

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export default defineConfig({
  e2e: {
    // Note: We don't use baseUrl because Cypress verifies it BEFORE before:run fires.
    // Instead, we set the URL via env and use cy.visit(Cypress.env('BASE_URL')) in tests.
    supportFile: 'cypress/support/e2e.ts',
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      'src/game/tests/acceptance/channels/cypress/**/*.cy.test.ts',
    ],
    video: true, // Enable video for debugging
    screenshotOnRunFailure: true,

    setupNodeEvents(on, config) {
      // Set default BASE_URL for tests
      config.env = config.env || {};
      config.env.BASE_URL = 'http://localhost:3010';

      // Start Supabase + server once before all tests
      on('before:run', async () => {
        console.log('[Cypress] Starting Supabase environment...');
        const supabaseEnv = await startSupabase();
        supabaseInstanceId = supabaseEnv.instanceId;
        databaseUrl = supabaseEnv.databaseUrl;

        testEnvVars = {
          DATABASE_URL: supabaseEnv.databaseUrl,
          DATABASE_DIRECT_URL: supabaseEnv.databaseDirectUrl,
          SUPABASE_URL: supabaseEnv.supabaseUrl,
          SUPABASE_ANON_KEY: supabaseEnv.anonKey ?? '',
          SUPABASE_PUBLISHABLE_KEY: supabaseEnv.anonKey ?? '',
          SUPABASE_SERVICE_ROLE_KEY: supabaseEnv.supabaseKey,
          // GoTrue issues JWTs with issuer from API_EXTERNAL_URL (http://localhost:8000)
          SUPABASE_JWT_ISSUER: 'http://localhost:8000/auth/v1',
          NODE_ENV: 'test',
        };

        setupTestEnvironment({
          databaseUrl: supabaseEnv.databaseUrl,
          databaseDirectUrl: supabaseEnv.databaseDirectUrl,
          supabaseUrl: supabaseEnv.supabaseUrl,
          supabaseKey: supabaseEnv.supabaseKey,
        });

        // Run migrations
        console.log('[Cypress] Running migrations...');
        await supabaseEnv.runMigrations();

        // Build CSS
        console.log('[Cypress] Building CSS...');
        await new Promise<void>((resolve, reject) => {
          const css = spawn('pnpm', ['css:build'], {
            env: { ...process.env, ...testEnvVars },
            stdio: 'inherit',
            shell: true,
          });
          css.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`CSS build failed with code ${code}`))));
        });

        // Start server
        console.log('[Cypress] Starting Fastify server...');
        serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
          env: { ...process.env, ...testEnvVars },
          stdio: 'inherit',
          shell: true,
        });

        serverProcess.on('error', (err) => {
          console.error('[Cypress] Server process error:', err);
        });

        await waitForServer('http://localhost:3010', 60000);
        console.log('[Cypress] Server ready!');
      });

      // Reset data before each spec file
      on('before:spec', async () => {
        if (!databaseUrl) {
          console.log('[before:spec] No databaseUrl, skipping reset');
          return;
        }

        const pool = new pg.Pool({ connectionString: databaseUrl });
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
          console.log('[before:spec] Data reset complete');
        } finally {
          await pool.end();
        }
      });

      // Cleanup after all tests
      on('after:run', async () => {
        console.log('[Cypress] Cleaning up...');

        if (serverProcess) {
          console.log('[Cypress] Stopping server...');
          serverProcess.kill('SIGTERM');
          serverProcess = undefined;
        }

        if (supabaseInstanceId) {
          console.log('[Cypress] Stopping Supabase...');
          await stopSupabase(supabaseInstanceId);
          supabaseInstanceId = undefined;
        }

        console.log('[Cypress] Cleanup complete.');
      });

      // Task for manual reset from tests (if needed)
      on('task', {
        async resetSupabase() {
          if (!databaseUrl) {
            console.log('[resetSupabase] No databaseUrl, skipping');
            return null;
          }

          const pool = new pg.Pool({ connectionString: databaseUrl });
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
            console.log('[resetSupabase] Reset complete');
          } finally {
            await pool.end();
          }
          return null;
        },
      });

      return config;
    },
  },
});
