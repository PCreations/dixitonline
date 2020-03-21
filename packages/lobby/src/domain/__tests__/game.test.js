import { makeGame, joinPlayer } from '../game';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { playerJoinedGame } from '../events';

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
});
