/* eslint-disable max-classes-per-file */
import { playerJoinedGame } from './events';
import { equals as playerEquals } from './player';

export class GameAlreadyJoinedByPlayerError extends Error {}
export class MaximumNumberOfPlayerReachedError extends Error {}

export const MAXIMUM_NUMBER_OF_PLAYERS = 6;

export const makeGame = ({ id, host, players = [] } = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');

  return Object.freeze({
    id,
    host,
    players,
  });
};

const getAllPlayers = game => [game.host, ...game.players];

const isGameFull = game => getAllPlayers(game).length === MAXIMUM_NUMBER_OF_PLAYERS;

export const joinPlayer = (game, player) => {
  if (getAllPlayers(game).some(playerEquals.bind(null, player))) throw new GameAlreadyJoinedByPlayerError();
  if (isGameFull(game)) throw new MaximumNumberOfPlayerReachedError();
  return [
    makeGame({ ...game, players: game.players.concat(player) }),
    [playerJoinedGame({ gameId: game.id, playerId: player.id })],
  ];
};
