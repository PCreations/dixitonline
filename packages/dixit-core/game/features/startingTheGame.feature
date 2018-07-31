Feature: Starting the game

  As Julien, the game's host
  I want the be able to start the game once enough player has joined
  So that the storyteller phase can start

  Rules
  -----
  * a deck is composed of 84 cards
  * a player's order is defined by her order of arrival in the game
  * 6 cards are distributed to each player, the other cards thus making the draw pile
  * a minimum of 4 players is required to start the game (the 3-player variant is not supported)
  * a maximum of 6 players is allowed

  Background:
    Given a game created by Julien

  Scenario: trying to start the game with not enough players
    Given "Mathilde and Nicolas" have joined the game
    When Julien starts the game
    Then the game should emit an error with "NOT_ENOUGH_PLAYERS" as title

  Scenario Outline: starting the game with enough players
    Given <players> have joined the game
    When Julien starts the game
    Then <players> should receive 6 cards
    And the draw pile should contain <drawPileCardsCount> cards

    Examples:
      | players                               | drawPileCardsCount |
      | "Mathilde, Nicolas, Léa"              | 60                 |
      | "Mathilde, Nicolas, Léa, Tom"         | 54                 |
      | "Mathilde, Nicolas, Léa, Tom, Pierre" | 48                 |