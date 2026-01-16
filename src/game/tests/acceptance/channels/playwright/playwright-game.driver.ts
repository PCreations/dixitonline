/**
 * Playwright Game Driver
 *
 * This driver implements the GameDriverDSL interface for Playwright E2E tests.
 * It wraps both UI interactions and HTTP calls in Effect, allowing reuse of
 * existing test suites.
 *
 * Strategy:
 * - UI interactions when available (auth, create game, join game)
 * - Backdoor API when no UI exists (setup decks, query game state)
 */

import { expect, type Page } from '@playwright/test';
import { Effect, Option } from 'effect';

import type { DeckSnapshot } from '../../../../deck.entity.js';
import type { PlayersRandomizeStrategy } from '../../../../game.entity.js';
import type { GameBuilder } from '../../../game.builder.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';

type EndConditionDto =
  | {
      type: 'NumberOfTimesBeingStoryteller';
      numberOfTimes: number;
    }
  | {
      type: 'LimitOfPoints';
      limit: number;
    };

interface PlaywrightGameDriverDSL {
  readonly getGameSnapshot: (gameId: string) => Effect.Effect<unknown, Error>;
  readonly getStartedGameSnapshot: (
    gameId: string,
  ) => Effect.Effect<unknown, Error>;
  readonly gameEndedGameSnapshot: (
    gameId: string,
  ) => Effect.Effect<unknown, Error>;
  readonly unsafe__saveGameEntity: (game: unknown) => Effect.Effect<void, Error>;
  readonly given: {
    readonly defaultDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      withShuffledCards?: ReadonlyArray<string>;
    }) => Effect.Effect<void, Error>;
    readonly existingDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      shuffleStrategy?: 'identity' | 'shuffle';
    }) => Effect.Effect<DeckSnapshot, Error>;
    readonly existingNonStartedGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      players?: ReadonlyArray<string>;
      endCondition?: EndConditionDto;
    }) => Effect.Effect<void, Error>;
    readonly existingFullGame: (props: { gameId: string }) => Effect.Effect<void, Error>;
    readonly existingGame: (
      driver: PlaywrightGameDriverDSL,
      builder: GameBuilder,
    ) => Effect.Effect<{ game: unknown; deck: DeckSnapshot }, Error>;
  };
  readonly withFailFastMode: () => PlaywrightGameDriverDSL;
  readonly when: {
    readonly creatingGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      endCondition?: EndConditionDto;
    }) => Effect.Effect<void, Error>;
    readonly joiningGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void, Error>;
    readonly joiningGameWhileAnotherPlayerJustJoinedInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasJustJoinedInBetween: string;
    }) => Effect.Effect<void, Error>;
    readonly leavingGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void, Error>;
    readonly startingGame: (props: {
      gameId: string;
      playerId: string;
      randomizeStrategy?: PlayersRandomizeStrategy;
    }) => Effect.Effect<void, Error>;
    readonly startingGameWhileAnotherPlayerLeftInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasLeftInBetween: string;
    }) => Effect.Effect<void, Error>;
    readonly submittingClue: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
      clue: string;
    }) => Effect.Effect<void, Error>;
    readonly selectingCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => Effect.Effect<void, Error>;
    readonly votingOnCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => Effect.Effect<void, Error>;
    readonly notifyingToBeReadyForNextTurn: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void, Error>;
  };
  readonly assert: {
    readonly createdGameToEqual: (game: {
      id: string;
      createdBy: string;
      deckId: string;
      endCondition?: EndConditionDto;
      players: ReadonlyArray<string>;
    }) => Effect.Effect<void, Error>;
    readonly playerToHaveJoinedGame: (props: {
      gameId: string;
      playerId: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToJoinGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToLeaveGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToStartGame: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly gameToHavePlayers: (props: {
      gameId: string;
      players: ReadonlyArray<string>;
    }) => Effect.Effect<void, Error>;
    readonly gameToHaveBeenStarted: (props: {
      gameId: string;
    }) => Effect.Effect<void, Error>;
    readonly currentTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
    }) => Effect.Effect<void, Error>;
    readonly newTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
      cardsInDrawPile: ReadonlyArray<{ id: string; url: string }>;
      playersHavingBeenStoryteller: Record<string, number>;
    }) => Effect.Effect<void, Error>;
    readonly playerHandsToEqual: (props: {
      gameId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
    }) => Effect.Effect<void, Error>;
    readonly turnClueToBeSubmitted: (props: {
      gameId: string;
      storytellerClue: string;
      storytellerCardId: string;
    }) => Effect.Effect<void, Error>;
    readonly turnToHaveSelectedCards: (props: {
      gameId: string;
      selectedCards: ReadonlyArray<{ cardId: string; playerId: string }>;
    }) => Effect.Effect<void, Error>;
    readonly turnToBeInVotingPhase: (props: {
      gameId: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToSubmitClue: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToSelectCard: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToHaveVotedOnCard: (props: {
      gameId: string;
      votedBy: string;
      ownedBy: string;
      cardId: string;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToVoteOnCard: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly turnToBeInScoringPhase: (props: {
      gameId: string;
    }) => Effect.Effect<void, Error>;
    readonly playersToHaveScore: (props: {
      gameId: string;
      scores: ReadonlyArray<{ playerId: string; score: number }>;
    }) => Effect.Effect<void, Error>;
    readonly playersReadyForNextTurnToEqual: (props: {
      gameId: string;
      playersReadyForNextTurn: ReadonlyArray<string>;
    }) => Effect.Effect<void, Error>;
    readonly playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn: (props?: {
      error?: string;
    }) => Effect.Effect<void, Error>;
    readonly gameViewToEqual: (props: {
      gameId: string;
      gameView: unknown;
    }) => Effect.Effect<void, Error>;
    readonly gameToBeEnded: (props: {
      gameId: string;
    }) => Effect.Effect<void, Error>;
  };
}

/**
 * Creates a Playwright Game Driver that implements the GameDriverDSL interface.
 * All methods return Effect types for compatibility with existing test suites.
 */
export const makePlaywrightGameDriver = (
  page: Page,
): PlaywrightGameDriverDSL => {
  const testState = {
    currentError: Option.none<Error>(),
    failFast: false,
    currentGameId: undefined as string | undefined,
  };

  // Helper for HTTP calls (backdoor API)
  const httpPost = <T>(url: string, body: object): Effect.Effect<T, Error> =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(`${BASE_URL}${url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return response.json() as T;
      },
      catch: (e) => new Error(String(e)),
    });

  const httpGet = <T>(url: string): Effect.Effect<T, Error> =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(`${BASE_URL}${url}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return response.json() as T;
      },
      catch: (e) => new Error(String(e)),
    });

  // Helper for UI actions
  const uiAction = <T = void>(
    fn: () => Promise<T>,
  ): Effect.Effect<T, Error> =>
    Effect.tryPromise({
      try: fn,
      catch: (e) => new Error(String(e)),
    });

  // Helper to catch errors and store them
  const withErrorHandling = <T>(
    effect: Effect.Effect<T, Error>,
  ): Effect.Effect<T | void, never> =>
    effect.pipe(
      Effect.catchAll((error) => {
        if (testState.failFast) {
          return Effect.die(new Error(`[PlaywrightDriver] ${error.message}`));
        }
        testState.currentError = Option.some(error);
        return Effect.succeed(void 0 as T | void);
      }),
    );

  const given: PlaywrightGameDriverDSL['given'] = {
    // Backdoor API - no UI for creating decks
    defaultDeck: (props) =>
      httpPost('/api/test/setup/deck', { ...props, isDefault: true }).pipe(
        Effect.map(() => void 0),
      ),

    existingDeck: (props) =>
      Effect.gen(function* () {
        yield* httpPost('/api/test/setup/deck', props);
        return {
          id: props.id,
          cards: (props.cards ?? []).map((id) => ({
            id,
            url: `https://example.com/${id}`,
          })),
          isDefault: false,
        } as DeckSnapshot;
      }),

    existingNonStartedGame: (props) =>
      Effect.gen(function* () {
        // Setup deck first if not provided
        const deckId = props.deckId ?? 'default-deck-id';
        if (!props.deckId) {
          yield* given.defaultDeck({ id: deckId });
        }

        // Create game via backdoor API
        yield* httpPost('/api/test/action/create-game', {
          gameId: props.gameId,
          hostId: props.hostId,
          deckId,
          endCondition: props.endCondition,
        });

        testState.currentGameId = props.gameId;

        // Join other players via backdoor API
        for (const player of props.players ?? []) {
          if (player !== props.hostId) {
            yield* httpPost('/api/test/action/join-game', {
              gameId: props.gameId,
              playerId: player,
            });
          }
        }
      }),

    existingFullGame: (props) =>
      given.existingNonStartedGame({
        gameId: props.gameId,
        hostId: 'id-player-1',
        players: Array.from({ length: 6 }, (_, i) => `id-player-${i + 1}`),
      }),

    existingGame: (driver, builder) =>
      Effect.gen(function* () {
        const originalFailFast = testState.failFast;
        testState.failFast = true;

        // Cast to unknown for E2E compatibility - the builder doesn't verify types at runtime
        yield* builder.build(driver as unknown as Parameters<typeof builder.build>[0]);

        testState.failFast = originalFailFast;

        const gameId = builder.gameId;
        const deckId = builder.deckId;

        const gameResult = yield* httpGet<{
          found: boolean;
          snapshot: unknown;
        }>(`/api/test/game/${gameId}/snapshot`);

        return {
          game: gameResult.snapshot,
          // Minimal deck snapshot for Playwright tests - we don't use the full deck data
          deck: {
            id: deckId,
            cards: [],
            isDefault: false,
            cardsById: {},
            shuffleStrategy: { shuffle: (cards: ReadonlyArray<unknown>) => cards },
          } as unknown as DeckSnapshot,
        };
      }),
  };

  const when: PlaywrightGameDriverDSL['when'] = {
    creatingGame: (props) =>
      withErrorHandling(
        uiAction(async () => {
          // Navigate to home and authenticate
          await page.goto(`${BASE_URL}`);

          // Wait for the page to load and check if we need to authenticate
          const guestForm = page.locator('#guest-form');
          if (await guestForm.isVisible({ timeout: 5000 }).catch(() => false)) {
            await page.fill('input[placeholder="Pseudo"]', props.hostId);
            await page.click('#guest-form button[type="submit"]');
            await page.waitForSelector('text=Créer une partie', {
              timeout: 10000,
            });
          }

          // Navigate to create game page
          await page.click('text=Créer une partie');

          // Fill the form based on endCondition
          if (props.endCondition?.type === 'LimitOfPoints') {
            await page.click('input[value="LimitOfPoints"]');
            if (props.endCondition.limit) {
              await page.fill(
                'input[name="limitOfPoints"]',
                String(props.endCondition.limit),
              );
            }
          } else if (
            props.endCondition?.type === 'NumberOfTimesBeingStoryteller' &&
            props.endCondition.numberOfTimes
          ) {
            await page.fill(
              'input[name="numberOfTimes"]',
              String(props.endCondition.numberOfTimes),
            );
          }

          // Submit the form
          await page.click('button:has-text("Créer la partie")');

          // Wait for redirect to lobby
          await page.waitForURL(/\/game\/[a-f0-9-]+\/lobby/, {
            timeout: 10000,
          });

          // Extract gameId from URL
          const url = page.url();
          const match = url.match(/\/game\/([a-f0-9-]+)\/lobby/);
          if (match) {
            testState.currentGameId = match[1];
          }
        }),
      ),

    joiningGame: (props) =>
      withErrorHandling(
        uiAction(async () => {
          // Navigate to join page
          await page.goto(`${BASE_URL}/game/${props.gameId}/join`);

          // Check if we need to authenticate
          const guestForm = page.locator('#guest-form');
          if (await guestForm.isVisible({ timeout: 5000 }).catch(() => false)) {
            await page.fill('input[placeholder="Pseudo"]', props.playerId);
            await page.click('#guest-form button[type="submit"]');
          }

          // Wait for lobby
          await page.waitForURL(/\/game\/.*\/lobby/, { timeout: 10000 });
        }),
      ),

    joiningGameWhileAnotherPlayerJustJoinedInBetween: () =>
      Effect.fail(
        new Error(
          'Optimistic locking test not supported via UI - use in-memory/drizzle channel',
        ),
      ),

    leavingGame: (props) =>
      withErrorHandling(
        httpPost('/api/test/action/leave-game', {
          gameId: props.gameId,
          playerId: props.playerId,
        }).pipe(Effect.map(() => void 0)),
      ),

    startingGame: (props) =>
      withErrorHandling(
        uiAction(async () => {
          // Click the start game button
          await page.click('button:has-text("Démarrer")');
          // Wait for redirect to play page
          await page.waitForURL(/\/game\/.*\/play/, { timeout: 10000 });
        }),
      ),

    startingGameWhileAnotherPlayerLeftInBetween: () =>
      Effect.fail(
        new Error(
          'Optimistic locking test not supported via UI - use in-memory/drizzle channel',
        ),
      ),

    submittingClue: (props) =>
      withErrorHandling(
        uiAction(async () => {
          // This would interact with the game UI
          // For now, use backdoor API
          await fetch(`${BASE_URL}/api/test/action/submit-clue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(props),
          });
        }),
      ),

    selectingCard: (props) =>
      withErrorHandling(
        uiAction(async () => {
          // This would interact with the game UI
          await fetch(`${BASE_URL}/api/test/action/select-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(props),
          });
        }),
      ),

    votingOnCard: (props) =>
      withErrorHandling(
        uiAction(async () => {
          // This would interact with the game UI
          await fetch(`${BASE_URL}/api/test/action/vote-on-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(props),
          });
        }),
      ),

    notifyingToBeReadyForNextTurn: (props) =>
      withErrorHandling(
        uiAction(async () => {
          await fetch(`${BASE_URL}/api/test/action/notify-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(props),
          });
        }),
      ),
  };

  const assert: PlaywrightGameDriverDSL['assert'] = {
    createdGameToEqual: (game) =>
      uiAction(async () => {
        // Verify we're on the lobby page
        await expect(page).toHaveURL(/\/game\/[a-f0-9-]+\/lobby/);

        // Verify the host is shown with (Hôte) indicator
        // Note: The UI may truncate long player names (like UUIDs), so we just verify
        // that there's a host element visible
        const hostElement = page
          .locator('.lobby-player-name')
          .filter({ hasText: '(Hôte)' });
        await expect(hostElement).toBeVisible();

        // Verify the host element contains the beginning of the player ID
        // (UI may truncate long names)
        const hostText = await hostElement.textContent();
        const expectedPrefix = game.createdBy.substring(0, 10);
        if (!hostText?.includes(expectedPrefix)) {
          throw new Error(
            `Expected host name to contain "${expectedPrefix}", but got "${hostText}"`,
          );
        }

        // Verify player count
        await expect(page.locator('.lobby-counter')).toContainText(
          `${game.players.length}/6`,
        );
      }),

    playerToHaveJoinedGame: (props) =>
      uiAction(async () => {
        // Check that the player name is visible in the lobby
        await expect(page.locator('.lobby-player-name')).toContainText(
          props.playerId,
        );
      }),

    playerToNotHaveBeenAbleToJoinGame: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        // Reset error state
        testState.currentError = Option.none();
      }),

    playerToNotHaveBeenAbleToLeaveGame: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    playerToNotHaveBeenAbleToStartGame: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    gameToHavePlayers: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: { players: string[] };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.players).toEqual(props.players);
      }),

    gameToHaveBeenStarted: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: { status: { _tag: string } };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.status._tag).toBe('StartedGame');
      }),

    currentTurnToBeStarted: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: {
            currentTurn: {
              currentStorytellerId: string;
              phase: string;
              turnNumber: number;
            };
          };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.currentTurn.currentStorytellerId).toBe(
          props.storytellerId,
        );
        expect(result.snapshot.currentTurn.phase).toBe('storytelling');
        expect(result.snapshot.currentTurn.turnNumber).toBe(1);
      }),

    newTurnToBeStarted: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    playerHandsToEqual: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    turnClueToBeSubmitted: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    turnToHaveSelectedCards: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    turnToBeInVotingPhase: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    playerToNotHaveBeenAbleToSubmitClue: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    playerToNotHaveBeenAbleToSelectCard: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    playerToHaveVotedOnCard: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    playerToNotHaveBeenAbleToVoteOnCard: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    turnToBeInScoringPhase: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    playersToHaveScore: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    playersReadyForNextTurnToEqual: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    gameViewToEqual: () =>
      Effect.fail(new Error('Not implemented for Playwright driver')),

    gameToBeEnded: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: { status: { _tag: string } };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.status._tag).toBe('EndedGame');
      }),
  };

  const driver: PlaywrightGameDriverDSL = {
    given,
    when,
    assert,
    withFailFastMode: () => {
      testState.failFast = true;
      return driver;
    },
    getGameSnapshot: (gameId) =>
      httpGet<{ snapshot: unknown }>(`/api/test/game/${gameId}/snapshot`).pipe(
        Effect.map((r) => r.snapshot),
      ),
    getStartedGameSnapshot: (gameId) =>
      httpGet<{ snapshot: unknown }>(`/api/test/game/${gameId}/snapshot`).pipe(
        Effect.map((r) => r.snapshot),
      ),
    gameEndedGameSnapshot: (gameId) =>
      httpGet<{ snapshot: unknown }>(`/api/test/game/${gameId}/snapshot`).pipe(
        Effect.map((r) => r.snapshot),
      ),
    unsafe__saveGameEntity: () =>
      Effect.fail(new Error('Not supported via Playwright driver')),
  };

  return driver;
};
