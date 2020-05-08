/* eslint-disable max-classes-per-file */
import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import {
  newGameCreatedEvent,
  playerJoinedGame,
  newGameStartedEvent,
  handsCompletedEvent,
  gameEndedEvent,
} from './events';
import { getEndingConditionStrategy } from './end-condition-strategies';
import { equals as playerEquals } from './player';
import { makeGameResult as baseMakeGameResult, makeErrorResult } from './game-result';

const defaultShuffle = toShuffle => shuffleWithSeed(toShuffle, 'default-seed');

export const DEFAULT_END_CONDITION = {
  isGameEnded: false,
};

export const CARDS_NOT_DEALT_YET = null;

export const GameStatus = {
  WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
  STARTED: 'STARTED',
  ENDED: 'ENDED',
};

export const GameError = {
  GAME_ALREADY_JOINED: 'GAME_ALREADY_JOINED',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  MAXIMUM_NUMBER_OF_PLAYERS_REACHED: 'MAXIMUM_NUMBER_OF_PLAYERS_REACHED',
  ONLY_HOST_CAN_START_GAME: 'ONLY_HOST_CAN_START_GAME',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
  X_TIMES_STORYTELLER_CANT_BE_LESS_THAN_ONE: 'X_TIMES_STORYTELLER_CANT_BE_LESS_THAN_ONE',
  SCORE_LIMIT_CANT_BE_LESS_THAN_ONE: 'SCORE_LIMIT_CANT_BE_LESS_THAN_ONE',
};

export const MAXIMUM_NUMBER_OF_PLAYERS = 6;
export const MINIMUM_NUMBER_OF_PLAYERS = 3;
export const NUMBER_OF_CARDS_IN_A_DECK = 84;
export const NUMBER_OF_CARDS_BY_HAND = 6;

export const makeNullCards = () => ({
  isNullCards: true,
  length: 0,
});

export const makeGame = ({
  id,
  host,
  cards = makeNullCards(),
  drawPile = [],
  score = {},
  players = [],
  status = GameStatus.WAITING_FOR_PLAYERS,
  currentTurn = { id: null, storytellerId: null, number: 0 },
  endCondition = DEFAULT_END_CONDITION,
} = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');
  if (
    typeof endCondition.xTimesStorytellerLimit === 'undefined' &&
    typeof endCondition.scoreLimit === 'undefined' &&
    typeof endCondition.isGameEnded === 'undefined'
  )
    throw new Error(`Invalid end condition, received "${endCondition}"`);

  console.log(`creating a game with ${cards.length} cards`);

  return Object.freeze({
    id,
    host,
    players,
    cards,
    drawPile,
    endCondition,
    score,
    status,
    currentTurn,
  });
};

const haveCardsNotBeenDealtYet = game => game.cards.isNullCards;

const applyEndingConditionStrategy = ({ value: game, events }) => {
  if (haveCardsNotBeenDealtYet(game)) return { value: game, events };
  const endingCondition = getEndingConditionStrategy(game);
  const { isGameEnded } = endingCondition(game);
  if (isGameEnded)
    return {
      value: makeGame({ ...game, status: GameStatus.ENDED }),
      events: events.concat(gameEndedEvent({ gameId: game.id })),
    };
  return { value: game, events };
};

const makeGameResult = (game, events = []) => applyEndingConditionStrategy(baseMakeGameResult(game, events));

export const getNumberOfCardsByHand = game =>
  getAllPlayers(game).length === 3 ? NUMBER_OF_CARDS_BY_HAND + 1 : NUMBER_OF_CARDS_BY_HAND;

export const getAllPlayers = game => [game.host, ...game.players];

export const getEndCondition = game => {
  const allPlayersLength = getAllPlayers(game).length;
  if (typeof game.endCondition.xTimesStorytellerLimit !== 'undefined') {
    return {
      remainingTurns: allPlayersLength * game.endCondition.xTimesStorytellerLimit - game.currentTurn.number,
    };
  }
  if (typeof game.endCondition.scoreLimit !== 'undefined') {
    return {
      scoreLimit: game.endCondition.scoreLimit,
    };
  }
  return {
    remainingTurns: Math.floor(game.cards.length / allPlayersLength),
  };
};

const isGameFull = game => getAllPlayers(game).length === MAXIMUM_NUMBER_OF_PLAYERS;

export const createGame = ({ gameId, host, endCondition }) => {
  if (endCondition?.xTimesStorytellerLimit !== undefined && endCondition.xTimesStorytellerLimit < 1) {
    return makeErrorResult(GameError.X_TIMES_STORYTELLER_CANT_BE_LESS_THAN_ONE);
  }
  if (endCondition?.scoreLimit !== undefined && endCondition.scoreLimit < 1) {
    return makeErrorResult(GameError.SCORE_LIMIT_CANT_BE_LESS_THAN_ONE);
  }
  return makeGameResult(makeGame({ id: gameId, host, endCondition }), [newGameCreatedEvent({ gameId })]);
};

export const joinPlayer = (game, player) => {
  if (getAllPlayers(game).some(playerEquals.bind(null, player))) return makeErrorResult(GameError.GAME_ALREADY_JOINED);
  if (isGameFull(game)) return makeErrorResult(GameError.MAXIMUM_NUMBER_OF_PLAYERS_REACHED);
  return makeGameResult(makeGame({ ...game, players: game.players.concat(player) }), [
    playerJoinedGame({ gameId: game.id, playerId: player.id }),
  ]);
};

export const startGame = (game, player) => {
  if (game.status === GameStatus.STARTED) {
    return makeErrorResult(GameError.GAME_ALREADY_STARTED);
  }
  if (getAllPlayers(game).length < MINIMUM_NUMBER_OF_PLAYERS) {
    return makeErrorResult(GameError.NOT_ENOUGH_PLAYERS);
  }
  if (playerEquals(game.host, player)) {
    const isDefaultEndCondition =
      game.endCondition?.xTimesStorytellerLimit === undefined && game.endCondition?.scoreLimit === undefined;
    return makeGameResult(
      makeGame({
        ...game,
        status: GameStatus.STARTED,
      }),
      [
        newGameStartedEvent({
          gameId: game.id,
          playerIds: getAllPlayers(game).map(({ id }) => id),
          useAllDeck: !isDefaultEndCondition,
        }),
      ]
    );
  }
  return makeErrorResult(GameError.ONLY_HOST_CAN_START_GAME);
};

export const updateDeck = (game, { discardedCards, shuffle = defaultShuffle } = {}) => {
  if (game.cards.length < getAllPlayers(game).length && game.endCondition !== DEFAULT_END_CONDITION) {
    const drawPile = shuffle([...game.drawPile, ...discardedCards, ...game.cards]);
    return makeGameResult(
      makeGame({
        ...game,
        cards: drawPile,
        drawPile: [],
      })
    );
  }
  return makeGameResult(
    makeGame({
      ...game,
      drawPile: game.drawPile.concat(discardedCards),
    })
  );
};

export const completeHands = (game, { cards, actualHandsByPlayerId, previousTurnId }) => {
  const allPlayers = getAllPlayers(game);
  const numberOfCardsByHand = getNumberOfCardsByHand(game);
  const actualCards = cards ?? game.cards;
  if (!actualHandsByPlayerId) {
    const handsByPlayerId = allPlayers.reduce(
      (hands, player, playerIndex) => ({
        ...hands,
        [player.id]: actualCards.slice(
          playerIndex * numberOfCardsByHand,
          playerIndex * numberOfCardsByHand + numberOfCardsByHand
        ),
      }),
      {}
    );
    const remainingCards = actualCards.slice(allPlayers.length * numberOfCardsByHand);
    return makeGameResult(
      makeGame({
        ...game,
        cards: remainingCards,
      }),
      [handsCompletedEvent({ gameId: game.id, handsByPlayerId })]
    );
  }
  const handsByPlayerId = Object.entries(actualHandsByPlayerId).reduce(
    (completedHands, [playerId, hand], playerIndex) => {
      const numberOfCardsToCompleteHand = numberOfCardsByHand - hand.length;
      return {
        ...completedHands,
        [playerId]: hand.concat(actualCards.slice(playerIndex, playerIndex + numberOfCardsToCompleteHand)),
      };
    },
    {}
  );
  return makeGameResult(
    makeGame({
      ...game,
      cards: actualCards.slice(allPlayers.length),
    }),
    [handsCompletedEvent({ gameId: game.id, handsByPlayerId, previousTurnId })]
  );
};

export const updateScore = (game, turnScore) => {
  const newScore = Object.entries(turnScore).reduce(
    (scores, [playerId, playerTurnScore]) => ({
      ...scores,
      [playerId]: playerTurnScore + (game.score[playerId] || 0),
    }),
    {}
  );
  console.log('updated score', newScore);
  return makeGameResult(
    makeGame({
      ...game,
      score: newScore,
    })
  );
};

export const setCurrentTurn = (game, currentTurn) =>
  makeGameResult(
    makeGame({
      ...game,
      currentTurn: {
        ...currentTurn,
        number: game.currentTurn.number + 1,
      },
    })
  );
