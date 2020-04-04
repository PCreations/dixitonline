import { completeHands } from '../domain/game';

export const makeCompleteHands = ({ gameRepository, dispatchDomainEvents }) => async ({
  gameId,
  actualHandsByPlayerId,
  cards,
}) => {
  const game = await gameRepository.getGameById(gameId);
  const result = completeHands(game, { cards, actualHandsByPlayerId });
  if (!result.error) {
    await gameRepository.saveGame(result.value);
    dispatchDomainEvents(result.events);
  }
  return result;
};
