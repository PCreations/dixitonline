export const phaseFragment = `
  id
  name
  clue
  storytellerId
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
