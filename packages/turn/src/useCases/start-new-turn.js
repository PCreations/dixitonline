import { events } from '../domain/events';

export const makeStartNewTurn = ({ turnRepository }) => async ({ gameId, players, previousTurnId }) => {
  let storytellerId = players[0].id;
  if (previousTurnId) {
    const previousTurn = await turnRepository.getTurnById(previousTurnId);
    const previousStorytellerId = previousTurn.turn.storytellerId;
    const previousStorytellerIndex = players.findIndex(player => player.id === previousStorytellerId);
    if (previousStorytellerIndex + 1 < players.length) {
      storytellerId = players[previousStorytellerIndex + 1].id;
    }
  }
  const turnId = turnRepository.getNextTurnId();
  return turnRepository.saveTurn(turnId, [events.turnStarted({ id: turnId, gameId, players, storytellerId })]);
};
