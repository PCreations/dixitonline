import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import * as reducer from '../reducer';
import { events } from '../events';
import { defineClue, choseCard, vote } from '../behaviors';
import { TurnError } from '../errors';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

const getTestPlayers = () => [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];

describe('behaviors', () => {
  describe('define clue', () => {
    it('returns the correct events when the storyteller correctly tries to define her clue', () => {
      // arrange
      const turnState = buildTestTurn().build();
      const { storytellerId } = turnState.turn;
      const storytellerHand = turnState.turn.handByPlayerId[storytellerId];
      const turnReducer = jest.spyOn(reducer, 'turnReducer');
      const expectedClueDefinedEvent = events.clueDefined({
        text: 'some clue text',
        cardId: storytellerHand[0].id,
      });

      // act
      const result = defineClue(turnState, {
        playerId: storytellerId,
        text: 'some clue text',
        cardId: storytellerHand[0].id,
      });

      // assert
      expect(result.events).toEqual([expectedClueDefinedEvent]);
      expect(turnReducer).toHaveBeenCalledWith(turnState, expectedClueDefinedEvent);
    });
    it('returns an error when the player is not the storyteller', () => {
      // arrange
      const players = getTestPlayers();
      const turnState = buildTestTurn()
        .withPlayers(players)
        .build();

      // act
      const result = defineClue(turnState, {
        playerId: players[2].id,
        text: 'some clue text',
        cardId: players[2].hand[0].id,
      });

      // assert
      expect(result.error).toEqual(TurnError.NOT_AUTHORIZED);
    });
  });
  describe('chosing a card', () => {
    // arrange
    const players = getTestPlayers();
    const turnState = buildTestTurn()
      .withPlayers(players)
      .inPlayersCardChoicePhase()
      .build();
    const activePlayer = players[1];
    const activePlayerHand = turnState.turn.handByPlayerId[activePlayer.id];
    const chosenCard = activePlayerHand[0];
    const turnReducer = jest.spyOn(reducer, 'turnReducer');
    const expectedPlayerCardChosenEvent = events.playerCardChosen({
      playerId: activePlayer.id,
      cardId: chosenCard.id,
    });

    // act
    const result = choseCard(turnState, {
      playerId: activePlayer.id,
      cardId: chosenCard.id,
    });

    // assert
    expect(result.events).toEqual([expectedPlayerCardChosenEvent]);
    expect(turnReducer).toHaveBeenCalledWith(turnState, expectedPlayerCardChosenEvent);
  });
  describe('vote', () => {
    test('voting on a card that is not the one owned by the active player', () => {
      // arrange
      const players = getTestPlayers();
      const turnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();
      const activePlayer = players[1];
      const storytellerCardOnBoard = turnState.turn.board.find(
        ({ playerId }) => playerId === turnState.turn.storytellerId
      );
      const turnReducer = jest.spyOn(reducer, 'turnReducer');
      const expectedPlayerVotedEvent = events.playerVoted({
        playerId: activePlayer.id,
        cardId: storytellerCardOnBoard.id,
      });

      // act
      const result = vote(turnState, {
        playerId: activePlayer.id,
        cardId: storytellerCardOnBoard.id,
      });

      // assert
      expect(result.events).toEqual([expectedPlayerVotedEvent]);
      expect(turnReducer).toHaveBeenCalledWith(turnState, expectedPlayerVotedEvent);
    });
    test('when the last player has voted, it should return a turnEnded event', () => {
      // arrange
      const players = getTestPlayers();
      const turnState = buildTestTurn()
        .withId('t1')
        .withGameId('g1')
        .withPlayers(players)
        .inPlayersVotingPhase()
        .withPlayerThatHavePlayed({ playerId: players[1].id, voteOnCardOwnedByPlayerId: players[0].id })
        .build();
      const activePlayer = players[2];
      const storytellerCardOnBoard = turnState.turn.board.find(
        ({ playerId }) => playerId === turnState.turn.storytellerId
      );
      const expectedTurnEndedEvent = events.turnEnded({
        id: 't1',
        storytellerId: players[0].id,
        playersWithHandAndScore: players.map(p => ({
          playerId: p.id,
          hand: p.hand.slice(1),
          score: 2,
        })),
        gameId: 'g1',
      });

      // act
      const result = vote(turnState, {
        playerId: activePlayer.id,
        cardId: storytellerCardOnBoard.id,
      });

      // assert
      expect(result.events).toContainEqual(expectedTurnEndedEvent);
    });
    test("can't vote for her own card", () => {
      // arrange
      const players = getTestPlayers();
      const turnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();
      const activePlayer = players[1];
      const activePlayerCardOnBoard = turnState.turn.board.find(({ playerId }) => playerId === activePlayer.id);
      // act
      const result = vote(turnState, {
        playerId: activePlayer.id,
        cardId: activePlayerCardOnBoard.id,
      });

      // assert
      expect(result.error).toEqual(TurnError.YOU_CANT_VOTE_FOR_YOUR_OWN_CARD);
    });
  });
});
