import * as firebase from '@firebase/testing';
import { makeLobbyRepository, makeNullLobbyRepository } from '../lobby-repository';

let firebaseApp;

describe('LobbyRepository', () => {
  beforeEach(() => {
    firebaseApp = firebase.initializeTestApp({
      projectId: `${Math.floor(Math.random() * new Date())}`,
    });
  });
  afterEach(() => {
    firebase.apps().map(app => app.delete());
  });
  it('gets the next game id string', () => {
    // arrange
    const lobbyRepository = makeLobbyRepository();

    // act
    const gameId = lobbyRepository.getNextGameId();

    // assert
    expect(typeof gameId).toBe('string');
  });
  it('can create a game', async () => {
    // arrange
    const lobbyRepository = makeLobbyRepository({ firestore: firebaseApp.firestore() });

    // act
    await lobbyRepository.createGame({ id: 'g1' });

    // assert
    const game = await lobbyRepository.getGameById('g1');
    expect(game).toEqual({ id: 'g1' });
  });
  it('can retrieves all games', async () => {
    // arrange
    const lobbyRepository = makeLobbyRepository({ firestore: firebaseApp.firestore() });
    await lobbyRepository.createGame({ id: 'g1' });
    await lobbyRepository.createGame({ id: 'g2' });

    // act
    const games = await lobbyRepository.getAllGames();

    // assert
    expect(games).toEqual([
      {
        id: 'g1',
      },
      {
        id: 'g2',
      },
    ]);
  });
});

describe('Null LobbyRepository', () => {
  it('provides hard coded next game id', () => {
    // arrange
    const lobbyRepository = makeNullLobbyRepository({ nextGameId: 'g1' });

    // act
    const gameId = lobbyRepository.getNextGameId();

    // assert
    expect(gameId).toBe('g1');
  });
  it('creates a game', async () => {
    // arrange
    const lobbyRepository = makeNullLobbyRepository({ nextGameId: 'g1' });

    // act
    await lobbyRepository.createGame({ id: 'g1' });
    const createdGame = await lobbyRepository.getGameById('g1');

    // assert
    expect(createdGame).toEqual({ id: 'g1' });
  });
  it('retrieves a provided game', async () => {
    // arrange
    const lobbyRepository = makeNullLobbyRepository({
      nextGameId: 'g3',
      gamesData: {
        g1: { id: 'g1' },
        g2: { id: 'g2' },
      },
    });

    // act
    const gameG1 = await lobbyRepository.getGameById('g1');
    const gameG2 = await lobbyRepository.getGameById('g2');

    // assert
    expect(gameG1).toEqual({ id: 'g1' });
    expect(gameG2).toEqual({ id: 'g2' });
  });
  it('retrieves all given games', async () => {
    // arrange
    const lobbyRepository = makeNullLobbyRepository({
      nextGameId: 'g3',
      gamesData: {
        g1: { id: 'g1' },
        g2: { id: 'g2' },
      },
    });

    // act
    const games = await lobbyRepository.getAllGames();

    // assert
    expect(games).toEqual([
      {
        id: 'g1',
      },
      {
        id: 'g2',
      },
    ]);
  });
});
