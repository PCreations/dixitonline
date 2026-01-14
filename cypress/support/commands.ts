/// <reference types="cypress" />

// ***********************************************
// Custom Cypress commands for the four-layer testing model
//
// These commands encapsulate web implementation details,
// keeping the driver DSL at the business level.
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Clears the user session (cookies and localStorage)
       */
      clearSession(): Chainable<void>;

      /**
       * Authenticates as a guest user with the given username
       */
      authenticateAsGuest(username: string): Chainable<void>;

      /**
       * Asserts that the user is authenticated with the given username
       */
      assertUserAuthenticated(username: string): Chainable<void>;

      /**
       * Asserts that the user is not authenticated
       */
      assertUserNotAuthenticated(): Chainable<void>;

      /**
       * Resets Supabase environment (truncates tables + deletes auth users)
       * Must be called at the start of each test suite for isolation
       */
      resetSupabase(): Chainable<null>;
    }
  }
}

// Web implementation details isolated from the business-level DSL

Cypress.Commands.add('clearSession', () => {
  // Clear cookies and localStorage (works without visiting a page)
  cy.clearCookies();
  cy.clearLocalStorage();
  // Clear all browser storage including IndexedDB using Cypress's clearAllSessionStorage
  // and clearAllLocalStorage which work across all origins
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
});

Cypress.Commands.add('authenticateAsGuest', (username: string) => {
  // Clear client-side storage first
  cy.clearSession();
  // Visit the home page (using BASE_URL env since we can't use baseUrl config)
  const baseUrl = Cypress.env('BASE_URL') || 'http://localhost:3010';
  cy.visit(baseUrl);
  // The auth modal may open automatically for unauthenticated users,
  // or require clicking "Commencer l'aventure" button.
  // We wait for the guest-form to be visible (handles both cases).
  cy.get('#guest-form', { timeout: 10000 }).should('be.visible').within(() => {
    cy.get('input[placeholder="Pseudo"]').type(username);
    cy.get('button[type="submit"]').click();
  });
});

Cypress.Commands.add('assertUserAuthenticated', (username: string) => {
  // After authentication, the user should see the game creation buttons
  // instead of the login form, and their username should be displayed
  cy.contains('Créer une partie').should('be.visible');
  cy.contains(username).should('be.visible');
});

Cypress.Commands.add('assertUserNotAuthenticated', () => {
  // When not authenticated, the login form should be visible
  cy.get('#guest-form').should('be.visible');
});

Cypress.Commands.add('resetSupabase', () => {
  // 1. Clear server-side data via Node.js task
  cy.task('resetSupabase', null, { log: true });
  // 2. Clear client-side data (cookies, localStorage, sessionStorage, IndexedDB)
  cy.clearSession();
});

export {};
