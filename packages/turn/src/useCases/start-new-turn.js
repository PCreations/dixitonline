import { makeTurn } from '../domain/turn';

export const makeStartNewTurn = ({ turnRepository }) => async ({ players, storytellerId }) => {
  await turnRepository.saveTurn(makeTurn({ id: turnRepository.getNextTurnId(), players, storytellerId }));
};
