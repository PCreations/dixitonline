import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { turnReducer, TurnPhase } from '../reducer';
import { events } from '../events';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { computeScore } from '../compute-score';

jest.mock('../compute-score');

const getTestPlayers = () => [
  {
    id: 'p1',
    name: 'player1',
    hand: buildTestHand().build(),
  },
  {
    id: 'p2',
    name: 'player2',
    hand: buildTestHand().build(),
  },
  {
    id: 'p3',
    name: 'player3',
    hand: buildTestHand().build(),
  },
  {
    id: 'p4',
    name: 'player4',
    hand: buildTestHand().build(),
  },
];

describe('turnReducer (root)', () => {
  it('returns correct default state', () => {
    // act
    const state = turnReducer();

    // assert
    expect(state).toEqual({
      turn: {
        id: null,
        gameId: null,
        storytellerId: null,
        phase: TurnPhase.STORYTELLER,
        clue: {
          text: '',
          cardId: null,
        },
        board: [],
        handByPlayerId: {},
        score: {},
      },
      playerById: {},
    });
  });

  test('turnStarted event', () => {
    // arrange
    const players = getTestPlayers();
    const turnStarted = events.turnStarted({
      id: 't1',
      gameId: 'g1',
      storytellerId: players[0].id,
      players,
    });

    // act
    const state = turnReducer(undefined, turnStarted);

    // assert
    expect(state).toEqual({
      turn: {
        id: 't1',
        gameId: 'g1',
        storytellerId: 'p1',
        phase: TurnPhase.STORYTELLER,
        clue: {
          text: '',
          cardId: null,
        },
        board: [],
        score: {},
        handByPlayerId: {
          p1: players[0].hand,
          p2: players[1].hand,
          p3: players[2].hand,
          p4: players[3].hand,
        },
      },
      playerById: {
        p1: {
          id: 'p1',
          name: 'player1',
        },
        p2: {
          id: 'p2',
          name: 'player2',
        },
        p3: {
          id: 'p3',
          name: 'player3',
        },
        p4: {
          id: 'p4',
          name: 'player4',
        },
      },
    });
  });

  describe('storyteller phase', () => {
    test('clueDefined event', () => {
      // arrange
      const players = getTestPlayers();
      const turn = buildTestTurn()
        .withPlayers(players)
        .build();
      const clueDefined = events.clueDefined({ text: 'some clue', cardId: players[0].hand[0].id });

      // act
      const state = turnReducer(turn, clueDefined);

      // assert
      expect(state.turn.clue).toEqual({
        text: 'some clue',
        cardId: players[0].hand[0].id,
      });
      expect(state.turn.phase).toEqual(TurnPhase.PLAYERS_CARD_CHOICE);
    });
    test("clueDefined event should not be handled if the card is not one of the storyteller's ones", () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .build();
      const clueDefined = events.clueDefined({ text: 'some clue', cardId: players[1].hand[0].id });

      // act
      const state = turnReducer(initialTurnState, clueDefined);

      // assert
      expect(state.turn.clue).toEqual(initialTurnState.turn.clue);
      expect(state.turn.phase).toEqual(TurnPhase.STORYTELLER);
    });
  });

  describe('players card choice phase', () => {
    test('playerCardChosen', () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .build();
      const activePlayer = players[1];
      const chosenCard = activePlayer.hand[0];
      const playerCardChosen = events.playerCardChosen({
        playerId: activePlayer.id,
        cardId: chosenCard.id,
      });

      // act
      const state = turnReducer(initialTurnState, playerCardChosen);

      // assert
      expect(state.turn.board).toContainEqual({
        ...chosenCard,
        playerId: activePlayer.id,
        votes: [],
      });
      expect(state.turn.handByPlayerId[activePlayer.id]).not.toContainEqual(chosenCard);
    });
    test('playerCardChosen event should not be handled if the player does not own the card', () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .build();
      const activePlayer = players[2];
      const playerCardChosen = events.playerCardChosen({
        playerId: activePlayer.id,
        cardId: players[1].hand[0].id,
      });

      // act
      const state = turnReducer(initialTurnState, playerCardChosen);

      // assert
      expect(initialTurnState.turn.board).toEqual(state.turn.board);
      expect(initialTurnState.turn.handByPlayerId).toEqual(state.turn.handByPlayerId);
    });
    test('playerCardChosen event should not be handled if the player is the storyteller', () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .build();
      const activePlayer = players[0];
      const playerCardChosen = events.playerCardChosen({
        playerId: activePlayer.id,
        cardId: players[0].hand[0].id,
      });

      // act
      const state = turnReducer(initialTurnState, playerCardChosen);

      // assert
      expect(initialTurnState.turn.board).toEqual(state.turn.board);
      expect(initialTurnState.turn.handByPlayerId).toEqual(state.turn.handByPlayerId);
    });
    test('phase should be set to players voting phase when the last player has chosen her card and the storyteller card should be added to the board', () => {
      // arrange
      const players = getTestPlayers();
      const player1CardChosen = events.playerCardChosen({
        playerId: players[1].id,
        cardId: players[1].hand[0].id,
      });
      const player2CardChosen = events.playerCardChosen({
        playerId: players[2].id,
        cardId: players[2].hand[0].id,
      });
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .withHistory([player1CardChosen, player2CardChosen])
        .build();
      const player3CardChosen = events.playerCardChosen({
        playerId: players[3].id,
        cardId: players[3].hand[0].id,
      });

      // act
      const state = turnReducer(initialTurnState, player3CardChosen);

      // assert
      expect(state.turn.board).toEqual([
        {
          ...players[1].hand[0],
          playerId: players[1].id,
          votes: [],
        },
        {
          ...players[2].hand[0],
          playerId: players[2].id,
          votes: [],
        },
        {
          ...players[3].hand[0],
          playerId: players[3].id,
          votes: [],
        },
        {
          ...players[0].hand[0],
          playerId: players[0].id,
          votes: [],
        },
      ]);
      expect(state.turn.handByPlayerId[players[0].id]).not.toContainEqual(players[0].hand[0]);
      expect(state.turn.phase).toEqual(TurnPhase.PLAYERS_VOTING);
    });
    test('phase should not be set to players voting phase when the last player has chosen her card and there is 3 players', () => {
      // arrange
      const players = getTestPlayers().slice(0, 3);
      const player1CardChosen = events.playerCardChosen({
        playerId: players[1].id,
        cardId: players[1].hand[0].id,
      });
      const player2CardChosen = events.playerCardChosen({
        playerId: players[2].id,
        cardId: players[2].hand[0].id,
      });
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .withHistory([player1CardChosen])
        .build();

      // act
      const state = turnReducer(initialTurnState, player2CardChosen);

      // assert
      expect(state.turn.phase).toEqual(TurnPhase.PLAYERS_CARD_CHOICE);
    });
    test('when there is 3 players, the phase should be set to players voting phase when the last player has chosen her second card and the storyteller card should be added to the board', () => {
      // arrange
      const players = getTestPlayers().slice(0, 3);
      const player1Card1Chosen = events.playerCardChosen({
        playerId: players[1].id,
        cardId: players[1].hand[0].id,
      });
      const player1Card2Chosen = events.playerCardChosen({
        playerId: players[1].id,
        cardId: players[1].hand[1].id,
      });
      const player2Card1Chosen = events.playerCardChosen({
        playerId: players[2].id,
        cardId: players[2].hand[0].id,
      });
      const player2Card2Chosen = events.playerCardChosen({
        playerId: players[2].id,
        cardId: players[2].hand[1].id,
      });
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .withHistory([player1Card1Chosen, player1Card2Chosen, player2Card1Chosen])
        .build();

      // act
      const state = turnReducer(initialTurnState, player2Card2Chosen);

      // assert
      expect(state.turn.board).toEqual([
        {
          ...players[1].hand[0],
          playerId: players[1].id,
          votes: [],
        },
        {
          ...players[1].hand[1],
          playerId: players[1].id,
          votes: [],
        },
        {
          ...players[2].hand[0],
          playerId: players[2].id,
          votes: [],
        },
        {
          ...players[2].hand[1],
          playerId: players[2].id,
          votes: [],
        },
        {
          ...players[0].hand[0],
          playerId: players[0].id,
          votes: [],
        },
      ]);
      expect(state.turn.phase).toEqual(TurnPhase.PLAYERS_VOTING);
    });
  });

  describe('players voting phase', () => {
    test('playerVoted', () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();
      const activePlayer = players[1];
      const playerVoted = events.playerVoted({ playerId: activePlayer.id, cardId: initialTurnState.turn.board[1].id });

      // act
      const state = turnReducer(initialTurnState, playerVoted);

      // assert
      expect(state.turn.board[1]).toEqual({
        ...initialTurnState.turn.board[1],
        votes: [activePlayer.id],
      });
    });
    test('playerVoted should not be handled if player tries to vote for her own card', () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();
      const activePlayer = players[1];
      const playerVoted = events.playerVoted({ playerId: activePlayer.id, cardId: initialTurnState.turn.board[0].id });

      // act
      const state = turnReducer(initialTurnState, playerVoted);

      // assert
      expect(initialTurnState.turn.board).toEqual(state.turn.board);
    });
    test('playerVoted should not be handled if player is the storyteller', () => {
      // arrange
      const players = getTestPlayers();
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();
      const activePlayer = players[0];
      const playerVoted = events.playerVoted({ playerId: activePlayer.id, cardId: initialTurnState.turn.board[0].id });

      // act
      const state = turnReducer(initialTurnState, playerVoted);

      // assert
      expect(initialTurnState.turn.board).toEqual(state.turn.board);
    });
    test('playerVoted should not be handled if player has already voted', () => {
      // arrange
      const players = getTestPlayers();
      const activePlayer = players[1];
      const initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .withPlayerThatHavePlayed({
          playerId: activePlayer.id,
          voteOnCardOwnedByPlayerId: players[0].id,
        })
        .build();
      const playerVoted = events.playerVoted({
        playerId: activePlayer.id,
        cardId: initialTurnState.turn.board[3].id,
      });

      // act
      const state = turnReducer(initialTurnState, playerVoted);

      // assert
      expect(initialTurnState.turn.board).toEqual(state.turn.board);
    });
    test('playerVoted should lead to score computation when the last player has voted', () => {
      // arrange
      const players = getTestPlayers();
      let initialTurnState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();
      const player1Voted = events.playerVoted({ playerId: players[1].id, cardId: initialTurnState.turn.board[1].id });
      const player2Voted = events.playerVoted({ playerId: players[2].id, cardId: initialTurnState.turn.board[0].id });
      const player3Voted = events.playerVoted({ playerId: players[3].id, cardId: initialTurnState.turn.board[0].id });
      initialTurnState = turnReducer(turnReducer(initialTurnState, player1Voted), player2Voted);

      // act
      const state = turnReducer(initialTurnState, player3Voted);

      // assert
      expect(computeScore).toHaveBeenCalledWith({
        storytellerId: state.turn.storytellerId,
        board: state.turn.board,
      });
      expect(state.score).toEqual(
        computeScore({
          storytellerId: state.turn.storytellerId,
          board: state.turn.board,
        })
      );
      expect(state.turn.phase).toEqual(TurnPhase.SCORING);
    });
  });
});
