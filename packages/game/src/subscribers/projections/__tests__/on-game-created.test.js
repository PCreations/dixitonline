import { GameStatus } from '../../../domain/game';
import * as gameEvents from '../../../domain/events';
import { createOnGameCreated } from '../on-game-created';
import { createInMemoryGameProjectionGateway } from '../gateways';
import { makeNullGameRepository } from '../../../repos';
import { buildTestGame } from '../../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../../__tests__/dataBuilders/player';
import { buildgameRepositoryInitialGames } from '../../../__tests__/dataBuilders/game-repository-initial-games';

describe('onGameCreated', () => {
  it('generate game view when a new game is created', async () => {
    const gameCreated = buildTestGame()
      .withId('gameId')
      .withXtimesStorytellerLimit(2)
      .withHost(
        buildTestPlayer()
          .withId('hostId')
          .withName('Host')
          .build()
      )
      .build();
    const gameRepository = makeNullGameRepository({
      gamesData: buildgameRepositoryInitialGames()
        .withGames([gameCreated])
        .build(),
    });
    const gameProjectionGateway = createInMemoryGameProjectionGateway();
    const onGameCreated = createOnGameCreated({ gameProjectionGateway, gameRepository });

    await onGameCreated(gameEvents.newGameCreatedEvent({ gameId: 'gameId' }).payload);

    const game = await gameProjectionGateway.getGame({ gameId: 'gameId' });
    expect(game).toEqual({
      id: 'gameId',
      status: GameStatus.WAITING_FOR_PLAYERS,
      endCondition: {
        xTimesStorytellerLimit: 2,
      },
      players: {
        hostId: {
          isHost: true,
          username: 'Host',
          isReady: true,
          score: 0,
          isStoryteller: false,
        },
      },
    });
  });
});
