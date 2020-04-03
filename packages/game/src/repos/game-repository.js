import { v1 as uuidv1 } from 'uuid';
import { makeGame, GameStatus } from '../domain/game';

export class GameNotFoundError extends Error {
  constructor(gameId) {
    super();
    this.message = `Game ${gameId} not found`;
  }
}

export const makeGameRepository = ({ uuid = uuidv1, firestore = makeNullFirestore() } = {}) => {
  const lobbyGames = firestore.collection('lobby-games');
  return {
    getNextGameId() {
      return uuid();
    },
    saveGame(game) {
      return lobbyGames.doc(game.id).set(game);
    },
    async getGameById(id) {
      const doc = await lobbyGames.doc(id).get();
      if (!doc.exists) {
        throw new GameNotFoundError(id);
      }
      return makeGame(doc.data());
    },
    getAllGames() {
      return lobbyGames
        .where('status', '==', GameStatus.WAITING_FOR_PLAYERS)
        .get()
        .then(snapshot => {
          const games = [];
          snapshot.forEach(doc => games.push(makeGame(doc.data())));
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
  const gamesData = { ...gamesInitialData };
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
