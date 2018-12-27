const { LobbyQuery, reduceToLobby } = require('../../queries/lobbyQuery');

const ViewStore = ({ history = [], consumeEvents }) => {
  const inMemoryViewStore = {
    lobby: history.reduce(reduceToLobby, undefined).toJS(),
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
