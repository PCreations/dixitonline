/// <reference types="cypress" />
/// <reference path="../support/commands.ts" />

describe('Page d\'accueil', () => {
  // Data reset happens automatically in before:spec (see cypress.config.ts)

  it('affiche le formulaire de connexion', () => {
    // Visit the home page (using BASE_URL env since we can't use baseUrl config)
    const baseUrl = Cypress.env('BASE_URL') || 'http://localhost:3010';
    cy.visit(baseUrl);

    // Verify the guest form is visible
    cy.get('#guest-form').should('be.visible');

    // Verify the guest form has the username input
    cy.get('#guest-form input[placeholder="Pseudo"]').should('be.visible');

    // Verify the guest form has the submit button
    cy.get('#guest-form button[type="submit"]').should('be.visible');
    cy.get('#guest-form').contains('Commencer à jouer').should('be.visible');

    // Verify the auth form is visible
    cy.get('#auth-form').should('be.visible');

    // Verify the auth form has the email input
    cy.get('#auth-form input[placeholder="Email"]').should('be.visible');

    // Verify the auth form has the submit button
    cy.get('#auth-form').contains('Recevoir un magic link').should('be.visible');
  });
});
