export const makeGetShuffledDeck = ({ deckRepository, shuffle }) => async () => {
  const deck = await deckRepository.getDefaultDeck();
  return {
    name: deck.name,
    cards: shuffle(deck.cards),
  };
};
