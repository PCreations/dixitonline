export const makeHand = (cards = []) => {
  if (cards.length === 0) {
    throw new Error('Hand cannot be empty');
  }
  if (cards.length > 6) {
    throw new Error('The maximum amount of cards is 6');
  }
  return [...cards];
};
