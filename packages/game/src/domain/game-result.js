export const makeGameResult = (game, events = []) => ({
  value: game,
  events,
});

export const makeErrorResult = error => ({
  error,
  events: [],
});
