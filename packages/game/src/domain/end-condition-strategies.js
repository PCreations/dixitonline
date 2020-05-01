const remainingTurnsEndingCondition = remainingTurns => ({
  remainingTurns,
  isGameEnded: remainingTurns === 0,
});

export const defaultEndingConditionStrategy = game => {
  const playersCount = game.players.length + 1;
  const cardsCount = game.cards.length;
  return remainingTurnsEndingCondition(Math.floor(cardsCount / playersCount));
};

export const xTimesStorytellerEndingConditionsStrategy = game => {
  const playersCount = game.players.length + 1;
  const xTimesLimit = game.endCondition.xTimesStorytellerLimit;
  const currentTurnNumber = game.currentTurn.number;
  return remainingTurnsEndingCondition(playersCount * xTimesLimit - currentTurnNumber);
};

export const scoreLimitEndingCondition = game => ({
  isGameEnded: Object.values(game.score).some(s => s >= game.endCondition.scoreLimit),
});

export const getEndingConditionStrategy = game => {
  if (game.endCondition.scoreLimit) {
    return scoreLimitEndingCondition;
  }
  if (game.endCondition.xTimesStorytellerLimit) {
    return xTimesStorytellerEndingConditionsStrategy;
  }
  return defaultEndingConditionStrategy;
};
