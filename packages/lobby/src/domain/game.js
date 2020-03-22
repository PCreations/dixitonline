/* eslint-disable max-classes-per-file */
import { newGameCreatedEvent, playerJoinedGame, newGameStartedEvent } from './events';
import { equals as playerEquals } from './player';
import { makeResult, makeErrorResult } from './result';

export class GameAlreadyJoinedByPlayerError extends Error {}
export class MaximumNumberOfPlayerReachedError extends Error {}
export class OnlyHostCanStartGameError extends Error {}
export class NotEnoughPlayersError extends Error {}

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

export const getAllPlayers = game => [game.host, ...game.players];

const isGameFull = game => getAllPlayers(game).length === MAXIMUM_NUMBER_OF_PLAYERS;

export const createGame = ({ gameId, host }) =>
  makeResult(makeGame({ id: gameId, host }), [newGameCreatedEvent({ gameId })]);

export const joinPlayer = (game, player) => {
  if (getAllPlayers(game).some(playerEquals.bind(null, player)))
    return makeErrorResult(new GameAlreadyJoinedByPlayerError());
  if (isGameFull(game)) return makeErrorResult(new MaximumNumberOfPlayerReachedError());
  return makeResult(makeGame({ ...game, players: game.players.concat(player) }), [
    playerJoinedGame({ gameId: game.id, playerId: player.id }),
  ]);
};

export const startGame = (game, player) => {
  if (playerEquals(game.host, player)) {
    return makeResult(game.id, [
      newGameStartedEvent({ gameId: game.id, playerIds: getAllPlayers(game).map(({ id }) => id) }),
    ]);
  }
  return makeErrorResult(new OnlyHostCanStartGameError());
};
