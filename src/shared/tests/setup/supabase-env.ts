import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as dotenv from 'dotenv';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';

import { runDrizzleMigrations } from './test-env.setup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the committed Supabase test configuration
const COMPOSE_DIR = path.join(__dirname, 'supabase-test');
const COMPOSE_FILE = 'docker-compose.yml';
const ENV_FILE = path.join(COMPOSE_DIR, '.env');

// Store instances per isolated environment (keyed by unique ID)
const environments = new Map<
  string,
  {
    started: StartedDockerComposeEnvironment;
  }
>();

/**
 * Creates an isolated Supabase environment for a test suite.
 * Each instance gets its own:
 * - Unique container names via Docker Compose project name
 * - Isolated database and volumes
 * - Dynamic port mappings
 *
 * This allows multiple test suites to run in parallel without conflicts.
 */
export const startSupabase = async () => {
  // Generate a unique identifier for this test suite instance
  const instanceId = `supabase-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // eslint-disable-next-line no-console
  console.log(`[${instanceId}] Creating isolated Supabase environment...`);

  // Load environment variables from committed .env file
  const supabaseEnv = dotenv.parse(fs.readFileSync(ENV_FILE));

  if (!supabaseEnv.SERVICE_ROLE_KEY) {
    throw new Error('SERVICE_ROLE_KEY is missing in .env');
  }

  // Create and configure Docker Compose environment
  const dockerComposeEnv = new DockerComposeEnvironment(
    COMPOSE_DIR,
    COMPOSE_FILE
  ).withProjectName(instanceId);

  // Pass all environment variables from .env file
  for (const key of Object.keys(supabaseEnv)) {
    dockerComposeEnv.withEnvironment({ [key]: supabaseEnv[key] });
  }

  // Start containers with health checks
  // Note: Docker Compose V2 uses {service}-{replica} format for wait strategies
  // eslint-disable-next-line no-console
  console.log(`[${instanceId}] Starting Docker containers...`);
  const startedEnvironment = await dockerComposeEnv
    .withWaitStrategy('db-1', Wait.forHealthCheck().withStartupTimeout(120000)) // 2 minutes
    .withWaitStrategy(
      'auth-1',
      Wait.forHealthCheck().withStartupTimeout(120000)
    ) // 2 minutes
    .withWaitStrategy(
      'realtime-1',
      Wait.forHealthCheck().withStartupTimeout(120000)
    ) // 2 minutes
    .withStartupTimeout(180000) // 3 minutes global timeout
    .up();

  // Store the environment for later cleanup
  environments.set(instanceId, { started: startedEnvironment });

  // Get container ports
  // Note: Docker Compose V2 uses {project}-{service}-{replica} naming,
  // so we need to use the full service name with replica suffix
  const db = startedEnvironment.getContainer('db-1');
  const auth = startedEnvironment.getContainer('auth-1');
  const kong = startedEnvironment.getContainer('kong-1');
  const realtime = startedEnvironment.getContainer('realtime-1');

  const dbPort = db.getMappedPort(5432);
  const authPort = auth.getMappedPort(9999);
  const kongPort = kong.getMappedPort(8000);
  const realtimePort = realtime.getMappedPort(4000);

  // eslint-disable-next-line no-console
  console.log(
    `[${instanceId}] Containers started - DB:${dbPort}, Auth:${authPort}, Kong:${kongPort}, Realtime:${realtimePort}`
  );

  // Build connection strings
  const databaseUrl = `postgresql://postgres:${supabaseEnv.POSTGRES_PASSWORD}@0.0.0.0:${dbPort}/postgres`;
  const databaseDirectUrl = `postgresql://postgres:${supabaseEnv.POSTGRES_PASSWORD}@0.0.0.0:${dbPort}/postgres`;

  return {
    instanceId, // Return the instance ID for cleanup
    db: {
      host: '0.0.0.0',
      port: dbPort,
      user: 'postgres',
      password: supabaseEnv.POSTGRES_PASSWORD,
      database: 'postgres',
    },
    databaseUrl,
    databaseDirectUrl,
    supabaseUrl: `http://0.0.0.0:${kongPort}`,
    supabaseKey: supabaseEnv.SERVICE_ROLE_KEY,
    anonKey: supabaseEnv.ANON_KEY,
    authUrl: `http://0.0.0.0:${authPort}`,
    realtimeUrl: `http://0.0.0.0:${realtimePort}`,
    kongPort,
    dbPort,
    authPort,
    realtimePort,
    async runMigrations() {
      // eslint-disable-next-line no-console
      console.log(`[${instanceId}] Running migrations...`);
      return await runDrizzleMigrations(databaseDirectUrl);
    },
  };
};

/**
 * Stops a specific Supabase instance and cleans up its resources
 */
export const stopSupabase = async (instanceId?: string) => {
  if (!instanceId) {
    // If no instance ID provided, clean up all environments
    // eslint-disable-next-line no-console
    console.log('Cleaning up all Supabase environments...');
    for (const [id, env] of environments.entries()) {
      await cleanupEnvironment(id, env);
    }
    environments.clear();
    return;
  }

  const env = environments.get(instanceId);
  if (!env) {
    // eslint-disable-next-line no-console
    console.warn(
      `[${instanceId}] Environment not found, may already be cleaned up`
    );
    return;
  }

  await cleanupEnvironment(instanceId, env);
  environments.delete(instanceId);
};

async function cleanupEnvironment(
  instanceId: string,
  env: { started: StartedDockerComposeEnvironment }
) {
  try {
    // eslint-disable-next-line no-console
    console.log(`[${instanceId}] Stopping containers...`);
    await env.started.down({
      removeVolumes: true,
      timeout: 30000,
    });
    // eslint-disable-next-line no-console
    console.log(`[${instanceId}] Containers stopped`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[${instanceId}] Error stopping containers:`, error);
  }
}
