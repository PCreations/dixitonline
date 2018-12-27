const { createLobbySelector } = require('./createLobbySelector');

const createSelectors = createSelector => ({
  selectLobby: createLobbySelector(createSelector),
});

module.exports = {
  createSelectors,
};
