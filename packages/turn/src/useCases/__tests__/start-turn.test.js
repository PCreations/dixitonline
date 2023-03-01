import { buildTestTurn } from '../../__tests__/dataBuilders/turn';
import { buildTestHand } from '../../__tests__/dataBuilders/hand';
import { events as turnEvents } from '../../domain/events';
import { makeStartNewTurn } from '../start-new-turn';
import { makeNullTurnRepository } from '../../repos/turn-repository';

describe('start new turn', () => {
  it('starts a new turn by setting the first player as storyteller if there was no previous turn and dispatch a turn started event', async () => {
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
      .withStoryteller(players[0])
      .withPlayers(players)
      .build();
    const dispatchDomainEvents = jest.fn();
    const turnRepository = makeNullTurnRepository({ nextTurnId: expectedTurn.turn.id });
    const startNewTurn = makeStartNewTurn({ turnRepository, dispatchDomainEvents });

    // act
    await startNewTurn({
      players,
      gameId: 'g1',
    });

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.turn.id);

    expect(turn).toEqual(expectedTurn);
    expect(dispatchDomainEvents).toHaveBeenCalledWith([
      turnEvents.turnStarted({
        id: turn.turn.id,
        gameId: turn.turn.gameId,
        storytellerId: turn.turn.storytellerId,
        players,
      }),
      turnEvents.turnUpdated({
        id: turn.turn.id,
      }),
    ]);
  });
  it('starts a new turn by setting the next player as the storyteller if there was a previous turn', async () => {
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
    const dispatchDomainEvents = jest.fn();
    const previousTurn = buildTestTurn()
      .withGameId('g1')
      .withStoryteller(players[0])
      .withPlayers(players);
    const previousTurnHistory = previousTurn.getHistory();
    const previousTurnId = previousTurn.build().turn.id;
    const expectedTurn = buildTestTurn()
      .withGameId('g1')
      .withStoryteller(players[1])
      .withPlayers(players)
      .build();
    const turnRepository = makeNullTurnRepository({
      nextTurnId: expectedTurn.turn.id,
      initialHistory: { [previousTurnId]: previousTurnHistory },
    });
    const startNewTurn = makeStartNewTurn({ turnRepository, dispatchDomainEvents });

    // act
    await startNewTurn({
      players,
      gameId: 'g1',
      previousTurnId,
    });

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.turn.id);
    expect(turn).toEqual(expectedTurn);
  });
  it('starts a new turn by setting the first player as the storyteller if last player was the storyteller the last turn', async () => {
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
    const dispatchDomainEvents = jest.fn();
    const previousTurn = buildTestTurn()
      .withGameId('g1')
      .withStoryteller(players[2])
      .withPlayers(players);
    const previousTurnHistory = previousTurn.getHistory();
    const previousTurnId = previousTurn.build().turn.id;
    const expectedTurn = buildTestTurn()
      .withGameId('g1')
      .withStoryteller(players[0])
      .withPlayers(players)
      .build();
    const turnRepository = makeNullTurnRepository({
      nextTurnId: expectedTurn.turn.id,
      initialHistory: { [previousTurnId]: previousTurnHistory },
    });
    const startNewTurn = makeStartNewTurn({ turnRepository, dispatchDomainEvents });

    // act
    await startNewTurn({
      players,
      gameId: 'g1',
      previousTurnId,
    });

    // assert
    const turn = await turnRepository.getTurnById(expectedTurn.turn.id);
    expect(turn).toEqual(expectedTurn);
  });
});
