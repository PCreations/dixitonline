export const makeGame = ({ id, host } = {}) => {
  if (!id) throw new Error('Game must contain an id');
  if (!host) throw new Error('Game must have an host');
  return Object.freeze({
    id,
    host,
  });
};
