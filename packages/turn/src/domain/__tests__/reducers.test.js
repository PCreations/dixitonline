import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { turnReducer, TurnPhase } from '../reducers';
import { events } from '../events';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';

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
];

describe('turnReducer (root)', () => {
  it('returns correct default state', () => {
    // act
    const state = turnReducer();

    // assert
    expect(state).toEqual({
      turn: {
        id: null,
        storytellerId: null,
        phase: TurnPhase.STORYTELLER,
        clue: {
          text: '',
          cardId: null,
        },
        board: [],
        handByPlayerId: {},
      },
      playerById: {},
    });
  });

  test('turnStarted event', () => {
    // arrange
    const players = getTestPlayers();
    const turnStarted = events.turnStarted({
      id: 't1',
      storytellerId: players[0].id,
      players,
    });

    // act
    const state = turnReducer(undefined, turnStarted);

    // assert
    expect(state).toEqual({
      turn: {
        id: 't1',
        storytellerId: 'p1',
        phase: TurnPhase.STORYTELLER,
        clue: {
          text: '',
          cardId: null,
        },
        board: [],
        handByPlayerId: {
          p1: players[0].hand,
          p2: players[1].hand,
          p3: players[2].hand,
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
    test("clueDefined event should not be handled if the card is not one of the storytelle's ones", () => {
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
  });
});
