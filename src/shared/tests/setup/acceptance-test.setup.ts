import { startSupabase, stopSupabase } from './supabase-env.js';
import { setupTestEnvironment } from './test-env.setup.js';

interface AcceptanceTestSetupOptions {
  now?: Date;
  userTimezone?: string;
}

export function createAcceptanceTestSetup(
  options: AcceptanceTestSetupOptions = {},
) {
  const { userTimezone = 'UTC' } = options;
  let supabaseInstanceId: string;

  const setup = async (): Promise<void> => {
    const supabaseEnv = await startSupabase();
    supabaseInstanceId = supabaseEnv.instanceId;

    setupTestEnvironment({
      databaseUrl: supabaseEnv.databaseUrl,
      databaseDirectUrl: supabaseEnv.databaseDirectUrl,
      supabaseUrl: supabaseEnv.supabaseUrl,
      supabaseKey: supabaseEnv.supabaseKey,
    });

    await supabaseEnv.runMigrations();
  };

  const teardown = async () => {
    if (supabaseInstanceId) {
      await stopSupabase(supabaseInstanceId);
    }
  };

  return {
    setup,
    teardown,
    userTimezone,
  };
}
