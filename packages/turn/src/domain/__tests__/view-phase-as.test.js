import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { TurnPhase } from '../reducer';
import { viewPhaseAs } from '../view-phase-as';

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

describe.only('view phase as', () => {
  describe('storyteller phase', () => {
    test('view as storyteller', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[0].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.STORYTELLER,
        storytellerId: 'p1',
        hand: players[0].hand,
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: false,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: true,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: true,
          },
        ],
      });
    });
    test('view as an other player', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[1].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.STORYTELLER,
        hand: players[1].hand,
        storytellerId: 'p1',
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: false,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: true,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: true,
          },
        ],
      });
    });
  });
  describe('players card choice phase', () => {
    test('view as storyteller', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[0].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.PLAYERS_CARD_CHOICE,
        clue: initialState.turn.clue.text,
        hand: players[0].hand,
        storytellerId: 'p1',
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: true,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: false,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: false,
          },
        ],
      });
    });
    test('view as a player when someone has played', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inPlayersCardChoicePhase()
        .withPlayerThatHavePlayed(players[1])
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[1].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.PLAYERS_CARD_CHOICE,
        clue: initialState.turn.clue.text,
        storytellerId: 'p1',
        hand: initialState.turn.handByPlayerId[players[1].id],
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: true,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: true,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: false,
          },
        ],
      });
    });
  });
  describe('players voting phase', () => {
    test('view as storyteller', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[0].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.PLAYERS_VOTING,
        clue: initialState.turn.clue.text,
        storytellerId: 'p1',
        board: initialState.turn.board.map(({ id, url }) => ({ id, url })),
        hand: initialState.turn.handByPlayerId[players[0].id],
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: true,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: false,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: false,
          },
        ],
      });
    });
    test('view as a player when someone has played', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .withPlayerThatHavePlayed({ playerId: players[1].id, voteOnCardOwnedByPlayerId: players[2].id })
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[1].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.PLAYERS_VOTING,
        clue: initialState.turn.clue.text,
        storytellerId: 'p1',
        board: initialState.turn.board.map(({ id, url }) => ({ id, url })),
        hand: initialState.turn.handByPlayerId[players[1].id],
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: true,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: true,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: false,
          },
        ],
      });
    });
  });
  describe('scoring phase', () => {
    test('for anyone', () => {
      // arrange
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inScoringPhase()
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[1].id);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.SCORING,
        clue: initialState.turn.clue.text,
        storytellerId: 'p1',
        board: initialState.turn.board.map(({ votes, ...boardRest }) => ({
          ...boardRest,
          votes: votes.map(playerId => ({
            id: playerId,
            name: initialState.playerById[playerId].name,
          })),
        })),
        hand: initialState.turn.handByPlayerId[players[1].id],
        players: [
          {
            id: 'p1',
            name: 'player1',
            readyForNextPhase: true,
            score: initialState.turn.score.p1,
          },
          {
            id: 'p2',
            name: 'player2',
            readyForNextPhase: true,
            score: initialState.turn.score.p2,
          },
          {
            id: 'p3',
            name: 'player3',
            readyForNextPhase: true,
            score: initialState.turn.score.p3,
          },
        ],
      });
    });
  });
});
