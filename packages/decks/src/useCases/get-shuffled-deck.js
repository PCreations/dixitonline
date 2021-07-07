import { events } from '../events';

const CARDS_IN_DECK = 372;
const MINIMUM_NUMBER_OF_CARDS_FOR_GAME_DECK = 84;
const CARDS_PER_PLAYER = MINIMUM_NUMBER_OF_CARDS_FOR_GAME_DECK / 6;

export const makeGetShuffledDeck = ({ shuffle, dispatchDomainEvents }) => async ({
  gameId,
  playersCount,
  useAllDeck = false,
}) => {
  const deck = new Array(CARDS_IN_DECK).fill().map((_, index) => index + 1);
  const cards = shuffle(deck, `${gameId}${Math.random()}`).slice(
    0,
    useAllDeck
      ? CARDS_IN_DECK
      : playersCount <= 6
      ? MINIMUM_NUMBER_OF_CARDS_FOR_GAME_DECK
      : playersCount * CARDS_PER_PLAYER
  );
  dispatchDomainEvents([events.deckShuffled({ gameId, cards })]);
  return {
    name: deck.name,
    cards,
  };
};
