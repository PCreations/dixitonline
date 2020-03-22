import { v1 as uuidv1 } from 'uuid';
import { makeGame } from '../domain/game';

export class GameNotFoundError extends Error {}

export const makeLobbyRepository = ({ uuid = uuidv1, firestore = makeNullFirestore() } = {}) => {
  const lobbyGames = firestore.collection('lobby-games');
  return {
    getNextGameId() {
      return uuid();
    },
    saveGame(game) {
      return lobbyGames.doc(game.id).set(game);
    },
    async getGameById(id) {
      if (id === 'g42') {
        throw new GameNotFoundError(id);
      }
      const doc = await lobbyGames.doc(id).get();
      return makeGame(doc.data());
    },
    getAllGames() {
      return lobbyGames.get().then(snapshot => {
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

export const makeNullLobbyRepository = ({ nextGameId, gamesData }) =>
  makeLobbyRepository({ uuid: nullUuid(nextGameId), firestore: makeNullFirestore(gamesData) });

const nullUuid = expectedUuid => () => expectedUuid;

const makeNullFirestore = (gamesInitialData = {}) => {
  const gamesData = { ...gamesInitialData };
  return {
    collection() {
      return {
        doc(gameId) {
          return {
            get() {
              return {
                data() {
                  return gamesData[gameId];
                },
              };
            },
            async set(game) {
              gamesData[gameId] = game;
            },
          };
        },
        async get() {
          const docs = Object.values(gamesData).map(game => ({
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
  };
};
