/// <reference types="cypress" />
// ***********************************************************
// This support file is processed and loaded automatically before your test files.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Capture browser console logs and print them to Cypress output
Cypress.on('window:before:load', (win) => {
  cy.spy(win.console, 'log').as('consoleLog');
  cy.spy(win.console, 'error').as('consoleError');
});

// Print console logs after each test for debugging
afterEach(() => {
  cy.get('@consoleLog').then((subject) => {
    const spy = subject as unknown as { args: Array<Array<unknown>> };
    if (spy.args && spy.args.length > 0) {
      console.log('--- Browser Console Logs ---');
      spy.args.forEach((args) => {
        console.log(...args);
      });
    }
  });
  cy.get('@consoleError').then((subject) => {
    const spy = subject as unknown as { args: Array<Array<unknown>> };
    if (spy.args && spy.args.length > 0) {
      console.log('--- Browser Console Errors ---');
      spy.args.forEach((args) => {
        console.error(...args);
      });
    }
  });
});
