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
    // {
    //   storyTeller: 'p1',
    //   players: [
    //     {
    //       id: 'p1',
    //       name: 'player1',
    //       hand: [
    //         { id: 'c1', url: 'https://cards.url/c1.png' },
    //         { id: 'c2', url: 'https://cards.url/c2.png' },
    //         { id: 'c3', url: 'https://cards.url/c3.png' },
    //         { id: 'c4', url: 'https://cards.url/c4.png' },
    //         { id: 'c5', url: 'https://cards.url/c5.png' },
    //         { id: 'c6', url: 'https://cards.url/c6.png' },
    //       ],
    //     },
    //     {
    //       id: 'p2',
    //       name: 'player2',
    //       hand: [
    //         { id: 'c7', url: 'https://cards.url/c7.png' },
    //         { id: 'c8', url: 'https://cards.url/c8.png' },
    //         { id: 'c9', url: 'https://cards.url/c9.png' },
    //         { id: 'c10', url: 'https://cards.url/c10.png' },
    //         { id: 'c11', url: 'https://cards.url/c11.png' },
    //         { id: 'c12', url: 'https://cards.url/c12.png' },
    //       ],
    //     },
    //     {
    //       id: 'p3',
    //       name: 'player3',
    //       hand: [
    //         { id: 'c13', url: 'https://cards.url/c13.png' },
    //         { id: 'c14', url: 'https://cards.url/c14.png' },
    //         { id: 'c15', url: 'https://cards.url/c15.png' },
    //         { id: 'c16', url: 'https://cards.url/c16.png' },
    //         { id: 'c17', url: 'https://cards.url/c17.png' },
    //         { id: 'c18', url: 'https://cards.url/c18.png' },
    //       ],
    //     },
    //   ],
    // }
    await startNewTurn();

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.id);
    expect(turn).toEqual(expectedTurn);
  });
});
