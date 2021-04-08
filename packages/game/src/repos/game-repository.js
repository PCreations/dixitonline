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
        where(field, _, value) {
          return {
            async get() {
              let docs;
              if (name === 'lobby-games') {
                docs = Object.values(gamesData)
                  .filter(Boolean)
                  .filter(game => game[field] === value)
                  .map(game => ({
                    data() {
                      return game;
                    },
                  }));
              } else {
                docs = Object.values(playersHeartbeatsData)
                  .filter(Boolean)
                  .filter(playerHeartbeat => playerHeartbeat[field] === value)
                  .map(playerHeartbeat => ({
                    data() {
                      return playerHeartbeat;
                    },
                  }));
              }
              return {
                forEach: cb => docs.forEach(cb),
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
      };
    },
  };
};
