import { updateScore, completeHands } from '../domain/game';

export const makeHandleTurnEnded = ({ gameRepository, dispatchDomainEvents }) => async ({
  gameId,
  actualHandsByPlayerId,
  turnScore,
  previousTurnId,
}) => {
  const game = await gameRepository.getGameById(gameId);
  const result = updateScore(game, turnScore);
  const editedGameResult = completeHands(result.value, { actualHandsByPlayerId, previousTurnId });
  if (!editedGameResult.error) {
    await gameRepository.saveGame(editedGameResult.value);
    dispatchDomainEvents(editedGameResult.events);
  }
  return editedGameResult;
};
