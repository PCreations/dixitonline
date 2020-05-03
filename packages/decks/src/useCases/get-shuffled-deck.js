import { events } from '../events';

const CARDS_IN_DECK = 296;
const NUMBER_OF_CARDS_FOR_GAME_DECK = 84;

export const makeGetShuffledDeck = ({ shuffle, dispatchDomainEvents }) => async ({ gameId, useAllDeck = false }) => {
  console.log({ useAllDeck });
  const deck = new Array(CARDS_IN_DECK).fill().map((_, index) => index + 1);
  const cards = shuffle(deck).slice(0, useAllDeck ? CARDS_IN_DECK : NUMBER_OF_CARDS_FOR_GAME_DECK);
  console.log(
    `shuffle(deck (length = ${deck.length})).slice(0, ${useAllDeck ? CARDS_IN_DECK : NUMBER_OF_CARDS_FOR_GAME_DECK});`
  );
  dispatchDomainEvents([events.deckShuffled({ gameId, cards })]);
  return {
    name: deck.name,
    cards,
  };
};
