"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeNullLobbyRepository = exports.makeLobbyRepository = exports.GameNotFoundError = void 0;

var _uuid = require("uuid");

var _game = require("../domain/game");

class GameNotFoundError extends Error {
  constructor(gameId) {
    super();
    this.message = `Game ${gameId} not found`;
  }

}

exports.GameNotFoundError = GameNotFoundError;

const makeLobbyRepository = ({
  uuid = _uuid.v1,
  firestore = makeNullFirestore()
} = {}) => {
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

      return (0, _game.makeGame)(doc.data());
    },

    getAllGames() {
      return lobbyGames.get().then(snapshot => {
        const games = [];
        snapshot.forEach(doc => games.push((0, _game.makeGame)(doc.data())));
        return games;
      });
    },

    deleteGameById(gameId) {
      return lobbyGames.doc(gameId).delete();
    }

  };
};

exports.makeLobbyRepository = makeLobbyRepository;

const makeNullLobbyRepository = ({
  nextGameId,
  gamesData
}) => makeLobbyRepository({
  uuid: nullUuid(nextGameId),
  firestore: makeNullFirestore(gamesData)
});

exports.makeNullLobbyRepository = makeNullLobbyRepository;

const nullUuid = expectedUuid => () => expectedUuid;

const makeNullFirestore = (gamesInitialData = {}) => {
  const gamesData = { ...gamesInitialData
  };
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

                exists: typeof gamesData[gameId] !== 'undefined'
              };
            },

            async set(game) {
              gamesData[gameId] = game;
            },

            delete() {
              gamesData[gameId] = undefined;
            }

          };
        },

        async get() {
          const docs = Object.values(gamesData).filter(Boolean).map(game => ({
            data() {
              return game;
            }

          }));
          return {
            forEach: docs.forEach.bind(docs)
          };
        }

      };
    }

  };
};