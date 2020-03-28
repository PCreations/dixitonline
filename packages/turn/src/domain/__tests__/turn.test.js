import { TurnPhase, makeTurn, getTurnPhaseAs } from '../turn';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';

describe('turn', () => {
  it('can be correctly created', () => {
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    expect(makeTurn({ id: 't1', players, storytellerId: players[0].id })).toEqual({
      id: 't1',
      phase: TurnPhase.STORYTELLER,
      storytellerId: players[0].id,
      players,
    });
  });
  it('cannot be created without an id', () => {
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    expect(() => makeTurn({ players, storytellerId: players[0].id })).toThrow('A turn must contain an id');
  });
  it('cannot be created without an storytellerId', () => {
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    expect(() => makeTurn({ players, id: 't1' })).toThrow('A turn must contain a storytellerId');
  });
  it('cannot be created with less than 3 players', () => {
    const players = [buildTestPlayer().build(), buildTestPlayer().build()];
    expect(() => makeTurn({ id: 't1', players, storytellerId: 'someId' })).toThrow(
      'A turn must have at least 3 players'
    );
  });
  it('cannot be created with more than 6 players', () => {
    const players = [
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
      buildTestPlayer().build(),
    ];
    expect(() => makeTurn({ id: 't1', players, storytellerId: 'someId' })).toThrow(
      'A turn must have less than 6 players'
    );
  });
  it('cannot be created with a storyteller id that is not part of the players', () => {
    const players = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
    expect(() => makeTurn({ id: 't1', players, storytellerId: 'notAplayerId' })).toThrow(
      'Storyteller must be part of the players'
    );
  });
});

describe('get phase', () => {
  describe('storyteller phase', () => {
    it('gets the current phase as the storyteller', () => {
      // arrange
      const storytellerHand = buildTestHand().build();
      const storyteller = buildTestPlayer()
        .withHand(storytellerHand)
        .build();
      const otherPlayers = [buildTestPlayer().build(), buildTestPlayer().build()];
      const turn = buildTestTurn()
        .withStorytellerId(storyteller.id)
        .withPlayers([storyteller, ...otherPlayers])
        .build();

      // act
      const phase = getTurnPhaseAs(turn, storyteller.id);

      // assert
      expect(phase).toEqual({
        storytellerId: storyteller.id,
        hand: storyteller.hand,
      });
    });
    it('gets the current phase as a player that is not the storyteller', () => {
      // arrange
      const storytellerHand = buildTestHand().build();
      const storyteller = buildTestPlayer()
        .withHand(storytellerHand)
        .build();
      const otherPlayers = [buildTestPlayer().build(), buildTestPlayer().build()];
      const turn = buildTestTurn()
        .withStorytellerId(storyteller.id)
        .withPlayers([storyteller, ...otherPlayers])
        .build();

      // act
      const phase = getTurnPhaseAs(turn, otherPlayers[0].id);

      // assert
      expect(phase).toEqual({
        storytellerId: storyteller.id,
        hand: otherPlayers[0].hand,
      });
    });
  });
});
