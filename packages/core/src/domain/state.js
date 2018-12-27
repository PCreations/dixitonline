const { Record, Map } = require('immutable');
const { reduceToGame, reduceToPlayers } = require('./game/state');
const {
  events: { types: gameEventTypes },
} = require('./game/events');

const DixitState = Record({
  games: Map({}),
  players: Map({}),
});

const reduceToGames = (games = Map({}), event) => {
  if (event && event.payload && event.payload.gameId) {
    return games.update(event.payload.gameId, reduceToGame(event));
  }
  return games;
};

const reduceToPlayers = (players = Map({}), event) => {
  switch (event.type) {
    case gameEventTypes.PLAYER_HAS_JOINED_A_GAME:
      return players.update(event.payload.playerId, reduceToPlayer(event));
    default:
      return players;
  }
};

const reduceToDixitState = (dixitState = DixitState(), event) =>
  dixitState.withMutations(state =>
    state.update('games', reduceToGames(event)).update('players', reduceToPlayers(event)),
  );

const selectGames = (state = DixitState()) => state.games;

const selectNotStartedGame = (state = DixitState()) => selectGames(state).filter(game => !game.isStarted);

const selectPlayers = (state = DixitState()) => state.players;

const selectGameOfId = (state = DixitState(), gameId) => state.getIn(['games', gameId]);

const selectPlayerOfId = (state = DixitState(), playerId) => state.getIn(['players', playerId]);

module.exports = {
  reduceToDixitState,
  selectGames,
  selectNotStartedGame,
  selectPlayers,
  selectGameOfId,
  selectPlayerOfId,
};
