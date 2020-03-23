import * as firebase from '@firebase/testing';
import { makeGameRepository, makeNullGameRepository, GameNotFoundError } from '../game-repository';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildgameRepositoryInitialGames } from '../../__tests__/dataBuilders/game-repository-initial-games';

let firebaseApp;

describe('gameRepository', () => {
  beforeEach(() => {
    firebaseApp = firebase.initializeTestApp({
      projectId: `${Math.floor(Math.random() * new Date())}`,
    });
  });
  afterEach(() => {
    return Promise.all(firebase.apps().map(app => app.delete()));
  });
  it('gets the next game id string', () => {
    // arrange
    const gameRepository = makeGameRepository();

    // act
    const gameId = gameRepository.getNextGameId();

    // assert
    expect(typeof gameId).toBe('string');
  });
  it('can create a game', async () => {
    // arrange
    const gameRepository = makeGameRepository({ firestore: firebaseApp.firestore() });
    const expectedGame = buildTestGame()
      .withId('g1')
      .build();

    // act
    await gameRepository.saveGame(expectedGame);

    // assert
    const game = await gameRepository.getGameById('g1');
    expect(game).toEqual(expectedGame);
  });
  it('can retrieves all games', async () => {
    // arrange
    const gameRepository = makeGameRepository({ firestore: firebaseApp.firestore() });
    const game1 = buildTestGame()
      .withId('g1')
      .build();
    const game2 = buildTestGame()
      .withId('g2')
      .build();
    await gameRepository.saveGame(game1);
    await gameRepository.saveGame(game2);

    // act
    const games = await gameRepository.getAllGames();

    // assert
    expect(games).toEqual([game1, game2]);
  });
  it('can delete a game', async () => {
    // arrange
    const gameRepository = makeGameRepository({ firestore: firebaseApp.firestore() });
    const game1 = buildTestGame()
      .withId('g1')
      .build();
    const game2 = buildTestGame()
      .withId('g2')
      .build();
    await gameRepository.saveGame(game1);
    await gameRepository.saveGame(game2);

    // act
    await gameRepository.deleteGameById(game1.id);
    const games = await gameRepository.getAllGames();

    // assert
    expect(games).toEqual([game2]);
  });
  it('throws a GameNotFoundError if game was not found', async () => {
    // arrange
    const gameRepository = makeGameRepository({
      firestore: firebaseApp.firestore(),
    });

    // act & assert
    expect.assertions(1);
    await expect(gameRepository.getGameById('nonExistingId')).rejects.toEqual(new GameNotFoundError('nonExistingId'));
  });
});

describe('Null gameRepository', () => {
  it('provides hard coded next game id', () => {
    // arrange
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });

    // act
    const gameId = gameRepository.getNextGameId();

    // assert
    expect(gameId).toBe('g1');
  });
  it('creates a game', async () => {
    // arrange
    const gameRepository = makeNullGameRepository({ nextGameId: 'g1' });
    const game = buildTestGame()
      .withId('g1')
      .build();

    // act
    await gameRepository.saveGame(game);
    const createdGame = await gameRepository.getGameById('g1');

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
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game1, game2])
      .build();
    const gameRepository = makeNullGameRepository({
      nextGameId: 'g3',
      gamesData: initialGames,
    });

    // act
    const gameG1 = await gameRepository.getGameById('g1');
    const gameG2 = await gameRepository.getGameById('g2');

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
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game1, game2])
      .build();
    const gameRepository = makeNullGameRepository({
      nextGameId: 'g3',
      gamesData: initialGames,
    });

    // act
    const games = await gameRepository.getAllGames();

    // assert
    expect(games).toEqual([game1, game2]);
  });
  it('can delete a game', async () => {
    // arrange
    const game1 = buildTestGame()
      .withId('g1')
      .build();
    const game2 = buildTestGame()
      .withId('g2')
      .build();
    const initialGames = buildgameRepositoryInitialGames()
      .withGames([game1, game2])
      .build();
    const gameRepository = makeNullGameRepository({
      nextGameId: 'g3',
      gamesData: initialGames,
    });

    // act
    await gameRepository.deleteGameById(game1.id);
    const games = await gameRepository.getAllGames();

    // assert
    expect(games).toEqual([game2]);
  });
});
