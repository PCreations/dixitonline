/**
 * Cypress Game Driver
 *
 * This driver implements the GameDriverDSL interface for Cypress E2E tests.
 * All game-related methods throw 'not implemented' for now.
 * The auth DSL is implemented for the hello world test.
 *
 * Following the four-layer testing model:
 * - Layer 1: Test Suite (Given/When/Then)
 * - Layer 2: DSL Interface (this file - business-level operations)
 * - Layer 3: Custom Commands (cypress/support/commands.ts - web implementation)
 * - Layer 4: Application (server + Supabase)
 */

/**
 * Extension du DSL pour les scenarios d'authentification.
 * Reste au niveau metier, pas de reference aux elements web.
 */
interface CypressAuthDSL {
  readonly given: {
    readonly userNotConnected: () => void;
  };
  readonly when: {
    readonly authenticatingAsGuest: (username: string) => void;
  };
  readonly assert: {
    readonly userToBeAuthenticated: (username: string) => void;
    readonly userToNotBeAuthenticated: () => void;
  };
}

/**
 * Simplified GameDriverDSL interface for Cypress.
 * All methods return void since Cypress commands are chainable.
 */
interface CypressGameDriverDSL {
  readonly given: {
    readonly defaultDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      withShuffledCards?: ReadonlyArray<string>;
    }) => void;
    readonly existingDeck: (props: {
      id: string;
      cards?: ReadonlyArray<string>;
      shuffleStrategy?: 'identity' | 'shuffle';
    }) => void;
    readonly existingNonStartedGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
      players?: ReadonlyArray<string>;
    }) => void;
    readonly existingFullGame: (props: { gameId: string }) => void;
    readonly existingGame: (gameBuilder: unknown) => void;
  };
  readonly when: {
    readonly creatingGame: (props: {
      gameId: string;
      hostId: string;
      deckId?: string;
    }) => void;
    readonly joiningGame: (props: {
      gameId: string;
      playerId: string;
    }) => void;
    readonly joiningGameWhileAnotherPlayerJustJoinedInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasJustJoinedInBetween: string;
    }) => void;
    readonly leavingGame: (props: {
      gameId: string;
      playerId: string;
    }) => void;
    readonly startingGame: (props: {
      gameId: string;
      playerId: string;
    }) => void;
    readonly startingGameWhileAnotherPlayerLeftInBetween: (props: {
      gameId: string;
      playerId: string;
      playerThatHasLeftInBetween: string;
    }) => void;
    readonly submittingClue: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
      clue: string;
    }) => void;
    readonly selectingCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => void;
    readonly votingOnCard: (props: {
      gameId: string;
      playerId: string;
      cardId: string;
    }) => void;
    readonly notifyingToBeReadyForNextTurn: (props: {
      gameId: string;
      playerId: string;
    }) => void;
  };
  readonly assert: {
    readonly createdGameToEqual: (game: {
      id: string;
      createdBy: string;
      deckId: string;
      players: ReadonlyArray<string>;
    }) => void;
    readonly playerToHaveJoinedGame: (props: {
      gameId: string;
      playerId: string;
    }) => void;
    readonly playerToNotHaveBeenAbleToJoinGame: (props?: {
      error?: string;
    }) => void;
    readonly playerToNotHaveBeenAbleToLeaveGame: (props?: {
      error?: string;
    }) => void;
    readonly playerToNotHaveBeenAbleToStartGame: (props?: {
      error?: string;
    }) => void;
    readonly gameToHavePlayers: (props: {
      gameId: string;
      players: ReadonlyArray<string>;
    }) => void;
    readonly gameToHaveBeenStarted: (props: { gameId: string }) => void;
    readonly currentTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
    }) => void;
    readonly newTurnToBeStarted: (props: {
      gameId: string;
      storytellerId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
      cardsInDrawPile: ReadonlyArray<{ id: string; url: string }>;
      playersHavingBeenStoryteller: Record<string, number>;
    }) => void;
    readonly playerHandsToEqual: (props: {
      gameId: string;
      playerHands: ReadonlyArray<{
        playerId: string;
        cards: ReadonlyArray<string>;
      }>;
    }) => void;
    readonly turnClueToBeSubmitted: (props: {
      gameId: string;
      storytellerClue: string;
      storytellerCardId: string;
    }) => void;
    readonly turnToHaveSelectedCards: (props: {
      gameId: string;
      selectedCards: ReadonlyArray<{ cardId: string; playerId: string }>;
    }) => void;
    readonly turnToBeInVotingPhase: (props: { gameId: string }) => void;
    readonly playerToNotHaveBeenAbleToSubmitClue: (props?: {
      error?: string;
    }) => void;
    readonly playerToNotHaveBeenAbleToSelectCard: (props?: {
      error?: string;
    }) => void;
    readonly playerToHaveVotedOnCard: (props: {
      gameId: string;
      votedBy: string;
      ownedBy: string;
      cardId: string;
    }) => void;
    readonly playerToNotHaveBeenAbleToVoteOnCard: (props?: {
      error?: string;
    }) => void;
    readonly turnToBeInScoringPhase: (props: { gameId: string }) => void;
    readonly playersToHaveScore: (props: {
      gameId: string;
      scores: ReadonlyArray<{ playerId: string; score: number }>;
    }) => void;
    readonly playersReadyForNextTurnToEqual: (props: {
      gameId: string;
      playersReadyForNextTurn: ReadonlyArray<string>;
    }) => void;
    readonly playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn: (props?: {
      error?: string;
    }) => void;
    readonly gameViewToEqual: (props: {
      gameId: string;
      gameView: unknown;
    }) => void;
    readonly gameToBeEnded: (props: { gameId: string }) => void;
  };
  readonly auth: CypressAuthDSL;
  readonly withFailFastMode: () => CypressGameDriverDSL;
  readonly getGameSnapshot: (gameId: string) => void;
  readonly getStartedGameSnapshot: (gameId: string) => void;
  readonly gameEndedGameSnapshot: (gameId: string) => void;
  readonly unsafe__saveGameEntity: (game: unknown) => void;
}

/**
 * Creates a Cypress Game Driver that implements the DSL interface.
 * All game-related methods throw 'not implemented' for now.
 * The auth DSL is implemented for the hello world test.
 */
export const makeCypressGameDriver = (): CypressGameDriverDSL => {
  const notImplemented = (): never => {
    throw new Error('not implemented');
  };

  // GameDriverDSL implementation - all stubbed for now
  const given: CypressGameDriverDSL['given'] = {
    defaultDeck: notImplemented,
    existingDeck: notImplemented,
    existingNonStartedGame: notImplemented,
    existingFullGame: notImplemented,
    existingGame: notImplemented,
  };

  const when: CypressGameDriverDSL['when'] = {
    creatingGame: notImplemented,
    joiningGame: notImplemented,
    joiningGameWhileAnotherPlayerJustJoinedInBetween: notImplemented,
    leavingGame: notImplemented,
    startingGame: notImplemented,
    startingGameWhileAnotherPlayerLeftInBetween: notImplemented,
    submittingClue: notImplemented,
    selectingCard: notImplemented,
    votingOnCard: notImplemented,
    notifyingToBeReadyForNextTurn: notImplemented,
  };

  const assert: CypressGameDriverDSL['assert'] = {
    createdGameToEqual: notImplemented,
    playerToHaveJoinedGame: notImplemented,
    playerToNotHaveBeenAbleToJoinGame: notImplemented,
    playerToNotHaveBeenAbleToLeaveGame: notImplemented,
    playerToNotHaveBeenAbleToStartGame: notImplemented,
    gameToHavePlayers: notImplemented,
    gameToHaveBeenStarted: notImplemented,
    currentTurnToBeStarted: notImplemented,
    newTurnToBeStarted: notImplemented,
    playerHandsToEqual: notImplemented,
    turnClueToBeSubmitted: notImplemented,
    turnToHaveSelectedCards: notImplemented,
    turnToBeInVotingPhase: notImplemented,
    playerToNotHaveBeenAbleToSubmitClue: notImplemented,
    playerToNotHaveBeenAbleToSelectCard: notImplemented,
    playerToHaveVotedOnCard: notImplemented,
    playerToNotHaveBeenAbleToVoteOnCard: notImplemented,
    turnToBeInScoringPhase: notImplemented,
    playersToHaveScore: notImplemented,
    playersReadyForNextTurnToEqual: notImplemented,
    playerToNotHaveBeenAbleToNotifyToBeReadyForNextTurn: notImplemented,
    gameViewToEqual: notImplemented,
    gameToBeEnded: notImplemented,
  };

  // Auth DSL for hello world test
  // Web implementation details are encapsulated in Cypress custom commands
  // The DSL remains purely business-level, no web element references
  const auth: CypressAuthDSL = {
    given: {
      userNotConnected: () => {
        cy.clearSession();
      },
    },
    when: {
      authenticatingAsGuest: (username: string) => {
        cy.authenticateAsGuest(username);
      },
    },
    assert: {
      userToBeAuthenticated: (username: string) => {
        cy.assertUserAuthenticated(username);
      },
      userToNotBeAuthenticated: () => {
        cy.assertUserNotAuthenticated();
      },
    },
  };

  const driver: CypressGameDriverDSL = {
    given,
    when,
    assert,
    auth,
    withFailFastMode: () => driver,
    getGameSnapshot: notImplemented,
    getStartedGameSnapshot: notImplemented,
    gameEndedGameSnapshot: notImplemented,
    unsafe__saveGameEntity: notImplemented,
  };

  return driver;
};
