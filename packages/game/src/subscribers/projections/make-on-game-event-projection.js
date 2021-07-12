import { createGameProjection } from './game-projection';

export const makeOnGameEventProjection = gameEventType => ({
  subscribeToDomainEvent,
  gameProjectionGateway,
  gameRepository,
}) => {
  subscribeToDomainEvent(gameEventType, async event => {
    const createdGame = await gameRepository.getGameById(event.payload.gameId);

    const gameProjection = createGameProjection(createdGame, event);

    gameProjectionGateway.save(gameProjection);
  });
};
