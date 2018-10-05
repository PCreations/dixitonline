const { is } = require('immutable');
const { scan, distinctUntilChanged, map, tap } = require('rxjs/operators');
const { type: GAME_CREATED } = require('../writeModel/game/domain/game/events/gameCreated');
const { type: PLAYER_JOINED_GAME } = require('../writeModel/game/domain/game/events/playerJoinedGame');
const { createLobby, addGameToLobby, addPlayerInGame, toJS } = require('./domain/lobby');

const ReadModel = async ({ events$, projectionStore }) => {
  const eventHandlers = {
    [GAME_CREATED](lobby, event) {
      return addGameToLobby(lobby, {
        gameId: event.payload.gameId,
        playerId: event.payload.playerId,
        username: event.payload.username,
      });
    },
    [PLAYER_JOINED_GAME](lobby, event) {
      return addPlayerInGame(lobby, {
        gameId: event.payload.gameId,
        playerId: event.payload.playerId,
        username: event.payload.username,
      });
    },
  };
  const lobbyReducer = (lobby, event) =>
    typeof eventHandlers[event.type] === 'undefined'
      ? createLobby(lobby)
      : eventHandlers[event.type](createLobby(lobby), event);

  events$
    .pipe(
      scan(lobbyReducer, createLobby()),
      distinctUntilChanged(is),
      map(toJS),
      tap(lobby => {
        debugger;
      }),
      map(lobby => ({
        gamesList: Object.values(lobby.games),
      })),
    )
    .subscribe({
      next: projectionStore.lobby.save,
    });
};

module.exports = {
  ReadModel,
};
