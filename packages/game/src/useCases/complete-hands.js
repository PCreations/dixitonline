import { completeHands } from '../domain/game';

export const makeCompleteHands = ({ gameRepository, dispatchDomainEvents }) => async ({
  gameId,
  actualHandsByPlayerId,
  cards,
  previousTurnId,
}) => {
  const game = await gameRepository.getGameById(gameId);
  const result = completeHands(game, { cards, actualHandsByPlayerId, previousTurnId });
  if (!result.error) {
    console.log('Saving game with cards.length = ', result.value.cards.length);
    await gameRepository.saveGame(result.value);
    dispatchDomainEvents(result.events);
  }
  return result;
};
