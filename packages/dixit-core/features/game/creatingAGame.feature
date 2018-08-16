Feature: Creating a game

  As Julien, a player
  I want to create a new game
  So that I can wait for people to join the game

  Background:
    Given I am logged as "Julien"

  Scenario: Creating a game
    When creating a new game
    Then the game should appear in the game's list with "Julien" as the unique player

  Scenario: Seeing a player joining the game
    When "Mathilde" joins the game
    Then "Mathilde" should appear in the player's list of this game

  Scenario: Having the possibility to start the game
    Given "Mathilde" joins the game
    And "Nicolas" joins the game
    When "Léa" joins the game
    Then I can see a "start game" action in the game's detail
