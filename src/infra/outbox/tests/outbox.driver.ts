import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Stream } from 'effect';
import { type GameEvent, GameEventBus } from '../../../game/game-event-bus.js';
import {
  type InMemoryOutboxRepositoryState,
  makeInMemoryOutboxRepository,
  OutboxRepository,
} from '../outbox.repository.js';

/**
 * State for tracking published events in tests.
 */
export type GameEventBusTestState = {
  readonly getPublishedEvents: () => ReadonlyArray<GameEvent>;
  readonly waitForEvent: (
    matcher: (event: GameEvent) => boolean,
    timeoutMs?: number,
  ) => Effect.Effect<GameEvent, Error>;
  readonly clear: () => void;
};

/**
 * DSL for testing outbox behavior.
 */
interface OutboxDriverDSL {
  readonly given: {
    /**
     * Insert an unprocessed event directly into the outbox.
     */
    readonly existingUnprocessedEvent: (props: {
      aggregateType: 'game' | 'player';
      aggregateId: string;
      aggregateVersion: number;
      event: GameEvent;
    }) => Effect.Effect<void>;
  };

  readonly when: {
    /**
     * Simulate the polling daemon processing unprocessed events.
     */
    readonly daemonProcessesEvents: () => Effect.Effect<void>;
  };

  readonly assert: {
    /**
     * Assert that an event matching the given criteria was published to GameEventBus.
     */
    readonly eventToHaveBeenPublishedToGameEventBus: (
      matcher: Partial<GameEvent> & { _tag: GameEvent['_tag'] },
    ) => Effect.Effect<void>;

    /**
     * Assert that an event with the given ID was marked as processed.
     */
    readonly eventToBeMarkedAsProcessed: (
      eventId: string,
    ) => Effect.Effect<void>;

    /**
     * Assert that no unprocessed events remain in the outbox.
     */
    readonly noUnprocessedEventsToRemain: () => Effect.Effect<void>;

    /**
     * Assert that an event was eventually published (with timeout).
     */
    readonly eventToEventuallyBePublished: (
      matcher: Partial<GameEvent> & { _tag: GameEvent['_tag'] },
      timeoutMs?: number,
    ) => Effect.Effect<void>;
  };

  /**
   * Access to raw state for advanced assertions.
   */
  readonly getOutboxState: () => InMemoryOutboxRepositoryState;
  readonly getEventBusState: () => GameEventBusTestState;
}

export class OutboxDriver extends Context.Tag('OutboxDriver')<
  OutboxDriver,
  OutboxDriverDSL
>() {}

/**
 * Creates the OutboxDriver implementation.
 */
const makeOutboxDriver = (deps: {
  outboxRepository: Context.Tag.Service<OutboxRepository>;
  outboxState: InMemoryOutboxRepositoryState;
  gameEventBus: Context.Tag.Service<GameEventBus>;
  eventBusState: GameEventBusTestState;
}): OutboxDriverDSL => {
  const { outboxRepository, outboxState, gameEventBus, eventBusState } = deps;

  const given: OutboxDriverDSL['given'] = {
    existingUnprocessedEvent: (props) =>
      // We use a fake transaction since in-memory doesn't need it
      outboxRepository
        .insertWithinTransaction(null as never, {
          aggregateType: props.aggregateType,
          aggregateId: props.aggregateId,
          aggregateVersion: props.aggregateVersion,
          event: props.event,
        })
        .pipe(Effect.orDie),
  };

  const when: OutboxDriverDSL['when'] = {
    daemonProcessesEvents: () =>
      Effect.gen(function* () {
        const unprocessed = yield* outboxRepository
          .findUnprocessed(100)
          .pipe(Effect.orDie);

        for (const row of unprocessed) {
          if (row.aggregateType === 'game') {
            const event = row.payload as GameEvent;
            yield* gameEventBus.publish(event);
          }
          yield* outboxRepository.markAsProcessed(row.id).pipe(Effect.orDie);
        }
      }),
  };

  const assert: OutboxDriverDSL['assert'] = {
    eventToHaveBeenPublishedToGameEventBus: (matcher) =>
      Effect.sync(() => {
        const published = eventBusState.getPublishedEvents();
        const found = published.find((event) => {
          if (event._tag !== matcher._tag) return false;
          for (const [key, value] of Object.entries(matcher)) {
            if ((event as Record<string, unknown>)[key] !== value) return false;
          }
          return true;
        });
        expect(found).toBeDefined();
      }),

    eventToBeMarkedAsProcessed: (eventId) =>
      Effect.sync(() => {
        const events = outboxState.getStoredEvents();
        const event = events.find((e) => e.id === eventId);
        expect(event).toBeDefined();
        expect(event?.processedAt).not.toBeNull();
      }),

    noUnprocessedEventsToRemain: () =>
      Effect.gen(function* () {
        const unprocessed = yield* outboxRepository
          .findUnprocessed(100)
          .pipe(Effect.orDie);
        expect(unprocessed).toHaveLength(0);
      }),

    eventToEventuallyBePublished: (matcher, timeoutMs = 5000) =>
      eventBusState
        .waitForEvent((event) => {
          if (event._tag !== matcher._tag) return false;
          for (const [key, value] of Object.entries(matcher)) {
            if ((event as Record<string, unknown>)[key] !== value) return false;
          }
          return true;
        }, timeoutMs)
        .pipe(
          Effect.map(() => undefined),
          Effect.catchAll((error) =>
            Effect.die(
              new Error(
                `Event ${matcher._tag} was not published: ${error.message}`,
              ),
            ),
          ),
        ),
  };

  return {
    given,
    when,
    assert,
    getOutboxState: () => outboxState,
    getEventBusState: () => eventBusState,
  };
};

/**
 * Creates the test layer for OutboxDriver with in-memory implementations.
 */
export const makeOutboxDriverTestLayer = () => {
  const { repository: outboxRepository, state: outboxState } =
    makeInMemoryOutboxRepository();

  // Single source of truth for published events
  const publishedEvents: Array<GameEvent> = [];
  const subscribers: Array<(event: GameEvent) => void> = [];

  const eventBusState: GameEventBusTestState = {
    getPublishedEvents: () => [...publishedEvents],
    waitForEvent: (matcher, timeoutMs = 5000) =>
      Effect.async<GameEvent, Error>((resume) => {
        const existing = publishedEvents.find(matcher);
        if (existing) {
          resume(Effect.succeed(existing));
          return;
        }

        const timeout = setTimeout(() => {
          resume(
            Effect.fail(
              new Error(`Timeout waiting for event after ${timeoutMs}ms`),
            ),
          );
        }, timeoutMs);

        const subscriber = (event: GameEvent) => {
          if (matcher(event)) {
            clearTimeout(timeout);
            resume(Effect.succeed(event));
          }
        };
        subscribers.push(subscriber);
      }),
    clear: () => {
      publishedEvents.length = 0;
    },
  };

  const gameEventBus: Context.Tag.Service<GameEventBus> = {
    publish: (event) =>
      Effect.sync(() => {
        publishedEvents.push(event);
        for (const subscriber of subscribers) {
          subscriber(event);
        }
      }),
    subscribe: (gameId) =>
      Stream.fromIterable(publishedEvents.filter((e) => e.gameId === gameId)),
    subscribeAll: () => Stream.fromIterable(publishedEvents),
  };

  const outboxRepositoryLayer = Layer.succeed(
    OutboxRepository,
    outboxRepository,
  );
  const eventBusLayer = Layer.succeed(GameEventBus, gameEventBus);

  const driverLayer = Layer.succeed(
    OutboxDriver,
    makeOutboxDriver({
      outboxRepository,
      outboxState,
      gameEventBus,
      eventBusState,
    }),
  );

  return Layer.mergeAll(driverLayer, outboxRepositoryLayer, eventBusLayer);
};
