export const equalsFreeze = (a = {}) => ({
  toEqual(b = {}) {
    return expect({ ...a }).toEqual({ ...b });
  },
});
