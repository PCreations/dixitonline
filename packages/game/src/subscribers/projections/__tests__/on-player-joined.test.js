import { GameStatus } from '../../../domain/game';
import * as gameEvents from '../../../domain/events';
import { createOnPlayerJoined } from '../on-player-joined';
import { createInMemoryGameProjectionGateway } from '../gateways';
import { makeNullGameRepository } from '../../../repos';
import { buildTestGame } from '../../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../../__tests__/dataBuilders/player';
import { buildgameRepositoryInitialGames } from '../../../__tests__/dataBuilders/game-repository-initial-games';

describe('onPlayerJoined', () => {
  it('generate game view when a player has joined a game', async () => {
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
    const gameRepository = makeNullGameRepository({
      gamesData: buildgameRepositoryInitialGames()
        .withGames([game])
        .build(),
    });
    const gameProjectionGateway = createInMemoryGameProjectionGateway();
    const onPlayerJoined = createOnPlayerJoined({ gameProjectionGateway, gameRepository });

    await onPlayerJoined(
      gameEvents.playerJoinedGame({ gameId: 'gameId', playerId: playerThatHasJoinedTheGame.id }).payload
    );

    const gameProjection = await gameProjectionGateway.getGame({ gameId: 'gameId' });
    expect(gameProjection).toEqual({
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
        playerId: {
          isHost: false,
          username: 'Player',
          isReady: true,
          score: 0,
          isStoryteller: false,
        },
      },
    });
  });
});
