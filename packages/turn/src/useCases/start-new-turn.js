import { events as turnEvents } from '../domain/events';

export const makeStartNewTurn = ({ turnRepository, dispatchDomainEvents }) => async ({
  gameId,
  players,
  previousTurnId,
}) => {
  // TODO: this logic should be in domain
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
  const events = [turnEvents.turnStarted({ id: turnId, gameId, players, storytellerId })];
  const turn = await turnRepository.saveTurn(turnId, events);
  dispatchDomainEvents(events);
  return turn;
};
