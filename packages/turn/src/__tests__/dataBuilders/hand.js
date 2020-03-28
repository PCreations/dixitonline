import { buildTestCard } from './card';
import { makeHand } from '../../domain/hand';

export const buildTestHand = () => {
  const defaultCards = new Array(6).fill().map(() => buildTestCard().build());
  return {
    build() {
      return makeHand(defaultCards);
    },
  };
};
