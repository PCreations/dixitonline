import { makeGame, createGame, joinPlayer, startGame, GameError, getAllPlayers, GameStatus } from '../game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { playerJoinedGame, newGameStartedEvent, newGameCreatedEvent } from '../events';
import { buildTestGame } from '../../__tests__/dataBuilders/game';

describe('Game', () => {
  it('can be correctly created', () => {
    const host = buildTestPlayer().build();
    const players = [buildTestPlayer().build(), buildTestPlayer().build()];
    const game = makeGame({ id: '1', host, players });
    expect(game).toEqual({ id: '1', host, players, status: GameStatus.WAITING_FOR_PLAYERS });
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

  describe('create game', () => {
    it('creates a game', () => {
      // arrange
      const host = buildTestPlayer().build();

      // act
      const result = createGame({ gameId: 'g1', host });

      // assert
      expect({ ...result.value }).toEqual({
        ...buildTestGame()
          .withId('g1')
          .withHost(host)
          .build(),
      });
      expect(result.events).toEqual([newGameCreatedEvent({ gameId: 'g1' })]);
      expect(result.error).toBeUndefined();
    });
  });

  describe('join player', () => {
    it('joins a player', () => {
      // arrange
      const host = buildTestPlayer().build();
      const game = makeGame({ id: 'g1', host });
      const playerThatWantsToJoinTheGame = buildTestPlayer().build();

      // act
      const { value: gameEdited, events } = joinPlayer(game, playerThatWantsToJoinTheGame);

      // assert
      expect(gameEdited.players).toEqual([playerThatWantsToJoinTheGame]);
      expect(events).toEqual([playerJoinedGame({ gameId: game.id, playerId: playerThatWantsToJoinTheGame.id })]);
    });
    it('returns a GameAlreadyJoinedByPlayerError if the player is the host', () => {
      // arrange
      const host = buildTestPlayer().build();
      const game = buildTestGame()
        .withHost(host)
        .build();

      // act
      const { error } = joinPlayer(game, host);

      // assert
      expect(error).toEqual(GameError.GAME_ALREADY_JOINED);
    });
    it('returns a GameAlreadyJoinedByPlayerError if the player has already joined the game', () => {
      // arrange
      const host = buildTestPlayer().build();
      const player1 = buildTestPlayer().build();
      const player2 = buildTestPlayer().build();
      const game = buildTestGame()
        .withHost(host)
        .withPlayers([player1, player2])
        .build();

      // act
      const { error } = joinPlayer(game, player2);

      // assert
      expect(error).toEqual(GameError.GAME_ALREADY_JOINED);
    });
    it('returns a MaximumNumberOfPlayerReachedError when a player tries to join a game with already the maximum number of players in it', () => {
      // arrange
      const host = buildTestPlayer().build();
      const player = buildTestPlayer().build();
      const game = buildTestGame()
        .withHost(host)
        .asFullGame()
        .build();

      // act
      const { error } = joinPlayer(game, player);

      // assert
      expect(error).toEqual(GameError.MAXIMUM_NUMBER_OF_PLAYERS_REACHED);
    });
  });

  describe('start game', () => {
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
      const game = buildTestGame()
        .withXPlayers(3)
        .build();
      const player = buildTestPlayer().build();

      // act
      const { events, error } = startGame(game, player);

      // assert
      expect(events).toEqual([]);
      expect(error).toEqual(GameError.ONLY_HOST_CAN_START_GAME);
    });
    it("can't be started if there is not enough players", () => {
      // arrange
      const game = buildTestGame().build();
      const player = buildTestPlayer().build();

      // act
      const { events, error } = startGame(game, player);

      // assert
      expect(events).toEqual([]);
      expect(error).toEqual(GameError.NOT_ENOUGH_PLAYERS);
    });
  });
});
