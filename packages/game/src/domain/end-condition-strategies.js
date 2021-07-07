const remainingTurnsEndingCondition = remainingTurns => ({
  remainingTurns,
  isGameEnded: remainingTurns === -1,
});

export const defaultEndingConditionStrategy = game => {
  const playersCount = game.players.length + 1;
  const cardsCount = game.cards.length;
  const cardsPerDraw = game.players.length === 2 ? 5 : playersCount;
  const cardsPerPlayers = cardsCount / cardsPerDraw;
  return remainingTurnsEndingCondition(cardsPerPlayers <= 0 ? -1 : Math.floor(cardsCount / cardsPerDraw));
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
