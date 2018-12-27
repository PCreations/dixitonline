const invariant = require('invariant');
const { gameCommandHandlers } = require('./commandHandlers/gameCommandHandlers');

const DixitCore = ({
  getAuthUser,
  getGameOfId,
  getNextGameId,
  dispatchEvents,
  saveEvents,
  consumeCommands,
}) => () => {
  const commandHandlers = {
    ...gameCommandHandlers({ getAuthUser, getGameOfId, getNextGameId }),
  };
  consumeCommands(async command => {
    invariant(typeof command.payload !== 'undefined', `missing payload in command ${command.type}`);
    invariant(typeof commandHandlers[command.type] !== 'undefined', `invalid command ${command.type}`);
    const authUser = await getAuthUser();
    invariant(typeof authUser !== 'undefined', 'unauthenticated commands are not allowed');
    const events = await commandHandlers[command.type](command, authUser);
    invariant(Array.isArray(events), 'events returned from a command handler must be an array');
    dispatchEvents(events);
    saveEvents(events);
  });
};

module.exports = {
  DixitCore,
};
