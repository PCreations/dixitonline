import { makeGame, joinPlayer, GameAlreadyJoinedByPlayerError, MaximumNumberOfPlayerReachedError } from '../game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { playerJoinedGame } from '../events';
import { buildTestGame } from '../../__tests__/dataBuilders/game';

describe('Game', () => {
  it('can be correctly created', () => {
    const host = buildTestPlayer().build();
    const players = [buildTestPlayer().build(), buildTestPlayer().build()];
    const game = makeGame({ id: '1', host, players });
    expect(game).toEqual({ id: '1', host, players });
  });
  it('must have an id', () => {
    expect(() => makeGame({ id: undefined })).toThrow('Game must contain an id');
  });
  it('must have an host', () => {
    expect(() => makeGame({ id: 'g1' })).toThrow('Game must have an host');
  });
  it('players list must be empty by default', () => {
    const host = buildTestPlayer().build();
    const game = makeGame({ id: 'g1', host });

    expect(game.players).toEqual([]);
  });
  describe('join player', () => {
    it('joins a player', () => {
      // arrange
      const host = buildTestPlayer().build();
      const game = makeGame({ id: 'g1', host });
      const playerThatWantsToJoinTheGame = buildTestPlayer().build();

      // act
      const [gameEdited, events] = joinPlayer(game, playerThatWantsToJoinTheGame);

      // assert
      expect(gameEdited.players).toEqual([playerThatWantsToJoinTheGame]);
      expect(events).toEqual([playerJoinedGame({ gameId: game.id, playerId: playerThatWantsToJoinTheGame.id })]);
    });
    it('throws a GameAlreadyJoinedByPlayerError if the player is the host', () => {
      // arrange
      const host = buildTestPlayer().build();
      const game = buildTestGame()
        .withHost(host)
        .build();

      // act & assert
      expect(() => joinPlayer(game, host)).toThrow(GameAlreadyJoinedByPlayerError);
    });
    it('throws a GameAlreadyJoinedByPlayerError if the player has already joined the game', () => {
      // arrange
      const host = buildTestPlayer().build();
      const player1 = buildTestPlayer().build();
      const player2 = buildTestPlayer().build();
      const game = buildTestGame()
        .withHost(host)
        .withPlayers([player1, player2])
        .build();

      // act & assert
      expect(() => joinPlayer(game, player2)).toThrow(GameAlreadyJoinedByPlayerError);
    });
    it('throws a MaximumNumberOfPlayerReachedError when a player tries to join a game with already the maximum number of players in it', () => {
      // arrange
      const host = buildTestPlayer().build();
      const player = buildTestPlayer().build();
      const game = buildTestGame()
        .withHost(host)
        .withPlayers([
          buildTestPlayer().build(),
          buildTestPlayer().build(),
          buildTestPlayer().build(),
          buildTestPlayer().build(),
          buildTestPlayer().build(),
        ])
        .build();

      // act & assert
      expect(() => joinPlayer(game, player)).toThrow(MaximumNumberOfPlayerReachedError);
    });
  });
});
