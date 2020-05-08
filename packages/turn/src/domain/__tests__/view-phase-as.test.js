import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { TurnPhase } from '../reducer';
import { viewPhaseAs } from '../view-phase-as';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

const getTestPlayers = () => [
  buildTestPlayer()
    .withId('p1')
    .withName('player1')
    .build(),
  buildTestPlayer()
    .withId('p2')
    .withName('player2')
    .build(),
  buildTestPlayer()
    .withId('p3')
    .withName('player3')
    .build(),
  buildTestPlayer()
    .withId('p4')
    .withName('player4')
    .build(),
];

describe('view phase as', () => {
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
          {
            id: 'p4',
            name: 'player4',
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
          {
            id: 'p4',
            name: 'player4',
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
          {
            id: 'p4',
            name: 'player4',
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
          {
            id: 'p4',
            name: 'player4',
            readyForNextPhase: false,
          },
        ],
      });
    });
  });
  describe('players voting phase', () => {
    test('view as storyteller', () => {
      // arrange
      const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[0].id, shuffle);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.PLAYERS_VOTING,
        clue: initialState.turn.clue.text,
        storytellerId: 'p1',
        board: shuffle(initialState.turn.board.map(({ id, url }) => ({ id, url }))),
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
          {
            id: 'p4',
            name: 'player4',
            readyForNextPhase: false,
          },
        ],
      });
    });
    test('view as a player when someone has played', () => {
      // arrange
      const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
      const players = getTestPlayers();
      const initialState = buildTestTurn()
        .withPlayers(players)
        .inPlayersVotingPhase()
        .withPlayerThatHavePlayed({ playerId: players[1].id, voteOnCardOwnedByPlayerId: players[2].id })
        .build();

      // act
      const phase = viewPhaseAs(initialState, players[1].id, shuffle);

      // assert
      expect(phase).toEqual({
        id: initialState.turn.id,
        type: TurnPhase.PLAYERS_VOTING,
        clue: initialState.turn.clue.text,
        storytellerId: 'p1',
        board: shuffle(
          initialState.turn.board
            .filter(({ playerId }) => playerId !== players[1].id)
            .map(({ id, url }) => ({ id, url }))
        ),
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
          {
            id: 'p4',
            name: 'player4',
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
          {
            id: 'p4',
            name: 'player4',
            readyForNextPhase: true,
            score: initialState.turn.score.p4,
          },
        ],
      });
    });
  });
});
