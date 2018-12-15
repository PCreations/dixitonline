const { Record, OrderedSet, Map } = require('immutable');

const GameState = Record({
  id: undefined,
  deck: undefined,
  players: [],
  status: undefined,
});
