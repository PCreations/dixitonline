import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';

import * as dotenv from 'dotenv';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';

import { runDrizzleMigrations } from './test-env.setup.js';

const execAsync = promisify(exec);

// Cache directory for Supabase docker files
const SUPABASE_CACHE_DIR = path.join(os.tmpdir(), 'supabase-docker-cache');
const CACHE_LOCK_FILE = path.join(os.tmpdir(), 'supabase-cache.lock');

// Promise to track cache initialization
let cacheInitPromise: Promise<void> | null = null;

// Store instances per isolated environment (keyed by unique ID)
const environments = new Map<string, {
  started: StartedDockerComposeEnvironment;
  workDir: string;
}>();

/**
 * Creates an isolated Supabase environment for a test suite.
 * Each instance gets its own:
 * - Temporary directory with docker-compose files
 * - Unique container names
 * - Isolated database and volumes
 *
 * This allows multiple test suites to run in parallel without conflicts.
 */
export const startSupabase = async () => {
  // Generate a unique identifier for this test suite instance
  const instanceId = `supabase-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Create a temporary directory for this instance's docker-compose files
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'kotcha'));
  const workDir = path.join(base, instanceId);
  fs.mkdirSync(workDir, { recursive: true });


  // eslint-disable-next-line no-console
  console.log(`[${instanceId}] Creating isolated Supabase environment in ${workDir}`);

  try {
    // Step 1: Setup Supabase docker files in the temporary directory
    await setupSupabaseDocker(workDir, instanceId);

    // Step 2: Load environment variables
    const supabaseEnvPath = path.join(workDir, '.env');
    const supabaseEnv = dotenv.parse(fs.readFileSync(supabaseEnvPath));

    if (!supabaseEnv.SERVICE_ROLE_KEY) {
      throw new Error('SERVICE_ROLE_KEY is missing in .env');
    }

    // Step 3: Create and configure Docker Compose environment
    const composeFile = path.join(workDir, 'docker-compose.yml');
    const dockerComposeEnv = new DockerComposeEnvironment(
      path.dirname(composeFile),
      path.basename(composeFile)
    ).withProjectName(instanceId);

    // Pass all environment variables from .env file
    Object.keys(supabaseEnv).forEach((key) => {
      dockerComposeEnv.withEnvironment({ [key]: supabaseEnv[key] });
    });

    // Step 4: Start containers with health checks
    // eslint-disable-next-line no-console
    console.log(`[${instanceId}] Starting Docker containers...`);
    const startedEnvironment = await dockerComposeEnv
      .withWaitStrategy('db', Wait.forHealthCheck().withStartupTimeout(120000)) // 2 minutes
      .withWaitStrategy('auth', Wait.forHealthCheck().withStartupTimeout(120000)) // 2 minutes
      .withStartupTimeout(180000) // 3 minutes global timeout
      .up();

    // Store the environment for later cleanup
    environments.set(instanceId, { started: startedEnvironment, workDir });

    // Step 5: Get container ports (use service names, not container names)
    const db = startedEnvironment.getContainer('db');
    const auth = startedEnvironment.getContainer('auth');
    const kong = startedEnvironment.getContainer('kong');

    const dbPort = db.getMappedPort(5432);
    const authPort = auth.getMappedPort(9999);
    const kongPort = kong.getMappedPort(8000);

    // eslint-disable-next-line no-console
    console.log(`[${instanceId}] Containers started - DB:${dbPort}, Auth:${authPort}, Kong:${kongPort}`);

    // Step 6: Build connection strings
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
      authUrl: `http://0.0.0.0:${authPort}`,
      kongPort,
      dbPort,
      authPort,
      async runMigrations() {
        // eslint-disable-next-line no-console
        console.log(`[${instanceId}] Running migrations...`);
        return await runDrizzleMigrations(databaseDirectUrl);
      },
    };
  } catch (error) {
    // Cleanup on error
    // eslint-disable-next-line no-console
    console.error(`[${instanceId}] Error during startup:`, error);
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
    throw error;
  }
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
    console.warn(`[${instanceId}] Environment not found, may already be cleaned up`);
    return;
  }

  await cleanupEnvironment(instanceId, env);
  environments.delete(instanceId);
};

async function cleanupEnvironment(
  instanceId: string,
  env: { started: StartedDockerComposeEnvironment; workDir: string }
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

  // Clean up temporary directory
  try {
    if (fs.existsSync(env.workDir)) {
      // eslint-disable-next-line no-console
      console.log(`[${instanceId}] Cleaning up temporary directory...`);
      
      // Clean up Docker volumes with proper permissions using a temporary container
      const dbDataPath = path.join(env.workDir, 'volumes', 'db', 'data');
      if (fs.existsSync(dbDataPath)) {
        try {
          await execAsync(
            `docker run --rm -v ${JSON.stringify(dbDataPath)}:/data alpine sh -c "rm -rf /data/*"`
          );
        } catch (error) {
          // Docker cleanup failed, proceed with directory removal
          console.warn(`[${instanceId}] Docker cleanup failed:`, error);
        }
      }
      
    fs.rmSync(env.workDir, { recursive: true, force: true });

    // Clean up the parent base directory if empty
    const baseDir = path.dirname(env.workDir);
    if (baseDir.includes('kotcha') && fs.existsSync(baseDir)) {
      try {
        fs.rmdirSync(baseDir); // Only removes if empty
      } catch {
        // Directory not empty or already removed
      }
    }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[${instanceId}] Error cleaning up work directory:`, error);
  }
}

/**
 * Initializes the shared cache for Supabase docker files (called once globally)
 */
async function initializeSupabaseCache(): Promise<void> {
  // If cache already exists, skip initialization
  if (fs.existsSync(SUPABASE_CACHE_DIR)) {
    return;
  }

  // Use a simple lock file to prevent concurrent initialization
  // Try to create lock file atomically
  let lockFd: number | null = null;
  try {
    lockFd = fs.openSync(CACHE_LOCK_FILE, 'wx');

    // We got the lock, proceed with cache initialization
    // eslint-disable-next-line no-console
    console.log('[cache] Initializing shared Supabase docker cache...');

    const tmpClone = path.join(os.tmpdir(), `supabase-clone-${Date.now()}`);

    try {
      // Clone Supabase repository
      await execAsync(
        `git clone --filter=blob:none --no-checkout https://github.com/supabase/supabase "${tmpClone}"`
      );

      await execAsync(
        'git sparse-checkout set --cone docker && git checkout master',
        { cwd: tmpClone }
      );

      // Create cache directory and copy files
      fs.mkdirSync(SUPABASE_CACHE_DIR, { recursive: true });

      const dockerSrcPath = path.join(tmpClone, 'docker');
      const files = fs.readdirSync(dockerSrcPath);

      for (const file of files) {
        const srcPath = path.join(dockerSrcPath, file);
        const destPath = path.join(SUPABASE_CACHE_DIR, file);

        if (fs.statSync(srcPath).isDirectory()) {
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      // Copy .env.example
      fs.copyFileSync(
        path.join(tmpClone, 'docker', '.env.example'),
        path.join(SUPABASE_CACHE_DIR, '.env.example')
      );

      // eslint-disable-next-line no-console
      console.log('[cache] Supabase docker cache initialized successfully');
    } finally {
      // Clean up clone
      if (fs.existsSync(tmpClone)) {
        fs.rmSync(tmpClone, { recursive: true, force: true });
      }
    }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      // Another process is initializing the cache, wait for it
      // eslint-disable-next-line no-console
      console.log('[cache] Waiting for cache initialization by another process...');

      // Poll until cache directory exists (max 60 seconds)
      const maxWait = 60000;
      const pollInterval = 500;
      const startTime = Date.now();

      while (!fs.existsSync(SUPABASE_CACHE_DIR)) {
        if (Date.now() - startTime > maxWait) {
          throw new Error('Timeout waiting for Supabase cache initialization');
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // eslint-disable-next-line no-console
      console.log('[cache] Cache initialization complete');
    } else {
      throw error;
    }
  } finally {
    // Release lock
    if (lockFd !== null) {
      fs.closeSync(lockFd);
      try {
        fs.unlinkSync(CACHE_LOCK_FILE);
      } catch {
        // Ignore errors when removing lock file
      }
    }
  }
}

/**
 * Ensures cache is initialized (only runs initialization once)
 */
async function ensureCacheInitialized(): Promise<void> {
  if (!cacheInitPromise) {
    cacheInitPromise = initializeSupabaseCache();
  }
  return cacheInitPromise;
}

/**
 * Sets up Supabase Docker files in an isolated directory using cached files
 */
async function setupSupabaseDocker(workDir: string, instanceId: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[${instanceId}] Setting up Supabase Docker files...`);

  // Ensure cache is initialized
  await ensureCacheInitialized();

  // Copy files from cache to work directory
  const files = fs.readdirSync(SUPABASE_CACHE_DIR);

  for (const file of files) {
    const srcPath = path.join(SUPABASE_CACHE_DIR, file);
    const destPath = path.join(workDir, file);

    if (fs.statSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Copy .env.example as .env
  fs.copyFileSync(
    path.join(SUPABASE_CACHE_DIR, '.env.example'),
    path.join(workDir, '.env')
  );

  // Process docker-compose.yml to make it unique for this instance
  await processDockerCompose(workDir, instanceId);

  // eslint-disable-next-line no-console
  console.log(`[${instanceId}] Supabase Docker setup complete`);
}

/**
 * Processes docker-compose.yml to keep only necessary services and configure for isolation
 */
async function processDockerCompose(workDir: string, instanceId: string): Promise<void> {
  const keepServices = ['db', 'auth', 'kong'];
  const composeFilePath = path.join(workDir, 'docker-compose.yml');

  // Use yq for processing (check if installed)
  try {
    await execAsync('which yq');
  } catch {
    throw new Error('yq is not installed. Please install yq: brew install yq (macOS) or see https://github.com/mikefarah/yq');
  }

  // Step 1: Get all services in the compose file
  const { stdout: allServicesOutput } = await execAsync(
    `yq eval '.services | keys | .[]' "${composeFilePath}"`
  );
  const allServices = allServicesOutput.trim().split('\n');

  // Step 2: Remove unwanted services
  for (const service of allServices) {
    if (!keepServices.includes(service)) {
      await execAsync(
        `yq eval 'del(.services.${service})' -i "${composeFilePath}"`,
        { cwd: workDir }
      );
    }
  }

  // Step 3: Clean up dependencies for remaining services
  for (const service of keepServices) {
    // Get dependencies for this service
    try {
      const { stdout: depsOutput } = await execAsync(
        `yq eval '.services.${service}.depends_on | keys | .[]' "${composeFilePath}" 2>/dev/null || true`,
        { cwd: workDir }
      );

      if (depsOutput.trim()) {
        const deps = depsOutput.trim().split('\n');

        for (const dep of deps) {
          // If dependency is not in our keep list, remove it
          if (!keepServices.includes(dep)) {
            await execAsync(
              `yq eval 'del(.services.${service}.depends_on.${dep})' -i "${composeFilePath}"`,
              { cwd: workDir }
            );
          }
        }
      }

      // If depends_on is now empty, remove it entirely
      const { stdout: depCountOutput } = await execAsync(
        `yq eval '.services.${service}.depends_on | length' "${composeFilePath}" 2>/dev/null || echo "0"`,
        { cwd: workDir }
      );

      if (depCountOutput.trim() === '0') {
        await execAsync(
          `yq eval 'del(.services.${service}.depends_on)' -i "${composeFilePath}"`,
          { cwd: workDir }
        );
      }
    } catch {
      // No dependencies or error reading them, continue
    }
  }

  // Step 4: Update container names with instance ID
  for (const service of keepServices) {
    await execAsync(
      `yq eval '.services.${service}.container_name = "${instanceId}-${service}"' -i "${composeFilePath}"`,
      { cwd: workDir }
    );
  }

  // Step 5: Configure dynamic port mapping
  await execAsync(`yq eval '.services.db.ports = ["0:5432"]' -i "${composeFilePath}"`, { cwd: workDir });
  await execAsync(`yq eval '.services.auth.ports = ["0:9999"]' -i "${composeFilePath}"`, { cwd: workDir });
  await execAsync(`yq eval '.services.kong.ports = ["0:8000", "0:8443"]' -i "${composeFilePath}"`, { cwd: workDir });

  // Step 6: Get all volumes and remove unused ones
  try {
    const { stdout: allVolumesOutput } = await execAsync(
      `yq eval '.volumes | keys | .[]' "${composeFilePath}" 2>/dev/null || true`,
      { cwd: workDir }
    );

    if (allVolumesOutput.trim()) {
      const allVolumes = allVolumesOutput.trim().split('\n');
      const usedVolumes = new Set<string>();

      // Find which volumes are actually used
      for (const service of keepServices) {
        try {
          const { stdout: serviceVolumesOutput } = await execAsync(
            `yq eval '.services.${service}.volumes[]' "${composeFilePath}" 2>/dev/null || true`,
            { cwd: workDir }
          );

          if (serviceVolumesOutput.trim()) {
            const volumes = serviceVolumesOutput.trim().split('\n');
            for (const vol of volumes) {
              // Extract volume name (before the first colon)
              const volumeName = vol.split(':')[0];
              // Check if it's a named volume (not a path)
              if (volumeName && !volumeName.startsWith('.') && !volumeName.startsWith('/')) {
                usedVolumes.add(volumeName);
              }
            }
          }
        } catch {
          // Continue if no volumes
        }
      }

      // Remove unused volumes
      for (const vol of allVolumes) {
        if (!usedVolumes.has(vol)) {
          await execAsync(
            `yq eval 'del(.volumes.${vol})' -i "${composeFilePath}"`,
            { cwd: workDir }
          );
        }
      }
    }
  } catch {
    // No volumes section or error, continue
  }
}
