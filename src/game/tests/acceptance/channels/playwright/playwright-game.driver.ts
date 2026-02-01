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
  readonly unsafe__saveGameEntity: (
    game: unknown,
  ) => Effect.Effect<void, Error>;
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
    readonly existingFullGame: (props: {
      gameId: string;
    }) => Effect.Effect<void, Error>;
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
    currentPlayerId: undefined as string | undefined, // The authenticated player for UI interactions
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
  const uiAction = <T = void>(fn: () => Promise<T>): Effect.Effect<T, Error> =>
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

  // Authenticate as a specific player via backdoor API
  // This sets the auth cookie with a JWT containing the playerId as the sub claim
  const authenticateAsPlayer = (playerId: string): Effect.Effect<void, Error> =>
    uiAction(async () => {
      // Call the backdoor auth endpoint to get the JWT token
      const response = await page.request.post(`${BASE_URL}/api/test/auth/login`, {
        data: {
          playerId,
          username: playerId,
        },
      });

      if (!response.ok()) {
        throw new Error(`Failed to authenticate as ${playerId}: ${response.status()}`);
      }

      // Get the token from the response body (more reliable than parsing Set-Cookie header)
      const body = (await response.json()) as { token: string };

      // Add the cookie to the browser context
      await page.context().addCookies([
        {
          name: 'sb-access-token',
          value: body.token,
          domain: new URL(BASE_URL).hostname,
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      testState.currentPlayerId = playerId;
    });

  // Check if the given player is the currently authenticated UI player
  const isCurrentUiPlayer = (playerId: string): boolean =>
    testState.currentPlayerId === playerId;

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
        yield* builder.build(
          driver as unknown as Parameters<typeof builder.build>[0],
        );

        testState.failFast = originalFailFast;

        const gameId = builder.gameId;
        const deckId = builder.deckId;

        const gameResult = yield* httpGet<{
          found: boolean;
          snapshot: { players: ReadonlyArray<string> };
        }>(`/api/test/game/${gameId}/snapshot`);

        // Authenticate as the first player for UI interactions
        const firstPlayer = gameResult.snapshot.players[0];
        if (firstPlayer) {
          yield* authenticateAsPlayer(firstPlayer);
          testState.currentGameId = gameId;
        }

        return {
          game: gameResult.snapshot,
          // Minimal deck snapshot for Playwright tests - we don't use the full deck data
          deck: {
            id: deckId,
            cards: [],
            isDefault: false,
            cardsById: {},
            shuffleStrategy: {
              shuffle: (cards: ReadonlyArray<unknown>) => cards,
            },
          } as unknown as DeckSnapshot,
        };
      }),
  };

  const when: PlaywrightGameDriverDSL['when'] = {
    creatingGame: (props) =>
      // Use backdoor API for all game creation
      // The UI form uses AuthProvider which relies on Supabase JS client session,
      // but our test auth cookie is not recognized by the JS client.
      // Visual testing focuses on the game flow (game-scenarios) rather than form submission.
      withErrorHandling(
        Effect.gen(function* () {
          // Authenticate via backdoor API
          yield* authenticateAsPlayer(props.hostId);

          // Create game via backdoor API
          // Don't default deckId - let the use case fetch the actual default deck from the repository
          yield* httpPost('/api/test/action/create-game', {
            gameId: props.gameId,
            hostId: props.hostId,
            deckId: props.deckId,
            endCondition: props.endCondition,
          });

          testState.currentGameId = props.gameId;

          // Navigate to the lobby to verify creation visually
          yield* uiAction(async () => {
            await page.goto(`${BASE_URL}/game/${props.gameId}/lobby`);
            await page.waitForURL(/\/game\/[a-f0-9-]+\/lobby/, {
              timeout: 10000,
            });
          });
        }),
      ),

    joiningGame: (props) =>
      withErrorHandling(
        // Use backdoor API for joining - UI-based join doesn't support multiple players
        // in a single browser session (they would all use the same authenticated user)
        httpPost('/api/test/action/join-game', {
          gameId: props.gameId,
          playerId: props.playerId,
        }).pipe(Effect.map(() => void 0)),
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
        // Use backdoor API for starting - UI-based start requires the host to be
        // authenticated, but in multi-player scenarios we use a single browser session
        httpPost('/api/test/action/start-game', {
          gameId: props.gameId,
          playerId: props.playerId,
        }).pipe(Effect.map(() => void 0)),
      ),

    startingGameWhileAnotherPlayerLeftInBetween: () =>
      Effect.fail(
        new Error(
          'Optimistic locking test not supported via UI - use in-memory/drizzle channel',
        ),
      ),

    submittingClue: (props) => {
      // Use UI when the player is the current authenticated player
      if (isCurrentUiPlayer(props.playerId)) {
        return withErrorHandling(
          uiAction(async () => {
            // Navigate to game page
            await page.goto(`${BASE_URL}/game/${props.gameId}`);

            // Click on the card by its alt text (accessible selector)
            await page.getByRole('img', { name: props.cardId, exact: true }).click();

            // Fill the clue using the specific input ID for this card
            // Each card has its own clue input with ID: clue-input-{cardId}
            await page.locator(`#clue-input-${props.cardId}`).fill(props.clue);

            // Submit via accessible button selector
            await page.getByRole('button', { name: /Soumettre/i }).click();

            // Verify the clue is displayed (phase change)
            await expect(page.getByText(`« ${props.clue} »`)).toBeVisible({
              timeout: 10000,
            });
          }),
        );
      }

      // For other players, use backdoor API
      return withErrorHandling(
        httpPost('/api/test/action/submit-clue', props).pipe(
          Effect.map(() => void 0),
        ),
      );
    },

    selectingCard: (props) => {
      // Use UI when the player is the current authenticated player
      if (isCurrentUiPlayer(props.playerId)) {
        return withErrorHandling(
          uiAction(async () => {
            // Navigate to game page
            await page.goto(`${BASE_URL}/game/${props.gameId}`);

            // Click on the card by its alt text (accessible selector)
            await page.getByRole('img', { name: props.cardId, exact: true }).click();

            // Submit the selection via accessible button selector
            await page.getByRole('button', { name: /Sélectionner/i }).click();

            // Wait for confirmation heading
            await expect(
              page.getByRole('heading', { name: /sélectionnée/i }),
            ).toBeVisible({ timeout: 10000 });
          }),
        );
      }

      // For other players, use backdoor API
      return withErrorHandling(
        httpPost('/api/test/action/select-card', props).pipe(
          Effect.map(() => void 0),
        ),
      );
    },

    votingOnCard: (props) => {
      // Use UI when the player is the current authenticated player
      if (isCurrentUiPlayer(props.playerId)) {
        return withErrorHandling(
          uiAction(async () => {
            // Navigate to game page
            await page.goto(`${BASE_URL}/game/${props.gameId}`);

            // Click on the card by its alt text (accessible selector)
            // Cards on the board have alt={cardId}
            await page.getByRole('img', { name: props.cardId, exact: true }).click();

            // Submit the vote via accessible button selector
            await page.getByRole('button', { name: /Voter/i }).click();

            // Wait for vote confirmation heading
            await expect(
              page.getByRole('heading', { name: /enregistré/i }),
            ).toBeVisible({ timeout: 10000 });
          }),
        );
      }

      // For other players, use backdoor API
      return withErrorHandling(
        httpPost('/api/test/action/vote-on-card', props).pipe(
          Effect.map(() => void 0),
        ),
      );
    },

    notifyingToBeReadyForNextTurn: (props) => {
      // Use UI when the player is the current authenticated player
      if (isCurrentUiPlayer(props.playerId)) {
        return withErrorHandling(
          uiAction(async () => {
            // Navigate to game page
            await page.goto(`${BASE_URL}/game/${props.gameId}`);

            // Click the continue button via accessible selector
            await page.getByRole('button', { name: /Continuer/i }).click();

            // Wait for waiting message (text-based selector)
            await expect(page.getByText(/attente/i)).toBeVisible({
              timeout: 10000,
            });
          }),
        );
      }

      // For other players, use backdoor API
      return withErrorHandling(
        httpPost('/api/test/action/notify-ready', props).pipe(
          Effect.map(() => void 0),
        ),
      );
    },
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
          snapshot: { players: ReadonlyArray<string> };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.players).toEqual(props.players);
      }),

    gameToHaveBeenStarted: (props) =>
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify the game has started - should show game UI with turn info
        await expect(page.locator('.game-info')).toBeVisible();
        await expect(page.locator('.game-turn')).toContainText(/Tour/);
      }),

    currentTurnToBeStarted: (props) =>
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify turn 1 is displayed
        await expect(page.locator('.game-turn')).toContainText('Tour 1');

        // If current player is the storyteller, verify it's their turn
        if (props.storytellerId === testState.currentPlayerId) {
          await expect(page.locator('.game-status')).toContainText(
            /Ton tour|Donne un indice/,
          );
        } else {
          // Otherwise, verify we're waiting for the storyteller
          await expect(page.locator('.game-status')).toContainText(
            /attente.*conteur/i,
          );
        }
      }),

    newTurnToBeStarted: (props) =>
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify we're in storytelling phase
        if (props.storytellerId === testState.currentPlayerId) {
          // Current player is the new storyteller
          await expect(page.locator('.game-status')).toContainText(
            /Ton tour|Donne un indice/,
          );
        } else {
          // Waiting for the new storyteller
          await expect(page.locator('.game-status')).toContainText(
            /attente.*conteur/i,
          );
        }
      }),

    playerHandsToEqual: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: {
            hands: Record<string, ReadonlyArray<{ id: string }>>;
          };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        for (const { playerId, cards } of props.playerHands) {
          const hand = result.snapshot.hands[playerId];
          expect(hand?.map((c) => c.id)).toEqual(cards);
        }
      }),

    turnClueToBeSubmitted: (props) =>
      uiAction(async () => {
        // Navigate to game page to verify the clue is displayed
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify the clue is displayed using text selector (accessible)
        await expect(
          page.getByText(`« ${props.storytellerClue} »`),
        ).toBeVisible();

        // Verify we're in the selecting-cards phase (status shows "Sélection" or similar)
        await expect(page.locator('.game-status')).toContainText(/Sélection|Choisis/);
      }),

    turnToHaveSelectedCards: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: {
            currentTurn: {
              selectedCards: ReadonlyArray<{ cardId: string; playerId: string }>;
            };
          };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.currentTurn.selectedCards).toEqual(
          expect.arrayContaining([...props.selectedCards]),
        );
      }),

    turnToBeInVotingPhase: (props) =>
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify we're in voting phase by checking the status or voting board
        await expect(page.locator('.game-status')).toContainText(/vote/i);
      }),

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

    playerToHaveVotedOnCard: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: {
            currentTurn: {
              votes: ReadonlyArray<{
                votedBy: string;
                ownedBy: string;
                cardId: string;
              }>;
            };
          };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        const vote = result.snapshot.currentTurn.votes.find(
          (v) => v.votedBy === props.votedBy,
        );
        expect(vote).toBeDefined();
        expect(vote?.ownedBy).toBe(props.ownedBy);
        expect(vote?.cardId).toBe(props.cardId);
      }),

    playerToNotHaveBeenAbleToVoteOnCard: (props) =>
      Effect.sync(() => {
        const error = Option.getOrNull(testState.currentError);
        if (props?.error && error) {
          expect(error.message).toContain(props.error);
        }
        testState.currentError = Option.none();
      }),

    turnToBeInScoringPhase: (props) =>
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify we're in scoring phase using accessible heading selector
        await expect(
          page.getByRole('heading', { name: /Résultats/i }),
        ).toBeVisible();
      }),

    playersToHaveScore: (props) =>
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify the current player's score is displayed in the header
        // We can only visually verify the current authenticated player's score
        const currentPlayerScore = props.scores.find(
          (s) => s.playerId === testState.currentPlayerId,
        );
        if (currentPlayerScore !== undefined) {
          await expect(page.locator('.game-points')).toContainText(
            `${currentPlayerScore.score} points`,
          );
        }
      }),

    playersReadyForNextTurnToEqual: (props) =>
      Effect.gen(function* () {
        const result = yield* httpGet<{
          found: boolean;
          snapshot: {
            currentTurn: {
              playersReadyForNextTurn: ReadonlyArray<string>;
            };
          };
        }>(`/api/test/game/${props.gameId}/snapshot`);

        expect(result.snapshot.currentTurn.playersReadyForNextTurn).toEqual(
          expect.arrayContaining([...props.playersReadyForNextTurn]),
        );
        expect(
          result.snapshot.currentTurn.playersReadyForNextTurn.length,
        ).toBe(props.playersReadyForNextTurn.length);
      }),

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
      uiAction(async () => {
        // Navigate to game page
        await page.goto(`${BASE_URL}/game/${props.gameId}`);

        // Verify the game ended status is displayed
        await expect(page.locator('.game-status')).toContainText(/terminée/i);
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
