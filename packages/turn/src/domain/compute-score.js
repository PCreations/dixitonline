const toScore = (scores, { playerId, score }) => ({
  ...scores,
  [playerId]: score,
});

const STORYTELLER_EARNED_POINTS = 3;

export const computeScore = ({ storytellerId, board }) => {
  const playersCount = board.length - 1;
  const pointsWhenNotAllPlayersHaveFoundStorytellerCard = board.length === 3 ? 4 : 3; //?
  const storytellerCardVotes = board.filter(card => card.playerId === storytellerId).flatMap(card => card.votes);
  if (storytellerCardVotes.length === playersCount || storytellerCardVotes.length === 0) {
    const score = board
      .map(({ playerId, votes }) => {
        return {
          playerId,
          score: playerId === storytellerId ? 0 : 2 + votes.length,
        };
      })
      .reduce(toScore, {});
    return score;
  }
  return board
    .map(({ playerId, votes }) => {
      if (storytellerId === playerId) {
        return {
          playerId,
          score: STORYTELLER_EARNED_POINTS,
        };
      }
      return {
        playerId,
        score:
          votes.length +
          (storytellerCardVotes.includes(playerId) ? pointsWhenNotAllPlayersHaveFoundStorytellerCard : 0),
      };
    })
    .reduce(toScore, {});
};
