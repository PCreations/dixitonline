import { EventEmitter } from 'events';
import { events as turnEvents } from '@dixit/turn';
import { makeOnTurnStartedSubscriber } from '../on-turn-started';
import { createInMemoryGameProjectionGateway } from '../gateways';
import { makeNullGameRepository } from '../../../repos';
import { buildTestGame } from '../../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../../__tests__/dataBuilders/player';
import { buildgameRepositoryInitialGames } from '../../../__tests__/dataBuilders/game-repository-initial-games';

describe('onTurnStarted', () => {
  it('updates the storyteller when a new turn has started', async done => {
    expect.assertions(2);
    const game = buildTestGame()
      .withId('gameId')
      .withXtimesStorytellerLimit(2)
      .withHost(
        buildTestPlayer()
          .withId('hostId')
          .withName('Host')
          .build()
      )
      .withPlayers([
        buildTestPlayer()
          .withId('player2')
          .build(),
      ])
      .build();

    const eventEmitter = new EventEmitter();
    const dispatchDomainEvent = event => eventEmitter.emit(event.type, event);
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const gameRepository = makeNullGameRepository({
      gamesData: buildgameRepositoryInitialGames()
        .withGames([game])
        .build(),
    });
    const gameProjectionGateway = createInMemoryGameProjectionGateway();
    makeOnTurnStartedSubscriber({
      subscribeToDomainEvent,
      gameProjectionGateway,
      gameRepository,
    });
    dispatchDomainEvent(turnEvents.turnStarted({ id: 'turnId', gameId: 'gameId', storytellerId: 'player2' }));

    setImmediate(async () => {
      const updatedGameProjection = await gameProjectionGateway.getGame({ gameId: 'gameId' });
      expect(updatedGameProjection.players.player2.isStoryteller).toBe(true);
      expect(updatedGameProjection.players.hostId.isStoryteller).toBe(false);
      done();
    });
  });
});
