import { updateDeck, updateScore, completeHands } from '../domain/game';

export const makeHandleTurnEnded = ({ gameRepository, dispatchDomainEvents }) => async ({
  gameId,
  actualHandsByPlayerId,
  turnScore,
  previousTurnId,
  discardedCards,
}) => {
  // TODO : mettre dans une transaction game + rendre indempotent le updateScore + updateDeck + completeHands
  const game = await gameRepository.getGameById(gameId);
  const result = updateScore(game, turnScore);
  const { value: gameWithUpdatedDeck } = updateDeck(result.value, { discardedCards });
  const editedGameResult = completeHands(gameWithUpdatedDeck, { actualHandsByPlayerId, previousTurnId });
  if (!editedGameResult.error) {
    await gameRepository.saveGame(editedGameResult.value);
    dispatchDomainEvents(editedGameResult.events);
  }
  return editedGameResult;
};
