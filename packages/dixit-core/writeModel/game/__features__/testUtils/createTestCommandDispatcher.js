const { withParams } = require('dixit-utils');
const { type: JOIN_GAME } = require('../../domain/game/commands/joinGame');

const createTestCommandDispatcher = withParams(['writeModel'], ({ writeModel }) => async command => {
  const handlers = {
    [JOIN_GAME]: writeModel.gameUseCases.joinGame,
  };
  await handlers[command.type](command.payload);
});

module.exports = {
  createTestCommandDispatcher,
};
