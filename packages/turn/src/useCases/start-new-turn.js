import { makeTurn } from '../domain/turn';

export const makeStartNewTurn = ({ turnRepository }) => async () => {
  await turnRepository.saveTurn(makeTurn({ id: turnRepository.getNextTurnId() }));
};
