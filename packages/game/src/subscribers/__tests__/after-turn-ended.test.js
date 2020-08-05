import { EventEmitter } from 'events';
import { events as turnEvents } from '@dixit/turn';
import { buildTestCard } from '../../__tests__/dataBuilders/card';
import { buildTestGame } from '../../__tests__/dataBuilders/game';
import { makeAfterTurnEndedSubscriber } from '../after-turn-ended';
import { makeNullGameRepository } from '../../repos';
import { makeHandleTurnEnded } from '../../useCases/handle-turn-ended';

describe('after turn ended subscriber', () => {
  test('it should call the handleCompleteHands use case with the correct params', async () => {
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
    const turnScore = {
      [game.host.id]: 2,
      [game.players[0].id]: 4,
      [game.players[1].id]: 6,
    };
    const actualHandsByPlayerId = playersWithHandAndScore.reduce(
      (hands, { playerId, hand }) => ({
        ...hands,
        [playerId]: hand,
      }),
      {}
    );
    const discardedCards = new Array(3).fill().map(() => buildTestCard().build());
    const gameRepository = makeNullGameRepository({
      gamesData: { [game.id]: game },
    });
    const eventEmitter = new EventEmitter();
    const dispatchDomainEvents = events => events.map(event => eventEmitter.emit(event.type, event));
    const subscribeToDomainEvent = eventEmitter.on.bind(eventEmitter);
    const handleTurnEnded = jest.fn(makeHandleTurnEnded({ gameRepository, dispatchDomainEvents }));
    makeAfterTurnEndedSubscriber({
      subscribeToDomainEvent,
      handleTurnEnded,
    });

    // act
    dispatchDomainEvents([
      turnEvents.turnEnded({
        gameId: game.id,
        id: 't1',
        storytellerId: 'p1',
        playersWithHandAndScore,
        discardedCards,
      }),
    ]);

    // assert
    expect(handleTurnEnded).toHaveBeenCalledWith({
      gameId: game.id,
      actualHandsByPlayerId,
      previousTurnId: 't1',
      turnScore,
      discardedCards,
    });
  });
});
