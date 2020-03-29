import { buildTestCard } from './card';

export const buildTestHand = () => {
  const defaultCards = new Array(6).fill().map(() => buildTestCard().build());
  return {
    build() {
      return defaultCards;
    },
  };
};
