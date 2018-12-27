const { getGameOfId } = require('../../domain/game/getGameOfId');

const stateReducer = (state, event) => {
  switch (event.meta.aggregateName) {
    case 'game':
      return {
        ...state,
        games: {
          ...state.games,
          [event.meta.aggregateId]: (state.games[event.meta.aggregateId] || []).concat([event]),
        },
      };
    default:
      return state;
  }
};

const initialState = {
  games: {},
};

const EventStore = (history = []) => {
  let state = history.reduce(stateReducer, initialState);
  return {
    async saveEvents(events) {
      state = events.reduce(stateReducer, state);
    },
    getGameOfId: getGameOfId(gameId => state.games[gameId]),
  };
};

module.exports = {
  EventStore,
};
