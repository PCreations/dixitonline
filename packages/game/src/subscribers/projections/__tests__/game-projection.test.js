import { GameStatus, getEndCondition } from '../../../domain/game';
import { buildTestGame } from '../../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../../__tests__/dataBuilders/player';
import { createGameProjection } from '../game-projection';

describe('game projection', () => {
  it('generates the game projection from a game object', () => {
    const host = buildTestPlayer()
      .withId('hostId')
      .withName('Host')
      .build();
    const player1 = buildTestPlayer()
      .withId('player1')
      .withName('Player 1')
      .build();
    const player2 = buildTestPlayer()
      .withId('player2')
      .withName('Player 2')
      .build();
    const game = buildTestGame()
      .withId('gameId')
      .withHost(host)
      .withPlayers([player1, player2])
      .withXtimesStorytellerLimit(2)
      .withStartedStatus()
      .build();

    const gameProjection = createGameProjection(game, { payload: {} });

    expect(gameProjection).toEqual({
      id: 'gameId',
      status: GameStatus.STARTED,
      endCondition: getEndCondition(game),
      players: {
        hostId: {
          isHost: true,
          username: 'Host',
          isReady: true,
          score: 0,
          isStoryteller: false,
        },
        player1: {
          isHost: false,
          username: 'Player 1',
          isReady: true,
          score: 0,
          isStoryteller: false,
        },
        player2: {
          isHost: false,
          username: 'Player 2',
          isReady: true,
          score: 0,
          isStoryteller: false,
        },
      },
    });
  });
});
