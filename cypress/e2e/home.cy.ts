describe('Page d\'accueil', () => {
  it('affiche la modale de connexion', () => {
    // Visit the home page
    cy.visit('/');

    // Click on the "Commencer l'aventure" button
    cy.contains('Commencer l\'aventure').click();

    // Verify that the auth modal appears
    cy.contains('Bienvenue sur Tixid !').should('be.visible');

    // Verify the modal has the username input
    cy.get('input[placeholder="Votre pseudo"]').should('be.visible');

    // Verify the modal has the submit button
    cy.contains('Commencer à jouer').should('be.visible');
  });
});
