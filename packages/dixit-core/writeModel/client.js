const { withParams } = require('dixit-utils');
const { JoinGame } = require('./game/domain/game/commands/joinGame');

const Client = withParams(['projectionStore', 'dispatchCommand'], ({ projectionStore, dispatchCommand }) => ({
  commands: {
    joinGame: withParams(['gameId', 'playerId'], async ({ gameId, playerId }) => {
      await dispatchCommand(JoinGame({ gameId, playerId }));
    }),
  },
  projections: {
    lobby$: projectionStore.lobby.$,
  },
}));

module.exports = {
  Client,
};
