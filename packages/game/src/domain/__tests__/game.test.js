import {
  makeGame,
  createGame,
  joinPlayer,
  startGame,
  completeHands,
  updateScore,
  setCurrentTurn,
  GameError,
  getAllPlayers,
  GameStatus,
} from '../game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import {
  playerJoinedGame,
  newGameStartedEvent,
  newGameCreatedEvent,
  handsCompletedEvent,
  gameEndedEvent,
} from '../events';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { buildTestCard } from '../../__tests__/dataBuilders/card';

describe('Game', () => {
  it('can be correctly created', () => {
    const host = buildTestPlayer().build();
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    const cards = [buildTestCard().build(), buildTestCard().build(), buildTestCard().build()];
    const score = { [players[0].id]: 1, [players[1].id]: 3, [players[2].id]: 5 };
    const game = makeGame({
      id: '1',
      host,
      players,
      cards,
      score,
      status: GameStatus.STARTED,
      currentTurn: {
        id: 't1',
        storytellerId: players[0].id,
      },
    });
    expect(game).toEqual({
      id: '1',
      host,
      players,
      cards,
      score,
      status: GameStatus.STARTED,
      currentTurn: { id: 't1', storytellerId: players[0].id },
    });
  });
  it('must be created with a status WAITING_FOR_PLAYERS by default, an empty cards array, an empty score map and currentTurnId null', () => {
    const host = buildTestPlayer().build();
    const players = [buildTestPlayer().build(), buildTestPlayer().build()];
    const game = makeGame({ id: '1', host, players });
    expect(game).toEqual({
      id: '1',
      host,
      players,
      status: GameStatus.WAITING_FOR_PLAYERS,
      cards: [],
      score: {},
      currentTurn: {
        id: null,
        storytellerId: null,
      },
    });
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
      expect(value).toEqual({
        ...game,
        status: GameStatus.STARTED,
      });
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
    it("can't be started if the game is already started", () => {
      // arrange
      const game = buildTestGame()
        .withStartedStatus()
        .build();
      const player = buildTestPlayer().build();

      // act
      const { events, error } = startGame(game, player);

      // assert
      expect(events).toEqual([]);
      expect(error).toEqual(GameError.GAME_ALREADY_STARTED);
    });
  });

  describe('complete hand', () => {
    it('returns the hands for the player by removing cards from the deck when when no hands have been dealt yet', () => {
      // arrange
      const shuffledDeck = new Array(50).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .withXPlayers(2)
        .withStartedStatus()
        .build();
      const totalNumberOfPlayers = 3;
      const expectedHostHand = shuffledDeck.slice(0, 6);
      const expectedPlayer1Hand = shuffledDeck.slice(6, 12);
      const expectedPlayer2Hand = shuffledDeck.slice(12, 18);

      // act
      const { events, value } = completeHands(game, { cards: shuffledDeck });

      // assert
      expect(value.cards).toEqual(shuffledDeck.slice(6 * totalNumberOfPlayers));
      expect(events).toContainEqual(
        handsCompletedEvent({
          gameId: game.id,
          handsByPlayerId: {
            [game.host.id]: expectedHostHand,
            [game.players[0].id]: expectedPlayer1Hand,
            [game.players[1].id]: expectedPlayer2Hand,
          },
        })
      );
    });

    it("completes with one card each player's hand when given previous hands and return the full new hand", () => {
      // arrange
      const shuffledDeck = new Array(50).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .withXPlayers(2)
        .withStartedStatus()
        .withShuffledDeck(shuffledDeck)
        .build();
      const totalNumberOfPlayers = 3;
      const actualHandsByPlayerId = {
        [game.host.id]: new Array(6).fill().map(() => buildTestCard().build()),
        [game.players[0].id]: new Array(6).fill().map(() => buildTestCard().build()),
        [game.players[1].id]: new Array(6).fill().map(() => buildTestCard().build()),
      };
      const expectedHands = {
        [game.host.id]: actualHandsByPlayerId[game.host.id].concat(shuffledDeck[0]),
        [game.players[0].id]: actualHandsByPlayerId[game.players[0].id].concat(shuffledDeck[1]),
        [game.players[1].id]: actualHandsByPlayerId[game.players[1].id].concat(shuffledDeck[2]),
      };

      // act
      const { events, value } = completeHands(game, { actualHandsByPlayerId });

      // assert
      expect(value.cards).toEqual(shuffledDeck.slice(totalNumberOfPlayers));
      expect(events).toContainEqual(
        handsCompletedEvent({
          gameId: game.id,
          handsByPlayerId: expectedHands,
        })
      );
    });
    it('returns a game ended event if there is not enough cards to complete hands', () => {
      // arrange
      const shuffledDeck = new Array(15).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .withXPlayers(2)
        .withStartedStatus()
        .withShuffledDeck(shuffledDeck)
        .build();
      const actualHandsByPlayerId = {
        [game.host.id]: new Array(6).fill().map(() => buildTestCard().build()),
        [game.players[0].id]: new Array(6).fill().map(() => buildTestCard().build()),
        [game.players[1].id]: new Array(6).fill().map(() => buildTestCard().build()),
      };

      // act
      const { events, value } = completeHands(game, { actualHandsByPlayerId });

      // assert
      expect(value.status).toEqual(GameStatus.ENDED);
      expect(events).toContainEqual(
        gameEndedEvent({
          gameId: game.id,
        })
      );
    });
  });

  describe('update score', () => {
    // arrange
    const game = buildTestGame()
      .withXPlayers(2)
      .withScore()
      .build();
    const turnScore = {
      [game.host.id]: 2,
      [game.players[0].id]: 1,
      [game.players[1].id]: 5,
    };

    // act
    const { value: editedGame } = updateScore(game, turnScore);

    // assert
    expect(editedGame.score).toEqual({
      [game.host.id]: game.score[game.host.id] + 2,
      [game.players[0].id]: game.score[game.players[0].id] + 1,
      [game.players[1].id]: game.score[game.players[1].id] + 5,
    });
  });

  describe('set current turn', () => {
    // arrange
    const game = buildTestGame().build();
    const currentTurn = {
      id: 't1',
      storytellerId: 'p1',
    };

    // act
    const { value: editedGame } = setCurrentTurn(game, currentTurn);

    // assert
    expect(editedGame.currentTurn).toEqual(currentTurn);
  });
});
