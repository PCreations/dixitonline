import { EventEmitter } from 'events';
import * as gameEvents from '../../../domain/events';
import { makeOnPlayerJoinedSubscriber } from '../on-player-joined';
import { createInMemoryGameProjectionGateway } from '../gateways';
import { makeNullGameRepository } from '../../../repos';
import { buildTestGame } from '../../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../../__tests__/dataBuilders/player';
import { buildgameRepositoryInitialGames } from '../../../__tests__/dataBuilders/game-repository-initial-games';
import { createGameProjection } from '../game-projection';

describe('onPlayerJoined', () => {
  it('generate game view when a player has joined a game', async done => {
    expect.assertions(1);
    const playerThatHasJoinedTheGame = buildTestPlayer()
      .withId('playerId')
      .withName('Player')
      .build();
    const game = buildTestGame()
      .withId('gameId')
      .withXtimesStorytellerLimit(2)
      .withHost(
        buildTestPlayer()
          .withId('hostId')
          .withName('Host')
          .build()
      )
      .withPlayers([playerThatHasJoinedTheGame])
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
    makeOnPlayerJoinedSubscriber({
      subscribeToDomainEvent,
      gameProjectionGateway,
      gameRepository,
    });
    dispatchDomainEvent(gameEvents.playerJoinedGame({ gameId: 'gameId', playerId: playerThatHasJoinedTheGame.id }));

    setImmediate(async () => {
      const gameProjection = await gameProjectionGateway.getGame({ gameId: 'gameId' });
      const updatedGame = await gameRepository.getGameById('gameId');
      expect(gameProjection).toEqual(createGameProjection(updatedGame));
      done();
    });
  });
});
