import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import {
  makeGame,
  getNumberOfCardsByHand,
  getEndCondition,
  createGame,
  joinPlayer,
  startGame,
  updateDeck,
  completeHands,
  updateScore,
  setCurrentTurn,
  GameError,
  getAllPlayers,
  GameStatus,
  NUMBER_OF_CARDS_IN_A_DECK,
  DEFAULT_END_CONDITION,
  makeNullCards,
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
    const players = [
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
    ];
    const cards = new Array(48).fill().map(() => buildTestCard().build());
    const drawPile = new Array(10).fill().map(() => buildTestCard().build());
    const score = { [players[0].id]: 1, [players[1].id]: 3, [players[2].id]: 5 };
    const game = makeGame({
      id: '1',
      host,
      players,
      cards,
      drawPile,
      score,
      status: GameStatus.STARTED,
      currentTurn: {
        id: 't1',
        storytellerId: players[0].id,
      },
      endCondition: {
        xTimesStorytellerLimit: 2,
      },
    });
    expect(game).toEqual({
      id: '1',
      host,
      isPrivate: true,
      players,
      cards,
      drawPile,
      score,
      status: GameStatus.STARTED,
      currentTurn: { id: 't1', storytellerId: players[0].id },
      endCondition: {
        xTimesStorytellerLimit: 2,
      },
    });
  });
  it('must be created with a status WAITING_FOR_PLAYERS by default, an empty cards array, an empty score map and currentTurnId null and the default remaining turns strategy', () => {
    const host = buildTestPlayer().build();
    const players = [buildTestPlayer().build(), buildTestPlayer().build()];
    const game = makeGame({ id: '1', host, players });
    expect(game).toEqual({
      id: '1',
      host,
      isPrivate: true,
      players,
      status: GameStatus.WAITING_FOR_PLAYERS,
      cards: makeNullCards(),
      drawPile: [],
      score: {},
      currentTurn: {
        id: null,
        storytellerId: null,
        number: 0,
      },
      endCondition: DEFAULT_END_CONDITION,
    });
  });
  it('must be created with a valid end condition', () => {
    expect(() =>
      makeGame(
        buildTestGame()
          .withXtimesStorytellerLimit(2)
          .build()
      )
    ).not.toThrow();
    expect(() =>
      makeGame(
        buildTestGame()
          .withScoreLimit(30)
          .build()
      )
    ).not.toThrow();
    expect(() => makeGame(buildTestGame({ endCondition: 'not valid' }).build())).toThrow(
      'Invalid end condition, received "not valid"'
    );
  });
  it('must have an id', () => {
    expect(() => makeGame({ id: undefined })).toThrow('Game must contain an id');
  });
  it('must have an host if not in EXPIRED state', () => {
    expect(() => makeGame({ id: 'g1' })).toThrow('Game must have an host');
  });
  it('can be created without an host if game is in EXPIRED state', () => {
    expect(() => makeGame({ id: 'g1', status: GameStatus.EXPIRED })).not.toThrow('Game must have an host');
  });
  it('players list must be empty by default', () => {
    const host = buildTestPlayer().build();
    const game = makeGame({ id: 'g1', host });

    expect(game.players).toEqual([]);
  });

  describe('getNumberOfCardsByHand', () => {
    it('should be 6 for a game with more than 3 players', () => {
      const game = buildTestGame()
        .withXPlayers(3)
        .build();

      expect(getNumberOfCardsByHand(game)).toBe(6);
    });
    it('should be 7 for a game with 3 players', () => {
      const game = buildTestGame()
        .withXPlayers(2)
        .build();

      expect(getNumberOfCardsByHand(game)).toBe(7);
    });
  });

  describe('getEndCondition', () => {
    describe('default end condition', () => {
      it('returns the remaining turns until the deck is empty', () => {
        // arrange
        const game = buildTestGame()
          .withXPlayers(5)
          .withCards(48)
          .withStartedStatus()
          .build();

        // act
        const endCondition = getEndCondition(game);

        // assert
        expect(endCondition).toEqual({
          remainingTurns: 8,
        });
      });
      it('floors the remaining turns', () => {
        // arrange
        const game = buildTestGame()
          .withXPlayers(4)
          .withCards(54)
          .withStartedStatus()
          .build();

        // act
        const endCondition = getEndCondition(game);

        // assert
        expect(endCondition).toEqual({
          remainingTurns: 10,
        });
      });
    });
    describe('x times storyteller condition', () => {
      it.each`
        xTimesStorytellerLimit | currentTurnNumber | playersCount | expectedRemainingTurns
        ${1}                   | ${1}              | ${4}         | ${3}
        ${1}                   | ${4}              | ${4}         | ${0}
        ${2}                   | ${1}              | ${4}         | ${7}
        ${2}                   | ${5}              | ${4}         | ${3}
      `(
        'given a game with $playersCount players and the xTimesStorytellerLimit is $xTimesStorytellerLimit, when the current turn number is $currentTurnNumber then the remainingTurns is $expectedRemainingTurns',
        ({ xTimesStorytellerLimit, playersCount, currentTurnNumber, expectedRemainingTurns }) => {
          const game = buildTestGame()
            .withXPlayers(playersCount - 1)
            .withXtimesStorytellerLimit(xTimesStorytellerLimit)
            .withCurrentTurnNumber(currentTurnNumber)
            .build();
          expect(getEndCondition(game)).toEqual({
            remainingTurns: expectedRemainingTurns,
          });
        }
      );
    });
    describe('score limit condition', () => {
      it('returns the score limit', () => {
        // arrange
        const game = buildTestGame()
          .withScoreLimit(30)
          .build();

        // act
        const endCondition = getEndCondition(game);

        // assert
        expect(endCondition).toEqual({
          scoreLimit: 30,
        });
      });
    });
  });

  describe('create game', () => {
    it('creates a game without ending condition', () => {
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
    it('creates a game with x times storyteller ending condition', () => {
      // arrange
      const host = buildTestPlayer().build();

      // act
      const result = createGame({ gameId: 'g1', host, endCondition: { xTimesStorytellerLimit: 2 } });

      // assert
      expect({ ...result.value }).toEqual({
        ...buildTestGame()
          .withId('g1')
          .withHost(host)
          .withXtimesStorytellerLimit(2)
          .build(),
      });
      expect(result.events).toEqual([newGameCreatedEvent({ gameId: 'g1' })]);
      expect(result.error).toBeUndefined();
    });
    it("can't be created with a xTimesStorytellerLimit set to number < 1", () => {
      // arrange
      const host = buildTestPlayer().build();

      // act
      const { error } = createGame({
        gameId: 'g1',
        host,
        endCondition: {
          xTimesStorytellerLimit: -1,
        },
      });

      // assert
      expect(error).toEqual(GameError.X_TIMES_STORYTELLER_CANT_BE_LESS_THAN_ONE);
    });
    it('creates a game with a score limit ending condition', () => {
      // arrange
      const host = buildTestPlayer().build();

      // act
      const result = createGame({ gameId: 'g1', host, endCondition: { scoreLimit: 30 } });

      // assert
      expect({ ...result.value }).toEqual({
        ...buildTestGame()
          .withId('g1')
          .withHost(host)
          .withScoreLimit(30)
          .build(),
      });
      expect(result.events).toEqual([newGameCreatedEvent({ gameId: 'g1' })]);
      expect(result.error).toBeUndefined();
    });
    it("can't create a game with a score limit set to number < 1", () => {
      // arrange
      const host = buildTestPlayer().build();

      // act
      const { error } = createGame({ gameId: 'g1', host, endCondition: { scoreLimit: -1 } });

      // assert
      expect(error).toEqual(GameError.SCORE_LIMIT_CANT_BE_LESS_THAN_ONE);
    });
  });

  describe('join player', () => {
    it('joins a player', () => {
      // arrange
      const now = new Date();
      const host = buildTestPlayer().build();
      const game = makeGame({ id: 'g1', host });
      const playerThatWantsToJoinTheGame = buildTestPlayer()
        .joinedAt(now)
        .build();

      // act
      const { value: gameEdited, events } = joinPlayer(game, playerThatWantsToJoinTheGame);

      // assert
      expect(gameEdited.players).toEqual([
        {
          id: playerThatWantsToJoinTheGame.id,
          name: playerThatWantsToJoinTheGame.name,
          heartbeat: now,
        },
      ]);
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
        newGameStartedEvent({ gameId: game.id, playerIds: getAllPlayers(game).map(({ id }) => id), useAllDeck: false }),
      ]);
      expect(error).toBeUndefined();
    });
    it('can be started with all the deck if the player who wants to start the game is the host and the ending condition is not the default one', () => {
      // arrange
      const game = buildTestGame()
        .withXPlayers(3)
        .withScoreLimit(30)
        .build();

      // act
      const { value, events, error } = startGame(game, game.host);

      // assert
      expect(value).toEqual({
        ...game,
        status: GameStatus.STARTED,
      });
      expect(events).toEqual([
        newGameStartedEvent({ gameId: game.id, playerIds: getAllPlayers(game).map(({ id }) => id), useAllDeck: true }),
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

  describe('update deck', () => {
    it('updates the draw pile with the discarded cards of the previous turn', () => {
      // arrange
      const drawPile = new Array(5).fill().map(() => buildTestCard().build());
      const discardedCards = new Array(5).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .withXPlayers(2)
        .withCards(50)
        .withDrawPile(drawPile)
        .withStartedStatus()
        .build();

      // act
      const result = updateDeck(game, { discardedCards });

      // assert
      expect(result.value.drawPile).toEqual([...drawPile, ...discardedCards]);
    });
    it('completes the cards with the draw pile if the number of cards is below the number of players and there at least 1 remaining turns', () => {
      // arrange
      const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
      const drawPile = new Array(30).fill().map(() => buildTestCard().build());
      const discardedCards = new Array(5).fill().map(() => buildTestCard().build());
      const shuffledDeck = new Array(2).fill().map(() => buildTestCard().build());
      const expectedNewShuffledDeck = shuffle([...drawPile, ...discardedCards, ...shuffledDeck]);
      const game = buildTestGame()
        .withXPlayers(2)
        .withShuffledDeck(shuffledDeck)
        .withDrawPile(drawPile)
        .withStartedStatus()
        .withXtimesStorytellerLimit(5)
        .withCurrentTurnNumber(12)
        .build();

      // act
      const result = updateDeck(game, {
        discardedCards,
        shuffle,
      });

      // assert
      expect(result.value.drawPile).toEqual([]);
      expect(result.value.cards).toEqual(expectedNewShuffledDeck);
    });
    it('completes the cards with the draw pile if the number of cards is below the number of players and the end condition is score limit', () => {
      // arrange
      const shuffle = toShuffle => shuffleWithSeed(toShuffle, 'seed');
      const drawPile = new Array(30).fill().map(() => buildTestCard().build());
      const discardedCards = new Array(5).fill().map(() => buildTestCard().build());
      const shuffledDeck = new Array(2).fill().map(() => buildTestCard().build());
      const expectedNewShuffledDeck = shuffle([...drawPile, ...discardedCards, ...shuffledDeck]);
      const game = buildTestGame()
        .withXPlayers(2)
        .withShuffledDeck(shuffledDeck)
        .withDrawPile(drawPile)
        .withStartedStatus()
        .withScoreLimit(30)
        .build();

      // act
      const result = updateDeck(game, {
        discardedCards,
        shuffle,
      });

      // assert
      expect(result.value.drawPile).toEqual([]);
      expect(result.value.cards).toEqual(expectedNewShuffledDeck);
    });
    it('does not complete the cards with the draw pile if the number of cards is below the number of players and the end condition is the default one', () => {
      // arrange
      const drawPile = new Array(30).fill().map(() => buildTestCard().build());
      const discardedCards = new Array(5).fill().map(() => buildTestCard().build());
      const shuffledDeck = new Array(2).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .withXPlayers(2)
        .withShuffledDeck(shuffledDeck)
        .withDrawPile(drawPile)
        .withStartedStatus()
        .build();

      // act
      const result = updateDeck(game, {
        discardedCards,
      });

      // assert
      expect(result.value.drawPile).toEqual([...drawPile, ...discardedCards]);
      expect(result.value.cards).toEqual(shuffledDeck);
    });
  });

  describe('complete hand', () => {
    it('returns the hands for the player by removing cards from the deck when no hands have been dealt yet and correctly computes the remaining turns number', () => {
      // arrange
      const shuffledDeck = new Array(NUMBER_OF_CARDS_IN_A_DECK).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .asFullGame()
        .withStartedStatus()
        .build();
      const totalNumberOfPlayers = 6;
      const expectedHostHand = shuffledDeck.slice(0, 6);
      const expectedPlayer1Hand = shuffledDeck.slice(6, 12);
      const expectedPlayer2Hand = shuffledDeck.slice(12, 18);
      const expectedPlayer3Hand = shuffledDeck.slice(18, 24);
      const expectedPlayer4Hand = shuffledDeck.slice(24, 30);
      const expectedPlayer5Hand = shuffledDeck.slice(30, 36);

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
            [game.players[2].id]: expectedPlayer3Hand,
            [game.players[3].id]: expectedPlayer4Hand,
            [game.players[4].id]: expectedPlayer5Hand,
          },
        })
      );
    });

    it("completes with one card each player's hand when given previous hands and return the full new hand", () => {
      // arrange
      const shuffledDeck = new Array(50).fill().map(() => buildTestCard().build());
      const game = buildTestGame()
        .withXPlayers(3)
        .withStartedStatus()
        .withShuffledDeck(shuffledDeck)
        .build();
      const totalNumberOfPlayers = 4;
      const actualHandsByPlayerId = {
        [game.host.id]: new Array(5).fill().map(() => buildTestCard().build()),
        [game.players[0].id]: new Array(5).fill().map(() => buildTestCard().build()),
        [game.players[1].id]: new Array(5).fill().map(() => buildTestCard().build()),
        [game.players[2].id]: new Array(5).fill().map(() => buildTestCard().build()),
      };
      const expectedHands = {
        [game.host.id]: actualHandsByPlayerId[game.host.id].concat(shuffledDeck[0]),
        [game.players[0].id]: actualHandsByPlayerId[game.players[0].id].concat(shuffledDeck[1]),
        [game.players[1].id]: actualHandsByPlayerId[game.players[1].id].concat(shuffledDeck[2]),
        [game.players[2].id]: actualHandsByPlayerId[game.players[2].id].concat(shuffledDeck[3]),
      };

      // act
      const { events, value } = completeHands(game, { actualHandsByPlayerId, previousTurnId: 't1' });

      // assert
      expect(value.cards).toEqual(shuffledDeck.slice(totalNumberOfPlayers));
      expect(events).toContainEqual(
        handsCompletedEvent({
          gameId: game.id,
          handsByPlayerId: expectedHands,
          previousTurnId: 't1',
        })
      );
    });

    it("3 players mode : completes with two cards each player's hand when given previous hands and return the full new hand", () => {
      // arrange
      const shuffledDeck = new Array(50).fill().map((_, index) =>
        buildTestCard()
          .withId(`${index + 16}`)
          .build()
      );
      const game = buildTestGame()
        .withXPlayers(2)
        .withStartedStatus()
        .withShuffledDeck(shuffledDeck)
        .build();
      const actualHandsByPlayerId = {
        [game.host.id]: new Array(6).fill().map((_, index) =>
          buildTestCard()
            .withId(`${index}`)
            .build()
        ),
        [game.players[0].id]: new Array(5).fill().map((_, index) =>
          buildTestCard()
            .withId(`${index + 6}`)
            .build()
        ),
        [game.players[1].id]: new Array(5).fill().map((_, index) =>
          buildTestCard()
            .withId(`${index + 11}`)
            .build()
        ),
      };
      const totalCardsDrawn = 5;
      const expectedHands = {
        [game.host.id]: actualHandsByPlayerId[game.host.id].concat(shuffledDeck[0]),
        [game.players[0].id]: actualHandsByPlayerId[game.players[0].id].concat(shuffledDeck[1], shuffledDeck[2]),
        [game.players[1].id]: actualHandsByPlayerId[game.players[1].id].concat(shuffledDeck[3], shuffledDeck[4]),
      };

      // act
      const { events, value } = completeHands(game, { actualHandsByPlayerId, previousTurnId: 't1' });

      // assert
      expect(value.cards).toEqual(shuffledDeck.slice(totalCardsDrawn));
      expect(events[0]).toEqual(
        handsCompletedEvent({
          gameId: game.id,
          handsByPlayerId: expectedHands,
          previousTurnId: 't1',
        })
      );
    });

    it('returns a game ended event if there is not enough cards to complete hands', () => {
      // arrange
      const shuffledDeck = new Array(2).fill().map(() => buildTestCard().build());
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
    test('correctly updates the score', () => {
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
    test('ends the game if the score limit is reached', () => {
      // arrange
      const game = buildTestGame()
        .withXPlayers(2)
        .withCards(48)
        .withScoreLimit(30)
        .withScore([10, 20, 25])
        .build();
      const turnScore = {
        [game.host.id]: 2,
        [game.players[0].id]: 1,
        [game.players[1].id]: 5,
      };

      // act
      const { value: editedGame, events } = updateScore(game, turnScore);

      // assert
      expect(editedGame.status).toEqual(GameStatus.ENDED);
      expect(events).toEqual([gameEndedEvent({ gameId: game.id })]);
    });
  });

  describe('set current turn', () => {
    // arrange
    const game = buildTestGame()
      .withCurrentTurnNumber(1)
      .build();
    const currentTurn = {
      id: 't1',
      storytellerId: 'p2',
    };

    // act
    const { value: editedGame } = setCurrentTurn(game, currentTurn);

    // assert
    expect(editedGame.currentTurn).toEqual({
      ...currentTurn,
      number: 2,
    });
  });
});
