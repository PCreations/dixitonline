import { completeHands } from '../domain/game';

export const makeCompleteHands = ({ gameRepository, dispatchDomainEvents }) => async ({
  gameId,
  actualHandsByPlayerId,
}) => {
  const game = await gameRepository.getGameById(gameId);
  const result = completeHands(game, actualHandsByPlayerId);
  if (!result.error) {
    await gameRepository.saveGame(result.value);
    dispatchDomainEvents(result.events);
  }
  return result;
};
