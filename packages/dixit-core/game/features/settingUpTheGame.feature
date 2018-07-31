Feature: Setting up the game

  As a game's host
  I want the game to be setup (card and player's order)
  So that the storyteller phase can start

  Background:
    Given I have created a game
    And the game is not started yet

  Scenario: setting the players order
    Given there are 6 players
    When the game starts
    Then the players order can be retrieved

  Scenario Outline: distributing the cards
    Given a game's deck composed of 84 cards
    And there are <playersCount> players
    When the game starts
    Then each player should have received 6 cards
    And the draw pile should contain <drawCardsCount> cards

    Examples:
      | playersCount | drawCardsCount |
      | 4            | 60             |
      | 5            | 54             |
      | 6            | 48             |