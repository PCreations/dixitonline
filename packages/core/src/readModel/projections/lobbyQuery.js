const { handledEvents, createLobbyReducer } = require('../reducers/lobby');

const lobbyReducer = createLobbyReducer();

const updateLobbyProjectionOnEvent = ({ getLobby, saveLobby, notifyLobyChanges }) => async event => {
  if (handledEvents.includes(event.type)) {
    const lobbyState = await getLobby();
    const updatedLobby = lobbyReducer(lobbyState, event);
    try {
      await saveLobby(updatedLobby);
      notifyLobyChanges(updatedLobby);
    } catch (e) {}
  }
};

