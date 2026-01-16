/**
 * Playwright Global Setup
 *
 * This file is executed before all tests and sets up:
 * - Supabase instance
 * - Database migrations
 * - CSS build
 * - Fastify server
 */

import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import {
  startSupabase,
  stopSupabase,
} from './src/shared/tests/setup/supabase-env.js';
import { setupTestEnvironment } from './src/shared/tests/setup/test-env.setup.js';

let supabaseInstanceId: string | undefined;
let serverProcess: ChildProcess | undefined;
let databaseUrl: string | undefined;

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

async function globalSetup(): Promise<() => Promise<void>> {
  console.log('[Playwright] Starting Supabase environment...');
  const supabaseEnv = await startSupabase();
  supabaseInstanceId = supabaseEnv.instanceId;
  databaseUrl = supabaseEnv.databaseUrl;

  const testEnvVars = {
    DATABASE_URL: supabaseEnv.databaseUrl,
    DATABASE_DIRECT_URL: supabaseEnv.databaseDirectUrl,
    SUPABASE_URL: supabaseEnv.supabaseUrl,
    SUPABASE_ANON_KEY: supabaseEnv.anonKey ?? '',
    SUPABASE_PUBLISHABLE_KEY: supabaseEnv.anonKey ?? '',
    SUPABASE_SERVICE_ROLE_KEY: supabaseEnv.supabaseKey,
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
  console.log('[Playwright] Running migrations...');
  await supabaseEnv.runMigrations();

  // Build CSS
  console.log('[Playwright] Building CSS...');
  await new Promise<void>((resolve, reject) => {
    const css = spawn('pnpm', ['css:build'], {
      env: { ...process.env, ...testEnvVars },
      stdio: 'inherit',
      shell: true,
    });
    css.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`CSS build failed with code ${code}`)),
    );
  });

  // Start server
  console.log('[Playwright] Starting Fastify server...');
  serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
    env: { ...process.env, ...testEnvVars },
    stdio: 'inherit',
    shell: true,
  });

  serverProcess.on('error', (err) => {
    console.error('[Playwright] Server process error:', err);
  });

  await waitForServer('http://localhost:3010', 60000);
  console.log('[Playwright] Server ready!');

  // Store for teardown
  (globalThis as Record<string, unknown>).__PLAYWRIGHT_SUPABASE_ID__ =
    supabaseInstanceId;
  (globalThis as Record<string, unknown>).__PLAYWRIGHT_SERVER_PROCESS__ =
    serverProcess;
  (globalThis as Record<string, unknown>).__PLAYWRIGHT_DATABASE_URL__ =
    databaseUrl;

  // Write config to file for test workers to read
  const playwrightTempDir = join(process.cwd(), '.playwright-temp');
  mkdirSync(playwrightTempDir, { recursive: true });
  writeFileSync(
    join(playwrightTempDir, 'test-config.json'),
    JSON.stringify({ databaseUrl }, null, 2),
  );

  // Return teardown function
  return async () => {
    console.log('[Playwright] Cleaning up...');

    // Clean up temp config file
    try {
      rmSync(join(process.cwd(), '.playwright-temp'), { recursive: true });
    } catch {
      // Ignore if already deleted
    }

    const serverProc = (globalThis as Record<string, unknown>)
      .__PLAYWRIGHT_SERVER_PROCESS__ as ChildProcess | undefined;
    if (serverProc) {
      console.log('[Playwright] Stopping server...');
      serverProc.kill('SIGTERM');
    }

    const supabaseId = (globalThis as Record<string, unknown>)
      .__PLAYWRIGHT_SUPABASE_ID__ as string | undefined;
    if (supabaseId) {
      console.log('[Playwright] Stopping Supabase...');
      await stopSupabase(supabaseId);
    }

    console.log('[Playwright] Cleanup complete.');
  };
}

export default globalSetup;
