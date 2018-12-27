const uuid = require('uuid/v1');
const { EventEmitter } = require('events');
const { DixitCore } = require('../index');
const { reduceToDixitState } = require('../domain/state');

describe('Feature: creating a game', () => {
  describe('given the authenticated user being user42', () => {
    describe('and the lobby being empty', () => {
      describe('when user42 creates a new game', () => {
        test("then the lobby should contain the created game with user42 in player's list", () => {
          const eventEmitter = new EventEmitter();
          const sendCommand = command => eventEmitter.emit('command', command);
          const dispatchEvents = events => events.map(event => eventEmitter.emit('event', event));
          const consumeCommands = onCommand => eventEmitter.addListener('command', onCommand);
          const consumeEvents = onEvent => eventEmitter.addListener('event', onEvent);
          const getNextGameId = uuid;
          const inMemoryEventStore = [];
          let inMemoryState;
          const saveEvents = events => inMemoryEventStore.concat([events]);
          const dixitCore = DixitCore({
            consumeCommands,
            consumeEvents,
            dispatchEvents,
            saveEvents,
            getNextGameId,
            getState: () => inMemoryState,
            updateState: state => {
              inMemoryState = state;
            },
          });
          sendCommand(gameCommands.createGameCommand());
        });
      });
    });
  });
});
