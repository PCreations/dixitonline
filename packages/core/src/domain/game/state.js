const { Record, OrderedSet } = require('immutable');
const { events } = require('./events');

const MIN_PLAYERS_IN_A_GAME = 4;
const MAX_PLAYERS_IN_A_GAME = 6;

const DeckState = Record({
  cards: OrderedSet([]),
});

const DrawState = Record({
  cards: OrderedSet([]),
});

const GameState = Record({
  id: undefined,
  deck: DeckState(),
  draw: DrawState(),
  players: OrderedSet([]),
  isStarted: false,
});

const canPlayerJoinGame = ({ gameState = GameState(), playerId } = {}) =>
  gameState.players.size < MAX_PLAYERS_IN_A_GAME && !gameState.players.includes(playerId);

const canGameBeStarted = ({ gameState = GameState() } = {}) =>
  gameState.players.size >= MAX_PLAYERS_IN_A_GAME && !gameState.isStarted;

const Player = Record({
  id: undefined,
  name: undefined,
  hand: OrderedSet([]),
  points: 0,
});

const Turn = Record({
  id: undefined,
  storyteller: undefined,
  phase: undefined,
});

const reduceToDeck = event => (deckState = DeckState()) => {
  switch (event.type) {
    case events.types.DECK_SHUFFLED:
      return deckState.update('cards', () => OrderedSet(event.payload.cards));
  }
  return deckState;
};

const reduceToDraw = event => (drawState = DrawState()) => {
  switch (event.type) {
    case events.types.DRAW_PILE_CONSTITUTED:
      return drawState.update('cards', () => OrderedSet(event.payload.cards));
  }
  return drawState;
};

const reduceToGame = event => (gameState = GameState()) =>
  gameState.withMutations(state => {
    let _state = state.update('deck', reduceToDeck(event)).update('draw', reduceToDraw(event));
    switch (event.type) {
      case events.types.GAME_CREATED:
        return _state.set('id', event.payload.gameId);
      case events.types.GAME_STARTED:
        return _state.set('isStarted', true);
      case events.types.PLAYER_HAS_JOINED_A_GAME:
        return _state.update('players', players => players.add(event.payload.playerId));
      case events.types.PLAYERS_ORDER_DEFINED:
        return _state.update('players', () => OrderedSet(event.payload.players));
      default:
        return _state;
    }
  });

const reduceToPlayer = event => (playerState = Player()) => {
  switch (event.type) {
    case events.types.PLAYER_HAS_JOINED_A_GAME:
      return playerState.withMutations(player =>
        player.set('id', event.payload.playerId).set('name', event.payload.playerName),
      );
    default:
      return playerState;
  }
};

module.exports = {
  canGameBeStarted,
  canPlayerJoinGame,
  reduceToGame,
  reduceToPlayer,
};
