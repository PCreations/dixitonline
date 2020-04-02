export const makeResult = (value, events = []) => ({
  value,
  events,
});

export const makeErrorResult = error => ({
  error,
  events: [],
});
