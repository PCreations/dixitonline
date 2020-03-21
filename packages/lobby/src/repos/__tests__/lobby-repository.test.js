import * as firebase from '@firebase/testing';
import { makeLobbyRepository, makeNullLobbyRepository } from '../lobby-repository';
import { buildTestGame } from '../../__tests__/dataBuilders/game';

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
    const expectedGame = buildTestGame()
      .withId('g1')
      .build();

    // act
    await lobbyRepository.createGame(expectedGame);

    // assert
    const game = await lobbyRepository.getGameById('g1');
    expect(game).toEqual(expectedGame);
  });
  it('can retrieves all games', async () => {
    // arrange
    const lobbyRepository = makeLobbyRepository({ firestore: firebaseApp.firestore() });
    const game1 = buildTestGame()
      .withId('g1')
      .build();
    const game2 = buildTestGame()
      .withId('g2')
      .build();
    await lobbyRepository.createGame(game1);
    await lobbyRepository.createGame(game2);

    // act
    const games = await lobbyRepository.getAllGames();

    // assert
    expect(games).toEqual([game1, game2]);
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
    const game = buildTestGame()
      .withId('g1')
      .build();

    // act
    await lobbyRepository.createGame(game);
    const createdGame = await lobbyRepository.getGameById('g1');

    // assert
    expect(createdGame).toEqual(game);
  });
  it('retrieves a provided game', async () => {
    // arrange
    const game1 = buildTestGame()
      .withId('g1')
      .build();
    const game2 = buildTestGame()
      .withId('g2')
      .build();
    const initialGames = {
      g1: game1,
      g2: game2,
    };
    const lobbyRepository = makeNullLobbyRepository({
      nextGameId: 'g3',
      gamesData: initialGames,
    });

    // act
    const gameG1 = await lobbyRepository.getGameById('g1');
    const gameG2 = await lobbyRepository.getGameById('g2');

    // assert
    expect(gameG1).toEqual(game1);
    expect(gameG2).toEqual(game2);
  });
  it('retrieves all given games', async () => {
    // arrange
    const game1 = buildTestGame()
      .withId('g1')
      .build();
    const game2 = buildTestGame()
      .withId('g2')
      .build();
    const initialGames = {
      g1: game1,
      g2: game2,
    };
    const lobbyRepository = makeNullLobbyRepository({
      nextGameId: 'g3',
      gamesData: initialGames,
    });

    // act
    const games = await lobbyRepository.getAllGames();

    // assert
    expect(games).toEqual([game1, game2]);
  });
});
