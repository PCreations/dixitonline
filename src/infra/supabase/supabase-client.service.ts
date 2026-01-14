import {
  createClient,
  type RealtimeChannel,
  type RealtimePostgresInsertPayload,
  type SupabaseClient as SupabaseClientType,
} from '@supabase/supabase-js';
import { Context, Effect, Layer, Scope } from 'effect';

/**
 * Configuration for the Supabase client.
 */
export type SupabaseClientConfig = {
  readonly url: string;
  /**
   * Publishable key for Supabase (format: sb_publishable_...)
   * In older Supabase versions, this was called "anon key".
   */
  readonly publishableKey: string;
};

/**
 * Supabase client service for real-time subscriptions.
 */
export class SupabaseClient extends Context.Tag('SupabaseClient')<
  SupabaseClient,
  {
    /**
     * The underlying Supabase client instance.
     */
    readonly client: SupabaseClientType;

    /**
     * Subscribe to INSERT events on a table.
     * Returns the channel which can be used to unsubscribe.
     */
    readonly subscribeToInserts: <T extends Record<string, unknown>>(
      table: string,
      callback: (payload: RealtimePostgresInsertPayload<T>) => void,
    ) => Effect.Effect<RealtimeChannel>;

    /**
     * Unsubscribe from a channel.
     */
    readonly unsubscribe: (channel: RealtimeChannel) => Effect.Effect<void>;
  }
>() {}

/**
 * Create a live SupabaseClient layer with the given configuration.
 */
export const makeSupabaseClientLive = (config: SupabaseClientConfig) =>
  Layer.scoped(
    SupabaseClient,
    Effect.gen(function* () {
      const scope = yield* Scope.Scope;

      // Create the Supabase client
      const client = createClient(config.url, config.publishableKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      // Ensure cleanup on scope finalization
      yield* Scope.addFinalizer(
        scope,
        Effect.sync(() => {
          client.realtime.disconnect();
        }),
      );

      return {
        client,

        subscribeToInserts: <T extends Record<string, unknown>>(
          table: string,
          callback: (payload: RealtimePostgresInsertPayload<T>) => void,
        ) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan(
              'context.input',
              JSON.stringify({
                table,
                channelName: `${table}-inserts`,
              }),
            );

            const channel = client
              .channel(`${table}-inserts`)
              .on<T>(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table,
                },
                callback,
              )
              .subscribe();

            yield* Effect.annotateCurrentSpan(
              'context.output',
              JSON.stringify({
                subscribed: true,
              }),
            );

            return channel;
          }).pipe(Effect.withSpan('SupabaseClient.subscribeToInserts')),

        unsubscribe: (channel: RealtimeChannel) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan(
              'context.input',
              JSON.stringify({
                channelTopic: channel.topic,
              }),
            );

            yield* Effect.promise(async () => {
              await client.removeChannel(channel);
            });

            yield* Effect.annotateCurrentSpan('context.output', 'no data');
          }).pipe(Effect.withSpan('SupabaseClient.unsubscribe')),
      };
    }),
  );

/**
 * Layer that reads configuration from environment variables.
 * Requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to be set.
 */
export const SupabaseClientLive = Layer.unwrapEffect(
  Effect.sync(() => {
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables are required',
      );
    }

    return makeSupabaseClientLive({ url, publishableKey });
  }),
);
