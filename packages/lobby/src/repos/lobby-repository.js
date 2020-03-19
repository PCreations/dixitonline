import { v1 as uuidv1 } from 'uuid';

export const makeLobbyRepository = ({ uuid = uuidv1, firestore = makeNullFirestore() } = {}) => {
  const lobbyGames = firestore.collection('lobby-games');
  return {
    getNextGameId() {
      return uuid();
    },
    createGame(game) {
      return lobbyGames.doc(game.id).set(game);
    },
    async getGameById(id) {
      const doc = await lobbyGames.doc(id).get();
      return doc.data();
    },
    getAllGames() {
      return lobbyGames.get().then(snapshot => {
        const games = [];
        snapshot.forEach(doc => games.push(doc.data()));
        return games;
      });
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
            set(game) {
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
