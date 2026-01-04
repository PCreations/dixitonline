/// <reference types="cypress" />

// ***********************************************
// Custom Cypress commands
// ***********************************************

// Example:
// Cypress.Commands.add('login', (username: string) => {
//   // Login logic here
// });

// Add TypeScript definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom command types here
      // login(username: string): Chainable<void>
    }
  }
}

export {};
