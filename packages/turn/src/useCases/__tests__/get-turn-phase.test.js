import { makeGetTurnPhase } from '../get-turn-phase';
import { makeNullTurnRepository } from '../../repos/turn-repository';
import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { buildTestPlayer } from '../../__tests__/dataBuilders/player';

describe('getTurnPhase', () => {
  describe('storyteller phase', () => {
    test('viewed as storyteller', async () => {
      // arrange
      const storyteller = buildTestPlayer().build();
      const otherPlayers = [buildTestPlayer().build(), buildTestPlayer().build()];
      const turn = buildTestTurn()
        .withStorytellerId(storyteller.id)
        .withPlayers([storyteller, ...otherPlayers])
        .build();
      const turnRepository = makeNullTurnRepository({ initialData: { [turn.id]: turn } });
      const getTurnPhase = makeGetTurnPhase({ turnRepository });

      // act
      const { value } = await getTurnPhase({ turnId: turn.id, playerId: storyteller.id });

      // assert
      expect(value).toEqual({
        storytellerId: storyteller.id,
        hand: storyteller.hand,
      });
    });
    test('viewed as a player', async () => {
      // arrange
      const storyteller = buildTestPlayer().build();
      const otherPlayers = [buildTestPlayer().build(), buildTestPlayer().build()];
      const turn = buildTestTurn()
        .withStorytellerId(storyteller.id)
        .withPlayers([storyteller, ...otherPlayers])
        .build();
      const turnRepository = makeNullTurnRepository({ initialData: { [turn.id]: turn } });
      const getTurnPhase = makeGetTurnPhase({ turnRepository });

      // act
      const { value } = await getTurnPhase({ turnId: turn.id, playerId: otherPlayers[0].id });

      // assert
      expect(value).toEqual({
        storytellerId: storyteller.id,
        hand: otherPlayers[0].hand,
      });
    });
  });
});
