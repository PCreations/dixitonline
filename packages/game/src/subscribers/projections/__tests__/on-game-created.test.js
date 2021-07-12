import { EventEmitter } from 'events';
import * as gameEvents from '../../../domain/events';
import { makeOnGameCreatedSubscriber } from '../on-game-created';
import { createInMemoryGameProjectionGateway } from '../gateways';
import { makeNullGameRepository } from '../../../repos';
import { buildTestGame } from '../../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../../__tests__/dataBuilders/player';
import { buildgameRepositoryInitialGames } from '../../../__tests__/dataBuilders/game-repository-initial-games';
import { createGameProjection } from '../game-projection';

describe('onGameCreated', () => {
  it('generate game view when a new game is created', done => {
    expect.assertions(1);
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
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvent = event => eventEmitter.emit(event.type, event);
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const gameProjectionGateway = createInMemoryGameProjectionGateway();
    makeOnGameCreatedSubscriber({ subscribeToDomainEvent, gameProjectionGateway, gameRepository });

    dispatchDomainEvent(gameEvents.newGameCreatedEvent({ gameId: 'gameId' }));

    setImmediate(async () => {
      const gameProjection = await gameProjectionGateway.getGame({ gameId: 'gameId' });
      const updatedGame = await gameRepository.getGameById('gameId');
      expect(gameProjection).toEqual(createGameProjection(updatedGame));
      done();
    });
  });
});
