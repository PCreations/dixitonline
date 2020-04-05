export const phaseFragment = `
  name
  clue
  board {
    card {
      id
      url
    }
    playerId
    votes {
      id
      name
    }
  }
  hand {
    id
    url
  }
  players {
    id
    name
    readyForNextPhase
    score
  }
`;
