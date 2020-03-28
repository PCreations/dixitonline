export const TurnPhase = {
  STORYTELLER: '[turn phase] : storyteller',
};

export const makeTurn = ({ id }) =>
  Object.freeze({
    id,
    phase: TurnPhase.STORYTELLER,
  });
