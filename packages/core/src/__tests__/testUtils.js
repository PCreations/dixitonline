const shuffleSeed = require('shuffle-seed');
const { EventEmitter } = require('events');
const { DixitCore } = require('../index');
const { sendCommand: createSendCommand } = require('../infrastructure/inMemory/sendCommand');
const { dispatchEvents: createDispatchEvents } = require('../infrastructure/inMemory/dispatchEvents');
const { consumeCommands: createConsumeCommands } = require('../infrastructure/inMemory/consumeCommands');
const { consumeEvents: createConsumeEvents } = require('../infrastructure/inMemory/consumeEvents');
const { consumeErrors: createConsumeErrors } = require('../infrastructure/inMemory/consumeErrors');
const { sendError: createSendError } = require('../infrastructure/inMemory/sendError');
const { EventStore } = require('../infrastructure/inMemory/eventStore');
const { PlayerStore } = require('../infrastructure/inMemory/playerStore');
const { ViewStore } = require('../infrastructure/inMemory/viewStore');
const { GameProcessManager } = require('../processes/gameProcessManager');

const shuffle = toShuffle => shuffleSeed.shuffle(toShuffle, 'dixit-test');

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
  const playerStore = PlayerStore({
    player41: { id: 'player41', name: 'player 41' },
    player42: { id: 'player42', name: 'player 42' },
    player43: { id: 'player43', name: 'player 43' },
    player44: { id: 'player44', name: 'player 44' },
    player45: { id: 'player45', name: 'player 45' },
    player46: { id: 'player46', name: 'player 46' },
  });
  GameProcessManager({ getGameOfId: eventStore.getGameOfId, consumeEvents, sendCommand });
  const run = DixitCore({
    getAuthUser,
    consumeCommands,
    dispatchEvents,
    getNextGameId,
    sendError,
    shuffle,
    ...eventStore,
    ...playerStore,
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
  shuffle,
};
