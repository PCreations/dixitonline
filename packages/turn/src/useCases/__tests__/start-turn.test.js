import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { makeStartNewTurn } from '../start-new-turn';
import { makeNullTurnRepository } from '../../repos/turn-repository';

describe('start new turn', () => {
  it('starts a new turn', async () => {
    // arrange
    const players = [
      {
        id: 'p1',
        name: 'player1',
        hand: buildTestHand().build(),
      },
      {
        id: 'p2',
        name: 'player2',
        hand: buildTestHand().build(),
      },
      {
        id: 'p3',
        name: 'player3',
        hand: buildTestHand().build(),
      },
    ];
    const expectedTurn = buildTestTurn()
      .withGameId('g1')
      .withPlayers(players)
      .build();
    const turnRepository = makeNullTurnRepository({ nextTurnId: expectedTurn.turn.id });
    const startNewTurn = makeStartNewTurn({ turnRepository });

    // act
    await startNewTurn({
      players,
      storytellerId: expectedTurn.turn.storytellerId,
      gameId: 'g1',
    });

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.turn.id);
    expect(turn).toEqual(expectedTurn);
  });
});
