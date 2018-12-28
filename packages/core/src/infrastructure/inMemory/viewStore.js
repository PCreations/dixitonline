const { LobbyQuery, reduceToLobby } = require('../../queries/lobbyQuery');

const initViewStoreEvent = {
  type: '__INIT_VIEW_STORE__',
};

const ViewStore = ({ history = [], consumeEvents }) => {
  const inMemoryViewStore = {
    lobby: [initViewStoreEvent]
      .concat(history)
      .reduce(reduceToLobby, undefined)
      .toJS(),
  };
  const getLobby = LobbyQuery({
    consumeEvents,
    getLobby() {
      return inMemoryViewStore.lobby;
    },
  });
  return {
    getLobby,
  };
};

module.exports = {
  ViewStore,
};
