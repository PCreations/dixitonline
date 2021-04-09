import shortid from 'shortid';
import { makeGame, GameStatus, PLAYER_INACTIVE_AFTER_X_SECONDS } from '../domain/game';

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
  host: game.host ? game.host : {},
});

const convertFirestoreGameToGameData = firestoreGame => ({
  ...firestoreGame,
  host: firestoreGame.host ? firestoreGame.host : undefined,
});

export const makeGameRepository = ({ uuid = shortid, firestore = makeNullFirestore() } = {}) => {
  const lobbyGames = firestore.collection('lobby-games');
  const playersHeartbeatsCollection = firestore.collection('players-heartbeats');
  return {
    getNextGameId() {
      return uuid();
    },
    getPlayerHeartbeat({ playerId, gameId }) {
      return playersHeartbeatsCollection
        .doc(`${gameId}-${playerId}`)
        .get()
        .then(snp => ({
          playerId: snp.data().playerId,
          gameId: snp.data().gameId,
          heartbeat: convertFirestoreDateToDate(snp.data().heartbeat),
        }));
    },
    savePlayerHeartbeat({ playerId, gameId, heartbeat }) {
      return playersHeartbeatsCollection.doc(`${gameId}-${playerId}`).set({
        playerId,
        gameId,
        heartbeat: convertDateToFirestoreDate(heartbeat),
      });
    },
    deleteInactivePlayersHeartbeat({ now }) {
      const inactiveAfterMs = PLAYER_INACTIVE_AFTER_X_SECONDS * 1000;
      const considerInactiveAfterDate = new Date(+now - inactiveAfterMs);
      return playersHeartbeatsCollection.get().then(snp => {
        const heartbeatsToDelete = [];
        snp.forEach(doc => {
          if (convertFirestoreDateToDate(doc.data().heartbeat) <= considerInactiveAfterDate) {
            heartbeatsToDelete.push(doc.ref);
          }
        });
        return Promise.all(heartbeatsToDelete.map(ref => ref.delete()));
      });
    },
    getGamePlayersHeartbeats(gameId) {
      return playersHeartbeatsCollection
        .where('gameId', '==', gameId)
        .get()
        .then(snp => {
          const players = [];
          snp.forEach(doc =>
            players.push({
              ...doc.data(),
              heartbeat: convertFirestoreDateToDate(doc.data().heartbeat),
            })
          );
          return players;
        });
    },
    saveGame(game) {
      return lobbyGames.doc(game.id).set(convertGameDataToFirestoreGame(game));
    },
    async getGameById(id) {
      const doc = await lobbyGames.doc(id).get();
      if (!doc.exists) {
        throw new GameNotFoundError(id);
      }
      const game = makeGame(convertFirestoreGameToGameData(doc.data()));
      console.log('retrieved game', JSON.stringify(game, null, 2));
      return game;
    },
    getPublicGamesWaitingForPlayers() {
      return lobbyGames
        .where('status', '==', GameStatus.WAITING_FOR_PLAYERS)
        .where('isPrivate', '==', false)
        .get()
        .then(snapshot => {
          const games = [];
          snapshot.forEach(doc => games.push(makeGame(convertFirestoreGameToGameData(doc.data()))));
          return games;
        });
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
    getLobbyInfos() {
      return Promise.all([
        lobbyGames
          .where('status', '==', GameStatus.WAITING_FOR_PLAYERS)
          .where('isPrivate', '==', false)
          .get()
          .then(snp => snp.size),
        playersHeartbeatsCollection.get().then(snp => snp.size),
      ]).then(([waitingGames, connectedPlayers]) => {
        return {
          waitingGames,
          connectedPlayers,
        };
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
  const playersHeartbeatsData = Object.fromEntries(
    Object.values(gamesData).flatMap(gameData =>
      [gameData.host, ...gameData.players].filter(Boolean).map(player => [
        `${gameData.id}-${player.id}`,
        {
          gameId: gameData.id,
          playerId: player.id,
          heartbeat: convertDateToFirestoreDate(player.heartbeat),
        },
      ])
    )
  );
  return {
    collection(name) {
      return {
        where(field, operator, value) {
          let docs;
          return {
            async get() {
              if (name === 'lobby-games') {
                docs = Object.values(gamesData)
                  .filter(Boolean)
                  .filter(game => {
                    if (operator === '==') {
                      return game[field] === value;
                    }
                    return value.some(val => game[field] === val);
                  })
                  .map(game => ({
                    data() {
                      return game;
                    },
                  }));
              } else {
                docs = Object.values(playersHeartbeatsData)
                  .filter(Boolean)
                  .filter(playerHeartbeat => {
                    return playerHeartbeat[field] === value;
                  })
                  .map(playerHeartbeat => ({
                    data() {
                      return playerHeartbeat;
                    },
                  }));
              }
              return {
                forEach: cb => docs.forEach(cb),
                size: docs.length,
              };
            },
            where(field2, _, value2) {
              return {
                async get() {
                  docs = Object.values(gamesData)
                    .filter(Boolean)
                    .filter(game => {
                      return game[field] === value && game[field2] === value2;
                    })
                    .map(game => ({
                      data() {
                        return game;
                      },
                    }));

                  return {
                    forEach: cb => docs.forEach(cb),
                    size: docs.length,
                  };
                },
              };
            },
          };
        },
        doc(id) {
          if (name === 'lobby-games') {
            return {
              get() {
                return {
                  data() {
                    return gamesData[id];
                  },
                  exists: typeof gamesData[id] !== 'undefined',
                };
              },
              async set(game) {
                gamesData[id] = game;
              },
              delete() {
                gamesData[id] = undefined;
              },
            };
          }
          return {
            async get() {
              return {
                data() {
                  return playersHeartbeatsData[id];
                },
                exists: typeof playersHeartbeatsData[id] !== 'undefined',
              };
            },
            async set(game) {
              playersHeartbeatsData[id] = game;
            },
          };
        },
        async get() {
          const docs = Object.values(playersHeartbeatsData)
            .filter(Boolean)
            .map(playerHeartbeat => ({
              data() {
                return playerHeartbeat;
              },
              ref: {
                async delete() {
                  delete playersHeartbeatsData[`${playerHeartbeat.gameId}-${playerHeartbeat.playerId}`];
                },
              },
            }));
          return {
            size: Object.keys(playersHeartbeatsData).length,
            forEach: cb => docs.forEach(cb),
          };
        },
      };
    },
  };
};
