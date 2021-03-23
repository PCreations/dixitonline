import shortid from 'shortid';
import { makeGame, GameStatus } from '../domain/game';

export class GameNotFoundError extends Error {
  constructor(gameId) {
    super();
    this.message = `Game ${gameId} not found`;
  }
}

/* eslint-disable no-underscore-dangle */
const convertFirestoreDateToDate = (firestoreDate = { _seconds: +new Date() }) => new Date(firestoreDate._seconds);

const convertDateToFirestoreDate = (date = new Date()) => ({
  _seconds: +date,
  _nanoseconds: 709000000,
});

const convertGameDataToFirestoreGame = game => ({
  ...game,
  host: {
    ...game.host,
    heartbeat: convertDateToFirestoreDate(game.host.heartbeat),
  },
  players: game.players.map(p => ({
    ...p,
    heartbeat: convertDateToFirestoreDate(p.heartbeat),
  })),
});

const convertFirestoreGameToGameData = firestoreGame => ({
  ...firestoreGame,
  host: {
    ...firestoreGame.host,
    heartbeat: convertFirestoreDateToDate(firestoreGame.host.heartbeat),
  },
  players: firestoreGame.players.map(p => ({
    ...p,
    heartbeat: convertFirestoreDateToDate(p.heartbeat),
  })),
});

export const makeGameRepository = ({ uuid = shortid, firestore = makeNullFirestore() } = {}) => {
  const lobbyGames = firestore.collection('lobby-games');
  return {
    getNextGameId() {
      return uuid();
    },
    saveGame(game) {
      return lobbyGames.doc(game.id).set(convertGameDataToFirestoreGame(game));
    },
    async getGameById(id) {
      const doc = await lobbyGames.doc(id).get();
      if (!doc.exists) {
        throw new GameNotFoundError(id);
      }
      return makeGame(convertFirestoreGameToGameData(doc.data()));
    },
    getAllGames() {
      return lobbyGames
        .where('status', '==', GameStatus.WAITING_FOR_PLAYERS)
        .get()
        .then(snapshot => {
          const games = [];
          snapshot.forEach(doc => games.push(makeGame(convertFirestoreGameToGameData(doc.data()))));
          return games;
        });
    },
    deleteGameById(gameId) {
      return lobbyGames.doc(gameId).delete();
    },
  };
};

export const makeNullGameRepository = ({ nextGameId, gamesData }) =>
  makeGameRepository({ uuid: nullUuid(nextGameId), firestore: makeNullFirestore(gamesData) });

const nullUuid = expectedUuid => () => expectedUuid;

const makeNullFirestore = (gamesInitialData = {}) => {
  const gamesData = Object.fromEntries(
    Object.entries(gamesInitialData).map(([gameId, game]) => [gameId, convertGameDataToFirestoreGame(game)])
  );

  return {
    collection() {
      return {
        where(field, _, value) {
          return {
            async get() {
              const docs = Object.values(gamesData)
                .filter(Boolean)
                .filter(game => game[field] === value)
                .map(game => ({
                  data() {
                    return game;
                  },
                }));
              return {
                forEach: docs.forEach.bind(docs),
              };
            },
          };
        },
        doc(gameId) {
          return {
            get() {
              return {
                data() {
                  return gamesData[gameId];
                },
                exists: typeof gamesData[gameId] !== 'undefined',
              };
            },
            async set(game) {
              gamesData[gameId] = game;
            },
            delete() {
              gamesData[gameId] = undefined;
            },
          };
        },
      };
    },
  };
};
