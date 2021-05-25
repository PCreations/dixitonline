import { events } from './events';
import { makeResult, makeErrorResult } from './result';
import { turnReducer, TurnPhase } from './reducer';
import { TurnError } from './errors';

export const defineClue = (turnState, { playerId, text, cardId }) => {
  if (turnState.turn.storytellerId !== playerId) {
    return makeErrorResult(TurnError.NOT_AUTHORIZED);
  }
  const clueDefinedEvent = events.clueDefined({ text, cardId });
  const newTurnState = turnReducer(turnState, clueDefinedEvent);
  return makeResult(newTurnState, [clueDefinedEvent]);
};

export const choseCard = (turnState, { playerId, cardId }) => {
  const playerCardChosenEvent = events.playerCardChosen({ playerId, cardId });
  const newTurnState = turnReducer(turnState, playerCardChosenEvent);
  return makeResult(newTurnState, [playerCardChosenEvent]);
};

export const vote = (turnState, { playerId, cardId }) => {
  const playerCardsOnBoard = turnState.turn.board
    .filter(({ playerId: cardPlayerId }) => playerId === cardPlayerId)
    .map(c => c.id);
  if (playerCardsOnBoard.includes(cardId)) {
    return makeErrorResult(TurnError.YOU_CANT_VOTE_FOR_YOUR_OWN_CARD);
  }
  const playerVotedEvent = events.playerVoted({ playerId, cardId });
  const newTurnState = turnReducer(turnState, playerVotedEvent);
  const resultEvents = [playerVotedEvent];
  if (newTurnState.turn.phase === TurnPhase.SCORING) {
    const playersWithHandAndScore = Object.entries(newTurnState.turn.handByPlayerId).map(([handPlayerId, hand]) => ({
      playerId: handPlayerId,
      hand,
      score: newTurnState.turn.score[handPlayerId],
    }));
    resultEvents.push(
      events.turnEnded({
        id: newTurnState.turn.id,
        gameId: newTurnState.turn.gameId,
        storytellerId: newTurnState.turn.storytellerId,
        playersWithHandAndScore,
        discardedCards: newTurnState.turn.board.map(({ id, url }) => ({ id, url })),
      })
    );
  }
  return makeResult(newTurnState, resultEvents);
};
