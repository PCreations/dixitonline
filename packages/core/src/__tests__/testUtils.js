const { EventEmitter } = require('events');
const { DixitCore } = require('../index');
const { sendCommand: createSendCommand } = require('../infrastructure/inMemory/sendCommand');
const { dispatchEvents: createDispatchEvents } = require('../infrastructure/inMemory/dispatchEvents');
const { consumeCommands: createConsumeCommands } = require('../infrastructure/inMemory/consumeCommands');
const { consumeEvents: createConsumeEvents } = require('../infrastructure/inMemory/consumeEvents');
const { consumeErrors: createConsumeErrors } = require('../infrastructure/inMemory/consumeErrors');
const { sendError: createSendError } = require('../infrastructure/inMemory/sendError');
const { EventStore } = require('../infrastructure/inMemory/eventStore');
const { ViewStore } = require('../infrastructure/inMemory/viewStore');

const getDixitCore = ({ history = [], getNextGameId, getAuthUser }) => {
  const eventEmitter = new EventEmitter();
  const sendCommand = createSendCommand(eventEmitter);
  const sendError = createSendError(eventEmitter);
  const dispatchEvents = createDispatchEvents(eventEmitter);
  const consumeCommands = createConsumeCommands(eventEmitter);
  const consumeErrors = createConsumeErrors(eventEmitter);
  const consumeEvents = createConsumeEvents(eventEmitter);
  const viewStore = ViewStore({ history, consumeEvents });
  const eventStore = EventStore(history);
  const run = DixitCore({
    getAuthUser,
    consumeCommands,
    dispatchEvents,
    getNextGameId,
    sendError,
    ...eventStore,
  });
  run();
  return {
    viewStore,
    sendCommand,
    consumeEvents,
    consumeErrors,
  };
};

module.exports = {
  getDixitCore,
};
