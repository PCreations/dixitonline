export const events = {
  types: {
    TURN_STARTED: '[turn] - a new turn has started',
    TURN_ENDED: '[turn] - a turn has ended',
    CLUE_DEFINED: '[turn] - the clue has been defined',
    PLAYER_CARD_CHOSEN: '[turn] - a player has chosen a card',
    PLAYER_VOTED: '[turn] - a player has voted on a card',
    TURN_UPDATED: '[turn] - a turn has been updated',
  },
  turnStarted({ id, gameId, storytellerId, players }) {
    return {
      type: events.types.TURN_STARTED,
      payload: {
        id,
        gameId,
        storytellerId,
        players,
      },
    };
  },
  turnEnded({ id, gameId, storytellerId, playersWithHandAndScore, discardedCards }) {
    return {
      type: events.types.TURN_ENDED,
      payload: {
        id,
        gameId,
        storytellerId,
        playersWithHandAndScore,
        discardedCards,
      },
    };
  },
  turnUpdated({ id }) {
    return {
      type: events.types.TURN_UPDATED,
      payload: { id },
    };
  },
  clueDefined({ text, cardId }) {
    return {
      type: events.types.CLUE_DEFINED,
      payload: {
        text,
        cardId,
      },
    };
  },
  playerCardChosen({ playerId, cardId }) {
    return {
      type: events.types.PLAYER_CARD_CHOSEN,
      payload: {
        playerId,
        cardId,
      },
    };
  },
  playerVoted({ playerId, cardId }) {
    return {
      type: events.types.PLAYER_VOTED,
      payload: {
        playerId,
        cardId,
      },
    };
  },
};
