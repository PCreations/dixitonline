export const events = {
  types: {
    DECK_SHUFFLED: '[deck] - a deck has been shuffled',
  },
  deckShuffled({ gameId, cards }) {
    return {
      type: events.types.DECK_SHUFFLED,
      payload: {
        gameId,
        cards,
      },
    };
  },
};
