import { getEndCondition } from '../../domain/game';

export const createGameProjection = (game, event = { payload: {} }) => ({
  id: game.id,
  status: game.status,
  endCondition: getEndCondition(game),
  players: {
    [game.host.id]: {
      isHost: true,
      username: game.host.name,
      isReady: true,
      score: 0,
      isStoryteller: false,
    },
    ...Object.fromEntries(
      game.players.map(p => [
        p.id,
        {
          isHost: false,
          username: p.name,
          isReady: true,
          score: 0,
          isStoryteller: event.payload.storytellerId === p.id,
        },
      ])
    ),
  },
});
