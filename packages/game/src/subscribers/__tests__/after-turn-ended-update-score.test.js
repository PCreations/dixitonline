import { EventEmitter } from 'events';
import { events as turnEvents } from '@dixit/turn';
import { buildTestCard } from '../../__tests__/dataBuilders/card';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { makeAfterTurnEndedSubscriber } from '../after-turn-ended-update-score';
import { makeNullGameRepository } from '../../repos';
import { makeUpdateScore } from '../../useCases/update-score';

describe('after turn ended subscriber', () => {
  test('it should call the updateScore use case with the turn score', async () => {
    // arrange
    expect.assertions(1);
    const game = buildTestGame()
      .withXPlayers(2)
      .withScore()
      .build();
    const playersWithHandAndScore = [
      {
        playerId: game.host.id,
        hand: new Array(6).fill().map(() => buildTestCard().build()),
        score: 2,
      },
      {
        playerId: game.players[0].id,
        hand: new Array(6).fill().map(() => buildTestCard().build()),
        score: 4,
      },
      {
        playerId: game.players[1].id,
        hand: new Array(6).fill().map(() => buildTestCard().build()),
        score: 6,
      },
    ];
    const expectedTurnScore = {
      [game.host.id]: 2,
      [game.players[0].id]: 4,
      [game.players[1].id]: 6,
    };
    const gameRepository = makeNullGameRepository({});
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const updateScore = jest.fn(makeUpdateScore({ gameRepository, dispatchDomainEvents }));
    makeAfterTurnEndedSubscriber({
      subscribeToDomainEvent,
      updateScore,
    });

    // act
    dispatchDomainEvents([
      turnEvents.turnEnded({
        gameId: 'g1',
        id: 't1',
        storytellerId: 'p1',
        playersWithHandAndScore,
      }),
    ]);

    // assert
    expect(updateScore).toHaveBeenCalledWith({ gameId: 'g1', turnScore: expectedTurnScore });
  });
});
