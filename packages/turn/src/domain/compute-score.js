const toScore = (scores, { playerId, score }) => ({
  ...scores,
  [playerId]: score,
});

export const computeScore = ({ storytellerId, board }) => {
  const playersCount = board.length - 1;
  const storytellerCardVotes = board.filter(card => card.playerId === storytellerId).flatMap(card => card.votes);
  if (storytellerCardVotes.length === playersCount || storytellerCardVotes.length === 0) {
    return board
      .map(({ playerId, votes }) => ({
        playerId,
        score: playerId === storytellerId ? 0 : 2 + votes.length,
      }))
      .reduce(toScore, {});
  }
  return board
    .map(({ playerId, votes }) => {
      if (storytellerId === playerId) {
        return {
          playerId,
          score: 3,
        };
      }
      return {
        playerId,
        score: votes.length + (storytellerCardVotes.includes(playerId) ? 3 : 0),
      };
    })
    .reduce(toScore, {});
};
