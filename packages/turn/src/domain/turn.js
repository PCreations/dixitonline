export const TurnPhase = {
  STORYTELLER: '[turn phase] : storyteller',
};

export const MINIMUM_PLAYERS = 3;
const MAXIMUM_PLAYERS = 6;

export const makeTurn = ({ id, players = [], storytellerId } = {}) => {
  if (!id) {
    throw new Error('A turn must contain an id');
  }
  if (!storytellerId) {
    throw new Error('A turn must contain a storytellerId');
  }
  if (players.length < MINIMUM_PLAYERS) {
    throw new Error('A turn must have at least 3 players');
  }
  if (players.length > MAXIMUM_PLAYERS) {
    throw new Error('A turn must have less than 6 players');
  }
  if (!players.some(p => p.id === storytellerId)) {
    throw new Error('Storyteller must be part of the players');
  }
  return Object.freeze({
    id,
    phase: TurnPhase.STORYTELLER,
    storytellerId,
    players,
  });
};

const getPlayer = (turn, playerId) => turn.players.find(p => p.id === playerId);

export const getTurnPhaseAs = (turn, playerId) => {
  const player = getPlayer(turn, playerId);
  return {
    storytellerId: turn.storytellerId,
    hand: player.hand,
  };
};
