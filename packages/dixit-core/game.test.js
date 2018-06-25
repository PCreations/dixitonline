/*global expect*/
const { Subject } = require('rxjs');
const createDixit = require('./dixit');

/*
Peut-être faire une sorte de PhaseState ou GameState qui contient la phase actuelle et qui gère le passage aux suivantes, etc.
*/

const db = {
  games: {},
};

const saveGame = async game => {
  db.games[game.id] = game;
};

const gamesObservable$ = new Subject();

const createTestDixit = playerIndex => createDixit({
  player: {
    id: `p${playerIndex + 1}`,
  },
  saveGame,
  gamesObservable$,
});

describe('given 3 players : p1, p2, p3', () => {
  const [dixitP1, dixitP2, dixitP3] = [...Array(3).keys()].map(createTestDixit);
  describe('when p1 creates a new game', async() => {
    let game;
    beforeAll(async() => {
      game = await dixitP1.games.create();
    });
    test('then the created game should be created with p1 as the only player', () => {
      expect(game.playersIds).toEqual(['p1']);
    });
    test('then the created game should be in "waiting for players" phase', () => {
      expect(game.phase).toBe(dixitP1.games.WAITING_FOR_PLAYERS_PHASE);
    });
  });
  describe('when a new game is emitted by gamesObservable$', () => {
    test('then the game should be added in the games list', async() => {
      const game = await dixitP1.games.create();
      gamesObservable$.next(game);
      expect(dixitP2.games.getAll()).toEqual({
        [game.id]: game
      });
      expect(dixitP3.games.getAll()).toEqual({
        [game.id]: game
      });
    });
  });
});

describe('given a game in "waiting for players" phase', () => {
  describe('when a new player join the game', async() => {
    let dixitP1, dixitP2, game;
    beforeAll(async() => {
      ([dixitP1, dixitP2] = [createTestDixit(0), createTestDixit(1)]);
      game = await dixitP1.games.create();
      gamesObservable$.next(game);
    });
    test('then the player should be added in the game', () => {
      dixitP2.games.joinGameById(game.id);
      expect(dixitP2.games.get(game.id).playersIds).toEqual(['p1', 'p2']);
    });
    describe('when the gameObservable$ emits an update to a game', () => {
      test('then the game should be correctly updated', async() => {
        const game2 = await dixitP1.games.create(); // we just create an new game to be sure that only the correct one is updated
        expect(dixitP1.games.get(game.id).playersIds).toEqual(['p1', 'p2']);
        expect(dixitP1.games.get(game2.id).playersIds).toEqual(['p1']);
      });
    });
    describe('when there is at least 3 players', () => {
      test('then the host can start the game thus changing phase to "game started"', () => {

      });
    });
  });
  describe('when a player in the game quits the game', () => {
    test('then the player should no longer be in the game', () => {

    });
    describe('when this player is the host', () => {
      describe('when there is other players in the game', () => {
        test('then the player should be told that the game can\'t be cancelled until there is players remaining', () => {

        });
      });
      describe('when there is no other player in the game', () => {
        test('then the game should be deleted', () => {

        });
      });
    });
  });
});

describe('given a game in "game started" phase', () => {
  describe('when the game has just passed in the "game started" phase', () => {
    test('then each player should be given a random position', () => {

    });
    test('then each player should be given 6 cards', () => {

    });
    test('then the player\'s order should be computed', () => {

    });
    test('then the game should be set in phase "teller"', () => {

    });
  });
});

describe('given a game "teller" phase', () => {
  describe('when the game has passed in the "teller" phase', () => {
    test('then the first next player should be set as the teller (if there is no teller yet, the first in the list is taken)', () => {

    });
    test('then the currentTurnNumber should be incremented', () => {

    });
  });
  describe('when the teller chose a card and a description', () => {
    test('');
    test('then the game should be set in phase "player choice"', () => {

    });
  });
});
