import { EventEmitter } from 'events';
import { events as turnEvents } from '@dixit/turn';
import { buildTestCard } from '../../__tests__/dataBuilders/card';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { makeAfterTurnEndedCompleteHandsSubscriber } from '../after-turn-ended-complete-hands';
import { makeNullGameRepository } from '../../repos';
import { makeCompleteHands } from '../../useCases/complete-hands';

describe('after turn ended subscriber', () => {
  test('it should call the completeHands use case with the actual hands of the ended turn', async () => {
    // arrange
    expect.assertions(1);
    const shuffledDeck = new Array(50).fill().map(() => buildTestCard().build());
    const game = buildTestGame()
      .withXPlayers(2)
      .withStartedStatus()
      .withShuffledDeck(shuffledDeck)
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
    const actualHandsByPlayerId = playersWithHandAndScore.reduce(
      (hands, { playerId, hand }) => ({
        ...hands,
        [playerId]: hand,
      }),
      {}
    );
    const gameRepository = makeNullGameRepository({});
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const completeHands = jest.fn(makeCompleteHands({ gameRepository, dispatchDomainEvents }));
    makeAfterTurnEndedCompleteHandsSubscriber({
      subscribeToDomainEvent,
      completeHands,
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
    expect(completeHands).toHaveBeenCalledWith({ gameId: 'g1', actualHandsByPlayerId });
  });
});
