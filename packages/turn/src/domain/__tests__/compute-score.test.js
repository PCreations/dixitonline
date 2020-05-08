import { computeScore } from '../compute-score';
import { buildTestCard } from '../../__tests__/dataBuilders/card';

describe('compute score', () => {
  test('every player has found the storyteller card', () => {
    // arrange
    const storytellerId = 'p1';
    const card1 = {
      ...buildTestCard().build(),
      playerId: 'p1',
      votes: ['p2', 'p3'],
    };
    const card2 = {
      ...buildTestCard().build(),
      playerId: 'p2',
      votes: [],
    };
    const card3 = {
      ...buildTestCard().build(),
      playerId: 'p3',
      votes: [],
    };
    const board = [card1, card2, card3];

    // act
    const score = computeScore({ storytellerId, board });

    // assert
    expect(score).toEqual({
      p1: 0,
      p2: 2,
      p3: 2,
    });
  });
  test('none of the players have found the storyteller card', () => {
    // arrange
    const storytellerId = 'p1';
    const card1 = {
      ...buildTestCard().build(),
      playerId: 'p1',
      votes: [],
    };
    const card2 = {
      ...buildTestCard().build(),
      playerId: 'p2',
      votes: ['p1'],
    };
    const card3 = {
      ...buildTestCard().build(),
      playerId: 'p3',
      votes: ['p2'],
    };
    const board = [card1, card2, card3];

    // act
    const score = computeScore({ storytellerId, board });

    // assert
    expect(score).toEqual({
      p1: 0,
      p2: 3,
      p3: 3,
    });
  });
  test('at least one player has found the storyteller card but not all players and there is more than 3 players', () => {
    // arrange
    const storytellerId = 'p1';
    const card1 = {
      ...buildTestCard().build(),
      playerId: 'p1',
      votes: ['p2'],
    };
    const card2 = {
      ...buildTestCard().build(),
      playerId: 'p2',
      votes: ['p3'],
    };
    const card3 = {
      ...buildTestCard().build(),
      playerId: 'p3',
      votes: ['p4'],
    };
    const card4 = {
      ...buildTestCard().build(),
      playerId: 'p4',
      votes: [],
    };
    const board = [card1, card2, card3, card4];

    // act
    const score = computeScore({
      storytellerId,
      board,
    });

    // assert
    expect(score).toEqual({
      p1: 3,
      p2: 4,
      p3: 1,
      p4: 0,
    });
  });
  test('at least one player has found the storyteller card but not all players and there is only 3 players', () => {
    // arrange
    const storytellerId = 'p1';
    const card1 = {
      ...buildTestCard().build(),
      playerId: 'p1',
      votes: ['p2'],
    };
    const card2 = {
      ...buildTestCard().build(),
      playerId: 'p2',
      votes: ['p3'],
    };
    const card3 = {
      ...buildTestCard().build(),
      playerId: 'p3',
      votes: [],
    };
    const board = [card1, card2, card3];

    // act
    const score = computeScore({
      storytellerId,
      board,
    });

    // assert
    expect(score).toEqual({
      p1: 3,
      p2: 5,
      p3: 0,
    });
  });
});
