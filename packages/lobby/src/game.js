export const makeGame = ({ id } = {}) => {
  if (!id) throw new Error('Game must contain an id');
  return Object.freeze({
    id,
  });
};
