const { EventEmitter } = require('events');
const { DixitCore } = require('../index');
const { sendCommand: createSendCommand } = require('../infrastructure/inMemory/sendCommand');
const { dispatchEvents: createDispatchEvents } = require('../infrastructure/inMemory/dispatchEvents');
const { consumeCommands: createConsumeCommands } = require('../infrastructure/inMemory/consumeCommands');
const { consumeEvents: createConsumeEvents } = require('../infrastructure/inMemory/consumeEvents');
const { EventStore } = require('../infrastructure/inMemory/eventStore');
const { ViewStore } = require('../infrastructure/inMemory/viewStore');

const getDixitCore = ({ history = [], getNextGameId, getAuthUser }) => {
  const eventEmitter = new EventEmitter();
  const sendCommand = createSendCommand(eventEmitter);
  const dispatchEvents = createDispatchEvents(eventEmitter);
  const consumeCommands = createConsumeCommands(eventEmitter);
  const consumeEvents = createConsumeEvents(eventEmitter);
  const viewStore = ViewStore({ history, consumeEvents });
  const eventStore = EventStore(history);
  const run = DixitCore({
    getAuthUser,
    consumeCommands,
    dispatchEvents,
    getNextGameId,
    ...eventStore,
  });
  run();
  return {
    viewStore,
    sendCommand,
    consumeEvents,
  };
};

module.exports = {
  getDixitCore,
};
