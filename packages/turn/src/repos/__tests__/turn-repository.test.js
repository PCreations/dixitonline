import * as firebase from '@firebase/testing';
import { makeTurnRepository, makeNullTurnRepository } from '../turn-repository';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';

let firebaseApp;

describe('turnRepository', () => {
  beforeEach(() => {
    firebaseApp = firebase.initializeTestApp({
      projectId: `${Math.floor(Math.random() * new Date())}`,
    });
  });
  afterEach(() => {
    return Promise.all(firebase.apps().map(app => app.delete()));
  });
  it('can save a turn', async () => {
    // arrange
    const turnRepository = makeTurnRepository({ firestore: firebaseApp.firestore() });
    const expectedTurn = buildTestTurn().build();

    // act
    await turnRepository.saveTurn(expectedTurn);

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.id);
    expect(turn).toEqual(expectedTurn);
  });
  it('can get the next turn id', async () => {
    // arrange
    const turnRepository = makeTurnRepository({ firestore: firebaseApp.firestore() });

    // act
    const nextTurnId = turnRepository.getNextTurnId();

    // assert
    expect(typeof nextTurnId === 'string').toBe(true);
  });
});

describe('Null turnRepository', () => {
  it('creates a turn', async () => {
    // arrange
    const turnRepository = makeNullTurnRepository();
    const expectedTurn = buildTestTurn().build();

    // act
    await turnRepository.saveTurn(expectedTurn);

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.id);
    expect(turn).toEqual(expectedTurn);
  });
  it('can return the provided next id', () => {
    // arrange
    const turnRepository = makeNullTurnRepository({
      nextTurnId: 't1',
    });

    // act
    const nextTurnId = turnRepository.getNextTurnId();

    // assert
    expect(nextTurnId).toBe('t1');
  });
});
