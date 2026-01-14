/// <reference types="cypress" />
/// <reference path="../../../../../../cypress/support/commands.ts" />

import { makeCypressGameDriver } from './cypress-game.driver';

/**
 * Hello World test for Cypress E2E testing with the four-layer model.
 *
 * This test validates the authentication flow using the business-level DSL.
 * Web implementation details are encapsulated in cypress/support/commands.ts.
 */
describe('Feature: Authentification guest', () => {
  const driver = makeCypressGameDriver();

  // Data reset happens automatically in before:spec (see cypress.config.ts)

  it("Example: A user who is not connected can authenticate as a guest", () => {
    // GIVEN
    driver.auth.given.userNotConnected();

    // WHEN
    driver.auth.when.authenticatingAsGuest('TestPlayer');

    // THEN
    driver.auth.assert.userToBeAuthenticated('TestPlayer');
  });
});
