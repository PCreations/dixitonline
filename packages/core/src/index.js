const { gameCommandHandlers } = require('./commandHandlers/gameCommandHandlers');
const { reduceToDixitState } = require('./domain/state');

const DixitCore = async ({
  loadAllGamesEvents,
  loadAllTurnsEventsForGameOfId,
  getNextGameId,
  dispatchEvents,
  saveEvents,
  consumeCommands,
  consumeEvents,
  getState,
  updateState,
}) => {
  const gamesEvents = await loadAllGamesEvents();
  await updateState(gamesEvents.reduce(reduceToDixitState, undefined));
  const commandHandlers = {
    ...gameCommandHandlers({ getNextGameId }),
  };
  consumeCommands(async command => {
    invariant(typeof commandHandlers[command.type] !== 'undefined', `invalid command ${command.type}`);
    const events = await commandHandlers[command.type](getState(), command);
    invariant(Array.isArray(events), 'events returned from a command handler must be an array');
    dispatchEvents(events);
    saveEvents(events);
  });
  consumeEvents(event => updateState(reduceToDixitState(getState(), event)));
};

module.exports = {
  DixitCore,
};
