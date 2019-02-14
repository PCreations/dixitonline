const { Record, Set } = require('immutable');
const {
  events: { types: turnEventTypes },
} = require('../domain/turn/events');

const Card = Record({
  id: undefined,
});

const PlayerHand = Set([Card()]);

const reduceToPlayerHand = (PlayerHand = PlayerHand(), event) => {
  switch (event.type) {
    case turnEventTypes.HANDS_COMPLETED:
      return gamePlayerHands.withMutations(playersHands => {
        return event.payload.hands.reduce(
          (hands, { playerId, cards }) =>
            hands.update(playerId, Set([]), handsCard => handsCard.concat(Set(cards))),
          playersHands,
        );
      });
    default:
      return gamePlayerHands;
  }
};

const GamePlayerHandQuery = ({ consumeEvents, getStoredGamePlayerHandView }) => {
  const gamePlayerHands = {};
  return async ({ gameId, playerId }) => {
    if (!gamePlayerHands[gameId] || !gamePlayers[gameId][playerId]) {
      const playerHandState = await getStoredGamePlayerHandView({ gameId, playerId });
      games[gameId] = games[gameId] || {};
      games[gameId][playerId] =
        typeof playerHandState === 'undefined'
          ? PlayerHand()
          : PlayerHand({
              cards: Set(playerHandState.cards),
            });
      consumeEvents(event => {
        games[gameId] = reduceToPlayerHand(games[gameId], event);
      });
    }
    return games[gameId][playerId].toJS();
  };
};

module.exports = {
  reduceToGameInfo,
  GameInfoQuery,
  GameInfo,
};
