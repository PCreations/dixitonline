/* eslint-disable no-await-in-loop */
import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import { events } from '../../domain/events';
import { makeTurnRepository, makeNullTurnRepository, TurnNotFoundError } from '../turn-repository';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';

let firebaseApp;

describe.skip('turnRepository', () => {
  beforeEach(() => {
    firebaseApp = firebase.initializeTestApp({
      projectId: `${Math.floor(Math.random() * new Date())}`,
    });
  });
  afterEach(() => {
    return Promise.all(firebase.apps().map(app => app.delete()));
  });
  it('can save a turn from a list of events', async () => {
    // arrange
    expect.assertions(1);
    const players = [
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
    const turnRepository = makeTurnRepository({
      firestore: firebaseApp.firestore(),
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp,
    });
    const expectedTurn = buildTestTurn()
      .withId('t1')
      .withGameId('g1')
      .withPlayers(players)
      .inScoringPhase();
    const expectedTurnState = expectedTurn.build();
    const history = expectedTurn.getHistory(); //?

    // act
    // simulates multiple save spaced in time
    for (let i = 0; i < history.length; i += 1) {
      await turnRepository.saveTurn('t1', [history[i]]);
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // assert
    const turn = await turnRepository.getTurnById('t1');
    expect(turn).toEqual(expectedTurnState);
  });
  it('can get the next turn id', async () => {
    // arrange
    const turnRepository = makeTurnRepository({ firestore: firebaseApp.firestore() });

    // act
    const nextTurnId = turnRepository.getNextTurnId();

    // assert
    expect(typeof nextTurnId === 'string').toBe(true);
  });
  it('throws a TurnNotFoundError if game was not found', async () => {
    // arrange
    const turnRepository = makeTurnRepository({ firestore: firebaseApp.firestore() });

    // act & assert
    expect.assertions(1);
    await expect(turnRepository.getTurnById('nonExistingId')).rejects.toEqual(new TurnNotFoundError('nonExistingId'));
  });
});

describe('Null turnRepository', () => {
  it('creates a turn', async () => {
    // arrange
    const players = [
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
    const turnStarted = events.turnStarted({
      id: 't1',
      gameId: 'g1',
      storytellerId: players[0].id,
      players,
    });
    const turnRepository = makeNullTurnRepository();
    const expectedTurn = buildTestTurn()
      .withId('t1')
      .withGameId('g1')
      .withPlayers(players)
      .build();

    // act
    await turnRepository.saveTurn('t1', [turnStarted]);

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.turn.id);
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
  it('can be filled with turn history data', async () => {
    // arrange
    const players = [
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
    const turnStarted = events.turnStarted({
      id: 't1',
      gameId: 'g1',
      storytellerId: players[0].id,
      players,
    });
    const expectedTurn = buildTestTurn()
      .withId('t1')
      .withGameId('g1')
      .withPlayers(players)
      .build();
    const turnRepository = makeNullTurnRepository({
      initialHistory: {
        t1: [turnStarted],
      },
    });

    // act
    const turn = await turnRepository.getTurnById('t1');

    // assert
    expect(turn).toEqual(expectedTurn);
  });
});
