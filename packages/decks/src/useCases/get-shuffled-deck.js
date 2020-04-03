import { events } from '../events';

export const makeGetShuffledDeck = ({ deckRepository, shuffle, dispatchDomainEvents }) => async ({ gameId }) => {
  const deck = await deckRepository.getDefaultDeck();
  const cards = shuffle(deck.cards);
  dispatchDomainEvents([events.deckShuffled({ gameId, cards })]);
  return {
    name: deck.name,
    cards,
  };
};
