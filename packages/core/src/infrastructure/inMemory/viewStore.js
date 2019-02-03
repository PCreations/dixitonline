const { LobbyQuery, reduceToLobby } = require('../../queries/lobbyQuery');
const { GameInfoQuery, reduceToGameInfo, GameInfo } = require('../../queries/gameInfoQuery');

const initViewStoreEvent = {
  type: '__INIT_VIEW_STORE__',
  payload: {},
};

const ViewStore = ({ history = [], consumeEvents }) => {
  const inMemoryViewStore = {
    lobby: [initViewStoreEvent]
      .concat(history)
      .reduce(reduceToLobby, undefined)
      .toJS(),
    gamesInfo: [initViewStoreEvent].concat(history).reduce(
      (gamesInfo, event) =>
        typeof event.payload.gameId !== 'undefined'
          ? {
              ...gamesInfo,
              [event.payload.gameId]: reduceToGameInfo(
                GameInfo({ gameId: event.payload.gameId }),
                event,
              ).toJS(),
            }
          : {},
      {},
    ),
  };
  const getLobby = LobbyQuery({
    consumeEvents,
    getStoredLobbyView() {
      return inMemoryViewStore.lobby;
    },
  });
  const getGameInfo = GameInfoQuery({
    consumeEvents,
    getStoredGameInfoView(gameId) {
      return inMemoryViewStore.gamesInfo[gameId];
    },
  });
  return {
    getLobby,
    getGameInfo,
  };
};

module.exports = {
  ViewStore,
};
