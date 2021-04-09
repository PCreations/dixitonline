import { GameStatus, getAllPlayers, PLAYER_INACTIVE_AFTER_X_SECONDS } from '../../domain/game';
import { makeNullGameRepository } from '../../repos/game-repository';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { makeRemoveInactivePlayers } from '../remove-inactive-players';

describe('check inactive players', () => {
  it('removes inactive players in a game waiting for players', async () => {
    // arrange
    const now = new Date('2021-04-04:09:11:00');
    const host = buildTestPlayer()
      .joinedAt(now)
      .build();
    const activePlayer = buildTestPlayer()
      .joinedAt(new Date('2021-04-04:09:09:50'))
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS - 1 })
      .build();
    const inactivePlayer = buildTestPlayer()
      .withId('inactive-player')
      .joinedAt(new Date('2021-04-04:09:10:00'))
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS })
      .build();
    const game = buildTestGame()
      .withHost(host)
      .withPlayers([activePlayer, inactivePlayer])
      .build();
    const gameRepository = makeNullGameRepository({
      gamesData: {
        [game.id]: game,
      },
    });
    const removeInactivePlayers = makeRemoveInactivePlayers({ gameRepository });

    // act
    const result = await removeInactivePlayers({ gameId: game.id, now });
    const playersHeartbeats = await gameRepository.getGamePlayersHeartbeats(game.id);

    // assert
    expect(getAllPlayers(result.value)).toEqual([host, activePlayer]);
    expect(playersHeartbeats.find(p => p.playerId === inactivePlayer.id)).toBeUndefined();
  });

  it('removes the host if inactive and sets the first player as new host', async () => {
    // arrange
    const now = new Date('2021-04-04:09:11:00');
    const host = buildTestPlayer()
      .joinedAt(now)
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS })
      .build();
    const activePlayer = buildTestPlayer()
      .joinedAt(new Date('2021-04-04:09:09:50'))
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS - 1 })
      .build();
    const otherActivePlayer = buildTestPlayer()
      .joinedAt(new Date('2021-04-04:09:10:00'))
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS - 1 })
      .build();
    const game = buildTestGame()
      .withHost(host)
      .withPlayers([activePlayer, otherActivePlayer])
      .build(); //?
    const gameRepository = makeNullGameRepository({
      gamesData: {
        [game.id]: game,
      },
    });
    const removeInactivePlayers = makeRemoveInactivePlayers({ gameRepository });

    // act
    const result = await removeInactivePlayers({ gameId: game.id, now });

    // assert
    expect(getAllPlayers(result.value)).toEqual([activePlayer, otherActivePlayer]);
    expect(result.value.host).toEqual(activePlayer);
  });

  it('sets the game as EXPIRED if there is no players left', async () => {
    // arrange
    const now = new Date('2021-04-04:09:11:00');
    const inactiveHost = buildTestPlayer()
      .joinedAt(now)
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS })
      .build();
    const inactivePlayer = buildTestPlayer()
      .joinedAt(new Date('2021-04-04:09:09:50'))
      .lastSeenXsecondsAgo({ now, seconds: PLAYER_INACTIVE_AFTER_X_SECONDS })
      .build();
    const game = buildTestGame()
      .withHost(inactiveHost)
      .withPlayers([inactivePlayer])
      .build();
    const gameRepository = makeNullGameRepository({
      gamesData: {
        [game.id]: game,
      },
    });
    const removeInactivePlayers = makeRemoveInactivePlayers({ gameRepository });

    // act
    const result = await removeInactivePlayers({ gameId: game.id, now });

    // assert
    expect(getAllPlayers(result.value)).toEqual([]);
    expect(result.value.status).toEqual(GameStatus.EXPIRED);
  });
});
