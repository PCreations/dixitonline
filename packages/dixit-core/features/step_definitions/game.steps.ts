import { expect } from 'chai';
import { Given, When, Then } from 'cucumber';

Given('I am logged as {string}', function(playerName) {
  this.auth.loggedUserByName(playerName);
});

When('creating a new game', function() {
  this.game.createGameHostedByAuthUser();
});

Then("the game should appear in the game's list with {string} as the unique player", function(playerName) {
  // Write code here that turns the phrase above into concrete actions
  expect(this.game.getCurrentGamePlayersList()).to.equal([playerName]);
});

When('{string} joins the game', function(playerName) {
  this.game.addPlayerInCurrentGame(playerName);
});

Then("{string} should appear in the player's list of this game", function(playerName) {
  expect(this.game.getCurrentGamePlayersList()).to.include(playerName);
});

Then("I can see a {string} action in the game's detail", function(actionName) {
  expect(this.game.getAvailableActionsAsHostForCurrentGame()).to.include(actionName);
});
