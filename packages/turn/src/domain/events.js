export const events = {
  types: {
    TURN_STARTED: '[turn] - a new turn has started',
    CLUE_DEFINED: '[turn] - the clue has been defined',
    PLAYER_CARD_CHOSEN: '[turn] - a player has chosen a card',
  },
  turnStarted({ id, storytellerId, players }) {
    return {
      type: events.types.TURN_STARTED,
      payload: {
        id,
        storytellerId,
        players,
      },
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
};
