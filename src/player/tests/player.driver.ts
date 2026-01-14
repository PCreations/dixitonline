import { expect } from '@effect/vitest';
import { Context, Effect, Layer, Option } from 'effect';
import { EnsurePlayerExistsUseCase } from '../ensure-player-exists.usecase.js';
import { PlayerEntity, PlayerId } from '../player.entity.js';
import {
  InMemoryPlayerRepository,
  PlayerRepository,
} from '../player.repository.js';

// ============================================================================
// DSL Interface
// ============================================================================

interface PlayerDriverDSL {
  readonly given: {
    /**
     * Create an existing player in the repository
     */
    readonly existingPlayer: (props: {
      playerId: string;
      username: string;
      isAnonymous: boolean;
      email?: string;
    }) => Effect.Effect<void>;
  };

  readonly when: {
    /**
     * Execute the EnsurePlayerExists use case
     */
    readonly ensuringPlayerExists: (props: {
      playerId: string;
      username: string | undefined;
      isAnonymous: boolean;
    }) => Effect.Effect<void>;

    /**
     * Link an email to an existing player
     */
    readonly linkingEmail: (props: {
      playerId: string;
      email: string;
    }) => Effect.Effect<void>;
  };

  readonly assert: {
    /**
     * Assert that a player exists with the given properties
     */
    readonly playerToExist: (props: {
      playerId: string;
      username: string;
      isAnonymous: boolean;
    }) => Effect.Effect<void>;

    /**
     * Assert that a player has a specific username
     */
    readonly playerToHaveUsername: (props: {
      playerId: string;
      username: string;
    }) => Effect.Effect<void>;

    /**
     * Assert that a player has an email linked
     */
    readonly playerToHaveEmail: (props: {
      playerId: string;
      email: string;
    }) => Effect.Effect<void>;

    /**
     * Assert that a player is no longer anonymous
     */
    readonly playerToNotBeAnonymous: (props: {
      playerId: string;
    }) => Effect.Effect<void>;

    /**
     * Assert that linking email failed
     */
    readonly playerToNotHaveBeenAbleToLinkEmail: (props?: {
      error?: string;
    }) => Effect.Effect<void>;
  };
}

// ============================================================================
// Driver Tag
// ============================================================================

export class PlayerDriver extends Context.Tag('PlayerDriver')<
  PlayerDriver,
  PlayerDriverDSL
>() {}

// ============================================================================
// Driver Implementation
// ============================================================================

const makePlayerDriver = ({
  ensurePlayerExistsUseCase,
  playerRepository,
}: {
  ensurePlayerExistsUseCase: EnsurePlayerExistsUseCase;
  playerRepository: Context.Tag.Service<PlayerRepository>;
}): PlayerDriverDSL => {
  // Internal test state for error capture
  const testState = {
    currentError: Option.none<Error>(),
    lastPlayer: Option.none<PlayerEntity>(),
  };

  const given: PlayerDriverDSL['given'] = {
    existingPlayer: (props) =>
      Effect.gen(function* () {
        const player = PlayerEntity.createFromAuth({
          id: props.playerId,
          username: props.username,
          ...(props.email !== undefined && { email: props.email }),
          isAnonymous: props.isAnonymous,
        });
        yield* playerRepository.save(player);
      }).pipe(Effect.orDie),
  };

  const when: PlayerDriverDSL['when'] = {
    ensuringPlayerExists: (props) =>
      ensurePlayerExistsUseCase
        .execute({
          playerId: PlayerId(props.playerId),
          username: props.username,
          isAnonymous: props.isAnonymous,
        })
        .pipe(
          Effect.tap((player) =>
            Effect.sync(() => {
              testState.lastPlayer = Option.some(player);
            }),
          ),
          Effect.catchAll((error: unknown) => {
            const errorObj =
              error instanceof Error
                ? error
                : typeof error === 'object' &&
                    error !== null &&
                    'message' in error
                  ? new Error(String(error.message))
                  : new Error(String(error));
            testState.currentError = Option.some(errorObj);
            return Effect.succeed(undefined);
          }),
          Effect.asVoid,
        ),

    linkingEmail: (props) =>
      Effect.gen(function* () {
        const maybePlayer = yield* playerRepository
          .findById(PlayerId(props.playerId))
          .pipe(Effect.orDie);

        if (Option.isNone(maybePlayer)) {
          testState.currentError = Option.some(new Error('Player not found'));
          return;
        }

        const result = yield* maybePlayer.value
          .linkEmail(props.email)
          .pipe(Effect.either);

        if (result._tag === 'Left') {
          testState.currentError = Option.some(new Error(result.left._tag));
          return;
        }

        yield* playerRepository.save(result.right).pipe(Effect.orDie);
        testState.lastPlayer = Option.some(result.right);
      }),
  };

  const assert: PlayerDriverDSL['assert'] = {
    playerToExist: (props) =>
      Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const maybePlayer = yield* playerRepository
          .findById(PlayerId(props.playerId))
          .pipe(Effect.orDie);
        expect(Option.isSome(maybePlayer)).toBe(true);
        if (Option.isSome(maybePlayer)) {
          const snapshot = maybePlayer.value.toSnapshot();
          expect(snapshot.username).toBe(props.username);
          expect(snapshot.isAnonymous).toBe(props.isAnonymous);
        }
      }),

    playerToHaveUsername: (props) =>
      Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const maybePlayer = yield* playerRepository
          .findById(PlayerId(props.playerId))
          .pipe(Effect.orDie);
        expect(Option.isSome(maybePlayer)).toBe(true);
        if (Option.isSome(maybePlayer)) {
          expect(maybePlayer.value.toSnapshot().username).toBe(props.username);
        }
      }),

    playerToHaveEmail: (props) =>
      Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const maybePlayer = yield* playerRepository
          .findById(PlayerId(props.playerId))
          .pipe(Effect.orDie);
        expect(Option.isSome(maybePlayer)).toBe(true);
        if (Option.isSome(maybePlayer)) {
          expect(maybePlayer.value.toSnapshot().email).toBe(props.email);
        }
      }),

    playerToNotBeAnonymous: (props) =>
      Effect.gen(function* () {
        expect(testState.currentError).toEqual(Option.none());
        const maybePlayer = yield* playerRepository
          .findById(PlayerId(props.playerId))
          .pipe(Effect.orDie);
        expect(Option.isSome(maybePlayer)).toBe(true);
        if (Option.isSome(maybePlayer)) {
          expect(maybePlayer.value.toSnapshot().isAnonymous).toBe(false);
        }
      }),

    playerToNotHaveBeenAbleToLinkEmail: (props) =>
      Effect.sync(() => {
        expect(Option.isSome(testState.currentError)).toBe(true);
        if (props?.error && Option.isSome(testState.currentError)) {
          expect(testState.currentError.value.message).toBe(props.error);
        }
      }),
  };

  return { given, when, assert };
};

// ============================================================================
// Test Layer Factory
// ============================================================================

export const makePlayerDriverTestLayer = () => {
  // In-memory dependencies for isolation
  const dependencies = InMemoryPlayerRepository;

  // Driver layer that uses use cases
  const driverLayer = Layer.effect(
    PlayerDriver,
    Effect.gen(function* () {
      const ensurePlayerExistsUseCase = yield* EnsurePlayerExistsUseCase;
      const playerRepository = yield* PlayerRepository;

      return makePlayerDriver({
        ensurePlayerExistsUseCase,
        playerRepository,
      });
    }),
  );

  return driverLayer.pipe(
    Layer.provide(EnsurePlayerExistsUseCase.Default),
    Layer.provide(dependencies),
  );
};
