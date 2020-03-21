import { playerJoinedGame } from './events';

export const makeGame = ({ id, host, players = [] } = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');

  return Object.freeze({
    id,
    host,
    players,
  });
};

export const joinPlayer = (game, player) => [
  makeGame({ ...game, players: game.players.concat(player) }),
  [playerJoinedGame({ gameId: game.id, playerId: player.id })],
];
