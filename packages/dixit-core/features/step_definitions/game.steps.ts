import { expect } from 'chai';
import { Given, When, Then, setWorldConstructor } from 'cucumber';
import { DixitWorld } from './world';

setWorldConstructor(DixitWorld);

Given('I am logged as {string}', async function(this: DixitWorld, playerName: string) {
  await this.auth!.logInUser(playerName);
});

When('creating a new game', function(this: DixitWorld) {
  this.game!.createGameHostedBy(this.auth!.authUser as string);
});

Then("the game should appear in the game's list with {string} as the unique player", function(
  this: DixitWorld,
  playerName: string,
) {
  // Write code here that turns the phrase above into concrete actions
  expect(this.game!.getCurrentGamePlayersList()).to.equal([playerName]);
});

When('{string} joins the game', function(this: DixitWorld, playerName: string) {
  this.game!.addPlayerInCurrentGame(playerName);
});

Then("{string} should appear in the player's list of this game", function(
  this: DixitWorld,
  playerName: string,
) {
  expect(this.game!.getCurrentGamePlayersList()).to.include(playerName);
});

Then("I can see a {string} action in the game's detail", function(this: DixitWorld, actionName: string) {
  expect(this.game!.getAvailableActionsAsHostForCurrentGame()).to.include(actionName);
});
