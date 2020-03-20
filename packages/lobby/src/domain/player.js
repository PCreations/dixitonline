export const makePlayer = ({ id, name } = {}) => {
  if (!id) throw new Error('Player must contain an id');
  if (!name) throw new Error('Player must have a name');
  return { id, name };
};
