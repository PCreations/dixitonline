const toScore = (scores, { playerId, score }) => ({
  ...scores,
  [playerId]: score,
});

const getStorytellerEarnedPoints = playersCount => (playersCount === 3 ? 4 : 3);

export const computeScore = ({ storytellerId, board }) => {
  const playersCount = board.reduce(
    (players, { playerId }) => (players.includes(playerId) ? players : players.concat(playerId)),
    []
  ).length;
  const pointsWhenNotAllPlayersHaveFoundStorytellerCard = playersCount === 3 ? 4 : 3;
  const storytellerCardVotes = board.filter(card => card.playerId === storytellerId).flatMap(card => card.votes);
  let mergedBoard = board;
  if (playersCount === 3) {
    mergedBoard = Object.entries(
      board.reduce(
        (cardsByPlayerId, card) => ({
          ...cardsByPlayerId,
          [card.playerId]: card.votes.concat(cardsByPlayerId[card.playerId] || []),
        }),
        {}
      )
    ).flatMap(([playerId, votes]) => ({
      playerId,
      votes,
    }));
  }
  if (storytellerCardVotes.length === playersCount - 1 || storytellerCardVotes.length === 0) {
    const score = mergedBoard
      .map(({ playerId, votes }) => {
        return {
          playerId,
          score: playerId === storytellerId ? 0 : 2 + votes.length,
        };
      })
      .reduce(toScore, {});
    return score;
  }
  return mergedBoard
    .map(({ playerId, votes }) => {
      if (storytellerId === playerId) {
        return {
          playerId,
          score: getStorytellerEarnedPoints(playersCount),
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
