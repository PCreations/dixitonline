import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);

async function execAsync(
  command: string,
  options?: Parameters<typeof exec>[1],
): Promise<{ stdout: string | Buffer; stderr: string | Buffer }> {
  const result = await execPromise(command, options);
  // Print output to console
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

interface TestEnvironment {
  databaseUrl: string;
  databaseDirectUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Loads environment variables from .env.example and applies test overrides
 */
export function setupTestEnvironment(testEnv?: Partial<TestEnvironment>): void {
  // Try to load .env.example as the base configuration (optional for tests)
  const envExamplePath = path.resolve(__dirname, '../../../.env.example');

  if (fs.existsSync(envExamplePath)) {
    // Load .env.example variables if available
    const envConfig = dotenv.parse(fs.readFileSync(envExamplePath));

    // Apply all variables from .env.example
    Object.keys(envConfig).forEach((key) => {
      // Only set if not already defined (allows CI/CD to override)
      if (!process.env[key]) {
        process.env[key] = envConfig[key];
      }
    });
  }

  // Apply test-specific overrides
  process.env.NODE_ENV = 'production';

  // Always apply dynamic overrides from test containers
  if (testEnv?.databaseUrl) {
    process.env.DATABASE_URL = testEnv.databaseUrl;
  }
  if (testEnv?.databaseDirectUrl) {
    process.env.DATABASE_DIRECT_URL = testEnv.databaseDirectUrl;
  }
  if (testEnv?.supabaseUrl) {
    process.env.SUPABASE_URL = testEnv.supabaseUrl;
  }
  if (testEnv?.supabaseKey) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = testEnv.supabaseKey;
  }
}

/**
 * Runs Drizzle migrations for test database
 */
export async function runDrizzleMigrations(
  databaseDirectUrl: string,
): Promise<void> {
  console.log('Setting up test database schema...');

  try {
    // Set DATABASE_URL in environment for drizzle.config.ts to use
    // Use process.cwd() to get project root (where tests are run from)
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, 'drizzle.config.ts');

    await execAsync(`npx drizzle-kit migrate --config "${configPath}"`, {
      env: {
        ...process.env,
        DATABASE_URL: databaseDirectUrl,
      },
      cwd: projectRoot,
    });

    console.log('✓ Database schema applied successfully');
  } catch (error) {
    console.error('Failed to apply database schema:', error);
    throw error;
  }
}
