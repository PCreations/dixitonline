/* eslint-disable max-classes-per-file */
import {
  newGameCreatedEvent,
  playerJoinedGame,
  newGameStartedEvent,
  handsCompletedEvent,
  gameEndedEvent,
} from './events';
import { equals as playerEquals } from './player';
import { makeResult, makeErrorResult } from './result';

export const GameStatus = {
  WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
  STARTED: 'STARTED',
  ENDED: 'ENDED',
};

export const GameError = {
  GAME_ALREADY_JOINED: 'GAME_ALREADY_JOINED',
  MAXIMUM_NUMBER_OF_PLAYERS_REACHED: 'MAXIMUM_NUMBER_OF_PLAYERS_REACHED',
  ONLY_HOST_CAN_START_GAME: 'ONLY_HOST_CAN_START_GAME',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
};

export const MAXIMUM_NUMBER_OF_PLAYERS = 6;
export const MINIMUM_NUMBER_OF_PLAYERS = 3;

export const makeGame = ({
  id,
  host,
  cards = [],
  score = {},
  players = [],
  status = GameStatus.WAITING_FOR_PLAYERS,
} = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');

  return Object.freeze({
    id,
    host,
    players,
    cards,
    score,
    status,
  });
};

export const getAllPlayers = game => [game.host, ...game.players];

const isGameFull = game => getAllPlayers(game).length === MAXIMUM_NUMBER_OF_PLAYERS;

export const createGame = ({ gameId, host }) =>
  makeResult(makeGame({ id: gameId, host }), [newGameCreatedEvent({ gameId })]);

export const joinPlayer = (game, player) => {
  if (getAllPlayers(game).some(playerEquals.bind(null, player))) return makeErrorResult(GameError.GAME_ALREADY_JOINED);
  if (isGameFull(game)) return makeErrorResult(GameError.MAXIMUM_NUMBER_OF_PLAYERS_REACHED);
  return makeResult(makeGame({ ...game, players: game.players.concat(player) }), [
    playerJoinedGame({ gameId: game.id, playerId: player.id }),
  ]);
};

export const startGame = (game, player) => {
  if (getAllPlayers(game).length < MINIMUM_NUMBER_OF_PLAYERS) {
    return makeErrorResult(GameError.NOT_ENOUGH_PLAYERS);
  }
  if (playerEquals(game.host, player)) {
    return makeResult(
      makeGame({
        ...game,
        status: GameStatus.STARTED,
      }),
      [newGameStartedEvent({ gameId: game.id, playerIds: getAllPlayers(game).map(({ id }) => id) })]
    );
  }
  return makeErrorResult(GameError.ONLY_HOST_CAN_START_GAME);
};

export const completeHands = (game, { cards, actualHandsByPlayerId }) => {
  const allPlayers = getAllPlayers(game);
  const actualCards = cards || game.cards;
  if (!actualHandsByPlayerId) {
    const handsByPlayerId = allPlayers.reduce(
      (hands, player, playerIndex) => ({
        ...hands,
        [player.id]: actualCards.slice(playerIndex * 6, playerIndex * 6 + 6),
      }),
      {}
    );
    const remainingCards = actualCards.slice(allPlayers.length * 6);
    return makeResult(
      makeGame({
        ...game,
        cards: remainingCards,
      }),
      [handsCompletedEvent({ gameId: game.id, handsByPlayerId })]
    );
  }
  if (actualCards.length < allPlayers.length * 6) {
    return makeResult(
      makeGame({
        ...game,
        status: GameStatus.ENDED,
      }),
      [gameEndedEvent({ gameId: game.id })]
    );
  }
  const handsByPlayerId = Object.entries(actualHandsByPlayerId).reduce(
    (completedHands, [playerId, hand], playerIndex) => ({
      ...completedHands,
      [playerId]: hand.concat(actualCards[playerIndex]),
    }),
    {}
  );
  return makeResult(
    makeGame({
      ...game,
      cards: actualCards.slice(allPlayers.length),
    }),
    [handsCompletedEvent({ gameId: game.id, handsByPlayerId })]
  );
};
