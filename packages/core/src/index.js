const invariant = require('invariant');
const { gameCommandHandlers } = require('./commandHandlers/gameCommandHandlers');

const addCorrelationAndCausationIds = command => event => ({
  ...event,
  meta: {
    ...event.meta,
    correlationId: command.meta.correlationId,
    causationId: command.meta.causationId,
  },
});

const DixitCore = ({
  getAuthUser,
  getGameOfId,
  getPlayerOfId,
  getNextGameId,
  dispatchEvents,
  saveEvents,
  consumeCommands,
  sendError,
  shuffle,
}) => () => {
  const commandHandlers = {
    ...gameCommandHandlers({ getAuthUser, getGameOfId, getPlayerOfId, getNextGameId, shuffle }),
  };
  consumeCommands(async command => {
    const addCommandCorrelationAndCausationIdToEvent = addCorrelationAndCausationIds(command);
    try {
      invariant(typeof command.payload !== 'undefined', `missing payload in command ${command.type}`);
      invariant(typeof commandHandlers[command.type] !== 'undefined', `invalid command ${command.type}`);
      const authUser = await getAuthUser();
      invariant(typeof authUser !== 'undefined', 'unauthenticated commands are not allowed');
      const events = (await commandHandlers[command.type](command, authUser)).map(
        addCommandCorrelationAndCausationIdToEvent,
      );
      invariant(Array.isArray(events), 'events returned from a command handler must be an array');
      dispatchEvents(events);
      saveEvents(events);
    } catch (e) {
      sendError({
        error: e,
        correlationId: command.meta.correlationId,
      });
    }
  });
};

module.exports = {
  DixitCore,
};
