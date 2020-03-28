import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { makeStartNewTurn } from '../start-new-turn';
import { makeNullTurnRepository } from '../../repos/turn-repository';

describe('start new turn', () => {
  it('starts a new turn', async () => {
    // arrange
    const expectedTurn = buildTestTurn().build();
    const turnRepository = makeNullTurnRepository({ nextTurnId: expectedTurn.id });
    const startNewTurn = makeStartNewTurn({ turnRepository });

    // act
    await startNewTurn({
      players: expectedTurn.players,
      storytellerId: expectedTurn.players[0].id,
    });

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.id);
    expect(turn).toEqual(expectedTurn);
  });
});
