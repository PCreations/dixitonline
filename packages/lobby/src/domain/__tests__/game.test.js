import {
  makeGame,
  joinPlayer,
  startGame,
  GameAlreadyJoinedByPlayerError,
  MaximumNumberOfPlayerReachedError,
  OnlyHostCanStartGameError,
  getAllPlayers,
} from '../game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { playerJoinedGame, newGameStartedEvent } from '../events';
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
        .asFullGame()
        .build();

      // act & assert
      expect(() => joinPlayer(game, player)).toThrow(MaximumNumberOfPlayerReachedError);
    });
  });
  describe('game can be started', () => {
    it('can be started if the player who wants to start the game is the host', () => {
      // arrange
      const game = buildTestGame()
        .withXPlayers(3)
        .build();

      // act
      const { value, events, error } = startGame(game, game.host);

      // assert
      expect(value).toEqual(game.id);
      expect(events).toEqual([
        newGameStartedEvent({ gameId: game.id, playerIds: getAllPlayers(game).map(({ id }) => id) }),
      ]);
      expect(error).toBeUndefined();
    });
    it("can't be started if the player who wants to start the game is NOT the host", () => {
      // arrange
      const game = buildTestGame().build();
      const player = buildTestPlayer().build();

      // act
      const { events, error } = startGame(game, player);

      // assert
      expect(events).toEqual([]);
      expect(error).toEqual(new OnlyHostCanStartGameError());
    });
  });
});
